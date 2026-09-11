import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { tokenize, TokenType } from '@csstools/css-tokenizer';

const resourceAttributes = new Set([
  'style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'cursor',
  'marker', 'marker-start', 'marker-mid', 'marker-end', 'color-profile',
  'mask-image', 'background-image', 'border-image-source', 'list-style-image', 'shape-outside',
]);

const imageFunctions = new Set(['image', 'image-set', '-webkit-image-set', 'cross-fade', '-webkit-cross-fade']);
const imageHelpers = new Set([
  'linear-gradient', 'radial-gradient', 'conic-gradient',
  'repeating-linear-gradient', 'repeating-radial-gradient', 'repeating-conic-gradient',
  'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch',
  'color', 'color-mix', 'light-dark', 'calc', 'min', 'max', 'clamp', 'element', '-moz-element',
]);

// Static lesson assets must not mutate resource attributes after validation.
// Match local names so namespace prefixes cannot hide SVG/SMIL animation.
const smilElements = new Set([
  'set', 'animate', 'animatecolor', 'animatetransform', 'animatemotion', 'mpath', 'discard',
]);

function validateEmbeddedSvg(value, id, depth) {
  const data = /^data:image\/svg\+xml(?:;charset=[a-z0-9._-]+)?(;base64)?,(.*)$/is.exec(value);
  if (!data) return false;
  try {
    if (data[1] && !/^[a-z0-9+/]*={0,2}$/i.test(data[2])) throw new Error('invalid base64');
    const nested = data[1]
      ? new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(data[2], 'base64'))
      : decodeURIComponent(data[2]);
    validateSvg(nested, id, depth + 1);
    return true;
  } catch (error) {
    throw new Error(`${id}: unsupported embedded SVG resource: ${error.message}`, { cause: error });
  }
}

