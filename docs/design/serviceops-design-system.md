# ServiceOps Design System

Визуальная система для B2B-платформы управления заявками на ремонт, техническое обслуживание и поверку оборудования.

Эта дизайн-дока — source of truth для генерации компонентов и страниц. Она опирается на текущие макеты и на специфику продукта: роли и RBAC, реестр оборудования, договоры, жизненный цикл заявок, документы и ЭП, дашборды, аудит, а в следующем этапе — внутренний мессенджер и PWA для инженеров.

Из этого следуют два главных вывода. Во-первых, интерфейс должен быть очень понятным и предсказуемым, без “дизайна ради дизайна”. Во-вторых, стиль должен оставаться визуально лёгким, потому что пользователь большую часть времени работает в плотных списках, фильтрах, карточках заявки, документах и таблицах, а не на маркетинговых экранах.

---

## 1. Характер продукта

### Позиционирование
- **Тип продукта:** B2B service-operations platform
- **Отрасль:** обслуживание, ремонт и метрологический контроль оборудования
- **Характер:** спокойный, профессиональный, технологичный, надёжный
- **Ощущение:** порядок, контроль, прозрачность, скорость

### Визуальный архетип
Это не “яркий SaaS для стартапов” и не “тяжёлый industrial ERP из 2010-х”.

Нужен стиль:
- светлый
- модульный
- с тонкими разделителями
- с минимумом декоративного шума
- с мягкими радиусами
- с тёмным основным CTA
- с синим как цветом интеракции и навигационного акцента

### Визуальная ДНК по макетам
Что видно в референсах:
- основной фон очень светлый, холодно-серый
- почти весь контент живёт на белых карточках и панелях
- разделение чаще делается **бордером**, а не тенью
- тень есть, но она очень мягкая и в основном для overlay/hover
- главный CTA чаще тёмный, почти графитовый
- синий — это цвет табов, прогресса, ссылок, фокуса и активных состояний
- зелёный и красный используются как семантика KPI и статусов
- интерфейс “воздушный”, но не растянутый; это важная грань для B2B

---

## 2. Ключевые принципы

### 2.1. Clarity first
Самое важное — скорость считывания:
- крупные заголовки страниц
- чёткие зоны фильтров
- компактные, но не тесные списки
- статусы сразу читаются взглядом
- у любого блока есть визуально понятный приоритет

### 2.2. Border-first, shadow-second
Основной инструмент разделения — `1px` border и контраст фона.
Тень вторична и нужна:
- у dropdown/popover/dialog
- у hover-состояния карточки
- у мобильных sheet/drawer
- у верхнего слоя уведомлений

### 2.3. One strong action per zone
На странице обычно должен быть один главный CTA.
В блоке фильтров — один доминирующий action.
В карточке — одна primary-кнопка или одна primary-пара.

### 2.4. Blue means interaction
Синий не должен спорить с тёмным CTA.
Его роль:
- active tabs
- links
- focus ring
- selected row/card
- interactive badges
- progress ring
- chart primary series

### 2.5. Calm enterprise, not consumer excitement
Без кислотных акцентов, тяжёлых градиентов и постоянного glassmorphism.
Исключения:
- auth/onboarding иллюстрации
- мягкий backdrop у модалок и mobile sheet
- редкие декоративные blue glow на специальных экранах

### 2.6. Performance-aware visual design
Так как основные списки и формы должны быть быстрыми, а таблицы и фильтрация должны уверенно работать на больших объёмах, визуальный язык не должен опираться на тяжёлые эффекты: постоянные blur-слои, сложные декоративные фоны, глубокие многоуровневые тени и перегруженные анимации здесь неуместны.

---

## 3. Color Palette

## 3.1. Основные цвета

| Роль | Токен | HEX | Применение |
|---|---|---:|---|
| Primary CTA / Ink | `primary` | `#111827` | Главные кнопки, сильные действия, ключевые тёмные акценты |
| Primary Hover | `primary-hover` | `#0B1220` | Hover/pressed для primary |
| Interactive Blue | `interactive` | `#2F6BFF` | Tabs, links, focus, selection, progress |
| Interactive Hover | `interactive-hover` | `#1D4ED8` | Hover active-controls |
| Interactive Soft | `interactive-soft` | `#EEF4FF` | Selected rows, soft chips, calm backgrounds |
| Optional Brand Mark | `brand-mark` | `#2C0F0A` | Только монограмма/логотип/brand-marker |

