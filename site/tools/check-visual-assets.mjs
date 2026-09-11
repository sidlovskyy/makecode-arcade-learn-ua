import { generateVisualRegistry } from './generate-visual-registry.mjs';

try {
  const assets = await generateVisualRegistry({ check: true });
  console.log(`Checked ${assets.length} visual asset(s): registry, catalog, and SVGs are valid.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