function validateCssResources(css, fail, id, depth) {
  // XML entities have already been decoded by JSDOM. The tokenizer also
  // decodes CSS escapes in URL tokens, quoted strings and function/at-rule names.
  const tokens = tokenize({ css }, {
    onParseError: () => fail('malformed SVG stylesheet resource'),
  }).filter(([type]) => type !== TokenType.Whitespace && type !== TokenType.Comment);
  const validateUrl = (url) => {
    const value = url.trim();
    const embedded = /^data:(?:image\/(?:png|jpeg|gif|webp)|font\/(?:woff2?|ttf|otf|sfnt)|application\/(?:font-woff2?|x-font-woff2?|x-font-ttf|x-font-opentype|font-sfnt|vnd\.ms-fontobject))(?:;charset=[a-z0-9._-]+)?;base64,[a-z0-9+/]*={0,2}$/i;
    if (value.startsWith('#') || embedded.test(value)) return;
    const binaryFont = /^data:application\/octet-stream;base64,([a-z0-9+/]*={0,2})$/i.exec(value);
    if (binaryFont) {
      const signature = Buffer.from(binaryFont[1], 'base64').subarray(0, 4).toString('hex');
      if (['00010000', '4f54544f', '774f4646', '774f4632', '74746366'].includes(signature)) return;
    }
    // MakeCode uses percent-encoded SVG icons in its CSS. Decode and validate
    // them too; allowing the MIME type alone would hide nested remote resources.
    if (validateEmbeddedSvg(value, id, depth)) return;
    fail(`remote or unsupported SVG stylesheet resource: ${value.slice(0, 120)}`);
  };
  const functions = [];
  for (let index = 0; index < tokens.length; index++) {
    const [type, , , , data] = tokens[index];
    const parent = functions.at(-1);
    if (type === TokenType.AtKeyword && data.value.toLowerCase() === 'import') fail('remote SVG stylesheet import');
    if (type === TokenType.URL) validateUrl(data.value);
    if (type === TokenType.Function) {
      const name = data.value.toLowerCase();
      const urlFunction = name === 'url' || name === 'src';
      const imageType = name === 'type' && ['image-set', '-webkit-image-set'].includes(parent?.name);
      if (urlFunction || imageType) {
        const argument = tokens[index + 1];
        if (argument?.[0] !== TokenType.String || tokens[index + 2]?.[0] !== TokenType.CloseParen) {
          fail('unsupported SVG stylesheet URL syntax');
        }
        if (imageType && !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(argument[4].value)) {
          fail('unsupported SVG image type syntax');
        }
      }
      if (parent?.resource && !urlFunction && !imageType && !imageFunctions.has(name) && !imageHelpers.has(name)) {
        // Dynamic/custom functions could turn strings elsewhere into URLs.
        // Accept only image syntax whose resource arguments we can inspect.
        fail(`unsupported SVG image resource function: ${name}`);
      }
      functions.push({ name, resource: parent?.resource || urlFunction || imageFunctions.has(name), imageType });
    } else if (type === TokenType.OpenParen) {
      functions.push({ resource: parent?.resource });
    } else if (type === TokenType.CloseParen) {
      functions.pop();
    } else if (type === TokenType.String && parent?.resource && !parent.imageType) {
      // image()/image-set() accept URL strings without a url() wrapper.
      // type("image/png") is metadata, not a fetched resource.
      validateUrl(data.value);
    }
  }
  if (functions.some(({ resource }) => resource)) fail('unsupported unclosed SVG image resource function');
}

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
  const normalized = svg
    .replace(/\b(?:cursor|background(?:-image)?)\s*:\s*url\(\s*(['"]?)https:\/\/cdn\.makecode\.com\/[^'"\s)]+\/blockly\/media\/(?:hand(?:delete|closed)\.cur|sprites\.svg)\1\s*\)[^;{}]*;/g, '')
    .replace(/\bcursor\s*:\s*url\(\s*(['"]?)<<<PATH>>>\/handdelete\.cur\1\s*\)[^;{}]*(?:;|(?=}))/g, '')
    .replace(/@font-face\s*\{[^}]*\}/g, (rule) => {
      // These old editor EOT fallbacks are shadowed by embedded WOFF sources.
      // Remove them only when that self-contained replacement is present.
      if (!/src\s*:\s*url\(\s*['"]?data:(?:font\/|application\/(?:x-)?font-)/.test(rule)) return rule;
      return rule.replace(/\bsrc\s*:\s*url\(\s*(['"]?)(?:\.\.\/webfonts\/fa-(?:solid-900|regular-400)|fonts\/(?:icons|outline-icons|brand-icons))\.eot\1\s*\)\s*;/g, '');
    });
  validateSvg(normalized, id);
  return normalized;
}

export function validateSvg(svg, id, depth = 0) {
  const fail = (reason) => { throw new Error(`${id}: ${reason}`); };
  if (depth > 8) fail('unsupported embedded SVG nesting depth');
  // Exported embedded icons can include an XML declaration and comments. The
  // XML parser below still requires their actual root to be a safe SVG.
  if (typeof svg !== 'string' || (depth === 0 && !svg.trim().startsWith('<svg'))) fail('missing or malformed SVG');
  if (/<script\b|javascript\s*:|<!DOCTYPE|<!ENTITY/i.test(svg)) fail('unsafe SVG content');
  let dom;
  try {
    dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  } catch (error) {
    fail(`malformed SVG: ${error.message}`);
  }
  try {
    const instructions = dom.window.document.createTreeWalker(dom.window.document, dom.window.NodeFilter.SHOW_PROCESSING_INSTRUCTION);
    if (instructions.nextNode()) fail('unsafe SVG processing instruction');
    const root = dom.window.document.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg') fail('invalid SVG root');
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (smilElements.has(element.localName.toLowerCase())) fail('unsupported SMIL element in static SVG');
      if (['script', 'foreignobject'].includes(element.localName.toLowerCase())) fail('unsafe SVG element');
      if (element.localName === 'style') validateCssResources(element.textContent, fail, id, depth);
      for (const attribute of element.attributes) {
        const value = attribute.value.trim();
        if (/^on/i.test(attribute.name) || /javascript\s*:/i.test(value)) fail('unsafe SVG attribute');
        if (attribute.localName === 'href' && !value.startsWith('#') && !/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(value)) {
          if (!validateEmbeddedSvg(value, id, depth)) fail('remote or unsupported SVG href');
        }
        if (resourceAttributes.has(attribute.localName)) validateCssResources(value, fail, id, depth);
      }
    }
    // Embedded icons may rely on CSS/default sizing. The positive intrinsic-size
    // contract applies to the catalog asset, while nested SVGs need safety checks.
    if (depth > 0) return;
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