### Правило
- **Тёмный primary** — для самых важных действий.
- **Синий** — для навигации и интеракции.
- **`brand-mark`** — только как фирменный след, а не как массовый UI-цвет.

---

## 3.2. Нейтральная палитра

| Токен | HEX | Применение |
|---|---:|---|
| `background` | `#F5F7FB` | Общий фон приложения |
| `surface` | `#FFFFFF` | Карточки, панели, inputs |
| `surface-muted` | `#F8FAFC` | Search bar, subtle sections, nested panels |
| `surface-hover` | `#F1F5F9` | Hover для list/nav surfaces |
| `border` | `#E4E7EC` | Основные бордеры |
| `border-strong` | `#D0D5DD` | Активные рамки, усиленные разделители |
| `text-primary` | `#0F172A` | Основной текст |
| `text-secondary` | `#667085` | Вторичный текст, мета |
| `text-tertiary` | `#98A2B3` | Placeholder, timestamps |
| `text-disabled` | `#B8C1CC` | Disabled text/icons |

### Фоновые правила
- Экран приложения: `background`
- Белые смысловые блоки: `surface`
- Вложенные quiet-панели: `surface-muted`
- Hover/selected в меню: `surface-hover`

---

## 3.3. Семантические цвета

| Роль | HEX | Soft Background | Применение |
|---|---:|---:|---|
| Success | `#16A34A` | `#ECFDF3` | Выполнено, успешно, подтверждено |
| Warning | `#D97706` | `#FFFAEB` | Ожидание, дедлайны, внимательность |
| Danger | `#DC2626` | `#FEF3F2` | Ошибки, просрочка, рекламация |
| Info | `#0284C7` | `#F0F9FF` | Справочная информация |
| Violet | `#7C3AED` | `#F5F3FF` | Промежуточные статусные акценты |
| Emerald Bright | `#22C55E` | `#F0FDF4` | KPI growth, toggles |

### Правило
В operational UI семантика почти всегда живёт в формате:
- **светлый фон**
- **тёмный цвет текста/иконки**
- **без насыщенной заливки на всю плашку**

---

## 3.4. Доменные статусы заявки

| Статус | Цвет | Фон |
|---|---|---|
| Черновик | `text-secondary` | `surface-hover` |
| На согласовании | `interactive` | `interactive-soft` |
| Согласована | `#0F766E` | `#F0FDFA` |
| В работе | `#0284C7` | `#F0F9FF` |
| На подписи | `#7C3AED` | `#F5F3FF` |
| Ожидает оплаты | `#D97706` | `#FFFAEB` |
| Завершена | `#16A34A` | `#ECFDF3` |
| Рекламация | `#DC2626` | `#FEF3F2` |

### Правило
Статус должен читаться не только по цвету:
- всегда есть текст
- опционально иконка
- в таблицах — не только кружок/цвет, а нормальный badge

---

## 3.5. Палитра графиков

| Серия | HEX | Использование |
|---|---:|---|
| `chart-1` | `#2F6BFF` | Основная серия |
| `chart-2` | `#16A34A` | Успешные/выполненные |
| `chart-3` | `#F59E0B` | В ожидании / нагрузка |
| `chart-4` | `#7C3AED` | Доп. серия / подписи / документы |
| `chart-5` | `#EF4444` | Просрочка / проблемная серия |

### Правила для charts
- максимум 4 активных серии на одном графике
- grid lines очень светлые
- tooltip белый, компактный, с мягкой тенью
- primary line width: `2px`
- точки на линии — только при hover/active или на малом количестве точек
- зелёный и красный — только по смыслу, не для украшения

---

## 4. Typography

## 4.1. Шрифтовой стек

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

### Почему так
- `Inter` — чистый, современный, нейтральный, хорошо работает в B2B shell
- `JetBrains Mono` — для ID, номеров заявок, договоров, file metadata, tabular info

---

## 4.2. Шкала типографики

