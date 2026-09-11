// Complete accumulated programs; each lesson begins a new project.
// Art, unspecified positions/speeds, and the retained 500 ms rhythm are examples.
const ship = `img\`
    . . . 9 9 . . .
    . . 9 1 1 9 . .
    . . 9 1 1 9 . .
    . 9 9 1 1 9 9 .
    9 9 9 1 1 9 9 9
    9 . 9 9 9 9 . 9
    . . 2 . . 2 . .
    . . 5 . . 5 . .
\``;
const laser = `img\`
    5
    1
    1
    5
\``;
const enemy = `img\`
    . 2 . . . . 2 .
    . . 2 2 2 2 . .
    . 2 2 2 2 2 2 .
    2 2 1 2 2 1 2 2
    2 2 2 2 2 2 2 2
    . . 2 . . 2 . .
    . 2 . 2 2 . 2 .
    2 . . . . . . 2
\``;
const meteor = `img\`
    . . e e e . . .
    . e e d e e . .
    e e d d e e e .
    e e e e e d e e
    e d e e e e e e
    . e e e d e e .
    . . e e e e . .
    . . . e e . . .
\``;
const star = `img\`
    . 1 .
    1 1 1
    . 1 .
\``;
const horizontalShip = `let mySprite = sprites.create(${ship}, SpriteKind.Player)
mySprite.setPosition(80, 110)
controller.moveSprite(mySprite, 100, 0)`;
const shoot = (speed) => `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let projectile = sprites.createProjectileFromSprite(${laser}, mySprite, 0, ${speed})
})`;
const target = `let enemy = sprites.create(${enemy}, SpriteKind.Enemy)
enemy.setPosition(80, 30)
enemy.vx = 35
enemy.setBounceOnWall(true)`;
const hit = `sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy(effects.fire, 500)
    otherSprite.destroy(effects.disintegrate, 500)
    info.changeScoreBy(1)
})`;
const replaceTarget = `sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy(effects.fire, 500)
    otherSprite.destroy(effects.disintegrate, 500)
    info.changeScoreBy(1)
    enemy = sprites.create(${enemy}, SpriteKind.Enemy)
    enemy.y = randint(15, 50)
    enemy.vx = 35
    enemy.setBounceOnWall(true)
})`;
const energyStart = `let energy = 5\ninfo.setLife(6)`;
const roll = `roll = randint(1, 3)`;
const decide = `${roll}
if (roll == 1) {
    info.changeScoreBy(2)
} else {
    info.changeLifeBy(-1)
}`;
const spend = `${decide}
energy += -1
game.splash(energy)`;
const energyButton = (body) => `let roll = 0
${energyStart}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
${body.split('\n').map((line) => `    ${line}`).join('\n')}
})`;
const pilot = `let mySprite = sprites.create(${ship}, SpriteKind.Player)
mySprite.setPosition(10, 60)
controller.moveSprite(mySprite, 0, 90)`;
const decoration = `namespace SpriteKind {
    export const Decoration = SpriteKind.create()
}
${pilot}
for (let index = 0; index < 8; index++) {
    let star = sprites.create(${star}, SpriteKind.Decoration)
    star.setPosition(randint(2, 157), randint(2, 117))
}`;
const rain = (interval) => `game.onUpdateInterval(${interval}, function () {
    let meteor = sprites.create(${meteor}, SpriteKind.Enemy)
    meteor.setPosition(160, randint(8, 112))
    meteor.vx = -60
    meteor.setFlag(SpriteFlag.AutoDestroy, true)
})`;
const hitPlayer = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    otherSprite.destroy()
})`;
const defender = `${horizontalShip}
mySprite.setStayInScreen(true)
info.setScore(0)
info.setLife(3)`;
const waves = `game.onUpdateInterval(1000, function () {
    let enemy = sprites.create(${enemy}, SpriteKind.Enemy)
    enemy.setPosition(randint(8, 152), 0)
    enemy.vy = 20 + wave * 10
})`;
const shooter = `${defender}\nlet wave = 1\n${shoot(-120)}\n${waves}`;
const scoreWave = `sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy()
    otherSprite.destroy()
    info.changeScoreBy(1)
    if (info.score() == 5) {
        wave = 2
        game.splash("Хвиля 2!")
    }
})`;

export default [
  ['lesson-09-step-01', horizontalShip],
  ['lesson-09-step-02', `${horizontalShip}\n${shoot(-100)}`],
  ['lesson-09-step-03', `${horizontalShip}\n${target}\n${shoot(-100)}`],
  ['lesson-09-step-04', `${horizontalShip}\n${target}\n${shoot(-100)}\n${hit}`],
  ['lesson-09-step-05', `${horizontalShip}\n${target}\n${shoot(-100)}\n${replaceTarget}`],
  ['lesson-10-step-01', energyStart],
  ['lesson-10-step-02', energyButton(roll)],
  ['lesson-10-step-03', energyButton(decide)],
  ['lesson-10-step-04', energyButton(spend)],
  ['lesson-10-step-05', energyButton(`if (energy > 0) {\n${spend.split('\n').map((line) => `    ${line}`).join('\n')}\n} else {\n    game.splash("Енергія скінчилася")\n}`)],
  ['lesson-11-step-01', pilot],
  ['lesson-11-step-02', decoration],
  ['lesson-11-step-03', `${decoration}\n${rain(900)}`],
  ['lesson-11-step-04', `${decoration}\ninfo.setLife(3)\n${rain(900)}\n${hitPlayer}`],
  ['lesson-11-step-06', `${decoration}\ninfo.setLife(3)\n${rain(500)}\n${hitPlayer}`],
  ['lesson-12-step-01', defender],
  ['lesson-12-step-02', `${defender}\n${shoot(-120)}`],
  ['lesson-12-step-03', shooter],
  ['lesson-12-step-04', `${shooter}\n${scoreWave}`],
  ['lesson-12-step-05', `${shooter}\n${scoreWave}\n${hitPlayer}`],
].map(([id, code]) => ({ id, code, options: { snippetMode: false } }));
