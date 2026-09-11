import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { JSDOM } from 'jsdom';

export function validateCatalog(catalog) {
  const seen = new Set();
  for (const entry of catalog) {
    const id = entry?.id ?? '<missing-id>';
    if (typeof id !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`${id}: invalid catalog ID`);
    }
    if (seen.has(id)) throw new Error(`${id}: duplicate catalog ID`);
    if (typeof entry.code !== 'string' || !entry.code.trim()) throw new Error(`${id}: code is required`);
    if (!entry.options || typeof entry.options !== 'object' || Array.isArray(entry.options)) {
      throw new Error(`${id}: options must be an object`);
    }
    seen.add(id);
  }
  return catalog;
}

// Self-contained so the same checks run against actual MessageEvent window
// identities in Chromium, and against controlled events in the Node tests.
export function validateRenderMessage(event, frameWindow, id) {
  const fail = (reason) => { throw new Error(`${id}: ${reason}`); };
  if (!event) fail('missing renderer response');
  if (event.origin !== 'https://arcade.makecode.com') fail('untrusted renderer origin');
  if (!frameWindow || event.source !== frameWindow) fail('wrong renderer frame window');
  const message = event.data;
  if (!message || message.source !== 'makecode') fail('wrong message source');
  if (message.type !== 'renderblocks') fail('wrong response type');
  if (message.id !== id) fail(`wrong response ID: ${message.id}`);
  if (message.error !== undefined) fail(`renderer error: ${message.error}`);
  if (typeof message.svg !== 'string' || !message.svg.trim().startsWith('<svg')) fail('blank or malformed SVG');
  if (!Number.isFinite(message.width) || message.width <= 0 || !Number.isFinite(message.height) || message.height <= 0) {
    fail('renderer dimensions must be finite and positive');
  }
  return message.svg;
}

export function validateRenderResponse(event, frameWindow, id) {
  const svg = validateRenderMessage(event, frameWindow, id);
  validateSvg(svg, id);
  return svg;
}

export function normalizeRendererSvg(svg, id) {
  if (typeof svg !== 'string') throw new Error(`${id}: missing renderer SVG`);
  // The official renderer bundles Blockly's full editor CSS, including cursor
  // files and HTML toolbox sprites that are unused by the static SVG blocks.
  // Remove only those known editor declarations; any other remote resource is
  // still rejected below. Block geometry, labels and visible styles are intact.
  const normalized = svg.replace(/\b(?:cursor|background(?:-image)?)\s*:\s*url\(\s*(['"]?)https:\/\/cdn\.makecode\.com\/[^'"\s)]+\/blockly\/media\/(?:hand(?:delete|closed)\.cur|sprites\.svg)\1\s*\)[^;{}]*;/g, '');
  validateSvg(normalized, id);
  return normalized;
}

export function validateSvg(svg, id) {
  const fail = (reason) => { throw new Error(`${id}: ${reason}`); };
  if (typeof svg !== 'string' || !svg.trim().startsWith('<svg')) fail('missing or malformed SVG');
  if (/<script\b|javascript\s*:|<!DOCTYPE|<!ENTITY/i.test(svg)) fail('unsafe SVG content');
  let dom;
  try {
    dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  } catch (error) {
    fail(`malformed SVG: ${error.message}`);
  }
  try {
    const root = dom.window.document.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') fail('invalid SVG root');
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (['script', 'foreignobject'].includes(element.localName.toLowerCase())) fail('unsafe SVG element');
      for (const attribute of element.attributes) {
        const value = attribute.value.trim();
        if (/^on/i.test(attribute.name) || /javascript\s*:/i.test(value)) fail('unsafe SVG attribute');
        if (attribute.localName === 'href' && !value.startsWith('#') && !/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(value)) {
          fail('remote or unsupported SVG href');
        }
      }
    }
    // Keep checked-in images self-contained, including their stylesheets.
    if (/@import\b|url\(\s*['"]?\s*(?:https?:|\/\/)/i.test(svg)) fail('remote SVG stylesheet resource');
    const viewBox = root.getAttribute('viewBox');
    let box;
    if (viewBox !== null) {
      box = viewBox.trim().split(/[\s,]+/).map(Number);
      if (box.length !== 4 || !box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0) fail('SVG viewBox must have positive dimensions');
    }
    const dimension = (name, index) => {
      const raw = root.getAttribute(name);
      if (raw === null) return box?.[index];
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:px)?$/.test(raw)) fail(`invalid SVG ${name}`);
      return Number.parseFloat(raw);
    };
    const width = dimension('width', 2);
    const height = dimension('height', 3);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail('SVG dimensions must be positive');
    return { width, height };
  } finally {
    dom.window.close();
  }
}

// Render the entire batch before touching live assets. A directory rename keeps
// individual files from being observed half-written; the backup also supports
// rollback if replacement or registry generation fails.
export async function stagedReplace({ catalog, stagingDir, liveDir, render, afterReplace = async () => {} }) {
  validateCatalog(catalog);
  const batchId = catalog.map(({ id }) => id).join(', ') || '<empty-catalog>';
  const staging = path.resolve(stagingDir);
  const live = path.resolve(liveDir);
  if (staging === live || staging.startsWith(`${live}${path.sep}`) || live.startsWith(`${staging}${path.sep}`)) {
    throw new Error(`${batchId}: staging and live directories must be separate`);
  }
  const backup = `${staging}-backup-${randomUUID()}`;
  const lock = `${staging}.lock`;
  let ownsLock = false;
  let ownsStaging = false;
  let hasBackup = false;
  let replaced = false;
  try {
    await mkdir(path.dirname(staging), { recursive: true });
    try {
      await mkdir(lock);
      ownsLock = true;
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error('batch is locked by another or interrupted render');
      throw error;
    }
    // An existing stage belongs to another or interrupted run. Never erase it.
    await mkdir(staging);
    ownsStaging = true;
    for (const entry of catalog) {
      const svg = await render(entry);
      validateSvg(svg, entry.id);
      await writeFile(path.join(staging, `${entry.id}.svg`), svg);
    }
    await mkdir(path.dirname(live), { recursive: true });
    try {
      await rename(live, backup);
      hasBackup = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await rename(staging, live);
    replaced = true;
    await afterReplace();
  } catch (error) {
    if (replaced) await rm(live, { recursive: true, force: true });
    if (hasBackup) await rename(backup, live);
    throw new Error(`${batchId}: ${error.message}`, { cause: error });
  } finally {
    try {
      if (ownsStaging) await rm(staging, { recursive: true, force: true });
    } finally {
      if (ownsLock) await rm(lock, { recursive: true, force: true });
    }
  }
  if (hasBackup) await rm(backup, { recursive: true, force: true });
}