| Токен | Size | Line-height | Weight | Применение |
|---|---:|---:|---:|---|
| `text-xs` | 12px | 16px | 500 | caption, timestamps, meta |
| `text-sm` | 13px | 18px | 500 | labels, table meta, badges |
| `text-base` | 14px | 20px | 400 | основной UI-текст, таблицы, формы |
| `text-md` | 16px | 24px | 400 | карточки деталей, сообщения, auth |
| `text-lg` | 18px | 26px | 600 | card titles |
| `text-xl` | 20px | 28px | 600 | section titles |
| `text-2xl` | 24px | 32px | 700 | page subheaders |
| `text-3xl` | 30px | 38px | 700 | page titles |
| `text-4xl` | 36px | 42px | 700 | auth / major hero title |

### Иерархия
- **Page title:** 30/38, `700`
- **Section title:** 24/32, `700`
- **Widget title:** 18/26, `600`
- **Body default:** 14/20, `400`
- **Body relaxed:** 16/24, `400`
- **Meta / label:** 13/18, `500`

### Числа и данные
Для KPI, процентов, денег, ID и дат:
- использовать `tabular-nums`
- денежные значения выравнивать вправо в таблицах
- request number / contract number можно давать в `font-mono` или `tabular-nums`

---

## 4.3. Правила текста
- интерфейс — на русском
- sentence case, не `UPPERCASE`
- короткие action-лейблы: “Оформить заявку”, “Загрузить документ”, “Подписать”, “Отправить”
- избегать эмоциональных consumer-фраз
- ошибки и подсказки — короткие и прямые
- form и list cards не начинать с повторяющих intro/category-бейджей и абзацев вида “Укажите…”, “Добавьте…”, если заголовок и содержимое уже задают контекст
- видимые labels полей обязательны; подсказки, alerts и описания оставлять только для правил, рисков, ошибок, read-only/disabled states и неочевидных ограничений
- не выносить в пользовательский UI stage/evidence/contract-пояснения вроде `Stage 03`, `slice`, `shell`, `backend`, `membership`, `grant`, `scope`, если это уже зафиксировано в канонических docs; в интерфейсе оставлять только пользовательский смысл действия и состояния

---

## 5. Spacing System

### Базовая единица: 4px

| Токен | Значение | Применение |
|---|---:|---|
| `space-1` | 4px | иконка+текст micro gap |
| `space-2` | 8px | gap в компактных группах |
| `space-3` | 12px | поля, chips, meta clusters |
| `space-4` | 16px | card inner gap, form gap |
| `space-5` | 20px | standard card padding |
| `space-6` | 24px | section gap внутри страницы |
| `space-8` | 32px | крупные page block gaps |
| `space-10` | 40px | top-level spacing |
| `space-12` | 48px | большие формы/hero padding |
| `space-16` | 64px | крупные desktop sections |

### Правила применения
- между label и control: `6–8px`
- между полями формы: `16px`
- между группами фильтров: `24px`
- внутренний padding карточки: `20px` или `24px`
- между большими page-блоками: `24px` mobile, `32px` desktop

---

## 5.1. Layout tokens

| Токен | Значение | Применение |
|---|---:|---|
| `sidebar-width` | 248px | левое меню desktop |
| `topbar-height` | 72px | верхний хедер |
| `page-padding-x` | 20px / 24px / 32px | mobile / tablet / desktop |
| `page-padding-y` | 20px / 24px / 32px | вертикальные отступы контента |
| `content-gap` | 24px | gap между секциями |
| `card-padding` | 20px | default |
| `card-padding-lg` | 24px | analytics / large cards |

---

## 5.2. Density modes

Для B2B-интерфейса нужна не одна плотность, а 3 режима визуальной “ёмкости”.

| Mode | Контролы | Строка таблицы | Применение |
|---|---:|---:|---|
| Compact | 36px | 44px | dense tables, admin, filters |
| Default | 40px | 52px | основная часть продукта |
| Comfortable | 44px | 56px | auth, details, chat, summary cards |

### Правило
- основной продукт: `Default`
- data-heavy table views: `Compact` или `Default`
- auth, notifications, chat, mobile sheet: `Comfortable`

---

## 6. Border Radius

| Токен | Значение | Применение |
|---|---:|---|
| `radius-xs` | 6px | small badges, chips |
| `radius-sm` | 8px | small controls |
| `radius-md` | 10px | inputs, selects |
| `radius-lg` | 12px | buttons, pills, nav items |
| `radius-xl` | 16px | cards, table wrappers |
| `radius-2xl` | 20px | dialogs, drawers, big containers |
| `radius-3xl` | 28px | mobile sheets, large overlay panels |
| `radius-full` | 9999px | avatars, progress rings, toggles |

