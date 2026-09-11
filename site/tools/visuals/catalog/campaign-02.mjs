// Each entry is the complete program reached at that step, starting afresh per lesson.
// Positions and pixel art are examples where the lesson leaves them to the learner.
const robot = `img\`
    . . 7 7 7 7 . .
    . 7 7 7 7 7 7 .
    . 7 1 7 7 1 7 .
    . 7 f 7 7 f 7 .
    7 7 7 7 7 7 7 7
    7 . 7 1 1 7 . 7
    . . 7 7 7 7 . .
    . 7 7 . . 7 7 .
\``;
const coin = `img\`
    . . 5 5 5 5 . .
    . 5 5 4 4 5 5 .
    5 5 4 5 5 4 5 5
    5 4 5 5 5 5 4 5
    5 4 5 5 5 5 4 5
    5 5 4 5 5 4 5 5
    . 5 5 4 4 5 5 .
    . . 5 5 5 5 . .
\``;
const spikes = `img\`
    . . . . . . . .
    . . . . . . . .
    . 2 . . 2 . . 2
    . 2 . . 2 . . 2
    2 2 2 2 2 2 2 2
    2 1 2 2 1 2 2 1
    2 1 2 2 1 2 2 1
    2 2 2 2 2 2 2 2
\``;
const crystal = `img\`
    . . . 9 9 . . .
    . . 9 1 9 9 . .
    . 9 1 9 9 6 9 .
    9 1 9 9 6 6 6 9
    . 9 9 9 6 6 9 .
    . . 9 6 6 9 . .
    . . . 6 9 . . .
    . . . 9 . . . .
\``;
const star = `img\`
    . . . 5 5 . . .
    . . . 5 5 . . .
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    . 5 5 . . 5 5 .
    5 5 . . . . 5 5
\``;
const hero = `let mySprite = sprites.create(${robot}, SpriteKind.Player)`;
const buttonStart = `scene.setBackgroundColor(8)\n${hero}`;
const sayA = `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    mySprite.sayText("Стрибок!", 500)
})`;
const jumpA = `controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    mySprite.y += -10
    pause(150)
    mySprite.y += 10
})`;
const colorB = `controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    scene.setBackgroundColor(7)
})`;
const threeRoles = `${hero}
mySprite.setPosition(30, 60)
let coin = sprites.create(${coin}, SpriteKind.Food)
coin.setPosition(80, 60)
let spikes = sprites.create(${spikes}, SpriteKind.Enemy)
spikes.setPosition(130, 60)`;
const placedRoles = `${threeRoles}
controller.moveSprite(mySprite, 100, 100)
mySprite.setStayInScreen(true)
coin.setPosition(130, 30)
spikes.setPosition(130, 90)`;
const collectCoin = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    otherSprite.destroy(effects.disintegrate, 500)
})`;
const hitSpikes = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    otherSprite.destroy()
})`;
const arena = `${hero}
controller.moveSprite(mySprite, 100, 100)
mySprite.setPosition(10, 110)
let crystal = sprites.create(${crystal}, SpriteKind.Food)
crystal.setPosition(150, 10)
let danger = sprites.create(${spikes}, SpriteKind.Enemy)
danger.setPosition(150, 110)`;
const arenaInfo = `${arena}\ninfo.setScore(0)\ninfo.setLife(3)\ninfo.startCountdown(20)`;
const collectCrystal = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    otherSprite.setPosition(randint(10, 150), randint(10, 110))
})`;
const winCrystal = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    if (info.score() == 5) {
        game.over(true)
    }
    otherSprite.setPosition(randint(10, 150), randint(10, 110))
})`;
const hitDanger = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    info.changeLifeBy(-1)
    otherSprite.destroy()
    danger = sprites.create(${spikes}, SpriteKind.Enemy)
    danger.setPosition(randint(10, 150), randint(10, 110))
})`;
const catcher = `${hero}\ncontroller.moveSprite(mySprite, 110, 110)\nmySprite.setStayInScreen(true)\nmySprite.setPosition(30, 60)`;
const target = `${catcher}\nlet star = sprites.create(${star}, SpriteKind.Food)\nstar.setPosition(130, 60)\ninfo.setScore(0)`;
const touchStar = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
})`;
const teleportStar = `sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    info.changeScoreBy(1)
    otherSprite.setPosition(randint(8, 152), randint(8, 112))
})`;

export default [
  ['lesson-05-step-01', buttonStart],
  ['lesson-05-step-02', `${buttonStart}\n${sayA}`],
  ['lesson-05-step-03', `${buttonStart}\n${jumpA}`],
  ['lesson-05-step-04', `${buttonStart}\n${jumpA}\n${colorB}`],
  ['lesson-05-step-06', `${buttonStart}\n${jumpA}\n${colorB}`],
  ['lesson-06-step-01', threeRoles],
  ['lesson-06-step-02', placedRoles],
  ['lesson-06-step-03', `${placedRoles}\n${collectCoin}`],
  ['lesson-06-step-04', `${placedRoles}\n${collectCoin}\n${hitSpikes}`],
  ['lesson-06-step-05', `${placedRoles}\ninfo.setLife(3)\n${collectCoin}\n${hitSpikes}`],
  ['lesson-07-step-01', arena],
  ['lesson-07-step-02', arenaInfo],
  ['lesson-07-step-03', `${arenaInfo}\n${collectCrystal}`],
  ['lesson-07-step-04', `${arenaInfo}\n${winCrystal}`],
  ['lesson-07-step-05', `${arenaInfo}\n${winCrystal}\n${hitDanger}`],
  ['lesson-08-step-01', catcher],
  ['lesson-08-step-02', target],
  ['lesson-08-step-03', `${target}\n${touchStar}`],
  ['lesson-08-step-04', `${target}\n${teleportStar}`],
  ['lesson-08-step-05', `${target}\ninfo.startCountdown(30)\n${teleportStar}`],
].map(([id, code]) => ({ id, code, options: { snippetMode: false } }));
