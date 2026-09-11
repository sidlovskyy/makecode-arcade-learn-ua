// Each entry is the complete program at that lesson step. Art, positions and
// unprescribed speeds are examples; required formulas and kinds stay literal.
const image = rows => `img\`\n${rows.join('\n')}\``;
const heroRows = ['..5555..', '.555555.', '.515515.', '.555555.', '..8888..', '.888888.', '..8..8..', '.88..88.'];
const hero = image(heroRows);
const protectedHero = image(heroRows.map(row => row.replaceAll('8', '9')));
const enemyImage = image(['..2222..', '.222222.', '22122122', '22222222', '.222222.', '..2..2..', '.22..22.', '........']);
const foodImage = image(['...5....', '...5....', '.55555..', '..555...', '.55.55..', '........', '........', '........']);
const shieldImage = image(['.999999.', '99111199', '99199199', '99111199', '.999999.', '..9999..', '...99...', '........']);
const laser = image(['5', '1', '1', '5']);
const fireball = image(['.22.', '2442', '2442', '.22.']);
const bossImage = image(Array.from({ length: 16 }, (_, y) => y < 2 || y > 13 ? '...2222222222...' : y === 5 || y === 6 ? '2222112222112222' : '2222222222222222'));

// An explicit assignment retains the taught reset block when PXT hoists a
// mutable zero-initialized global into its implicit initialization.
const levelState = 'let state = 0\nstate = 0\nlet level = 1';
const startLevel = call => `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state == 0) {
        state = 1
        mySprite = sprites.create(${hero}, SpriteKind.Player)
        controller.moveSprite(mySprite, 90, 90)
        mySprite.setStayInScreen(true)
        info.setScore(0)${call ? '\n        loadLevel()' : ''}
    }
})`;
const loadLevel = `function loadLevel () {
    for (let index = 0; index < level + 1; index++) {
        let enemy = sprites.create(${enemyImage}, SpriteKind.Enemy)
        enemy.setPosition(randint(10, 150), randint(10, 60))
        enemy.vx = 15 + level * 10
        enemy.setBounceOnWall(true)
    }
}`;
const levelShoot = `controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state == 1) {
        let projectile = sprites.createProjectileFromSprite(${laser}, mySprite, 0, -100)
    }
})
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy()
    otherSprite.destroy()
    info.changeScoreBy(1)
})`;
const levels = `${levelState}\nlet mySprite: Sprite = null\n${loadLevel}\n${startLevel(true)}\n${levelShoot}`;
const transition = final => `game.onUpdate(function () {
    if (state == 1 && info.score() == level + 1) {
        state = 2
        level += 1
        game.splash("Рівень", level)
        info.setScore(0)
        ${final ? `if (level > 3) {
            game.over(true)
        } else {
            state = 1
            loadLevel()
        }` : 'loadLevel()\n        state = 1'}
    }
})`;

// Native named tilemap shadow plus its JRES and factory companion.
const width = 10, height = 8;
const cells = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) =>
  x === 0 || x === 9 || y === 0 || y === 7 || (y === 3 && x >= 2 && x <= 7) ? 2 : 1));
const header = [width, 0, height, 0];
const walls = image(cells.map(row => row.map(tile => tile === 2 ? '2' : '.').join('')));
const tileset = ['gallerytilemaps.baseTransparency16', 'sprites.castle.tileGrass2', 'sprites.dungeon.darkGroundCenter'];
const hex = [...header, ...cells.flat()].map(n => n.toString(16).padStart(2, '0')).join('');
const layer = Array(width * height / 2).fill(0);
cells.flat().forEach((tile, i) => { if (tile === 2) layer[Math.floor(i / 2)] |= 2 << (i % 2 * 4); });
const data = Buffer.from([16, ...header, ...cells.flat(), ...layer]).toString('hex');
const arenaAssets = {
  'tilemap.g.jres': JSON.stringify({ arena: { id: 'arena', mimeType: 'application/mkcd-tilemap', data: Buffer.from(data).toString('base64'), tileset, displayName: 'arena' } }),
  'tilemap.g.ts': `namespace myTiles { helpers._registerFactory("tilemap", function (name: string) {
    if (helpers.stringTrim(name) == "arena") return tiles.createTilemap(hex\`${hex}\`, ${walls}, [${tileset.join(', ')}], TileScale.Sixteen)
    return null
  }) }`,
};
const arena = `tiles.setCurrentTilemap(tilemap\`arena\`)
let mySprite = sprites.create(${hero}, SpriteKind.Player)
controller.moveSprite(mySprite, 90, 90)
tiles.placeOnTile(mySprite, tiles.getTileLocation(1, 5))`;
const patrol = `let patrol = sprites.create(${enemyImage}, SpriteKind.Enemy)
tiles.placeOnTile(patrol, tiles.getTileLocation(5, 1))
patrol.vx = 40
patrol.setBounceOnWall(true)`;
const follow = speed => `let chaser = sprites.create(${enemyImage}, SpriteKind.Enemy)
tiles.placeOnTile(chaser, tiles.getTileLocation(7, 5))
chaser.follow(mySprite, ${speed})`;
const contact = `info.setLife(3)
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    scene.cameraShake(4, 500)
    tiles.placeOnTile(sprite, tiles.getTileLocation(1, 5))
})`;