### Унификация
- **Inputs:** `10px`
- **Buttons:** `12px`
- **Cards:** `16px`
- **Overlay / Dialog:** `20px`
- **Mobile Sheet:** `28px`

### Важное правило
Не смешивать на одном экране 5–6 разных радиусов.
Обычно достаточно 3 уровней:
- `10`
- `12`
- `16`

---

## 7. Borders, Surfaces, Shadows

## 7.1. Surface recipes

### Base surface
- `background: white`
- `border: 1px solid border`
- `radius: 16px`
- тень либо отсутствует, либо `shadow-xs`

### Interactive surface
- border становится чуть плотнее
- появляется лёгкий lift `translateY(-1px)`
- тень усиливается совсем немного

### Overlay surface
- белый или почти белый фон
- radius `20–28px`
- мягкая тень `shadow-lg`
- backdrop dim + лёгкий blur

### Dialog header variants

Dialog и confirm modal используют единую геометрию верхней челки:

- плашка закреплена сверху внутри dialog content;
- высота плашки `52px`, close-action справа той же высоты;
- нижний радиус плашки и close-action одинаковый;
- описание и badge остаются под плашкой внутри header area;
- body и footer сохраняют обычные разделители `border`.

Канонические варианты:

| Variant | Назначение | Surface |
|---|---|---|
| `neutral` | более белый вариант для поверхностей, где нужен меньший контраст с body | `surface` + `border` + `shadow-sm` |
| `muted` | основной runtime default для рабочих editor-модалок и островов | `surface-muted` + `border` + `shadow-xs` |
| `dark` | исходная акцентная челка для критичных или особо важных модалок | `primary` + `primary-foreground` + `shadow-sm` |

Правило: не добавлять новые header variants ради эксперимента. Если нужен другой визуальный вес, сначала выбрать один из `neutral`, `muted`, `dark`; новый вариант допускается только после обновления этого source-of-truth.

### IslandCard header

Рабочие острова `IslandCard` для форм и списков используют тот же muted-подход к верхней челке:

- та же закрепленная верхняя геометрия, что была у исходного dark-варианта;
- surface `surface-muted`, `border`, `shadow-xs`;
- доменная иконка использует interactive-blue акцент, но сама плашка остается светлой;
- metric списка отображается как типографический хвост рядом с заголовком: `Заголовок · 12`, без badge-фона, без подписи вроде “активных” и без смены semantic heading name;
- action-slot справа повторяет muted action surface: `surface-muted` + `border` + `shadow-xs`.

Правило: runtime-острова в формах и списках не используют dark header по умолчанию. Темная челка допустима только для явно акцентных overlay-сценариев через отдельный design-system decision.

---

## 7.2. Shadow tokens

| Токен | Значение | Применение |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(16,24,40,0.04)` | subtle lift |
| `shadow-sm` | `0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)` | cards default |
| `shadow-md` | `0 8px 24px rgba(16,24,40,0.08)` | hover states |
| `shadow-lg` | `0 16px 40px rgba(16,24,40,0.12)` | dropdowns, popovers |
| `shadow-xl` | `0 24px 64px rgba(16,24,40,0.16)` | dialogs, mobile sheet |

### Правило
Обычные карточки не должны выглядеть “парящими”.
Главная пара:
- **card:** border + `shadow-xs`
- **hover:** border stronger + `shadow-md`

---

## 8. Motion & Transitions

## 8.1. Длительности

| Тип | Duration | Easing |
|---|---:|---|
| Micro | 120ms | `ease-out` |
| Fast | 180ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Base | 220ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Overlay | 280ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Page / large | 360ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` |

## 8.2. Общие анимации
- hover card: `translateY(-1px)` + `shadow`
- active button: `scale(0.98)`
- dropdown/popover: `fade + zoom 95→100`
- drawer/sheet: `fade + slide`
- accordion: `height + opacity`
- notification count: без подпрыгивания, только subtle appear

## 8.3. Reduced motion
`motion-reduce` обязателен:
- отключать zoom/slide, оставлять только fade
- на data screens анимация не должна мешать сканированию

