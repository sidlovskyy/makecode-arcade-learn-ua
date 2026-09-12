import type { Campaign } from './types';

// Selectable source examples, verified in Arcade's Python editor.
const hero = `img("""
    . . 5 5 5 5 . .
    . 5 5 5 5 5 5 .
    5 5 f 5 5 f 5 5
    5 5 5 5 5 5 5 5
    . 5 5 5 5 5 5 .
    . . 5 . . 5 . .
""")`;
const bridge = (variable = false, condition = false, final = false) => `${variable ? `speed = ${final ? 120 : 80}\n\n` : ''}def on_a_pressed():
    my_sprite.say_text("${final ? 'Python працює!' : 'Код працює!'}")${condition ? '\n    info.change_score_by(1)\n    if info.score() >= 3:\n        my_sprite.say_text("Три очки!")' : ''}
controller.A.on_event(ControllerButtonEvent.PRESSED, on_a_pressed)

my_sprite = sprites.create(${hero}, SpriteKind.player)
controller.move_sprite(my_sprite, ${variable ? 'speed, speed' : '80, 80'})${condition ? '\ninfo.set_score(0)' : ''}`;
const enemyFunction = (returns = true) => `def spawn_enemy(speed):
    enemy = sprites.create(img("""
        . 2 2 .
        2 2 2 2
        2 . . 2
    """), SpriteKind.enemy)
    enemy.vy = speed${returns ? '\n    return enemy' : ''}`;
const waveData = 'wave = 0\nspeeds = [30, 45, 60]';
const waveLoop = 'for speed in speeds:\n    spawn_enemy(speed)\n    pause(500)';
const pixels = `my_player = sprites.create(img("""
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
"""), SpriteKind.player)`;
const layers = `@namespace
class SpriteKind:
    Background = SpriteKind.create()

${pixels}
far_image = image.create(320, 120)
for index in range(20):
    far_image.set_pixel(index * 16, 60, 1)
    far_image.set_pixel(index * 16 + 8, 70, 5)
far = sprites.create(far_image, SpriteKind.Background)
far.z = -10
my_player.z = 0
hud = sprites.create(img("""
    9 9 9 9
    9 . . 9
    9 . . 9
    9 9 9 9
"""), SpriteKind.Background)
hud.z = 20`;
const scene = `${layers}
tiles.set_current_tilemap(tilemap("wide"))
controller.move_sprite(my_player, 80, 80)
my_player.set_position(40, 60)
scene.camera_follow_sprite(my_player)
far.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
hud.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
hud.set_position(10, 10)`;
const parallax = `${scene}

def on_update():
    far.x = 80 - my_player.x / 8
game.on_update(on_update)`;
const mini = `${parallax.replace('    Background = SpriteKind.create()', '    Background = SpriteKind.create()\n    MiniMap = SpriteKind.create()')}
my_minimap = minimap.minimap(MinimapScale.QUARTER)
minimap.include_sprite(my_minimap, my_player)
minimap_sprite = sprites.create(minimap.get_image(my_minimap), SpriteKind.MiniMap)
minimap_sprite.z = 50
minimap_sprite.set_flag(SpriteFlag.RELATIVE_TO_CAMERA, True)
minimap_sprite.set_position(118, 18)`;
const mvp = `def setup_player():
    my_player = sprites.create(img("""
        5 5 5
        5 f 5
        5 5 5
    """), SpriteKind.player)
    my_player.set_position(20, 60)
    controller.move_sprite(my_player, 80, 80)
    my_player.set_stay_in_screen(True)
    return my_player

def setup_goal():
    goal = sprites.create(img("""
        . 9 .
        9 9 9
        . 9 .
    """), SpriteKind.food)
    goal.set_position(140, 60)

def on_goal(sprite, other_sprite):
    game.over(True)
sprites.on_overlap(SpriteKind.player, SpriteKind.food, on_goal)

def on_danger(sprite, other_sprite):
    game.over(False)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, on_danger)

my_player = setup_player()
setup_goal()
danger = sprites.create(img("""
    2 . 2
    . 2 .
    2 . 2
"""), SpriteKind.enemy)
danger.set_position(80, 60)`;

