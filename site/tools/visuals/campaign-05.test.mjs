import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';
import catalog from './catalog/campaign-05.mjs';

test('game-designer programs cover twenty steps using native blocks without gray fallback', async () => {
  assert.equal(catalog.length, 20);
  for (const { id } of catalog) {
    const svg = await readFile(new URL(`../../src/assets/lesson-visuals/blocks/${id}.svg`, import.meta.url), 'utf8');
    assert.ok(!/class="[^"]*\btypescript_(?:statement|expression)\b/.test(svg), `${id}: gray TypeScript fallback is not a teachable native block`);
  }
});

test('lesson 18 contact resets both enemies away from the player respawn tile', () => {
  const actors = [];
  let overlap;
  let life;
  const { code } = catalog.find(({ id }) => id === 'lesson-18-step-06');
  // Execute the actual authoring program at its native API boundary. This
  // verifies the handler's placements, not a substitute physics simulation.
  runInNewContext(code, {
    img: () => ({}), tilemap: () => ({}), SpriteKind: { Player: 0, Enemy: 1 },
    sprites: {
      create: (_image, kind) => {
        const actor = { kind, follow() {}, setBounceOnWall() {} };
        actors.push(actor);
        return actor;
      },
      onOverlap: (player, enemy, handler) => {
        assert.equal(player, 0); assert.equal(enemy, 1); overlap = handler;
      },
    },
    controller: { moveSprite() {} }, scene: { cameraShake() {} },
    info: { setLife: value => { life = value; }, changeLifeBy: delta => { life += delta; } },
    tiles: {
      setCurrentTilemap() {}, getTileLocation: (col, row) => ({ col, row }),
      placeOnTile: (actor, { col, row }) => { actor.col = col; actor.row = row; },
    },
  });
  const [player, patrol, chaser] = actors;
  for (const contactEnemy of [chaser, patrol]) {
    life = 3;
    for (const actor of actors) Object.assign(actor, { col: 1, row: 5 });
    overlap(player, contactEnemy);
    assert.equal(life, 2, 'One encounter costs exactly one life');
    assert.deepEqual(actors.map(({ col, row }) => [col, row]), [[1, 5], [5, 1], [7, 5]],
      'Both enemies must leave the respawn tile, including the enemy outside this callback');
  }
});

test('lesson 18 native overlap diagram teaches all three safe respawn placements', async () => {
  const svg = await readFile(new URL('../../src/assets/lesson-visuals/blocks/lesson-18-step-06.svg', import.meta.url), 'utf8');
  const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  try {
    const overlap = dom.window.document.querySelector('.spritesoverlap');
    const placements = [...overlap.querySelectorAll('.mapplaceontile')].map(block => {
      const actor = [...block.children].find(child => child.matches('.variables_get, .argument_reporter_custom'));
      const location = [...block.children].find(child => child.matches('.mapgettile'));
      return [actor?.textContent, ...[...location?.querySelectorAll('.math_number') ?? []].map(node => Number(node.textContent))];
    });
    assert.deepEqual(placements, [['sprite', 1, 5], ['patrol', 5, 1], ['chaser', 7, 5]],
      'The native overlap stack must show the player and both enemies placed on distinct tiles');
  } finally { dom.window.close(); }
});