---

## 9. Breakpoints

| Breakpoint | Width | Применение |
|---|---:|---|
| `sm` | 640px | крупные телефоны |
| `md` | 768px | планшеты |
| `lg` | 1024px | laptops |
| `xl` | 1280px | desktop |
| `2xl` | 1536px | большие мониторы |

---

## 10. Layout Patterns

## 10.1. App Shell
Базовый паттерн — классический CRM shell.

### Desktop
- sidebar: 248px, white background, subtle right border
- topbar: 72px, white background, bottom border
- content background: `background`
- content cards: white

### Mobile
- sidebar превращается в drawer
- filters и notifications уходят в sheet
- topbar search можно сокращать до icon trigger
- touch targets минимум 44px

---

## 10.2. Sidebar
- иконка + label
- item height: `44px`
- active item: `surface-hover`, без насыщенной синей подложки
- active text: `text-primary`
- inactive text: `text-secondary`
- разделитель между основным меню и системным блоком

### Правило
Навигация не должна конкурировать с контентом.
Поэтому active state — **тихий**, а не кричащий.

---

## 10.3. Topbar
- белый фон
- тонкая нижняя граница
- search field с мягкой заливкой
- bell + unread badge
- avatar + user name
- breadcrumbs можно показывать слева от page title или в хедере страницы

---

## 10.4. Page sections
Страница строится как стек блоков:
1. page header
2. filters / controls
3. main content card
4. supplementary cards / chart cards / summary cards

### Правило
На одном экране лучше 2–4 крупных смысловых контейнера, чем 10 маленьких разрозненных коробок.

---

## 10.5. Operational form/list split
Для рабочих поверхностей, где слева находится форма добавления или редактирования, а справа список уже созданных объектов, используется единый desktop-паттерн:

- левая колонка с формой задает основную высоту пары;
- правая колонка растягивается до высоты формы;
- если список справа выше формы, скролл появляется внутри области списка, а не на всей странице;
- заголовок, метрики, badges, ошибки, loading и empty-состояния правой панели остаются закреплены в самой панели и не прячутся в scroll-area;
- на tablet/mobile колонки складываются в стек, высота не фиксируется, внутренний скролл не включается.

Паттерн применяется к create/edit + registry/list surfaces: дивизионы, юниты, приглашения, оборудование, средства измерения, эталоны и журнальные пары "форма записи / хронология".

### Правило
Не применять height-lock, если слева нет активной формы и показан только read-only/hidden placeholder. В таком режиме список должен идти обычным потоком страницы.

---

## 11. Component Recipes

## 11.1. Buttons

### Primary
Роль: ключевое действие страницы.

- background: `primary`
- text: white
- radius: `12px`
- height: `40 / 44 / 48`
- hover: `primary-hover`, лёгкий lift
- active: `scale(0.98)`

### Secondary
Роль: альтернативное действие.

- background: white
- border: `border`
- text: `text-primary`
- hover: `surface-muted`

### Accent Soft
Роль: contextual action, не главный CTA.

- background: `interactive-soft`
- text: `interactive`
- border: transparent
- hover: чуть насыщеннее фон

### Ghost
Роль: inline иконочные/текстовые действия.

- transparent
- text: `text-secondary`
- hover: `surface-hover`

### Danger
- soft variant по умолчанию
- solid red — только для финального destructive confirm

### Главное правило
На экране не должно быть “зоопарка” из 4 одинаково сильных кнопок.

---

## 11.2. Inputs / Select / Date
Системный вариант по умолчанию — **outlined soft input**.

- height: `40px` default, `44px` comfortable
- radius: `10px`
- border: `border`
- background: white
- focus: `interactive` border + `ring`
- placeholder: `text-tertiary`
- icons: 18–20px

### Underlined variant
Использовать только в auth/onboarding, где нужен более “editorial” вид.

### Ошибки
- border: danger
- help/error text под полем
- не использовать только красный цвет без текстового сообщения

### Tooltip / help-trigger
- Help-trigger рядом с label/control использует borderless `Info` icon, без серой кнопочной капсулы и без отдельной обводки.
- В покое иконка приглушена через opacity `45%`; на hover/focus становится `100%`.
- Runtime default для справки формы — `dark` tooltip с optional `title` и `description`.
- `light` и `info` tooltip variants доступны как явный выбор компонента для менее акцентных или мягко справочных поверхностей.
- `title` и `description` опциональны: компонент показывает только переданные блоки.
- Tooltip не заменяет field error: ошибка конкретного поля остается видимым текстом под control.

