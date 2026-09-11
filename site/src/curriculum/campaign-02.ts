import type { Campaign } from './types';

export const campaign02: Campaign = {
  id: 'campaign-02',
  order: 2,
  title: 'Дослідник',
  description: 'Навчи гру реагувати на кнопки й зустрічі спрайтів, а потім додай очки, життя та час.',
  color: 'yellow',
  reward: 'Зоряний дослідник',
  lessons: [
    {
      id: 'lesson-05',
      slug: 'knopky-i-podii',
      order: 5,
      title: 'Кнопки й події',
      summary: 'Запускай різні дії кнопками A і B.',
      durationMinutes: 25,
      difficulty: 'explorer',
      concepts: ['подія', 'on start', 'кнопки A/B', 'обробник'],
      prerequisites: ['lesson-04'],
      objective: 'Навчити гру реагувати на натискання A і B та відрізняти початкові команди від подій.',
      steps: [
        {
          id: 'lesson-05-step-01',
          title: 'Налаштуй початок',
          instruction:
            'Створи проєкт «Кнопки й події». У on start задай синє тло, створи спрайт Player і намалюй робота.',
          expected: 'Після Restart один робот одразу з’являється на синьому тлі.',
        },
        {
          id: 'lesson-05-step-02',
          title: 'Додай подію A',
          instruction:
            'У Controller перетягни окремий блок on A button pressed. Усередину додай команду mySprite say «Стрибок!» for 500 ms.',
          expected: 'Напис «Стрибок!» з’являється тільки після натискання A.',
        },
        {
          id: 'lesson-05-step-03',
          title: 'Зроби справжній стрибок',
          instruction:
            'У тій самій події A заміни напис блоком change mySprite y by -10, а після нього додай pause 150 ms і change y by 10.',
          expected: 'Після A робот швидко підстрибує вгору й повертається на попереднє місце.',
          hint:
            'У координатах Arcade менше y означає вище. Тому перша зміна від’ємна, а друга — додатна.',
        },
        {
          id: 'lesson-05-step-04',
          title: 'Додай подію B',
          instruction:
            'Створи блок on B button pressed і встав у нього set background color. Обери колір, відмінний від синього.',
          expected: 'B змінює тло, але не рухає робота.',
        },
        {
          id: 'lesson-05-step-05',
          title: 'Порівняй моменти запуску',
          instruction:
            'Натисни A тричі й B двічі, потім Restart. Простеж, що виконується багато разів, а що — лише на старті.',
          expected: 'Події A і B повторюються після кожного натискання, а початкове синє тло та створення робота виконуються один раз після Restart.',
        },
        {
          id: 'lesson-05-step-06',
          title: 'Розклади блоки правильно',
          instruction:
            'Переконайся, що створення спрайта лежить в on start, а команди для кнопок — у двох окремих подіях Controller.',
          expected: 'На робочій області видно три окремі секції: on start, on A pressed і on B pressed.',
        },
      ],
      challenge: {
        title: 'Дві кнопки — два сигнали',
        prompt:
          'Зроби новий проєкт, де A показує слово «Так», B показує «Ні», а on start показує «Обери!» лише один раз.',
        hint: 'Для початкового повідомлення використай splash у on start, а для кнопок — дві події say.',
      },
      quiz: {
        question: 'Чим on start відрізняється від on A button pressed?',
        options: [
          'on start виконується один раз під час запуску, а подія A — після кожного натискання A',
          'Обидві події працюють лише один раз',
          'on start працює тільки після натискання A',
        ],
        correctIndex: 0,
        explanation:
          'on start готує початковий стан гри. Обробник кнопки чекає на дію гравця й може запускатися знову і знову.',
      },
      xp: 125,
      makeCodeUrl: 'https://arcade.makecode.com/reference/controller/button/on-event',
    },
    {
      id: 'lesson-06',
      slug: 'koly-spraity-zustrichaiutsia',
      order: 6,
      title: 'Коли спрайти зустрічаються',
      summary: 'Розділи спрайти за ролями та безпечно обробляй зіткнення.',
      durationMinutes: 30,
      difficulty: 'explorer',
      concepts: ['SpriteKind', 'overlap', 'параметри події', 'destroy'],
      prerequisites: ['lesson-05'],
      objective: 'Використати категорії SpriteKind і окремі обробники overlap, не знищуючи помилково героя.',
      steps: [
        {
          id: 'lesson-06-step-01',
          title: 'Створи три ролі',
          instruction:
            'Створи проєкт «Зустріч спрайтів». Додай героя Player, монету Food і шипи Enemy з різними зображеннями.',
          expected: 'У симуляторі видно три різні спрайти, а в кожного блока створення вказаний свій kind.',
        },
        {
          id: 'lesson-06-step-02',
          title: 'Розстав об’єкти',
          instruction:
            'Додай герою керування й stay in screen. Постав монету праворуч угорі, а шипи праворуч унизу.',
          expected: 'Герой рухається, а монета й шипи лишаються на різних місцях.',
        },
        {
          id: 'lesson-06-step-03',
          title: 'Оброби монету',
          instruction:
            'Додай overlap Player з Food. Усередині збільш рахунок на 1 і знищ otherSprite з ефектом disintegrate.',
          expected: 'Після дотику монета зникає один раз, а рахунок стає 1; герой лишається.',
          hint:
            'У цій події sprite — герой Player, а otherSprite — монета Food. Знищуй саме otherSprite.',
        },
        {
          id: 'lesson-06-step-04',
          title: 'Оброби небезпеку',
          instruction:
            'Додай іншу подію overlap Player з Enemy. У ній зменш життя на 1 і знищ otherSprite.',
          expected: 'Дотик до шипів забирає одне життя і прибирає шипи, не знищуючи героя.',
        },
        {
          id: 'lesson-06-step-05',
          title: 'Задай запас життя',
          instruction: 'У on start установи 3 життя. Перезапусти гру та по черзі торкнися монети й шипів.',
          expected: 'Монета додає очко, шипи віднімають одне з трьох життів, а події не плутаються.',
        },
        {
          id: 'lesson-06-step-06',
          title: 'Перевір ролі',
          instruction:
            'Тимчасово зміни kind монети з Food на Enemy, перевір дотик, а потім поверни Food.',
          expected: 'З kind Enemy монета запускає небезпечну подію; після повернення Food вона знову дає очко.',
        },
      ],
      challenge: {
        title: 'Ліки й пастка',
        prompt:
          'Створи серце типу Food, яке додає одне життя й зникає, та пастку типу Enemy, яка забирає життя й теж зникає.',
        hint: 'Зроби два overlap-обробники та в кожному знищуй otherSprite, а не sprite.',
      },
      quiz: {
        question: 'Навіщо спрайтам задають різні SpriteKind?',
        options: [
          'Щоб автоматично змінити їхній колір',
          'Щоб групувати спрайти за роллю й запускати правильні події',
          'Щоб усі спрайти рухалися однаково',
        ],
        correctIndex: 1,
        explanation:
          'SpriteKind позначає роль об’єкта. Завдяки цьому overlap Player–Food може нагороджувати, а Player–Enemy — шкодити.',
      },
      xp: 125,
      makeCodeUrl: 'https://arcade.makecode.com/reference/sprites/on-overlap',
    },
    {
      id: 'lesson-07',
      slug: 'rakhunok-zhyttia-chas',
      order: 7,
      title: 'Рахунок, життя, час',
      summary: 'Покажи стан гри та задай зрозумілі умови перемоги й поразки.',
      durationMinutes: 30,
      difficulty: 'explorer',
      concepts: ['score', 'life', 'countdown', 'game over'],
      prerequisites: ['lesson-06'],
      objective: 'Додати рахунок, життя, відлік часу та окремі умови перемоги й поразки.',
      steps: [
        {
          id: 'lesson-07-step-01',
          title: 'Підготуй арену',
          instruction:
            'Створи героя Player з керуванням, один кристал Food і одну небезпеку Enemy. Розстав їх у різних кутах.',
          expected: 'Герой може дістатися і кристала, і небезпеки.',
        },
        {
          id: 'lesson-07-step-02',
          title: 'Увімкни показники',
          instruction: 'На початку задай score 0, life 3 і запусти countdown на 20 секунд.',
          expected: 'У верхній частині симулятора видно 0 очок, три серця та відлік від 20.',
        },
        {
          id: 'lesson-07-step-03',
          title: 'Нараховуй очки',
          instruction:
            'В overlap Player з Food додай 1 очко, перемісти кристал у випадкові x від 10 до 150 та y від 10 до 110.',
          expected: 'Після кожного збору рахунок зростає, а кристал перестрибує на нове місце.',
        },
        {
          id: 'lesson-07-step-04',
          title: 'Додай перемогу',
          instruction:
            'Після зміни рахунку встав if score = 5, а всередину — game over WIN.',
          expected: 'П’ятий зібраний кристал завершує гру перемогою.',
          hint:
            'У ліву частину порівняння встав блок score з Info, а в праву введи 5. Умова має лежати після change score by 1.',
        },
        {
          id: 'lesson-07-step-05',
          title: 'Втрачай життя',
          instruction:
            'В overlap Player з Enemy відніми 1 життя, знищ Enemy і створи нову небезпеку у випадковій позиції.',
          expected: 'Кожен дотик забирає одне серце; після нуля життів гра завершується поразкою.',
        },
        {
          id: 'lesson-07-step-06',
          title: 'Перевір час',
          instruction:
            'Перезапусти гру й нічого не збирай до завершення відліку. Потім зіграй ще раз і спробуй набрати 5 очок раніше.',
          expected: 'Нуль на таймері дає поразку, а 5 очок до завершення часу — перемогу.',
        },
      ],
      challenge: {
        title: 'Обери темп',
        prompt:
          'Налаштуй тривалість і кількість очок для перемоги так, щоб ти вигравав приблизно у двох із трьох спроб.',
        hint: 'Якщо завжди програєш — додай час або зменш ціль. Якщо завжди легко виграєш — зроби навпаки.',
      },
      quiz: {
        question: 'Який набір правил дає і перемогу, і поразку?',
        options: [
          'Перемога за 5 очок; поразка після нуля життів або часу',
          'Лише зміна кольору тла',
          'Нескінченне додавання очок без завершення',
        ],
        correctIndex: 0,
        explanation:
          'Гравцеві потрібна зрозуміла мета й ризик: умова очок дає перемогу, а життя чи час створюють умови поразки.',
      },
      xp: 150,
      makeCodeUrl: 'https://arcade.makecode.com/reference/info',
    },
    {
      id: 'lesson-08',
      slug: 'lovy-zirky',
      order: 8,
      title: 'Лови зірки',
      summary: 'Збери гру про зірки, які щоразу з’являються в новому місці.',
      durationMinutes: 35,
      difficulty: 'explorer',
      concepts: ['випадкова позиція', 'збирання', 'рахунок', 'час'],
      prerequisites: ['lesson-07'],
      objective: 'Побудувати гру зі збиранням зірок, випадковими позиціями та підрахунком очок.',
      steps: [
        {
          id: 'lesson-08-step-01',
          title: 'Створи ловця',
          instruction:
            'Створи проєкт «Лови зірки», намалюй героя Player, додай керування 110 на 110 і stay in screen ON.',
          expected: 'Герой швидко рухається по всьому екрану й не виходить за його межі.',
        },
        {
          id: 'lesson-08-step-02',
          title: 'Запали зірку',
          instruction: 'Створи жовту зірку типу Food, назви змінну star та задай початковий score 0.',
          expected: 'У симуляторі видно героя, одну зірку та нуль очок.',
        },
        {
          id: 'lesson-08-step-03',
          title: 'Нагороди за дотик',
          instruction: 'В overlap Player з Food додай change score by 1.',
          expected: 'Дотик до зірки збільшує рахунок на одне очко.',
        },
        {
          id: 'lesson-08-step-04',
          title: 'Телепортуй ціль',
          instruction:
            'Після зміни рахунку задай otherSprite позицію: x — pick random 8 to 152, y — pick random 8 to 112.',
          expected: 'Після кожного дотику та сама зірка миттєво з’являється в іншому видимому місці.',
          hint:
            'Використай один блок set otherSprite position. Усередину двох полів встав окремі блоки pick random.',
        },
        {
          id: 'lesson-08-step-05',
          title: 'Обмеж час',
          instruction: 'У on start додай countdown на 30 секунд і перезапусти гру.',
          expected: 'Таймер відраховує 30 секунд, а після нуля гра зупиняється й показує результат.',
        },
        {
          id: 'lesson-08-step-06',
          title: 'Зіграй і перевір',
          instruction:
            'Зіграй двічі по 30 секунд. Переконайся, що зірка завжди повністю видима й рахунок починається з нуля.',
          expected: 'Кожна нова гра має випадкову послідовність позицій і власний підсумковий рахунок.',
        },
      ],
      challenge: {
        title: 'Рідкісна суперзірка',
        prompt:
          'Додай окрему рожеву суперзірку нового kind Bonus, яка дає 3 очки, зникає після збору й не замінює звичайну зірку.',
        hint: 'Створи новий SpriteKind у списку kind і окрему подію overlap Player з Bonus.',
      },
      quiz: {
        question: 'Навіщо після збору задавати зірці випадкові x та y?',
        options: [
          'Щоб герой перестав рухатися',
          'Щоб рахунок обнулився',
          'Щоб кожна наступна ціль з’являлася в непередбачуваному місці',
        ],
        correctIndex: 2,
        explanation:
          'Нові випадкові координати переміщують зірку й роблять кожну погоню трохи іншою.',
      },
      xp: 175,
      makeCodeUrl: 'https://arcade.makecode.com/reference/math/randint',
    },
  ],
};
