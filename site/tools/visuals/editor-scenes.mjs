import { starterMap } from './catalog/campaign-04.mjs';

const url = 'https://arcade.makecode.com/?lang=en';
const button = (page, name) => page.getByRole('button', { name, exact: true });

export const heroSilhouette = [
  '................',
  '.....888888.....',
  '....88888888....',
  '...8888888888...',
  '...8888888888...',
  '..888888888888..',
  '..888888888888..',
  '..888888888888..',
  '...8888888888...',
  '...8888888888...',
  '...8888888888...',
  '....88888888....',
  '...888....888...',
  '...888....888...',
  '...888....888...',
  '................',
];

const heroDetails = new Map([
  ['5,4', '1'], ['6,4', '1'], ['9,4', '1'], ['10,4', '1'],
  ['7,8', '5'], ['8,8', '5'],
  ['6,9', '5'], ['7,9', '5'], ['8,9', '5'], ['9,9', '5'],
  ['7,10', '5'], ['8,10', '5'],
]);

export const heroDetailed = heroSilhouette.map((row, y) => [...row]
  .map((pixel, x) => heroDetails.get(`${x},${y}`) ?? pixel).join(''));

export async function waitForExtensionCards(page) {
  // Third-party cards resolve after the official tiles. Their placeholders
  // have no accessible role; wait only for spinners inside the viewport.
  await page.waitForFunction(() => [...document.querySelectorAll('.common-spinner')].every((spinner) => {
    const box = spinner.getBoundingClientRect();
    const style = getComputedStyle(spinner);
    return !box.width || !box.height || style.visibility === 'hidden' || style.opacity === '0'
      || box.top >= innerHeight || box.bottom <= 0 || box.left >= innerWidth || box.right <= 0;
  }));
}

async function home(page) {
  await page.getByRole('region', { name: 'My Projects', exact: true })
    .getByRole('button', { name: 'New Project', exact: true }).waitFor();
  await page.getByRole('region', { name: 'Beginner Skillmaps', exact: true }).waitFor();
  // Fix the rotating home banner through its own carousel control.
  await button(page, 'View Start Coding hero image').click();
}

async function project(page) {
  await home(page);
  await page.getByRole('region', { name: 'My Projects', exact: true })
    .getByRole('button', { name: 'New Project', exact: true }).click();
  await page.getByRole('textbox', { name: 'Give your project a name.' }).fill('KodKvest');
  await button(page, 'Create').click();
  await page.getByRole('dialog').filter({ hasText: 'Welcome!' }).getByRole('button', { name: 'Close', exact: true }).click();
  await button(page, 'Stop the simulator').waitFor();
  await button(page, 'Restart the simulator').waitFor();
  await button(page, 'Save the project').waitFor();
  await page.getByRole('tree', { name: 'Toolbox', exact: true }).waitFor();
  await page.getByRole('region', { name: 'Blocks workspace.', exact: true }).waitFor();
}

async function assetEditor(page, type) {
  await project(page);
  await button(page, 'View project assets').click();
  await button(page, 'Create a new asset').click();
  await button(page, `Create a new ${type} asset`).click();
  await page.getByRole('textbox', { name: 'Image Width', exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Image Height', exact: true }).waitFor();
  // The editing canvas has no accessible role/name in the current MakeCode UI.
  await page.locator('canvas.paint-surface.main').waitFor();
}

async function paintImage(page, rows) {
  if (rows.length !== 16 || rows.some(row => row.length !== 16 || /[^.0-9]/.test(row))) {
    throw new Error('sprite rows must be a 16×16 palette-index image');
  }
  const canvas = page.locator('canvas.paint-surface.main');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('missing sprite canvas');
  let selected;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = rows[y][x];
      if (color === '.') continue;
      if (selected !== color) {
        await page.getByRole('button', { name: new RegExp(`^Color ${color} \\(`) }).click();
        selected = color;
      }
      await page.mouse.click(
        box.x + box.width * (x + 0.5) / 16,
        box.y + box.height * (y + 0.5) / 16,
      );
    }
  }
}

async function silhouetteEditor(page) {
  await assetEditor(page, 'Image');
  await paintImage(page, heroSilhouette);
}

async function detailedEditor(page) {
  await assetEditor(page, 'Image');
  await paintImage(page, heroDetailed);
}

const arcadeImage = rows => rows.map(row => [...row].join(' ')).join('\n');