### InlineAlert vs Toast
- `ToastCenter` использовать для краткой обратной связи по операции: сохранено, архивировано, экспорт готов, ошибка сервера или сбой загрузки.
- Toast с конечным `duration` показывает истечение автозакрытия тонкой нижней линией; при наведении, фокусе и потере фокуса окна таймер визуально ставится на паузу вместе с Radix Toast.
- Появление/скрытие toast — короткий `fade + slide` без bounce/zoom; в `motion-reduce` убрать slide и анимированный timer progress.
- `InlineAlert` использовать для устойчивого контекста внутри страницы или карточки: режим просмотра, пустой раздел, предупреждение о доступе, справочная подсказка.
- Ошибки конкретного поля остаются под контролом, а не в toast или общем alert.

---

## 11.3. Cards
База для большинства смысловых блоков.

- background: white
- border: 1px solid `border`
- radius: `16px`
- padding: `20px` или `24px`
- shadow: `shadow-xs`

### Hoverable card
- hover: `border-strong`
- `shadow-md`
- `translateY(-1px)`

### Правило
Обычный контентный card не обязан подниматься на hover. Hover — только у реально интерактивных карточек.

---

## 11.4. Tabs
Для карточки заявки и разделов лучше использовать **underline tabs**, а не filled pills.

- inactive: `text-secondary`
- active: `interactive`
- underline: `2px`, `interactive`
- horizontal padding: `16–20px`
- height: `44px`

### Когда нужны pill tabs
Только для вторичных фильтров или сегментированных переключателей.

---

## 11.5. DataTable

### Базовый стиль
- wrapper: white card
- header row: `40px`
- body row: `52px` default
- vertical alignment: center
- border-bottom у строк
- zebra stripes — **не использовать по умолчанию**
- hover row: `surface-muted`
- selected row: `interactive-soft`

### Колонки
- header text: `13px`, `medium`, `text-secondary`
- body text: `14px`, `text-primary`
- long text: `truncate`
- numeric cells: right aligned + `tabular-nums`
- IDs: mono or tabular

### Рекомендации
- sticky header допустим для длинных реестров
- selection checkbox — всегда отдельная узкая колонка
- row actions — kebab menu справа
- пустое состояние — внутри table card, а не на отдельной странице

---

## 11.6. Status badges / chips
- soft background
- semibold text
- height: `24–28px`
- radius: full или `12px`
- optional dot/icon
- без капса

### Правило
Badge должен быть читаем как самостоятельная единица, но не перетягивать внимание с основного контента.

---

## 11.7. KPI Cards
### Структура
- title: `13px`, muted
- value: `32–36px`, semibold, tabular
- trend row: small badge/label
- sparkline: под контентом или справа внизу

### Цвет
- positive KPI: green
- warning: amber
- negative / overdue: red
- neutral KPI without stress: blue/ink

---

## 11.8. Charts
### Правила
- белая chart card
- chart padding минимум `20px`
- axis text: `12px`, muted
- grid: очень светлый, можно dashed
- tooltip: white card, radius 14, border, shadow-sm
- не ставить больше 4 серий
- legend — компактная, снизу или сверху справа
- у каждой диаграммы должен быть текстовый summary рядом или сверху

---

## 11.9. File Card
Универсальный паттерн для загрузки, документа и chat attachment.

### Структура
- file type icon tile
- file name
- meta: size / type / progress / uploader
- actions справа
- progress bar снизу при загрузке

### Визуально
- white background
- border
- radius `14–16px`
- icon tile: `surface-muted` или `interactive-soft`
- progress bar: `interactive`

---

## 11.10. Notifications
### Notification item
- avatar left
- title 15/20 semibold
- description/text second line
- timestamp muted
- unread dot синяя
- action button только если реально нужен

### Bell badge
- красный numeric badge допустим для глобального счётчика
- сам bell icon — нейтральный

### Mobile sheet
- radius `28–32px`
- белый фон
- dimmed blurred backdrop
- safe-area aware

---