const prototype = step => `${step >= 2 ? 'namespace SpriteKind {\n    export const Bonus = SpriteKind.create()\n}\nlet shield = false\nshield = false\n' : ''}${step >= 4 ? 'game.splash("Збери 8")\n' : ''}let mySprite = sprites.create(${hero}, SpriteKind.Player)
controller.moveSprite(mySprite, 90, 90)
mySprite.setStayInScreen(true)
mySprite.setPosition(20, 100)
info.setLife(3)
info.setScore(0)
let food = sprites.create(${foodImage}, SpriteKind.Food)
food.setPosition(80, 60)
let enemy = sprites.create(${enemyImage}, SpriteKind.Enemy)
enemy.setPosition(130, 30)
enemy.follow(mySprite, 25)
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    otherSprite.setPosition(randint(10, 150), randint(10, 110))
    info.changeScoreBy(1)${step >= 4 ? '\n    sprite.startEffect(effects.confetti, 500)' : ''}${step >= 3 ? '\n    music.play(music.tonePlayable(988, 100), music.PlaybackMode.InBackground)' : ''}
    if (info.score() >= 8) {${step >= 3 ? '\n        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.UntilDone)' : ''}
        game.over(true)
    }
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    ${step >= 2 ? 'if (!(shield)) {\n        ' : ''}sprite.setPosition(20, 100)
    otherSprite.setPosition(130, 30)${step >= 4 ? '\n    scene.cameraShake(4, 500)' : ''}${step >= 3 ? '\n    music.play(music.tonePlayable(131, 200), music.PlaybackMode.InBackground)' : ''}
    info.changeLifeBy(-1)${step >= 2 ? '\n    }' : ''}
})${step >= 2 ? `
let bonus = sprites.create(${shieldImage}, SpriteKind.Bonus)
bonus.setPosition(30, 60)
sprites.onOverlap(SpriteKind.Player, SpriteKind.Bonus, function (sprite, otherSprite) {
    otherSprite.destroy()
    shield = true
    sprite.setImage(${protectedHero})
    pause(5000)
    shield = false
    sprite.setImage(${hero})
})` : ''}`;

const bossArena = `namespace SpriteKind {
    export const Boss = SpriteKind.create()
}
let mySprite = sprites.create(${hero}, SpriteKind.Player)
mySprite.setPosition(80, 108)
controller.moveSprite(mySprite, 100, 0)
mySprite.setStayInScreen(true)
info.setLife(3)
let boss = sprites.create(${bossImage}, SpriteKind.Boss)
boss.setPosition(80, 20)`;
const bossShoot = `let bossHealth = 12
let phase = 1
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let projectile = sprites.createProjectileFromSprite(${laser}, mySprite, 0, -100)
})`;
const bossDamage = final => `sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Boss, function (sprite, otherSprite) {
    sprite.destroy()
    bossHealth += -1
    otherSprite.sayText(bossHealth)
    if (bossHealth == 8) {
        phase = 2
    }
    if (bossHealth == 4) {
        phase = 3
    }${final ? '\n    if (bossHealth == 0) {\n        otherSprite.destroy(effects.disintegrate, 500)\n        game.over(true)\n    }' : ''}
})`;
const bossAttack = `namespace SpriteKind {
    export const EnemyProjectile = SpriteKind.create()
}
game.onUpdateInterval(900, function () {
    let enemyShot = sprites.createProjectileFromSprite(${fireball}, boss, 0, 40)
    enemyShot.setKind(SpriteKind.EnemyProjectile)
    if (phase == 2) {
        enemyShot.vy = 70
    }
    if (phase == 3) {
        let extraShot = sprites.createProjectileFromSprite(${fireball}, boss, 30, 40)
        extraShot.setKind(SpriteKind.EnemyProjectile)
    }
})`;
const playerDamage = `sprites.onOverlap(SpriteKind.Player, SpriteKind.EnemyProjectile, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeLifeBy(-1)
})`;

export default [
  ['lesson-17-step-01', levelState],
  ['lesson-17-step-02', `${levelState}\nlet mySprite: Sprite = null\n${startLevel(false)}`],
  ['lesson-17-step-03', `${levelState}\nlet mySprite: Sprite = null\n${startLevel(false)}\n${loadLevel}`],
  ['lesson-17-step-04', levels],
  ['lesson-17-step-05', `${levels}\n${transition(false)}`],
  ['lesson-17-step-06', `${levels}\n${transition(true)}`],
  ['lesson-18-step-01', arena],
  ['lesson-18-step-02', `${arena}\n${patrol}`],
  ['lesson-18-step-03', `${arena}\n${patrol}\n${follow(30)}`],
  ['lesson-18-step-05', `${arena}\n${patrol}\n${follow(15)}`],
  ['lesson-18-step-06', `${arena}\n${patrol}\n${follow(15)}\n${contact}`],
  ...[1, 2, 3, 4].map(step => [`lesson-19-step-0${step}`, prototype(step)]),
  ['lesson-20-step-01', bossArena],
  ['lesson-20-step-02', `${bossArena}\n${bossShoot}`],
  ['lesson-20-step-03', `${bossArena}\n${bossShoot}\n${bossDamage(false)}`],
  ['lesson-20-step-04', `${bossArena}\n${bossShoot}\n${bossDamage(false)}\n${bossAttack}`],
  ['lesson-20-step-05', `${bossArena}\n${bossShoot}\n${bossDamage(true)}\n${bossAttack}\n${playerDamage}`],
].map(([id, code]) => ({ id, code, options: { snippetMode: false, ...(id.startsWith('lesson-18') ? { assets: arenaAssets } : {}) } }));
