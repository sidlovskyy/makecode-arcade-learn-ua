const heroImage = `img\`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . 7 7 7 7 7 7 . . . . .
    . . . . . 7 7 7 7 7 7 . . . . .
    . . . . . 7 1 7 7 1 7 . . . . .
    . . . . . 7 f 7 7 f 7 . . . . .
    . . . . . 7 7 7 7 7 7 . . . . .
    . . . . 7 7 7 7 7 7 7 7 . . . .
    . . . . 7 7 7 1 1 7 7 7 . . . .
    . . . . 7 7 7 1 1 7 7 7 . . . .
    . . . . . 7 7 7 7 7 7 . . . . .
    . . . . . 7 7 7 7 7 7 . . . . .
    . . . . . 7 7 . . 7 7 . . . . .
    . . . . . 7 7 . . 7 7 . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
\``;

const flagImage = `img\`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . 1 1 1 f f 1 1 f f 1 1 . . .
    . . 1 1 1 f f 1 1 f f 1 1 . . .
    . . 1 f f 1 1 f f 1 1 f f . . .
    . . 1 f f 1 1 f f 1 1 f f . . .
    . . 1 1 1 f f 1 1 f f 1 1 . . .
    . . 1 1 1 f f 1 1 f f 1 1 . . .
    . . 1 f f 1 1 f f 1 1 f f . . .
    . . 1 f f 1 1 f f 1 1 f f . . .
    . . 1 . . . . . . . . . . . . .
    . . 1 . . . . . . . . . . . . .
    . . 1 . . . . . . . . . . . . .
    . . 1 . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
\``;

const createHero = `let mySprite = sprites.create(${heroImage}, SpriteKind.Player)`;
const controlledHero = `${createHero}\ncontroller.moveSprite(mySprite, 100, 100)`;
const racer = `${createHero}\ncontroller.moveSprite(mySprite, 90, 90)\nmySprite.setStayInScreen(true)`;
const start = `${racer}\nmySprite.setPosition(12, 60)`;
const finish = `${start}\nlet finish = sprites.create(${flagImage}, SpriteKind.Food)\nfinish.setPosition(148, 60)`;

export default [
  {
    id: 'lesson-01-step-04',
    code: `scene.setBackgroundColor(7)`,
    options: { snippetMode: false },
  },
  { id: 'lesson-02-step-02', code: createHero, options: { snippetMode: false } },
  { id: 'lesson-03-step-01', code: createHero, options: { snippetMode: false } },
  { id: 'lesson-03-step-02', code: controlledHero, options: { snippetMode: false } },
  // The experiment ends by restoring both speeds to 100.
  { id: 'lesson-03-step-05', code: controlledHero, options: { snippetMode: false } },
  { id: 'lesson-03-step-06', code: `${controlledHero}\nmySprite.setStayInScreen(true)`, options: { snippetMode: false } },
  { id: 'lesson-04-step-01', code: racer, options: { snippetMode: false } },
  { id: 'lesson-04-step-02', code: start, options: { snippetMode: false } },
  { id: 'lesson-04-step-04', code: finish, options: { snippetMode: false } },
  {
    id: 'lesson-04-step-05',
    code: `${finish}\nsprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {\n    game.over(true)\n})`,
    options: { snippetMode: false },
  },
];
