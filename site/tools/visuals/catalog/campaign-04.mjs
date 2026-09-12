// Complete accumulated programs, reset for each lesson. Art and unspecified
// positions/speeds are examples. The deployed Arcade v4.1.25 game/animation.ts
// contains runImageAnimation; no legacy animation extension/package is required.
const image = (rows) => `img\`\n${rows.join('\n')}\``;
const standing = [
  '................', '................', '.....555555.....', '.....555555.....',
  '.....511515.....', '.....555555.....', '......5555......', '....88888888....',
  '....85888858....', '....85888858....', '......8888......', '......8888......',
  '......8..8......', '......8..8......', '.....88..88.....', '................',
];
const hero = image(standing);
const left = image(standing.map((row, y) => y === 14 ? '....888...8.....' : row));
const right = image(standing.map((row, y) => y === 14 ? '......8..888....' : row));
const foe = image(['..2222..', '.222222.', '22122122', '22222222', '.222222.', '..2..2..', '.22..22.', '........']);
const crystal = image(['...9....', '..919...', '.91119..', '9111119.', '.91119..', '..919...', '...9....', '........']);
const laser = image(['5', '1', '1', '5']);
const walker = `let mySprite = sprites.create(${hero}, SpriteKind.Player)\ncontroller.moveSprite(mySprite, 80, 80)`;
const animate = `animation.runImageAnimation(mySprite, [${left}, ${hero}, ${right}, ${hero}], 150, true)`;
const walkingFunction = `function startWalking () {\n    ${animate}\n}\n${walker}\nstartWalking()`;
const celebrate = `function celebrate () {
    mySprite.startEffect(effects.confetti, 500)
    music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)
}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    celebrate()
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    celebrate()
})`;