async function completedHeroWorkspace(page) {
  await project(page);
  await button(page, 'Convert code to JavaScript').click();
  const editor = page.locator('.monaco-editor textarea');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+KeyA');
  await page.keyboard.insertText(`let mySprite = sprites.create(img\`\n${arcadeImage(heroDetailed)}\n\`, SpriteKind.Player)`);
  const convert = button(page, 'Convert code to Blocks');
  const workspace = page.getByRole('region', { name: 'Blocks workspace.', exact: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    await convert.click();
    try {
      await workspace.waitFor({ timeout: 5_000 });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  const start = button(page, 'Start the simulator');
  if (await start.isVisible()) await start.click();
  else await button(page, 'Restart the simulator').click();
  await button(page, 'Stop the simulator').waitFor();
}

export async function pythonProject(page) {
  await project(page);
  await button(page, 'Stop the simulator').click();
  await page.getByTitle('Select code editor language', { exact: true }).click();
  await page.getByText('Python', { exact: true }).click();
  await button(page, 'Convert code to Python').waitFor();
  await page.locator('.monaco-editor textarea').waitFor();
}

export async function wideMap(page) {
  await pythonProject(page);
  await button(page, 'View project assets').click();
  await button(page, 'Create a new asset').click();
  await button(page, 'Create a new Tilemap asset').click();
  for (const [name, value] of [['Image Width', '20'], ['Image Height', '8']]) {
    const field = page.getByRole('textbox', { name, exact: true });
    await field.fill(value); await field.press('Tab');
    if (await field.inputValue() !== value) throw Error(`${name} must be ${value}`);
  }
  await page.getByPlaceholder('Asset Name', { exact: true }).fill('wide');
  await page.getByPlaceholder('Asset Name', { exact: true }).press('Tab');
  await page.getByTitle('Tile tileGrass2', { exact: true }).click();
  await page.getByTitle('Paint Tool', { exact: true }).click();
  // The native canvas has no accessible cells. Paint each bottom-row cell
  // through its measured 20×8 geometry, including both boundaries.
  const box = await page.locator('canvas.paint-surface.main').boundingBox();
  if (!box) throw Error('Missing tilemap canvas');
  for (let column = 0; column < 20; column++) {
    const x = box.x + box.width * (column + 0.5) / 20;
    const y = box.y + box.height * 15 / 16;
    await page.mouse.move(x, y);
    await page.waitForTimeout(40);
    await page.mouse.click(x, y);
  }
  await button(page, 'Done').click();
  await button(page, 'Edit the selected asset').waitFor();
  const valid = await page.evaluate(() => {
    const map = window.pxt.react.getTilemapProject().getAssets('tilemap').find(asset => asset.meta.displayName === 'wide');
    return map?.data.tilemap.width === 20 && map.data.tilemap.height === 8
      && [...map.data.tilemap.buf].every((cell, index) => cell === (index < 140 ? 0 : 1));
  });
  if (!valid) throw Error('wide must have 140 transparent cells and 20 ground cells');
  await button(page, 'Edit the selected asset').click();
  await page.locator('canvas.paint-surface.main').waitFor();
}

async function pythonSave(page) {
  await pythonProject(page);
  // Reopen the locally saved Python project so the empty-program simulator
  // has settled before capturing the Save action.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await button(page, 'Convert code to Python').waitFor();
  await button(page, 'Save the project').waitFor();
  if (!(await button(page, 'Convert code to Python').isVisible())) throw Error('Python must be visible before Save capture');
  if (await button(page, 'Convert code to JavaScript').isVisible()) throw Error('Retired language label must not be visible');
}

const definitions = [
  ['arcade-home', home],
  // MakeCode 4.1.25 calls the normal-mode control Stop, not Pause.
  ['blocks-workspace', project],
  ['sprite-image-editor', async (page) => {
    await assetEditor(page, 'Image');
    for (const name of ['Image Width', 'Image Height']) {
      const field = page.getByRole('textbox', { name, exact: true });
      if (await field.inputValue() !== '16') throw new Error(`${name} must be 16`);
    }
    await button(page, 'Color 15 (black)').waitFor();
  }],
  ['animation-extension', async (page) => {
    await project(page);
    await page.getByRole('treeitem', { name: 'Extensions', exact: true }).click();
    await page.getByRole('tabpanel', { name: 'Recommended', exact: true })
      .getByRole('button', { name: 'animation', exact: true }).waitFor();
    await waitForExtensionCards(page);
  }],
  ['animation-frames', async (page) => {
    await assetEditor(page, 'Animation');
    await button(page, 'Add new frame').click();
    await button(page, 'Add new frame').click();
    await button(page, 'Duplicate Current Frame').waitFor();
    await page.getByRole('textbox', { name: 'Interval Between Frames (ms)', exact: true }).waitFor();
  }],
  ['tilemap-editor', async (page) => {
    await project(page);
    await button(page, 'Convert code to JavaScript').click();
    // Feed the catalog's exact map to the official editor and open its native
    // tilemap field editor through the gutter icon for the completed-map capture.
    const expression = starterMap.assets['tilemap.g.ts'].match(/return (tiles\.createTilemap[\s\S]*?)\n        return null/)[1];
    await page.locator('.monaco-editor textarea').focus();
    await page.keyboard.press('ControlOrMeta+KeyA');
    await page.keyboard.insertText(`tiles.setCurrentTilemap(${expression})`);
    // Monaco continuously refreshes this gutter glyph while typechecking.
    await page.locator('.ms-Icon--Nav2DMapView').click({ force: true });
    await page.getByRole('textbox', { name: 'Image Width', exact: true }).waitFor();
    await button(page, 'Draw walls').waitFor();
    await page.getByText('Show walls', { exact: true }).waitFor();
  }],
];

export const editorScenes = definitions.map(([name, prepare]) => ({
  id: `editor:${name}`,
  url,
  viewport: { width: 1440, height: 900 },
  outputName: `${name}.webp`,
  prepare,
  ...(name === 'sprite-image-editor' ? {
    preserveFirstPanel: true,
    panelNames: ['blank', 'silhouette', 'detailed', 'simulator'],
    panels: [silhouetteEditor, detailedEditor, completedHeroWorkspace],
  } : name === 'tilemap-editor' ? {
    preserveFirstPanel: true,
    panelNames: ['starter-map', 'wide-map', 'python-save'],
    panels: [wideMap, pythonSave],
  } : {}),
}));