## 11.11. Messenger
Чат в продукте должен выглядеть как рабочая переписка, а не consumer messenger.

### Правила
- split layout: chats list + conversation
- conversation area спокойная, почти flat
- сообщения можно делать без тяжёлых bubble-блоков
- avatar + name + time важнее декоративной формы bubble
- attachment — через `FileCard compact`
- composer: белая панель с иконками и тёмной send button

---

## 11.12. Auth
Auth — единственный экран, где допустима более заметная иллюстративность.

### Композиция
- split layout
- слева форма на светлом фоне
- справа иллюстрация/blue-gradient canvas
- заголовок крупный
- controls comfortable density

### Поля
- можно использовать underlined variant
- primary CTA тёмный
- secondary action — светлый/disabled look
- consent block короткий и чистый

### Правило
Auth screen может быть эмоциональнее operational screens, но всё равно должен оставаться enterprise-friendly.

---

## 12. Iconography

### Общий стиль
- outline icons
- stroke width: `1.75–2`
- без filled icons по умолчанию
- color: `currentColor`

### Размеры
| Size | Pixels | Применение |
|---|---:|---|
| `xs` | 16px | inline, badges |
| `sm` | 18px | buttons, inputs |
| `md` | 20px | nav items |
| `lg` | 24px | standalone controls |
| `xl` | 32px | large panels / empty states |

---

## 13. Accessibility

### Базовые правила
- контраст — минимум AA
- `focus-visible` обязателен
- icon-only buttons — с `aria-label`
- touch targets — минимум `44x44` на mobile
- статусы не кодировать только цветом
- charts сопровождать текстом или summary
- `motion-reduce` обязателен
- семантика: заголовки, списки, таблицы, dialog semantics

---

## 14. Рекомендации по стеку компонентов

### Tailwind CSS
Использовать как основную styling-system базу.

### shadcn/ui
Использовать как стартовую основу, но не как “готовый дизайн”.

### Radix UI
Использовать именно **Primitives** как поведенческую основу для dialog, tabs, dropdown menu, popover, tooltip, scroll area, checkbox, switch и т.д.

### classnames + tailwind-merge
Использовать как стандартную связку для условной сборки классов и снятия конфликтов.

### class-variance-authority
Рекомендуется добавить для variant-driven компонентов.

### lucide-react
Использовать как основную библиотеку иконок.

### tw-animate-css
Для нового проекта использовать вместо `tailwindcss-animate`.

### react-hook-form + zod
Использовать для всех форм и схемной валидации.

### @tanstack/react-table
Использовать для всех таблиц и реестров.

### recharts
Использовать для KPI и operational dashboards.

### Важное архитектурное решение
Следовать принципам Material / Ant стоит на уровне понятности, плотности, структуры и предсказуемости, но не тащить в проект Ant Design как визуальную библиотеку.

---

## 15. Рекомендуемый подход к организации UI-кода

### Структура
```txt
components/
  ui/
    button.tsx
    input.tsx
    select.tsx
    badge.tsx
    card.tsx
    dialog.tsx
    drawer.tsx
    table.tsx
    tabs.tsx
    ...
  domain/
    requests/
    documents/
    dashboard/
    messenger/
    notifications/

lib/
  ui/
    cn.ts
    tokens.ts
    formatters.ts
    variants.ts

registry/
  serviceops/
    ...
```

---

## 16. Базовые правила для AI-генерации компонентов

### 16.1. Компонентный контракт
Каждый компонент:
- использует только семантические токены
- принимает `className`
- поддерживает `data-slot`, `data-variant`, `data-size`, `data-state` где это уместно
- не содержит внешних `margin`
- не хардкодит цвет через raw hex внутри JSX
- имеет `loading`, `disabled`, `error`, `empty` состояния, если это применимо

### 16.2. Вариантность
Варианты описываются через `cva`:
- `variant`
- `size`
- `tone`
- `state` только там, где это действительно API, а не runtime

### 16.3. Слои
- `ui/` — primitives
- `domain/` — бизнес-обёртки
- ни один доменный компонент не дублирует базовый styling recipe
- status wrappers строятся на badge, file widgets — на file card, data views — на table primitives

### 16.4. Стили
- сначала токены
- потом component recipe
- потом `className` override через `cn`
- arbitrary values — только для реально уникальных one-off ситуаций