export const campaign06: Campaign = {
  id: 'campaign-06', order: 6, title: 'Майстер коду',
  description: 'Перейди від блоків до Python, опануй графіку та створи власну завершену гру.',
  color: 'blue', reward: 'Автор власної гри',
  lessons: [
    {
      id: 'lesson-21', slug: 'vid-blokiv-do-python', order: 21, title: 'Від блоків до Python',
      summary: 'Зістав знайомі блоки з Python, зміни програму й перевір повернення до Blocks.',
      durationMinutes: 40, difficulty: 'master',
      concepts: ['Blocks', 'Python', 'обробник події', 'відступи', 'перетворення коду'],
      prerequisites: ['lesson-20'],
      objective: 'Знайти в Python відповідники створення героя, події та умови, змінити швидкість і перевірити коло Blocks → Python → Blocks.',
      steps: [
        {
          id: 'lesson-21-step-01', title: 'Збери знайомі блоки',
          instruction: 'Створи проєкт «Блоки й Python». У Blocks додай Player, керування 80 на 80 та подію A з повідомленням «Код працює!». Зображення героя на зразку можна змінити.',
          expected: 'Герой рухається стрілками, а A показує «Код працює!».',
          visual: { kind: 'blocks', assetId: 'blocks:lesson-21-step-01',
            alt: 'Початкова програма: створення Player, керування 80 на 80 і повідомлення за натисканням A.',
            focus: { x: 0, y: 0, width: 1, height: 1, label: 'Збери початок і подію A.' },
            explanation: 'Цю працюючу програму далі будемо читати у двох поданнях. Усі блоки виконують знайомі дії.' },
        },
        {
          id: 'lesson-21-step-02', title: 'Знайди створення спрайта в Python',
          instruction: 'У верхньому перемикачі мов відкрий меню та обери Python. Знайди my_sprite = sprites.create і порівняй його з блоком створення Player. Залиш весь згенерований малюнок між потрійними лапками.',
          expected: 'У Python видно той самий малюнок, SpriteKind.player і controller.move_sprite(my_sprite, 80, 80).',
          hint: 'Регістр важливий: стандартний вид героя записується SpriteKind.player. Меню мов відкривається стрілкою біля текстового редактора.',
          visual: { kind: 'comparison', focusedPreview: true, blocks: { assetId: 'blocks:lesson-21-step-02',
            alt: 'Та сама початкова програма; створення Player відповідає sprites.create у Python.',
            focus: { x: 0.015, y: 0.247, width: 0.535, height: 0.382, label: 'Знайди створення Player.' } },
            python: { label: 'Та сама програма в Python', code: bridge() },
            explanation: 'Присвоєння зберігає створений спрайт у my_sprite. img містить пікселі: крапка прозора, цифра задає колір.' },
        },
        {
          id: 'lesson-21-step-03', title: 'Зістав подію та обробник',
          instruction: 'Знайди def on_a_pressed(): і рядок із say_text під ним. Потім знайди controller.A.on_event: він пов’язує натискання A з функцією on_a_pressed. Натисни A в симуляторі.',
          expected: 'Ти пояснюєш, чому повідомлення з’являється після натискання A, і показуєш відступ усередині функції.',
          hint: 'У реєстрації події передаємо ім’я on_a_pressed без дужок. Чотири пробіли перед say_text означають, що команда належить функції.',
          visual: { kind: 'comparison', focusedPreview: true, blocks: { assetId: 'blocks:lesson-21-step-03',
            alt: 'Блок on A button pressed містить команду повідомлення спрайта.',
            focus: { x: 0.592, y: 0, width: 0.408, height: 0.671, label: 'Подія A та вкладена команда.' } },
            python: { label: 'Іменований обробник A', code: bridge() },
            explanation: 'def оголошує функцію, а on_event реєструє її як обробник. Рядок реєстрації не має відступу й стоїть поза функцією.' },
        },
        {
          id: 'lesson-21-step-04', title: 'Керуй швидкістю через змінну',
          instruction: 'Додай speed = 80 та заміни обидва числа в move_sprite на speed, як у прикладі. Запусти, потім зміни лише присвоєння на speed = 120 і запусти знову.',
          expected: 'Одне змінене число прискорює рух по обох осях; A продовжує працювати.',
          visual: { kind: 'python', label: 'Одна змінна для двох напрямків', code: bridge(true),
            explanation: 'Спочатку перевір 80, потім 120. Ім’я speed зберігає число, яке двічі передається в controller.move_sprite.' },
        },
        {
          id: 'lesson-21-step-05', title: 'Зістав умову з if',
          instruction: 'Додай info.set_score(0) після керування. У функції A після першого повідомлення додай зміну рахунку та if із прикладу. Для порівняння поверни speed до 80. Натисни A тричі.',
          expected: 'Рахунок зростає 1, 2, 3. Із третього натискання повідомлення змінюється на «Три очки!».',
          hint: 'if має чотири пробіли перед собою, а команда всередині нього — вісім. Умова >= 3 означає «не менше трьох».',
          visual: { kind: 'comparison', focusedPreview: true, blocks: { assetId: 'blocks:lesson-21-step-05',
            alt: 'У події A рахунок зростає на один; умова score ≥ 3 показує повідомлення «Три очки!».',
            focus: { x: 0.625, y: 0.464, width: 0.373, height: 0.46, label: 'Порівняй умову та вкладену дію.' } },
            python: { label: 'Умова всередині обробника', code: bridge(true, true) },
            explanation: 'Вкладені блоки стають вкладеними відступами. Після двокрапки if лише його відсунута команда залежить від рахунку.' },
        },
        {
          id: 'lesson-21-step-06', title: 'Перевір повне коло',
          instruction: 'Перейди до Blocks, задай speed значення 120 і перше повідомлення «Python працює!». Перевір блок умови, повернися до Python та зіграй: рух, A один раз, A ще двічі.',
          expected: 'Після кола Python → Blocks → Python лишилися швидкість 120, новий текст і перевірка рахунку; програма запускається.',
          hint: 'Якщо повернення до блоків не вдається, скасуй останню зміну й порівняй код зі зразком. Власний текстовий код не завжди має відповідний блок.',
          visual: { kind: 'comparison', focusedPreview: true, blocks: { assetId: 'blocks:lesson-21-step-06',
            alt: 'Завершена програма у Blocks: speed 120, нове повідомлення та збережена умова рахунку.',
            focus: { x: 0.014, y: 0.152, width: 0.986, height: 0.772, label: 'Перевір збережені зміни.' } },
            python: { label: 'Python після повернення', code: bridge(true, true, true) },
            explanation: 'Порівнюй дію програми, значення та події. MakeCode може переставити оголошення або змінити імена під час перетворення.' },
        },
      ],
      challenge: { title: 'Три відповідності', prompt: 'У Blocks додай до події B зміну рахунку, паузу й перемогу. Перейди до Python, знайди три відповідні виклики та перевір повернення до блоків.', hint: 'Шукай info.change_score_by, pause і game.game_over(True). Перевір подію B після перезапуску.' },
      quiz: { question: 'Який рядок пов’язує обробник on_a_pressed із натисканням A?',
        options: ['speed = 80', 'controller.A.on_event(ControllerButtonEvent.PRESSED, on_a_pressed)', 'my_sprite = sprites.create(...)'], correctIndex: 1,
        explanation: 'on_event отримує вид події та ім’я функції без дужок. Тіло функції виконається, коли гравець натисне A.' },
      xp: 225, makeCodeUrl: 'https://arcade.makecode.com/',
    },
    {
      id: 'lesson-22', slug: 'python-u-hri', order: 22, title: 'Python у грі',
      summary: 'Побудуй хвилю ворогів: змінна, список швидкостей, функція, цикл та умова.',
      durationMinutes: 50, difficulty: 'master',
      concepts: ['змінна', 'список', 'параметр', 'return', 'for', 'if/else', 'відступи'],
      prerequisites: ['lesson-21'],
      objective: 'Написати у Python функцію створення ворога, передати їй швидкості зі списку й обрати складність через if/else.',
      steps: [
        {
          id: 'lesson-22-step-01', title: 'Створи змінну хвилі',
          instruction: 'У новому проєкті обери Python. Введи wave = 0 і покажи це число як рахунок. Зміни wave на 2, перевір результат і поверни 0.',
          expected: 'Рахунок відповідає числу у wave; після повернення значення він дорівнює нулю.',
          visual: { kind: 'python', label: 'Змінна з числовим значенням', code: 'wave = 0\ninfo.set_score(wave)',
            explanation: 'Змінна має ім’я та значення. MakeCode розуміє wave як число з присвоєного 0 і способу використання.' },
        },
        {
          id: 'lesson-22-step-02', title: 'Збери список швидкостей',
          instruction: 'Додай speeds = [30, 45, 60]. Тимчасово покажи довжину списку через len(speeds), як у прикладі.',
          expected: 'На рахунку видно 3 — кількість значень у списку, а не одну зі швидкостей.',
          visual: { kind: 'python', label: 'Три числа в одному списку', code: `${waveData}\ninfo.set_score(len(speeds))`,
            explanation: 'Квадратні дужки об’єднують значення в список; коми відділяють елементи. len рахує елементи.' },
        },
        {
          id: 'lesson-22-step-03', title: 'Передай аргумент функції',
          instruction: 'Заміни перевірку довжини на функцію spawn_enemy(speed) і виклик spawn_enemy(30). Збережи відступи: створення спрайта й enemy.vy належать функції.',
          expected: 'Один ворог рухається вниз зі швидкістю 30; зміна аргументу на 60 прискорює його.',
          hint: 'speed — параметр у визначенні функції; 30 — аргумент у виклику. Числове використання enemy.vy допомагає редактору визначити тип параметра.',
          visual: { kind: 'python', label: 'Функція з параметром швидкості', code: `${waveData}\n\n${enemyFunction(false)}\n\nspawn_enemy(30)`,
            explanation: 'Визначення def описує дію, а виклик запускає її. Функція може приймати інше число при кожному виклику.' },
        },
        {
          id: 'lesson-22-step-04', title: 'Поверни створеного ворога',
          instruction: 'Додай return enemy наприкінці функції. Збережи результат виклику у first_enemy та задай йому позицію (20, 10).',
          expected: 'Повернений ворог починає рух у точці (20, 10); поза функцією ти можеш змінювати цей спрайт.',
          visual: { kind: 'python', label: 'return передає результат назовні', code: `${waveData}\n\n${enemyFunction()}\n\nfirst_enemy = spawn_enemy(30)\nfirst_enemy.set_position(20, 10)`,
            explanation: 'return повертає саме створений спрайт. first_enemy посилається на нього й дозволяє викликати set_position після завершення функції.' },
        },
        {
          id: 'lesson-22-step-05', title: 'Перебери список циклом',
          instruction: 'Заміни одиночний виклик і позицію на цикл for speed in speeds. Усередині виклич spawn_enemy(speed) та pause(500).',
          expected: 'З інтервалом пів секунди з’являються три вороги зі швидкостями 30, 45 і 60.',
          visual: { kind: 'python', label: 'Одна ітерація для кожної швидкості', code: `${waveData}\n\n${enemyFunction()}\n\n${waveLoop}`,
            explanation: 'for по черзі бере значення зі списку. Обидва рядки з чотирма пробілами повторюються для кожного значення; pause вимірюється в мілісекундах.' },
        },
        {
          id: 'lesson-22-step-06', title: 'Обери складність через if/else',
          instruction: 'Перед циклом обери список через if wave >= 3 та else. Запусти з wave = 0, потім задай wave = 3 і порівняй рух. Поясни аргумент, return та всі відступи.',
          expected: 'За wave 0 рухаються три вороги зі швидкостями 30, 45, 60; за wave 3 — 60, 75, 90. Обидві гілки запускаються без помилок.',
          hint: 'else стоїть на одному рівні з if. Цикл стоїть після обох гілок без відступу, тому виконується за будь-якої складності.',
          visual: { kind: 'python', label: 'Завершена хвиля з двома складностями',
            code: `wave = 0\n\n${enemyFunction()}\n\nif wave >= 3:\n    speeds = [60, 75, 90]\nelse:\n    speeds = [30, 45, 60]\n\n${waveLoop}`,
            explanation: 'Умова обирає список. Цикл передає кожне число як аргумент speed, функція створює й повертає ворога, а відступи задають межі функції, гілок і циклу.' },
        },
      ],
      challenge: { title: 'Функція нової хвилі', prompt: 'Збережи визначення spawn_enemy. Перенеси попередній верхньорівневий цикл for speed in speeds разом із його двома командами у функцію start_wave(speeds). Заміни старий цикл одним викликом start_wave([30, 45, 60, 75]) поза функціями.', hint: 'Заголовок: def start_wave(speeds: List[number]): — List[number] позначає список чисел. Цикл усередині функції має чотири пробіли, а його дві команди — вісім. Старого окремого циклу більше немає: є лише один запуск хвилі. Перевір, що з’явилися саме чотири вороги.' },
      quiz: { question: 'Що повертає return enemy у функції spawn_enemy?',
        options: ['Створений спрайт, який можна далі змінювати', 'Кількість пробілів у коді', 'Увесь список швидкостей'], correctIndex: 0,
        explanation: 'return передає результат виклику. Якщо записати first_enemy = spawn_enemy(30), ця змінна зберігатиме створений спрайт.' },
      xp: 275, makeCodeUrl: 'https://arcade.makecode.com/',
    },
    {
      id: 'lesson-23', slug: 'hrafika-maistra', order: 23, title: 'Графіка майстра',
      summary: 'Редагуй пікселі у Python, побудуй шари, паралакс і мінікарту.',
      durationMinutes: 55, difficulty: 'master',
      concepts: ['img у Python', 'z-шари', 'паралакс', 'мінікарта', 'інтервал оновлення'],
      prerequisites: ['lesson-22'],
      objective: 'Створити графіку у Python, розташувати спрайти на шарах і оновлювати мінікарту офіційним розширенням.',
      steps: [
        {
          id: 'lesson-23-step-01', title: 'Відредагуй пікселі у Python',
          instruction: 'У новому проєкті Python створи героя 16×16 зі зразка. Зміни кілька цифр кольору та прозорих крапок між потрійними лапками, зберігаючи 16 рядків по 16 пікселів.',
          expected: 'У симуляторі змінюються саме відредаговані пікселі героя.',
          visual: { kind: 'python', label: 'Малюнок 16×16 як текст', code: pixels,
            explanation: 'img перетворює сітку символів на зображення. Це справжній текст: його можна виділити, скопіювати та змінити у Python.' },
        },
        {
          id: 'lesson-23-step-02', title: 'Побудуй три шари',
          instruction: 'Продовж попередній код: створи far із зорями та hud за зразком. Задай far.z = -10, my_player.z = 0 і hud.z = 20. На старті вони розміщені навколо центру екрана.',
          expected: 'Герой перекриває далекі зорі, а рамка hud видима поверх героя.',
          visual: { kind: 'python', label: 'Глибина визначається властивістю z', code: layers,
            explanation: 'Більше z малюється попереду. Прозоре полотно far має 320×120 пікселів; цикл додає ряди зір. Оголошення @namespace створює власний вид Background для декорацій.' },
        },
        {
          id: 'lesson-23-step-03', title: 'Підготуй карту wide',
          instruction: 'Відкрий Assets → плюс (Create a new asset) → Tilemap. Унизу введи назву wide, ширину 20 та висоту 8 клітинок. Залиш верхні сім рядів прозорими (сіра шахівниця). У Gallery → Forest обери плитку землі tileGrass2, інструмент Paint (олівець) і зафарбуй усі 20 клітинок через увесь нижній ряд. Натисни Done, щоб зберегти карту, і повернися до Python.',
          expected: 'В Assets є карта wide 20×8 клітинок, тобто 320×128 пікселів: прозоре небо та суцільний нижній ряд землі. Код шарів попереднього кроку збережений.',
          hint: 'wide — назва ресурсу карти, створеного в Assets. У tilemap("wide") вона має збігатися з назвою в редакторі. Непрозорі плитки неба приховають далекі зорі.',
          visual: { kind: 'editor', assetId: 'editor:tilemap-editor', sourcePanel: 1,
            alt: 'Редактор Tilemap: карта wide, поля розміру 20 та 8, прозорі верхні сім рядів і земля внизу; Done зберігає ресурс.',
            focus: { x: 185 / 1440, y: 228 / 900, width: 1230 / 1440, height: 492 / 900, label: 'Залиш верхні сім рядів прозорими; намалюй землю тільки в нижньому ряду.' },
            explanation: 'Поля ширини й висоти — внизу ліворуч, назва wide — внизу праворуч перед Done. Шахівниця означає прозорість: крізь неї буде видно зорі. Наступний крок підключає цю карту до Python.' },
        },
        {
          id: 'lesson-23-step-04', title: 'Рухай далекі зорі повільніше',
          instruction: 'Після попередніх шарів додай вибір карти wide, керування та камеру зі зразка: tiles.set_current_tilemap, move_sprite, set_position і camera_follow_sprite. Прив’яжи far та hud до камери й розмісти hud у куті. Потім додай функцію on_update та реєстрацію game.on_update. Усередині задай far.x = 80 - my_player.x / 8. Пройди картою праворуч і назад.',
          expected: 'Коли x героя зростає на 80, x далекого шару зменшується на 10; рух назад змінює напрямок зсуву.',
          hint: 'Рядок із far.x має чотири пробіли, а game.on_update — жодного. Прапорець RELATIVE_TO_CAMERA дає змогу керувати зсувом вручну.',
          visual: { kind: 'python', label: 'Оновлення паралаксу кожного кадру', code: parallax,
            explanation: 'Формула ділить рух на вісім і змінює його напрямок. Це простий ефект глибини для нашої короткої карти wide.' },
        },
        {
          id: 'lesson-23-step-05', title: 'Додай офіційну мінікарту',
          instruction: 'В Extensions знайди https://github.com/microsoft/arcade-minimap і додай розширення. У Python додай вид MiniMap та команди minimap зі зразка. Зістав блок draw my_player on my_minimap із викликом include_sprite.',
          expected: 'У верхньому правому куті видно карту wide у масштабі Quarter із позначкою стартового місця героя.',
          hint: 'include_sprite отримує спочатку карту, потім спрайт: minimap.include_sprite(my_minimap, my_player). get_image дістає малюнок карти, з якого створюється окремий спрайт.',
          visual: { kind: 'comparison', blocks: { assetId: 'blocks:lesson-23-step-05',
            alt: 'Програма з картою wide, паралаксом та рідними блоками minimap Quarter, draw my_player і my_minimap image.',
            focus: { x: 0.01, y: 0.744, width: 0.498, height: 0.238, label: 'Створення та відображення мінікарти.' } },
            python: { label: 'Python із розширенням arcade-minimap', code: mini },
            explanation: 'my_minimap — об’єкт карти; minimap_sprite — спрайт її зображення. z 50 і прив’язка до камери розміщують його над ігровою сценою. Поки це один знімок.' },
        },
        {
          id: 'lesson-23-step-06', title: 'Оновлюй мінікарту двічі на секунду',
          instruction: 'Додай on_update_interval і реєстрацію game.on_update_interval(500, on_update_interval). Щоразу створюй свіжу карту, малюй героя й оновлюй зображення minimap_sprite.',
          expected: 'Позначка пересувається приблизно двічі на секунду без старого сліду; керування та паралакс лишаються плавними.',
          visual: { kind: 'python', label: 'Нова карта прибирає стару позначку',
            code: `${mini}\n\ndef on_update_interval():\n    current_map = minimap.minimap(MinimapScale.QUARTER)\n    minimap.include_sprite(current_map, my_player)\n    minimap_sprite.set_image(minimap.get_image(current_map))\ngame.on_update_interval(500, on_update_interval)`,
            explanation: 'current_map локальна для одного оновлення. Перемальовуємо карту раз на 500 мс, а паралакс продовжує оновлюватись кожного кадру.' },
        },
      ],
      challenge: { title: 'Другий шар глибини', prompt: 'У Python додай near_layer із z -5 та прапорцем RELATIVE_TO_CAMERA. У наявному on_update задай near_layer.x = 80 - my_player.x / 3 і порівняй рух із far.', hint: 'Створи near_layer до запуску оновлень. Дільник 3 дає більший зсув, ніж 8, тому ближчий шар рухається швидше.' },
      quiz: { question: 'Навіщо під час оновлення створювати новий об’єкт мінікарти?',
        options: ['Щоб збільшити швидкість героя', 'Щоб прибрати стару позначку перед малюванням нової', 'Щоб змінити ім’я проєкту'], correctIndex: 1,
        explanation: 'include_sprite малює на зображенні карти. Новий знімок кожні 500 мс прибирає попередню позначку, а set_image показує оновлений результат.' },
      xp: 300, makeCodeUrl: 'https://arcade.makecode.com/pkg/microsoft/arcade-minimap',
    },
    {
      id: 'lesson-24', slug: 'moia-vlasna-hra', order: 24, title: 'Моя власна гра',
      summary: 'Спроєктуй MVP у Python, протестуй його, поліпш і безпечно поділися.',
      durationMinutes: 60, difficulty: 'master',
      concepts: ['MVP', 'функції Python', 'ігровий цикл', 'тестування', 'безпечна публікація'],
      prerequisites: ['lesson-23'],
      objective: 'Створити власний ігровий цикл у Python, перевірити перемогу й поразку, зберегти резервну копію та підготувати гру до безпечної публікації.',
      steps: [
        {
          id: 'lesson-24-step-01', title: 'Запиши задум',
          instruction: 'Закінчи речення: «Гравець робить …, щоб …, але йому заважає …». Обери одну головну дію та поясни задум за 20 секунд.',
          expected: 'У задумі є дія, мета й перешкода; його можна реалізувати знайомими командами Python.',
          visual: { kind: 'guide', title: 'Картка задуму', items: ['Дія: що гравець робить найчастіше?', 'Мета: як він зрозуміє, що переміг?', 'Перешкода: що може призвести до поразки?', 'Приклад: керуй мандрівником, щоб дістатися кристала, оминаючи пастку. Заміни тему своєю.'] },
        },
        {
          id: 'lesson-24-step-02', title: 'Визнач MVP',
          instruction: 'Склади список із чотирьох обов’язкових частин: керований герой, мета, небезпека, перемога або поразка. Інші ідеї відклади до списку «потім».',
          expected: 'Є чотири перевірні частини MVP і окремий список додаткових ідей.',
          visual: { kind: 'guide', title: 'Мінімальна гра, яку можна пройти', items: ['Герой: рухається від керування.', 'Мета: до неї можна дістатися й отримати перемогу.', 'Небезпека: контакту можна уникнути, а зіткнення дає поразку.', 'Завершення: після екрана результату натисни A у симуляторі або клавішу Z, щоб почати знову.', 'Потім: нова графіка, музика, бонуси або рівні.'] },
        },
        {
          id: 'lesson-24-step-03', title: 'Створи ігровий цикл у Python',
          instruction: 'Створи проєкт із нейтральною назвою без свого імені та обери Python. Використай каркас: налаштуй setup_player, setup_goal, небезпеку й обробники зіткнень під свій задум. Спочатку перевір обидва результати.',
          expected: 'Герой рухається, мета дає перемогу, небезпека дає поразку. Після екрана результату натисни A у симуляторі або клавішу Z, щоб почати знову.',
          hint: 'У каркасі пастку можна обійти зверху або знизу. Змінюй одну частину за раз; власні зображення додавай після перевірки правил.',
          visual: { kind: 'python', label: 'MVP: функції налаштування та два обробники', code: mvp,
            explanation: 'setup_player повертає героя, setup_goal розміщує мету. on_goal і on_danger відповідають за різні завершення. Малюнки, координати й швидкість тут — приклад для твоєї теми.' },
        },
        {
          id: 'lesson-24-step-04', title: 'Перевір самостійно',
          instruction: 'Перевір старт, керування, досягнення мети та зіткнення з небезпекою. Після екрана результату натисни A у симуляторі або клавішу Z, щоб почати знову. Окремо натисни кнопку з круглою стрілкою під симулятором — Restart (Restart the simulator). Виправ Python-код і повтори перевірки двічі.',
          expected: 'Усі п’ять ситуацій працюють після двох послідовних запусків без ручного втручання в код.',
          visual: { kind: 'guide', title: 'П’ять перевірок — два проходи', items: ['Старт: усі об’єкти у своїх початкових місцях.', 'Керування: перевір усі напрямки та край екрана.', 'Мета: обійди небезпеку й отримай перемогу. Після екрана результату натисни A у симуляторі або клавішу Z, щоб почати знову.', 'Небезпека: навмисно отримай поразку. Після екрана результату натисни A у симуляторі або клавішу Z, щоб почати знову.', 'Restart: натисни круглу стрілку під симулятором; знову є початкові об’єкти та працездатне керування.', 'Запиши помилку, виправ її та повтори весь список двічі.'] },
        },
        {
          id: 'lesson-24-step-05', title: 'Проведи тест із гравцем',
          instruction: 'Дай гру другові, подрузі або дорослому. Першу хвилину не підказуй. Запитай, що було зрозуміло, складно й цікаво.',
          expected: 'Записано одну конкретну проблему або ідею покращення з поведінки чи відгуку гравця.',
          visual: { kind: 'guide', title: 'Спостереження замість підказок', items: ['Запиши, що гравець зробив першим.', 'Познач місце, де він зупинився або помилився.', 'Запитай: «Якою була мета? Що заважало? Що хочеться повторити?»', 'Обери одну зміну, яка допоможе зрозуміти або пройти гру.'] },
        },
        {
          id: 'lesson-24-step-06', title: 'Поліпш Python-код і збережи',
          instruction: 'Внеси одне покращення в Python, повтори п’ять перевірок і натисни Save зі значком дискети, щоб завантажити резервний PNG-файл проєкту.',
          expected: 'Поліпшена гра проходить перевірки, а резервний файл є у завантаженнях пристрою.',
          visual: { kind: 'editor', assetId: 'editor:tilemap-editor', sourcePanel: 2,
            alt: 'Редактор Python: кнопка Save зі значком дискети внизу праворуч від назви проєкту.',
            focus: { x: 0.383, y: 0.934, width: 0.03, height: 0.05, label: 'Збережи резервну копію через Save.' },
            explanation: 'На знімку відкрите подання Python. Save завантажує PNG, який містить проєкт: зберігай цей файл як резервну копію.' },
        },
        {
          id: 'lesson-24-step-07', title: 'Поділися безпечно',
          instruction: 'Перед Share прибери з назви й текстів справжнє ім’я, фото, школу, адресу та контакти. Попроси дорослого перевірити гру та погодити публікацію, а потім поділися посиланням із людьми, яким довіряєш.',
          expected: 'У грі немає особистих даних, дорослий погодив публікацію, а посилання збережене в безпечному місці.',
          visual: { kind: 'guide', title: 'Перевірка перед Share', items: ['Переглянь назву, малюнки, повідомлення й коментарі Python: прибери особисті дані.', 'Разом із дорослим зіграйте та перегляньте код перед публікацією.', 'Лише після погодження натисни Share у верхній панелі редактора.', 'У відкритому діалозі разом із дорослим перевір нейтральну назву проєкту.', 'Натисни Share Project у цьому діалозі — ця дія публікує гру та створює посилання.', 'Скопіюй створене посилання та збережи його в безпечному місці.', 'Люди з посиланням можуть відкрити гру й код і передати посилання іншим.'] },
        },
      ],
      challenge: { title: 'Версія 1.1', prompt: 'Додай у Python одну можливість зі списку «потім» і знову проведи всі перевірки. Збережи нову резервну копію.', hint: 'Обери зміну на 20 хвилин: звук, бонус або стартову підказку. Якщо знову публікуєш, повтори перевірку приватності з дорослим.' },
      quiz: { question: 'Що потрібно зробити перед Share власної гри?',
        options: ['Додати повне ім’я та школу', 'Прибрати особисті дані й попросити дорослого перевірити публікацію', 'Видалити умови перемоги'], correctIndex: 1,
        explanation: 'Посилання відкриває гру й Python-код людям, які його мають. Прибери особисті дані та разом із дорослим погодь публікацію.' },
      xp: 400, makeCodeUrl: 'https://arcade.makecode.com/share',
    },
  ],
};