// Current native tilemap shadow needs a named asset and its companion JRES/TS.
// Encoding follows PXT TilemapProject.encodeTilemap and Bitmap.setCore:
// tile width, little-endian map dimensions, row-major indices, packed wall nibbles.
const mapAssets = new Map();
function tilemap(width, height, cell, assets) {
  const cells = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => cell(x, y)));
  const header = [width & 255, width >> 8, height & 255, height >> 8];
  const hex = [...header, ...cells.flat().map(([tile]) => tile)].map(n => n.toString(16).padStart(2, '0')).join('');
  const walls = image(cells.map(row => row.map(([, wall]) => wall ? '2' : '.').join('')));
  const tileset = ['gallerytilemaps.baseTransparency16', ...assets];
  const expression = `tiles.createTilemap(hex\`${hex}\`, ${walls}, [${tileset.join(', ')}], TileScale.Sixteen)`;
  const name = `level${width}x${height}`;
  const layer = Array(Math.ceil(width * height / 2)).fill(0);
  cells.flat().forEach(([, wall], index) => {
    if (wall) layer[Math.floor(index / 2)] |= 2 << ((index % 2) * 4);
  });
  const data = Buffer.from([16, ...header, ...cells.flat().map(([tile]) => tile), ...layer]).toString('hex');
  mapAssets.set(name, {
    'tilemap.g.jres': JSON.stringify({ [name]: {
      id: name, mimeType: 'application/mkcd-tilemap',
      data: Buffer.from(data).toString('base64'), tileset, displayName: name,
    } }),
    'tilemap.g.ts': `namespace myTiles {\n    helpers._registerFactory("tilemap", function (name: string) {\n        if (helpers.stringTrim(name) == "${name}") return ${expression}\n        return null\n    })\n}`,
  });
  return `tiles.setCurrentTilemap(tilemap\`${name}\`)`;
}
const floor = 'sprites.castle.tileGrass2';
const stone = 'sprites.dungeon.darkGroundCenter';
const maze = tilemap(30, 12, (x, y) => {
  const wall = x === 0 || x === 29 || y === 0 || y === 11 || ([8, 16, 23].includes(x) && y !== ({8: 3, 16: 8, 23: 3})[x]);
  return [wall ? 2 : 1, wall];
}, [floor, stone]);
const traveler = `${maze}
let mySprite = sprites.create(${hero}, SpriteKind.Player)
controller.moveSprite(mySprite, 90, 90)
tiles.placeOnTile(mySprite, tiles.getTileLocation(1, 5))`;
const world = `${tilemap(16, 12, (x, y) => {
  const wall = x === 0 || x === 15 || y === 0 || y === 11;
  return [wall ? 2 : 1, wall];
}, [floor, stone])}
let mySprite = sprites.create(${hero}, SpriteKind.Player)
controller.moveSprite(mySprite, 90, 90)
tiles.placeOnTile(mySprite, tiles.getTileLocation(1, 5))
scene.cameraFollowSprite(mySprite)`;
// Keep the taught empty-array block visible: Arcade elides the typed default
// declaration once the list is used, but preserves an explicit assignment.
const populate = `let enemies: Sprite[] = []
enemies = []
for (let index = 0; index < 4; index++) {
    let enemy = sprites.create(${foe}, SpriteKind.Enemy)
    tiles.placeOnRandomTile(enemy, ${floor})
    enemies.push(enemy)
}`;
const patrol = `for (let enemy of enemies) {
    if (randint(0, 1) == 0) {
        enemy.vx = 35
        enemy.setBounceOnWall(true)
    } else {
        enemy.follow(mySprite, 25)
    }
}`;
const shoot = `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let projectile = sprites.createProjectileFromSprite(${laser}, mySprite, 100, 0)
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    let enemyIndex = enemies.indexOf(otherSprite)
    if (enemyIndex >= 0) {
        enemies.removeAt(enemyIndex)
    }
    sprite.destroy()
    otherSprite.destroy()
})`;
const inhabitants = `${world}\n${populate}\n${patrol}`;
const lava = 'sprites.dungeon.hazardLava0';
const door = 'sprites.dungeon.doorOpenEast';
const start = 'sprites.dungeon.floorLight0';
const crystalSite = 'sprites.dungeon.floorDarkDiamond';
const level = tilemap(30, 8, (x, y) => {
  if (y === 7 || x === 0 || x === 29) return [1, true];
  if ((y === 5 && x >= 5 && x <= 8) || (y === 3 && x >= 11 && x <= 14) || (y === 5 && x >= 18 && x <= 21)) return [1, true];
  if (x === 2 && y === 6) return [2, false];
  if (x === 13 && y === 2) return [3, false];
  if (y === 6 && ((x >= 9 && x <= 10) || (x >= 22 && x <= 24))) return [4, false];
  if (x === 27 && y === 6) return [5, false];
  return [0, false];
}, [stone, start, crystalSite, lava, door]);
export const starterMap = { code: level, assets: mapAssets.get('level30x8') };
// Authoring/play fixture for the optional, explicitly bounded first-platform patrol.
export const platformChallenge = `let enemy = sprites.create(${foe}, SpriteKind.Enemy)
enemy.setPosition(104, 76)
enemy.vx = 20
enemy.vy = 0
enemy.ay = 0
game.onUpdate(function () {
    if (enemy.x <= 96) {
        enemy.x = 96
        enemy.vx = 20
    } else if (enemy.x >= 128) {
        enemy.x = 128
        enemy.vx = -20
    }
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    tiles.placeOnRandomTile(sprite, ${start})
})`;
const physics = `${level}
let mySprite = sprites.create(${hero}, SpriteKind.Player)
tiles.placeOnRandomTile(mySprite, ${start})
mySprite.ay = 350
controller.moveSprite(mySprite, 100, 0)
scene.cameraFollowSprite(mySprite)`;
const jump = `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (mySprite.isHittingTile(CollisionDirection.Bottom)) {
        mySprite.vy = -160
    }
})`;
const collect = `let crystal = sprites.create(${crystal}, SpriteKind.Food)
tiles.placeOnRandomTile(crystal, ${crystalSite})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    otherSprite.destroy()
})`;
const damage = `scene.onOverlapTile(SpriteKind.Player, ${lava}, function (sprite, location) {
    sprite.startEffect(effects.fire, 500)
    info.changeLifeBy(-1)
    tiles.placeOnRandomTile(sprite, ${start})
})`;
const finish = `scene.onOverlapTile(SpriteKind.Player, ${door}, function (sprite, location) {
    if (info.score() == 1) {
        game.over(true)
    } else {
        sprite.sayText("Спершу знайди кристал!")
    }
})`;

export default [
  ['lesson-13-step-01', walker],
  ['lesson-13-step-04', `${walker}\n${animate}`],
  ['lesson-13-step-05', walkingFunction],
  ['lesson-13-step-06', `${walkingFunction}\n${celebrate}`],
  ['lesson-14-step-04', traveler],
  ['lesson-14-step-05', `${traveler}\nscene.cameraFollowSprite(mySprite)`],
  ['lesson-15-step-01', world],
  ['lesson-15-step-02', `${world}\nlet enemies: Sprite[] = []\nfor (let index = 0; index < 4; index++) {\n}`],
  ['lesson-15-step-03', `${world}\n${populate}`],
  ['lesson-15-step-04', inhabitants],
  ['lesson-15-step-05', `${inhabitants}\n${shoot}`],
  ['lesson-15-step-06', `${inhabitants}\n${shoot}\ncontroller.B.onEvent(ControllerButtonEvent.Pressed, function () {\n    game.splash(enemies.length)\n})`],
  ['lesson-16-step-02', physics],
  ['lesson-16-step-03', `${physics}\n${jump}`],
  ['lesson-16-step-04', `${physics}\n${jump}\n${collect}`],
  ['lesson-16-step-05', `${physics}\ninfo.setLife(3)\n${jump}\n${collect}\n${damage}`],
  ['lesson-16-step-06', `${physics}\ninfo.setLife(3)\n${jump}\n${collect}\n${damage}\n${finish}`],
].map(([id, code]) => {
  const mapName = code.match(/tilemap`([^`]+)`/)?.[1];
  return { id, code, options: { snippetMode: false, ...(mapName ? { assets: mapAssets.get(mapName) } : {}) } };
});
