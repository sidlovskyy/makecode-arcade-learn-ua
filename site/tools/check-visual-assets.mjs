import { execFile } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { defaultSiteRoot, generateVisualRegistry } from './generate-visual-registry.mjs';
import { blockCatalog, createBlockVisualManifest } from './visuals/catalog/index.mjs';

const exec = promisify(execFile);
const editorNames = [
  'animation-extension', 'animation-frames', 'arcade-home',
  'blocks-workspace', 'sprite-image-editor', 'tilemap-editor',
];

export async function checkVisualAssets({ siteRoot = defaultSiteRoot, catalog = blockCatalog } = {}) {
  const blockManifest = createBlockVisualManifest(catalog);
  if (blockManifest.length !== 93) {
    throw new Error(`Block manifest must contain exactly 93 sources; found ${blockManifest.length}`);
  }
  const manifest = new Map([
    ...blockManifest,
    ...editorNames.map((name) => ({
      id: `editor:${name}`, kind: 'editor', file: `src/assets/lesson-visuals/editor/${name}.webp`,
    })),
  ].map((asset) => [asset.id, asset]));

  // Reuse the offline SVG safety checks and exact, sorted local-import source comparison.
  const assets = await generateVisualRegistry({ siteRoot, catalog, check: true });
  for (const asset of assets) {
    const expected = manifest.get(asset.id);
    if (!expected) {
      throw new Error(asset.kind === 'blocks'
        ? `${asset.id}: no catalog source for registered SVG`
        : `${asset.id}: unexpected editor asset`);
    }
    if (asset.kind !== expected.kind || asset.file !== expected.file) {
      throw new Error(`${asset.id}: expected local ${expected.kind === 'editor' ? 'WebP' : 'SVG'} import ${expected.file}`);
    }
  }
  const registeredIds = new Set(assets.map(({ id }) => id));
  for (const expected of manifest.values()) {
    if (!registeredIds.has(expected.id)) {
      throw new Error(`${expected.id}: missing registered ${expected.kind === 'editor' ? 'WebP' : 'SVG'}`);
    }
  }

  // Generation may discover fresh files; the release audit requires them in Git.
  const { stdout } = await exec('git', [
    'ls-files', '--cached', '-z', '--',
    'src/assets/lesson-visuals/blocks/', 'src/assets/lesson-visuals/editor/',
  ], { cwd: siteRoot });
  const tracked = new Set(stdout.split('\0').filter(Boolean));
  for (const { id, file } of assets) {
    if (!tracked.has(file)) throw new Error(`${id}: asset is not tracked in Git: ${file}`);
  }
  return assets;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const assets = await checkVisualAssets();
    console.log(`Checked ${assets.length} local visual assets: 93 catalog SVGs + 6 editor WebPs; tracked files, SVG safety, and sorted registry are valid.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