### 16.5. Story coverage
У каждого компонента должны быть истории:
- Default
- Hover
- Focus
- Disabled
- Loading / Empty / Error
- Mobile / Desktop, если компонент адаптивный

---

## 17. Token scaffold для `globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  /* Core */
  --background: 220 23% 97%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* Neutrals */
  --muted: 220 20% 96%;
  --muted-foreground: 218 11% 47%;
  --secondary: 220 17% 94%;
  --secondary-foreground: 222 47% 11%;

  --border: 220 16% 90%;
  --input: 220 16% 90%;
  --ring: 221 91% 58%;

  /* Primary = dark CTA */
  --primary: 222 31% 14%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 222 47% 10%;

  /* Interactive */
  --accent: 221 91% 58%;
  --accent-foreground: 0 0% 100%;
  --accent-soft: 217 100% 97%;

  /* Semantic */
  --success: 142 72% 36%;
  --success-soft: 138 76% 97%;

  --warning: 35 92% 43%;
  --warning-soft: 48 100% 96%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --destructive-soft: 7 100% 97%;

  --info: 200 98% 39%;
  --info-soft: 204 100% 97%;

  /* Charts */
  --chart-1: 221 91% 58%;
  --chart-2: 142 72% 36%;
  --chart-3: 35 92% 43%;
  --chart-4: 262 83% 58%;
  --chart-5: 0 72% 51%;

  /* Radius */
  --radius-xs: 0.375rem;  /* 6px */
  --radius-sm: 0.5rem;    /* 8px */
  --radius-md: 0.625rem;  /* 10px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.25rem;  /* 20px */
  --radius-3xl: 1.75rem;  /* 28px */
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-destructive: hsl(var(--destructive));
  --color-info: hsl(var(--info));

  --radius: var(--radius-lg);
}
```

---

## 18. Базовый `cn()` helper

```ts
import classNames from "classnames"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: Parameters<typeof classNames>) {
  return twMerge(classNames(inputs))
}
```

---

## 19. Базовый рецепт variant-driven компонентов

```ts
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/ui/cn"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]",
        secondary:
          "border border-border bg-card text-foreground hover:bg-muted",
        accent:
          "bg-[hsl(var(--accent-soft))] text-accent hover:bg-blue-100",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger:
          "bg-destructive text-destructive-foreground hover:opacity-95",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
```

---

## 20. Do’s and Don’ts

### Do
- используй тёмный primary как главный CTA
- используй синий для selected/focus/interactive состояний
- строй экраны на white cards over mist background
- держи 14px как базовый UI-size
- выравнивай числа, деньги и проценты через `tabular-nums`
- делай статусы через текст + soft tone
- у data screens сначала думай о scanability, потом о красоте

### Don’t
- не заливай все действия ярким синим
- не используй heavy shadows на базовых карточках
- не делай насыщенный gradient background на operational screens
- не смешивай слишком много радиусов
- не проектируй tables как marketing cards
- не используй glassmorphism как основной стиль
- не делай мессенджер и уведомления визуально “чужими” по отношению к CRM shell

---

## 21. Quick Reference

```txt
STYLE
Modern light B2B CRM
Calm, clean, border-first, performance-aware

PRIMARY
Primary CTA: #111827
Interactive blue: #2F6BFF
Background: #F5F7FB
Surface: #FFFFFF
Border: #E4E7EC
Text main: #0F172A
Text secondary: #667085

SEMANTIC
Success: #16A34A
Warning: #D97706
Danger:  #DC2626
Info:    #0284C7

TYPOGRAPHY
Base UI: 14/20
Body relaxed: 16/24
Card title: 18/26 semibold
Section: 24/32 bold
Page title: 30/38 bold

RADIUS
Inputs: 10
Buttons: 12
Cards: 16
Dialog: 20
Mobile Sheet: 28

DENSITY
Controls: 40 default / 44 comfortable
Rows: 52 default / 56 comfortable

MOTION
Hover: 120–180ms
Components: 220ms
Overlay: 280ms
Use subtle fade/slide/zoom only

STACK
Tailwind CSS
shadcn/ui + Radix Primitives
classnames + tailwind-merge + cva
lucide-react
tw-animate-css
react-hook-form + zod
@tanstack/react-table
recharts
```
