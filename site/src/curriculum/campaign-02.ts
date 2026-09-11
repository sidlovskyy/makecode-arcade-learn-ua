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
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-05-step-01',
            alt: 'У on start синє тло та створення зеленого робота mySprite типу Player.',
            focus: { x: 0.028, y: 0.247, width: 0.972, height: 0.63, label: 'Початкове тло й робот — усередині on start.' },
            explanation: 'Колір 8 — синій у палітрі Arcade. Блок створення робота виконується один раз під час запуску; малюнок можна зробити власним.',
          },
          title: 'Налаштуй початок',
          instruction:
            'Створи проєкт «Кнопки й події». У on start задай синє тло, створи спрайт Player і намалюй робота.',
          expected: 'Після Restart один робот одразу з’являється на синьому тлі.',
        },
        {
          id: 'lesson-05-step-02',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-05-step-02',
            alt: 'Поряд із on start окрема подія on A button pressed показує Стрибок! на 500 мілісекунд.',
            focus: { x: 0.532, y: 0, width: 0.468, height: 0.671, label: 'Вклади say у подію A, а саму подію залиш окремо.' },
            explanation: 'Подія чекає на натискання A. Усередині mySprite say показує текст «Стрибок!» протягом 500 ms; початкові блоки залишаються у on start.',
          },
          title: 'Додай подію A',
          instruction:
            'У Controller перетягни окремий блок on A button pressed. Усередину додай команду mySprite say «Стрибок!» for 500 ms.',
          expected: 'Напис «Стрибок!» з’являється тільки після натискання A.',
        },
        {
          id: 'lesson-05-step-03',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-05-step-03',
            alt: 'Подія A містить change mySprite y by -10, pause 150 ms і change mySprite y by 10.',
            focus: { x: 0.627, y: 0, width: 0.373, height: 1, label: 'Заміни say трьома командами стрибка всередині A.' },
            explanation: 'Спершу y зменшується на 10, через 150 ms збільшується на 10. Робот повертається на ту саму висоту. Попереднього say у цій події вже немає.',
          },
          title: 'Зроби справжній стрибок',
          instruction:
            'У тій самій події A заміни напис блоком change mySprite y by -10, а після нього додай pause 150 ms і change y by 10.',
          expected: 'Після A робот швидко підстрибує вгору й повертається на попереднє місце.',
          hint:
            'У координатах Arcade менше y означає вище. Тому перша зміна від’ємна, а друга — додатна.',
        },
        {
          id: 'lesson-05-step-04',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-05-step-04',
            alt: 'Три окремі секції: on start, стрибок у події A та зелене тло в події B.',
            focus: { x: 0, y: 0.675, width: 0.312, height: 0.325, label: 'Додай окрему подію B з командою зміни тла.' },
            explanation: 'У зразку B обирає зелений колір 7. Можеш обрати інший колір, відмінний від початкового синього; команди стрибка лишаються в A.',
          },
          title: 'Додай подію B',
          instruction:
            'Створи блок on B button pressed і встав у нього set background color. Обери колір, відмінний від синього.',
          expected: 'B змінює тло, але не рухає робота.',
        },
        {
          id: 'lesson-05-step-05',
          visual: {
            kind: 'guide', title: 'Матриця перевірки кнопок',
            items: [
              'Restart → синє тло й один робот; стрибка ще немає.',
              'A → один стрибок і повернення; повтори тричі з паузою між натисканнями.',
              'B → тло змінюється, робот не рухається; натисни двічі. Другий раз колір уже такий самий, хоча подія виконується знову.',
              'Restart → знову синє тло й один робот; A та B чекають нових натискань.',
            ],
          },
          title: 'Порівняй моменти запуску',
          instruction:
            'Натисни A тричі й B двічі, потім Restart. Простеж, що виконується багато разів, а що — лише на старті.',
          expected: 'Події A і B повторюються після кожного натискання, а початкове синє тло та створення робота виконуються один раз після Restart.',
        },
        {
          id: 'lesson-05-step-06',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-05-step-06',
            alt: 'Повна програма має три незалежні стеки: A зі стрибком, B зі зміною тла та on start із роботом.',
            focus: { x: 0, y: 0, width: 1, height: 1, label: 'Перевір усі три окремі секції програми.' },
            explanation: 'Порядок секцій на полотні не задає порядок виконання. On start готує гру, а кожна подія Controller реагує лише на свою кнопку.',
          },
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
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-06-step-01',
            alt: 'On start створює mySprite Player, coin Food і spikes Enemy та розставляє їх у x 30, 80, 130 при y 60.',
            focus: { x: 0.028, y: 0.113, width: 0.972, height: 0.831, label: 'Зістав три малюнки з ролями Player, Food та Enemy.' },
            explanation: 'Окремі початкові позиції дають побачити всі три спрайти. Зображення показує вигляд, а kind визначає, яка подія зіткнення спрацює.',
          },
          title: 'Створи три ролі',
          instruction:
            'Створи проєкт «Зустріч спрайтів». Додай героя Player, монету Food і шипи Enemy з різними зображеннями. Задай їм позиції (30, 60), (80, 60) та (130, 60): ліворуч, посередині й праворуч.',
          expected: 'У симуляторі видно три різні спрайти, а в кожного блока створення вказаний свій kind.',
        },
        {
          id: 'lesson-06-step-02',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-06-step-02',
            alt: 'До трьох спрайтів додано керування mySprite 100 на 100, stay in screen ON та позиції монети 130,30 і шипів 130,90.',
            focus: { x: 0.028, y: 0.635, width: 0.919, height: 0.326, label: 'Додай керування герою й рознеси монету та шипи по висоті.' },
            explanation: 'У прикладі монета стоїть у (130, 30), шипи — у (130, 90). Ці останні команди позиції замінюють їхнє початкове розташування; рухається лише mySprite.',
          },
          title: 'Розстав об’єкти',
          instruction:
            'Додай герою керування й stay in screen. Постав монету праворуч угорі, а шипи праворуч унизу.',
          expected: 'Герой рухається, а монета й шипи лишаються на різних місцях.',
        },
        {
          id: 'lesson-06-step-03',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-06-step-03',
            alt: 'Окрема подія overlap Player з Food додає 1 очко і знищує otherSprite з ефектом disintegrate на 500 ms.',
            focus: { x: 0.464, y: 0, width: 0.536, height: 0.3, label: 'У події Food знищуй otherSprite — монету.' },
            explanation: 'Спочатку change score by 1 додає очко. Потім destroy otherSprite прибирає монету; disintegrate показує її зникнення, у зразку протягом 500 ms. Герой sprite залишається.',
          },
          title: 'Оброби монету',
          instruction:
            'Додай overlap Player з Food. Усередині збільш рахунок на 1 і знищ otherSprite з ефектом disintegrate.',
          expected: 'Після дотику монета зникає один раз, а рахунок стає 1; герой лишається.',
          hint:
            'У цій події sprite — герой Player, а otherSprite — монета Food. Знищуй саме otherSprite.',
        },
        {
          id: 'lesson-06-step-04',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-06-step-04',
            alt: 'Поряд з обробником Food є overlap Player з Enemy: change life by -1 та destroy otherSprite.',
            focus: { x: 0, y: 0.781, width: 0.543, height: 0.219, label: 'Окремий overlap Enemy забирає життя й прибирає шипи.' },
            explanation: 'У цьому обробнику otherSprite — Enemy. Його знищення припиняє повторні дотики до тих самих шипів; подія Food продовжує додавати очки.',
          },
          title: 'Оброби небезпеку',
          instruction:
            'Додай іншу подію overlap Player з Enemy. У ній зменш життя на 1 і знищ otherSprite.',
          expected: 'Дотик до шипів забирає одне життя і прибирає шипи, не знищуючи героя.',
        },
        {
          id: 'lesson-06-step-05',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-06-step-05',
            alt: 'У повній програмі з двома overlap-подіями on start додатково встановлює life to 3.',
            focus: { x: 0.012, y: 0.653, width: 0.131, height: 0.064, label: 'У on start задай set life to 3.' },
            explanation: 'Після Restart запас знову дорівнює трьом серцям. Монета додає 1 очко, а один дотик до шипів залишає 2 життя й прибирає шипи.',
          },
          title: 'Задай запас життя',
          instruction: 'У on start установи 3 життя. Перезапусти гру та по черзі торкнися монети й шипів.',
          expected: 'Монета додає очко, шипи віднімають одне з трьох життів, а події не плутаються.',
        },
        {
          id: 'lesson-06-step-06',
          visual: {
            kind: 'guide', title: 'Перевір три випадки overlap',
            items: [
              'Food: після Restart торкнися монети — +1 очко, монета зникає, герой залишається.',
              'Enemy: після Restart торкнися шипів — життя змінюється з 3 на 2, шипи зникають.',
              'Зміни kind монети на Enemy й натисни Restart. Її малюнок той самий, але дотик забирає життя.',
              'Поверни монеті Food, натисни Restart і перевір: вона знову додає очко. У destroy має бути otherSprite.',
            ],
          },
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
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-07-step-01',
            alt: 'On start створює керованого Player у 10,110, кристал Food у 150,10 та небезпеку Enemy у 150,110.',
            focus: { x: 0.028, y: 0.102, width: 0.972, height: 0.847, label: 'Створи три ролі й розстав їх у різних кутах.' },
            explanation: 'У зразку mySprite починає знизу ліворуч, crystal — угорі праворуч, danger — унизу праворуч. Керування 100 на 100 дає дістатися обох цілей.',
          },
          title: 'Підготуй арену',
          instruction:
            'Створи героя Player з керуванням, один кристал Food і одну небезпеку Enemy. Розстав їх у різних кутах.',
          expected: 'Герой може дістатися і кристала, і небезпеки.',
        },
        {
          id: 'lesson-07-step-02',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-07-step-02',
            alt: 'Наприкінці on start додано set score to 0, set life to 3 і start countdown 20 s.',
            focus: { x: 0.028, y: 0.713, width: 0.444, height: 0.248, label: 'На старті встанови 0 очок, 3 життя та 20 секунд.' },
            explanation: 'Три блоки Info задають початковий стан кожної спроби. Restart повторно встановлює ці значення й запускає новий відлік.',
          },
          title: 'Увімкни показники',
          instruction: 'На початку задай score 0, life 3 і запусти countdown на 20 секунд.',
          expected: 'У верхній частині симулятора видно 0 очок, три серця та відлік від 20.',
        },
        {
          id: 'lesson-07-step-03',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-07-step-03',
            alt: 'Overlap Player з Food додає 1 очко й задає otherSprite випадкові x 10–150 та y 10–110.',
            focus: { x: 0.404, y: 0, width: 0.596, height: 0.3, label: 'Після очка перемісти той самий кристал двома pick random.' },
            explanation: 'OtherSprite тут означає зібраний кристал. Окремий pick random обирає x, інший — y; новий спрайт створювати не потрібно.',
          },
          title: 'Нараховуй очки',
          instruction:
            'В overlap Player з Food додай 1 очко, перемісти кристал у випадкові x від 10 до 150 та y від 10 до 110.',
          expected: 'Після кожного збору рахунок зростає, а кристал перестрибує на нове місце.',
        },
        {
          id: 'lesson-07-step-04',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-07-step-04',
            alt: 'В overlap Food після change score by 1 вкладено if score = 5 із game over WIN.',
            focus: { x: 0.415, y: 0.169, width: 0.218, height: 0.235, label: 'Перевір score = 5 після додавання очка й заверш гру WIN.' },
            explanation: 'Умова перевіряє вже оновлений рахунок. Коли він дорівнює 5, виконується game over WIN; команда випадкової позиції з попереднього кроку залишається в події.',
          },
          title: 'Додай перемогу',
          instruction:
            'Після зміни рахунку встав if score = 5, а всередину — game over WIN.',
          expected: 'П’ятий зібраний кристал завершує гру перемогою.',
          hint:
            'У ліву частину порівняння встав блок score з Info, а в праву введи 5. Умова має лежати після change score by 1.',
        },
        {
          id: 'lesson-07-step-05',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-07-step-05',
            alt: 'Overlap Enemy віднімає 1 життя, знищує otherSprite, створює danger типу Enemy й задає випадкову позицію.',
            focus: { x: 0.641, y: 0, width: 0.359, height: 0.486, label: 'Після втрати життя заміни знищену небезпеку новою.' },
            explanation: 'Знищуй otherSprite, а новий Enemy збережи у danger. У зразку його x — 10–150, y — 10–110. Нуль життів автоматично завершує гру поразкою.',
          },
          title: 'Втрачай життя',
          instruction:
            'В overlap Player з Enemy відніми 1 життя, знищ Enemy і створи нову небезпеку у випадковій позиції.',
          expected: 'Кожен дотик забирає одне серце; після нуля життів гра завершується поразкою.',
        },
        {
          id: 'lesson-07-step-06',
          visual: {
            kind: 'guide', title: 'Рахунок, життя, час: перевір після Restart',
            items: [
              'Натисни Restart: рахунок 0, життя 3, таймер починає відлік від 20 секунд.',
              'Спроба часу: нічого не збирай до нуля на таймері — має бути поразка.',
              'Спроба перемоги: після Restart збери 5 кристалів до нуля на таймері — має бути WIN.',
              'Спроба життів: після Restart торкнися трьох небезпек — кожна забирає одне серце, а нуль дає поразку.',
              'Після кожного завершення Restart повертає 0 очок, 3 життя й нові 20 секунд.',
            ],
          },
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
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-08-step-01',
            alt: 'On start створює Player, додає керування 110 на 110, stay in screen ON і початкову позицію 30,60.',
            focus: { x: 0.028, y: 0.165, width: 0.972, height: 0.753, label: 'Налаштуй швидкого ловця й залиш його в межах екрана.' },
            explanation: 'Обидві швидкості дорівнюють 110. Stay in screen ON утримує героя на екрані, а позиція (30, 60) залишає місце для зірки праворуч.',
          },
          title: 'Створи ловця',
          instruction:
            'Створи проєкт «Лови зірки», намалюй героя Player, додай керування 110 на 110 і stay in screen ON. Задай герою початкову позицію x 30, y 60.',
          expected: 'Герой швидко рухається по всьому екрану й не виходить за його межі.',
        },
        {
          id: 'lesson-08-step-02',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-08-step-02',
            alt: 'До ловця додано жовту зірку star типу Food у 130,60 та set score to 0.',
            focus: { x: 0.028, y: 0.57, width: 0.87, height: 0.377, label: 'Назви ціль star, задай Food, позицію 130,60 і рахунок 0.' },
            explanation: 'Зірка починає праворуч, окремо від героя. Тому майбутня подія дотику не спрацьовуватиме одразу після Restart.',
          },
          title: 'Запали зірку',
          instruction: 'Створи жовту зірку типу Food, назви змінну star, постав її в x 130, y 60 та задай початковий score 0.',
          expected: 'Герой ліворуч, зірка праворуч; вони не торкаються, тому нова гра починається з нуля очок.',
        },
        {
          id: 'lesson-08-step-03',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-08-step-03',
            alt: 'Поряд з on start нова подія overlap Player з Food містить change score by 1.',
            focus: { x: 0.464, y: 0, width: 0.536, height: 0.301, label: 'У події Player–Food додай change score by 1.' },
            explanation: 'Кожне спрацювання overlap додає 1 очко. Поки герой лишається на зірці, подія може повторюватися; наступний крок перемістить ціль після дотику.',
          },
          title: 'Нагороди за дотик',
          instruction: 'В overlap Player з Food додай change score by 1.',
          expected: 'Дотик до зірки збільшує рахунок на одне очко.',
        },
        {
          id: 'lesson-08-step-04',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-08-step-04',
            alt: 'У події Food після очка set otherSprite position містить pick random 8 to 152 для x та 8 to 112 для y.',
            focus: { x: 0.417, y: 0.23, width: 0.583, height: 0.124, label: 'Перемісти otherSprite: x 8–152, y 8–112.' },
            explanation: 'Переміщується та сама зірка, яку торкнувся герой. Два незалежні випадкові числа залишають відступ від країв для зображення розміром до 16×16.',
          },
          title: 'Телепортуй ціль',
          instruction:
            'Після зміни рахунку задай otherSprite позицію: x — pick random 8 to 152, y — pick random 8 to 112.',
          expected: 'Після кожного дотику та сама зірка миттєво з’являється в іншому видимому місці.',
          hint:
            'Використай один блок set otherSprite position. Усередину двох полів встав окремі блоки pick random.',
        },
        {
          id: 'lesson-08-step-05',
          visual: {
            kind: 'blocks', assetId: 'blocks:lesson-08-step-05',
            alt: 'Повна гра зі збиранням зірки має доданий у on start блок start countdown 30 s.',
            focus: { x: 0.01, y: 0.84, width: 0.168, height: 0.112, label: 'Запусти countdown на 30 секунд усередині on start.' },
            explanation: 'Відлік запускається один раз на початку спроби. На нулі Arcade завершує гру й показує набраний рахунок; Restart починає нові 30 секунд із нуля очок.',
          },
          title: 'Обмеж час',
          instruction: 'У on start додай countdown на 30 секунд і перезапусти гру.',
          expected: 'Таймер відраховує 30 секунд, а після нуля гра зупиняється й показує результат.',
        },
        {
          id: 'lesson-08-step-06',
          visual: {
            kind: 'guide', title: 'Три повні спроби «Лови зірки»',
            items: [
              'Спроба 1: Restart → перевір 0 очок і 30 секунд. Збирай зірки до завершення таймера й запиши результат.',
              'Спроба 2: Restart → знову 0 очок. Зіграй усі 30 секунд, перевір видимість зірки біля країв і запиши рахунок.',
              'Спроба 3: Restart → ще одна повна гра на 30 секунд. Простеж за новою послідовністю позицій і запиши результат.',
              'Порівняй три результати: очки не переходять між спробами, зірка лишається видимою, таймер щоразу зупиняє гру.',
            ],
          },
          title: 'Зіграй і перевір',
          instruction:
            'Зіграй тричі по 30 секунд, щоразу натискаючи Restart. Переконайся, що зірка завжди повністю видима й рахунок починається з нуля.',
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
