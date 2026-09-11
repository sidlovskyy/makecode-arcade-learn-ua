// Named resource matches the 20 × 8 transparent-sky map drawn in lesson 23.
const cells = Array.from({ length: 8 }, (_, y) => Array(20).fill(y === 7 ? 1 : 0));
const header = [20, 0, 8, 0];
const tileset = ['gallerytilemaps.baseTransparency16', 'sprites.castle.tileGrass2'];
const hex = [...header, ...cells.flat()].map(n => n.toString(16).padStart(2, '0')).join('');
const data = Buffer.from([16, ...header, ...cells.flat(), ...Array(80).fill(0)]).toString('hex');
export const wideAssets = {
  'tilemap.g.jres': JSON.stringify({ wide: { id: 'wide', mimeType: 'application/mkcd-tilemap', data: Buffer.from(data).toString('base64'), tileset, displayName: 'wide' } }),
  'tilemap.g.ts': `namespace myTiles { helpers._registerFactory("tilemap", function (name: string) {
    if (helpers.stringTrim(name) == "wide") return tiles.createTilemap(hex\`${hex}\`, img\`${Array(8).fill('.'.repeat(20)).join('\n')}\`, [${tileset.join(', ')}], TileScale.Sixteen)
    return null
  }) }`,
};

// The code below is the current Arcade compiler output of the paired Python.
const programs = [
  {
    id: 'lesson-21-step-01',
    code: `controller.A.onEvent(ControllerButtonEvent.Pressed, function on_a_pressed() {
    my_sprite.sayText("Код працює!")
})
let my_sprite = sprites.create(img\`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
\`, SpriteKind.Player)
controller.moveSprite(my_sprite, 80, 80)
`,
  },
  {
    id: 'lesson-21-step-02',
    code: `controller.A.onEvent(ControllerButtonEvent.Pressed, function on_a_pressed() {
    my_sprite.sayText("Код працює!")
})
let my_sprite = sprites.create(img\`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
\`, SpriteKind.Player)
controller.moveSprite(my_sprite, 80, 80)
`,
  },
  {
    id: 'lesson-21-step-03',
    code: `controller.A.onEvent(ControllerButtonEvent.Pressed, function on_a_pressed() {
    my_sprite.sayText("Код працює!")
})
let my_sprite = sprites.create(img\`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
\`, SpriteKind.Player)
controller.moveSprite(my_sprite, 80, 80)
`,
  },
  {
    id: 'lesson-21-step-05',
    code: `let speed = 80
controller.A.onEvent(ControllerButtonEvent.Pressed, function on_a_pressed() {
    my_sprite.sayText("Код працює!")
    info.changeScoreBy(1)
    if (info.score() >= 3) {
        my_sprite.sayText("Три очки!")
    }

})
let my_sprite = sprites.create(img\`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
\`, SpriteKind.Player)
controller.moveSprite(my_sprite, speed, speed)
info.setScore(0)
`,
  },
  {
    id: 'lesson-21-step-06',
    code: `let speed = 120
controller.A.onEvent(ControllerButtonEvent.Pressed, function on_a_pressed() {
    my_sprite.sayText("Python працює!")
    info.changeScoreBy(1)
    if (info.score() >= 3) {
        my_sprite.sayText("Три очки!")
    }

})
let my_sprite = sprites.create(img\`
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
\`, SpriteKind.Player)
controller.moveSprite(my_sprite, speed, speed)
info.setScore(0)
`,
  },
  {
    id: 'lesson-23-step-05',
    code: `namespace SpriteKind {
    export const Background = SpriteKind.create()
    export const MiniMap = SpriteKind.create()
}

let my_player = sprites.create(img\`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . 5 5 5 5 5 5 5 5 . . . .
    . . . . 5 5 f 5 5 f 5 5 . . . .
    . . . . 5 5 5 5 5 5 5 5 . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . . . 8 8 8 8 . . . . . .
    . . . . . 8 8 8 8 8 8 . . . . .
    . . . . 8 8 8 8 8 8 8 8 . . . .
    . . . . . . 8 8 8 8 . . . . . .
    . . . . . . 8 8 8 8 . . . . . .
    . . . . . . 8 . . 8 . . . . . .
    . . . . . . 8 . . 8 . . . . . .
    . . . . . 8 8 . . 8 8 . . . . .
    . . . . . . . . . . . . . . . .
\`, SpriteKind.Player)
let far_image = image.create(320, 120)
for (let index = 0; index < 20; index++) {
    far_image.setPixel(index * 16, 60, 1)
    far_image.setPixel(index * 16 + 8, 70, 5)
}
let far = sprites.create(far_image, SpriteKind.Background)
far.z = -10
my_player.z = 0
let hud = sprites.create(img\`
    9 9 9 9
    9 . . 9
    9 . . 9
    9 9 9 9
\`, SpriteKind.Background)
hud.z = 20
tiles.setCurrentTilemap(tilemap\`wide\`)
controller.moveSprite(my_player, 80, 80)
my_player.setPosition(40, 60)
scene.cameraFollowSprite(my_player)
far.setFlag(SpriteFlag.RelativeToCamera, true)
hud.setFlag(SpriteFlag.RelativeToCamera, true)
hud.setPosition(10, 10)
game.onUpdate(function on_update() {
    far.x = 80 - my_player.x / 8
})
let my_minimap = minimap.minimap(MinimapScale.Quarter)
minimap.includeSprite(my_minimap, my_player)
let minimap_sprite = sprites.create(minimap.getImage(my_minimap), SpriteKind.MiniMap)
minimap_sprite.z = 50
minimap_sprite.setFlag(SpriteFlag.RelativeToCamera, true)
minimap_sprite.setPosition(118, 18)
`,
  },
];

export default programs.map(entry => ({
  ...entry,
  options: { snippetMode: false, ...(entry.id === "lesson-23-step-05" ? { assets: wideAssets, package: "arcade-minimap=github:microsoft/arcade-minimap#v0.6.1" } : {}) },
}));
