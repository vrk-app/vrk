# VRK Storybook Component Backlog

Статус: proposed source backlog  
Обновлено: 2026-05-12

## Назначение

Этот документ фиксирует backlog Storybook-компонентов для VRK Platform в формате, пригодном для stage-driven agent workflow.

Документ является source backlog для:

- `Stage 01 — 01-ui-storybook-foundation`;
- последующих UI slices в `Stage 02+`, когда бизнес-стадии будут добирать доменные компоненты и showcase-композиции.

## Как использовать в stage workflow

- `Stage 01` не обязан закрыть весь backlog из этого документа.
- `Stage 01` обязан закрыть Storybook infrastructure, foundations и Wave 1.
- Остальные P0/P1/P2 пункты из этого документа остаются source backlog для следующих sprint contracts и следующих stages.
- Для каждого UI/story slice агент обязан использовать repo-local workflow: `docs/design/ui-workflow.md`, `.impeccable.md`, `$vrk-web-ui-workflow`, `$impeccable craft`, `$polish`, `$web-design-guidelines`.
- Перед созданием или заменой reusable/domain UI агент обязан прогнать repo-local lookup helper по текущему Storybook inventory и зафиксировать решение `reuse` / `extend` / `create`.
- Этот backlog отвечает за planned component scope, но не заменяет lookup по уже существующим story-backed компонентам.
- Нельзя отмечать компонент завершенным без stories, evidence и verifier-pass на соответствующем stage slice.

## Stage 01 Scope Boundary

В рамках `Stage 01 — 01-ui-storybook-foundation` acceptance рекомендуется ограничить:

- Storybook scaffold и reproducible UI workflow;
- foundations;
- весь базовый UI;
- layout/navigation foundation;
- auth baseline;
- request list baseline;
- минимальные showcase stories для проверки composability.

Полный backlog ниже не равен полному scope одной стадии.

## Легенда

- `P0` — обязательно для первой версии Storybook по текущим макетам.
- `P1` — нужно сразу после `P0`, потому что уже есть в ТЗ.
- `P2` — отложенное, но API/варианты лучше предусмотреть заранее.

## Общие правила для агента

- Для всех интерактивных компонентов обязательны stories: `Default`, `Hover`, `Focus`, `Disabled`.
- Для data-компонентов обязательны stories: `Loading`, `Empty`, `Error`.
- Для адаптивных компонентов обязательны `Desktop` и `Mobile`.
- Интерфейс в Storybook должен быть на русском языке.
- UI examples в stories используют пользовательский текст продукта. Не выносить в интерфейсные stories stage/proof/backend/slice-пояснения, roadmap-комментарии и маркетинговую прозу, которая не является частью реального UI.
- Визуально нужно держаться спокойной CRM-стилистики, близкой к Material/Ant.
- Не плодить дубликаты: `SearchInput` и `PasswordInput` являются вариантами `InputField`; статусные плашки являются обертками над `Badge`; круг процентов является оберткой над `CircularProgress`; доменные таблицы строятся на базе одного `DataTable`.
- Если lookup заканчивается решением `create`, новый reusable component должен появиться вместе со stories, а backlog нужно обновить, когда в нем еще нет соответствующей component family или agreed slice.

## 1. Foundations

### FND-01 TokenDocs [P0]

- Назначение: docs-only страница с цветами, типографикой, spacing, radius, shadows, z-index.
- Обязательные props: нет.
- Состояния: нет.
- Stories: `Colors`, `Typography`, `Spacing`, `Elevation`, `Radii`.

### FND-02 IconGallery [P0]

- Назначение: каталог системных и доменных иконок: навигация, файлы, статусы, действия.
- Story expectation: story showcase читает `ICON_SECTIONS` из shared fixtures и показывает системный size ladder `16 / 20 / 24 / 32` без отдельного runtime component API.
- Состояния: `default`.
- Stories: `NavigationIcons`, `ActionIcons`, `FileTypeIcons`, `StatusIcons`.

### Shared enums / mock data [P0]

Не отдельный UI-компонент, а общий story helper:

- `RequestStatus`: черновик, на согласовании, согласована, в работе, на подписи, ожидает оплаты, завершена, рекламация.
- `RequestType` и `Priority`: ремонт, ТО, метрологическое обслуживание, аварийный; обычный, высокий, критический.
- `DocumentType`: дефектная ведомость, ТАВР, финансовый акт, счет, свидетельство, фото.
- `UserRole`: администратор, техрук, мастер/метролог, руководитель сервисной службы, инженер, бухгалтер.

## 2. Базовые UI-компоненты

### UI-01 Button [P0]

- Назначение: все основные CTA: «Оформить заявку», «Войти», «Прочитать», «Узнать больше».
- Обязательные props: `variant`, `size`, `children`, `leftIcon`, `rightIcon`, `loading`, `disabled`, `fullWidth`.
- Состояния: `default`, `hover`, `focus`, `active`, `loading`, `disabled`.
- Stories: `Primary`, `Secondary`, `Ghost`, `Danger`, `WithLeftIcon`, `WithRightIcon`, `Loading`, `Disabled`, `FullWidth`.

### UI-02 IconButton [P0]

- Назначение: иконки в шапке, чате, уведомлениях, меню действий.
- Обязательные props: `icon`, `size`, `variant`, `ariaLabel`, `disabled`.
- Состояния: `default`, `hover`, `focus`, `disabled`.
- Stories: `Filled`, `Outline`, `Ghost`, `Small`, `Large`, `Disabled`.

### UI-03 InputField [P0]

- Назначение: единое поле для `text` / `email` / `password` / `search`.
- Обязательные props: `type`, `label`, `placeholder`, `value`, `hint`, `error`, `leftIcon`, `rightIcon`, `disabled`.
- Контракт `hint`: вспомогательная справка показывается через compact help-trigger рядом с label/control и раскрывается по hover/focus; она не занимает постоянную строку под полем. `error` остается видимым текстом под полем и имеет приоритет в `aria-describedby`.
- Состояния: `empty`, `filled`, `hint`, `error`, `hint + error`, `disabled`, `with icon`.
- Stories: `Text`, `Email`, `Password`, `Search`, `WithHint`, `WithError`, `WithHintAndError`, `Disabled`.

### UI-04 SelectField [P0]

- Назначение: все селекты фильтров и справочников.
- Обязательные props: `label`, `placeholder`, `value`, `options`, `multiple`, `clearable`, `disabled`.
- Дополнительные props: `searchable`, `searchPlaceholder`.
- Состояния: `empty`, `selected`, `search`, `no results`, `multi`, `disabled`, `loading options`.
- Stories: `Single`, `SearchableDefault`, `NoResults`, `SearchDisabled`, `Multiple`, `WithPlaceholder`, `Disabled`, `LoadingOptions`.
- Реализация: `apps/web/shared/ui/SelectField.tsx`, stories в `apps/web/stories/primitives/SelectField.stories.tsx`.

### UI-05 DatePickerField [P0]

- Назначение: одиночная дата и диапазон периода.
- Обязательные props: `mode`, `label`, `value`, `placeholder`, `disabled`, `minDate`, `maxDate`.
- Состояния: `single`, `range`, `disabled`, `invalid`.
- Stories: `SingleDate`, `DateRange`, `Disabled`, `WithValue`.

### UI-06 Switch [P0]

- Назначение: бинарные фильтры типа «Неоплаченные», «Незавершенные».
- Обязательные props: `checked`, `label`, `disabled`.
- Состояния: `on`, `off`, `disabled`.
- Stories: `Checked`, `Unchecked`, `Disabled`.

### UI-07 Checkbox [P0]

- Назначение: выбор строк, согласия, bulk actions.
- Обязательные props: `checked`, `indeterminate`, `label`, `disabled`.
- Состояния: `unchecked`, `checked`, `indeterminate`, `disabled`.
- Stories: `Default`, `Checked`, `Indeterminate`, `Disabled`.

### UI-08 Tabs [P0]

- Назначение: вкладки карточки заявки.
- Обязательные props: `items`, `activeKey`, `onChange`, `fullWidth`.
- Состояния: `default`, `active`, `overflow`.
- Stories: `Basic`, `ManyTabs`, `WithLongLabels`.
- Реализация: `apps/web/shared/ui/Tabs.tsx`, stories в `apps/web/stories/primitives/Tabs.stories.tsx`; вкладки используют `tablist`/`tab`, roving focus и `Home`/`End`.

### UI-09 Badge [P0]

- Назначение: нейтральные, статусные и трендовые плашки.
- Обязательные props: `variant`, `tone`, `size`, `icon`, `children`.
- Состояния: `neutral`, `success`, `warning`, `danger`, `info`.
- Stories: `Neutral`, `Success`, `Warning`, `Danger`, `WithIcon`, `Small`, `TrendUp`, `TrendDown`.

### UI-10 Avatar [P0]

- Назначение: профиль пользователя, участники чата, уведомления.
- Обязательные props: `src`, `name`, `size`, `status`, `fallback`.
- Состояния: `image`, `initials`, `online`, `offline`.
- Stories: `Image`, `Initials`, `Online`, `Offline`, `Sizes`.

### UI-11 Card [P0]

- Назначение: базовая поверхность для KPI, таблиц, правых summary-блоков, auth-форм.
- Обязательные props: `padding`, `bordered`, `elevated`, `children`.
- Состояния: `plain`, `bordered`, `elevated`.
- Stories: `Base`, `Bordered`, `Elevated`, `Dense`.

### UI-11.1 IslandCard [P0]

- Назначение: wrapper над `Card` для рабочих островов с верхней muted-челкой, доменной иконкой, optional metric и правым action badge.
- Обязательные props: `title`, `children`, `icon`, `metric`, `action`, `headingLevel`, `className`, `bodyClassName`.
- Metric отображается как типографический хвост рядом с заголовком (`Заголовок · 12`), без badge-фона и без текстовой подписи.
- Горизонтальный отступ челки и вертикальный зазор до body равны body padding острова (`24px` / `card-padding-lg`); padding вложенных list items является вторичным уровнем и не задает кромку челки.
- Состояния: `form`, `form with action`, `with metric`, `long title`, `mobile`.
- Реализация: `apps/web/shared/ui/IslandCard.tsx`, stories в `apps/web/stories/primitives/IslandCard.stories.tsx`.
- Примечание: компонент не заменяет базовый `Card`; он фиксирует выбранный островной паттерн поверх существующей поверхности.

### UI-11.2 FormListSplitLayout [P0]

- Назначение: общий layout для operational surfaces, где слева форма добавления/редактирования, а справа список объектов.
- Обязательные props: `form`, `list`, `className`, `formClassName`, `listClassName`, `columnsClassName`.
- `FormListScrollArea` поддерживает `scrollMode: "page" | "contained"`; default `page` оставляет список в обычном page-flow без дополнительного right gutter, а `contained` включает desktop-only внутренний scroll и небольшой scrollbar gutter без блокировки scroll chaining.
- Поведение: на desktop (`xl+`) измеряет высоту левой формы и задает эту высоту правой колонке; переполнение переносится во внутренний scroll только при явном `scrollMode="contained"`. На tablet/mobile колонки складываются в обычный стек без height-lock.
- Состояния: `desktop short list`, `desktop long list scroll`, `mobile stacked`.
- Stories: `DesktopShortList`, `DesktopLongListScroll`, `MobileStacked`.
- Реализация: `apps/web/shared/ui/FormListSplitLayout.tsx`, stories в `apps/web/stories/primitives/FormListSplitLayout.stories.tsx`.

### UI-12 DropdownMenu [P0]

- Назначение: «многоточие», actions-меню, профильное меню.
- Обязательные props: `items`, `trigger`, `placement`, `disabled`.
- Состояния: `closed`, `open`, `with destructive action`, `disabled trigger`.
- Stories: `Basic`, `WithDangerItem`, `LongMenu`.

### UI-13 Popover [P0]

- Назначение: малые оверлеи: уведомления desktop, простые help/info панели.
- Обязательные props: `open`, `anchor`, `placement`, `title`, `content`.
- Состояния: `closed`, `open`, `with scroll`, `empty`.
- Stories: `Basic`, `Scrollable`, `Empty`.

### UI-13.1 Tooltip [P0]

- Назначение: compact help-trigger рядом с label/control для кратких справок в формах и плотных operator surfaces.
- Обязательные props: `variant`, `title`, `description`, `aria-label`, `triggerClassName`, `contentClassName`.
- Variants: `dark` является runtime default; `light` и `info` доступны как явный выбор для менее акцентных или справочных поверхностей.
- Контент: `title` и `description` опциональны; компонент рендерит только переданные блоки.
- Trigger: borderless `Info` icon, opacity `45%` в покое и `100%` на hover/focus, без отдельной кнопочной капсулы.
- Состояния: `default`, `hover`, `focus`, `light`, `info`, `description only`.
- Stories: `Default`, `Hover`, `Focus`, `Light`, `Info`, `DescriptionOnly`.
- Реализация: `apps/web/shared/ui/Tooltip.tsx`, stories в `apps/web/stories/primitives/Tooltip.stories.tsx`.

### UI-13.2 Dialog [P0]

- Назначение: базовое модальное окно для редактирования сущностей и вложенных operator actions.
- Обязательные props: `open`, `onOpenChange`, `title`, `description`, `badge`, `children`, `footer`, `size`, `dismissible`, `showClose`, `headerVariant`, `headerIcon`.
- Header variants: `neutral`, `muted`, `dark`. `muted` является runtime default для рабочих editor-модалок и островов; `neutral` остается более белым вариантом для поверхностей, где нужен меньший контраст с body; `dark` сохраняет исходную темную челку для акцентных и критичных модалок. Все три варианта используют одну геометрию верхней челки.
- Состояния: `default`, `neutral header`, `muted header`, `dark header`, `long content`, `dismiss disabled`, `mobile`.
- Stories: `Default`, `NeutralHeader`, `MutedHeader`, `DarkHeader`, `LongContent`, `DismissDisabled`, `Mobile`.
- Реализация: `apps/web/shared/ui/Dialog.tsx`, stories в `apps/web/stories/primitives/Dialog.stories.tsx`.

### UI-14 Drawer [P0]

- Назначение: мобильные панели, выезжающие меню, fullscreen sheet.
- Обязательные props: `open`, `side`, `title`, `children`, `onClose`.
- Состояния: `closed`, `open`, `full-screen mobile`.
- Stories: `RightDrawer`, `BottomSheet`, `MobileFullScreen`.

### UI-15 Pagination [P0]

- Назначение: навигация по спискам и таблицам.
- Обязательные props: `page`, `pageSize`, `total`, `pageSizeOptions`, `onPageChange`, `onPageSizeChange`.
- Состояния: `first page`, `middle`, `last`, `disabled`.
- Stories: `Basic`, `WithPageSize`, `LastPage`.
- Примечание: поддержать `10 / 25 / 50 / 100` на страницу, как требует ТЗ.

### UI-16 DataTable [P0]

- Назначение: единая база для «Недавние заявки», реестра оборудования, договоров и отчетных таблиц.
- Обязательные props: `columns`, `rows`, `loading`, `emptyState`, `sortState`, `pagination`, `rowSelection`, `rowActions`, `onRowClick`, `onRowDoubleClick`.
- Состояния: `default`, `sortable`, `selected row`, `loading`, `empty`, `long text/ellipsis`.
- Stories: `Basic`, `Sortable`, `WithSelection`, `WithRowActions`, `LongTextEllipsis`, `Loading`, `Empty`.
- Примечание: обязательно поддержать сортировку, пагинацию, многоточие для длинного текста и выделение строки при открытии карточки.

### UI-17 ProgressBar [P0]

- Назначение: линейный прогресс загрузки файла.
- Обязательные props: `value`, `max`, `showLabel`, `size`.
- Состояния: `0%`, `in progress`, `complete`.
- Stories: `TwentyPercent`, `FortyPercent`, `Complete`.

### UI-18 CircularProgress [P0]

- Назначение: круговой прогресс/процент на карточках заявок.
- Обязательные props: `value`, `max`, `size`, `label`, `tone`.
- Состояния: `0`, `partial`, `complete`.
- Stories: `TwelvePercent`, `FiftySixPercent`, `Complete`, `WithoutLabel`.

### UI-19 EmptyState [P0]

- Назначение: пустые списки, пустые вкладки, отсутствие документов/оборудования.
- Обязательные props: `title`, `description`, `action`, `icon`.
- Состояния: `passive`, `with CTA`.
- Stories: `NoData`, `NoSearchResults`, `WithAction`.

### UI-20 Skeleton [P0]

- Назначение: загрузка карточек, таблиц, чата.
- Обязательные props: `variant`, `rows`, `width`, `height`.
- Состояния: `text`, `card`, `table row`, `avatar line`.
- Stories: `TextLines`, `CardSkeleton`, `TableSkeleton`, `ChatSkeleton`.

### UI-21 CopyableText [P1]

- Назначение: компактное отображение ссылок, токенов, идентификаторов и code-like значений с копированием через icon action внутри блока.
- Обязательные props: `value`, `copyValue`, `copyLabel`, `copiedLabel`, `children`.
- Состояния: `default`, `hover`, `focus`, `long value`, `copied`.
- Stories: `Default`, `Hover`, `Focus`, `LongValue`.
- Примечание: кнопка копирования не должна становиться отдельным CTA; она появляется как маленькая иконка внутри блока при hover/focus.

## 3. Layout и навигация

### LAY-01 AppShell [P0]

- Назначение: общий каркас приложения: `sidebar + topbar + content`.
- Обязательные props: `sidebar`, `header`, `children`.
- Story-only control: состояние mobile drawer может экспонироваться в Storybook как внешний control для связки `TopBar` + `SidebarNav`, но не обязано быть runtime-prop самого `AppShell`.
- Состояния: `desktop`, `mobile with drawer`.
- Stories: `DesktopShell`, `MobileShell`.

### LAY-02 SidebarNav [P0]

- Назначение: левое меню с разделами и нижним блоком.
- Обязательные props: `items`, `activeKey`, `footerItems`, `collapsed`, `mobileOpen`.
- Состояния: `active item`, `long labels`, `long navigation`, `mobile drawer`, `collapsed + mobile drawer`.
- Stories: `Default`, `ActiveRequests`, `Collapsed`, `LongLabels`, `LongNavigation`, `MobileDrawer`, `CollapsedMobileDrawer`.
- Примечание: базовый CRM-shell с вертикальной навигацией закреплен в ТЗ.

### LAY-03 TopBar [P0]

- Назначение: хлебные крошки / поиск / уведомления / профиль.
- Обязательные props: `searchValue`, `notificationsCount`, `user`, `breadcrumbs`.
- Опциональные callbacks: `onSearch`, `onNotificationsClick`, `onUserMenu`.
- Состояния: `with notifications`, `without notifications`, `long username`, `search unavailable`, `actions unavailable`.
- Stories: `Default`, `WithUnreadCount`, `WithoutNotifications`, `LongUserName`, `SearchUnavailable`, `ActionsUnavailable`.
- Примечание: если опциональный callback (`onSearch`, `onNotificationsClick`, `onUserMenu`) не передан, соответствующий control должен отображаться как явно недоступный, а не как фальшиво интерактивный.

### LAY-04 Breadcrumbs [P0]

- Назначение: навигационная цепочка «Главная > Dashboard», «Заявки > Карточка заявки».
- Обязательные props: `items`, `separator`.
- Состояния: `short`, `long`.
- Stories: `TwoLevels`, `ThreeLevels`.

### LAY-05 PageHeader [P0]

- Назначение: заголовок страницы + actions справа.
- Обязательные props: `title`, `subtitle`, `actions`, `backLink`.
- Состояния: `title only`, `with actions`, `with subtitle`.
- Stories: `Simple`, `WithPrimaryAction`, `WithSubtitle`.

### LAY-06 FilterToolbar [P0]

- Назначение: единая обвязка для зон фильтров.
- Обязательные props: `children`, `actions`, `responsive`.
- Состояния: `desktop row`, `wrapped`, `mobile stacked`.
- Stories: `Inline`, `Wrapped`, `Mobile`.

## 4. Дашборд и аналитика

ТЗ требует KPI, графики, сводку по просроченным заявкам и фильтрацию/экспорт отчетов.

### DASH-01 KpiStatCard [P0]

- Назначение: карточка KPI с числом, подписью, трендом и мини-графиком.
- Обязательные props: `title`, `value`, `subtitle`, `trend`, `sparklineData`, `tone`.
- Состояния: `positive`, `negative`, `neutral`, `zero`.
- Stories: `PositiveTrend`, `NegativeTrend`, `ZeroValue`, `WithoutSparkline`.

### DASH-02 DashboardLineChartCard [P0]

- Назначение: большой график динамики заявок/нагрузки.
- Обязательные props: `title`, `series`, `xAxis`, `legend`, `filtersSlot`, `loading`, `empty`.
- Состояния: `1 series`, `3 series`, `loading`, `empty`.
- Stories: `SingleSeries`, `MultipleSeries`, `WithTooltip`, `Loading`, `Empty`.

### DASH-03 SummaryPanel [P0]

- Назначение: правый summary-блок с метриками и CTA.
- Обязательные props: `items`, `actions`, `loading`.
- Состояния: `with actions`, `loading`, `empty`.
- Stories: `Default`, `WithTwoMetrics`, `Loading`.

## 5. Заявки

Жизненный цикл заявки, комментарии, аудит, документы и маршрутизация прямо описаны в ТЗ; список заявок должен иметь фильтры, поиск и сортировку.

### REQ-01 RequestStatusBadge [P0]

- Назначение: единая визуализация статуса заявки.
- Обязательные props: `status`, `size`, `showIcon`.
- Состояния: все доменные статусы.
- Stories: `Draft`, `OnApproval`, `Approved`, `InWork`, `OnSigning`, `AwaitingPayment`, `Completed`, `Reclamation`.

### REQ-02 RequestProgressBadge [P0]

- Назначение: круглый процент/статус в карточке заявки списка.
- Обязательные props: `percent`, `label`, `tone`, `size`.
- Состояния: `0`, `partial`, `complete`.
- Stories: `TwelvePercent`, `FiftySixPercent`, `Complete`.

### REQ-03 RequestFiltersPanel [P0]

- Назначение: фильтрация списка заявок.
- Обязательные props: `dateFrom`, `dateTo`, `equipmentType`, `enterprise`, `contractor`, `contract`, `statuses`, `searchQuery`, `flags`, `onReset`.
- Состояния: `empty`, `with active filters`, `loading dictionaries`, `mobile stacked`.
- Stories: `Default`, `WithActiveFilters`, `WithToggles`, `Mobile`.

### REQ-04 RequestListItem [P0]

- Назначение: карточка одной заявки в списке.
- Обязательные props: `requestNumber`, `createdAt`, `title`, `enterprise`, `contractor`, `contract`, `sum`, `status`, `progressPercent`, `selected`, `note`.
- Состояния: `default`, `selected`, `long text`, `without note`, `0%`, `overflow input`.
- Stories: `Base`, `Selected`, `LongEnterpriseName`, `WithoutNote`, `Completed`, `ZeroProgress`, `OverflowInput`.
- Примечание: `note` — это текстовое примечание строки. Если в slice нет реального перехода, компонент не должен обещать ссылку или другое ложное действие.

### REQ-05 RequestList [P0]

- Назначение: список карточек заявок как композиция над `RequestListItem`.
- Обязательные props: `items`, `loading`, `empty`, `page`, `pageSize`, `total`.
- Состояния: `default`, `loading`, `empty`.
- Stories: `Default`, `Loading`, `Empty`, `ManyItems`.

### REQ-06 RequestDetailsHeader [P0]

- Назначение: хедер карточки заявки.
- Обязательные props: `requestNumber`, `requestDate`, `title`, `contractNumber`, `status`, `actions`, `editable`.
- Состояния: `editable`, `read-only`, `long title`.
- Stories: `Editable`, `ReadOnly`, `LongTitle`.

### REQ-07 EquipmentTable [P0]

- Назначение: вкладка «Оборудование» в карточке заявки.
- Обязательные props: `items`, `columns`, `canAdd`, `canEdit`, `loading`, `empty`.
- Состояния: `empty`, `with rows`, `long values`.
- Stories: `Empty`, `WithRows`, `WithAddAction`, `LongModelName`.

### REQ-08 CommentThread [P0]

- Назначение: лента комментариев по заявке.
- Обязательные props: `items`, `currentUserId`, `showComposer`, `allowInternal`, `onSend`.
- Состояния: `own comment`, `чужой comment`, `internal`, `public`, `with attachment`, `empty`.
- Stories: `MixedThread`, `WithInternalComments`, `WithAttachment`, `Empty`.
- Примечание: учесть внутренние комментарии, видимые только своей организации.

### REQ-09 AuditTimeline [P0]

- Назначение: журнал аудита действий по заявке.
- Обязательные props: `items`, `showDiff`, `dense`, `filter`.
- Состояния: `status change`, `file upload`, `comment added`, `edit action`, `empty`.
- Stories: `FullTimeline`, `Compact`, `Empty`.
- Примечание: журнал аудита обязателен и должен фиксировать кто, когда и что сделал.

## 6. Документы и файлы

ТЗ требует загрузку файлов, версионность документов, визуализацию и проверку ЭП.

### DOC-01 FileCard [P0]

- Назначение: единый компактный блок файла для загрузки, списка документов и вложений в чате.
- Обязательные props: `fileName`, `extension`, `size`, `status`, `progress`, `preview`, `actions`.
- Состояния: `uploading`, `uploaded`, `failed`, `compact`, `chat attachment`.
- Stories: `Uploading40Percent`, `Uploaded`, `Failed`, `Compact`, `ChatAttachment`.

### DOC-02 FileDropzone [P0]

- Назначение: зона загрузки файлов и фото.
- Обязательные props: `accept`, `multiple`, `maxSize`, `disabled`, `onDrop`.
- Состояния: `idle`, `dragover`, `disabled`, `error`.
- Stories: `Default`, `DragOver`, `ErrorState`, `Disabled`.

### DOC-03 DocumentCard [P0]

- Назначение: карточка доменного документа.
- Обязательные props: `type`, `fileName`, `size`, `uploadedBy`, `uploadedAt`, `version`, `signatureState`, `metadata`.
- Состояния: `unsigned`, `signed`, `invalid signature`, `multiple versions`.
- Stories: `TAVR`, `Invoice`, `MetrologyCertificate`, `Signed`, `SignatureInvalid`, `Versioned`.

### DOC-04 DocumentList [P0]

- Назначение: список документов заявки.
- Обязательные props: `documents`, `canUpload`, `canDelete`, `canSign`, `groupByType`.
- Состояния: `empty`, `grouped`, `read-only`, `with versions`.
- Stories: `Empty`, `GroupedByType`, `ReadOnly`, `VersionHistory`.

### DOC-05 SignatureStamp [P1]

- Назначение: визуальный штамп ЭП.
- Обязательные props: `signer`, `signedAt`, `verified`, `certificateInfo`, `mode`.
- Состояния: `valid`, `invalid`, `pending verification`.
- Stories: `ValidStamp`, `InvalidStamp`, `Compact`.
- Примечание: ЭП и визуализация подписанных документов описаны в ТЗ, но часть сценариев может пойти после `P0`.

## 7. Мессенджер и уведомления

Внутренний мессенджер с браузерными уведомлениями обозначен в roadmap и уже отрисован в макетах, поэтому в Storybook его разумно закладывать отдельным блоком.

### MSG-01 ChatListItem [P0]

- Назначение: элемент списка чатов.
- Обязательные props: `avatar`, `name`, `preview`, `time`, `unreadCount`, `pinned`, `active`.
- Состояния: `unread`, `pinned`, `active`, `long preview`.
- Stories: `Default`, `Unread`, `Pinned`, `Active`, `LongPreview`.

### MSG-02 ConversationHeader [P0]

- Назначение: верхняя часть открытого чата.
- Обязательные props: `user`, `role`, `online`, `actions`.
- Состояния: `online`, `offline`, `long name`.
- Stories: `Online`, `Offline`, `WithActions`.

### MSG-03 MessageBubble [P0]

- Назначение: сообщение в переписке.
- Обязательные props: `author`, `direction`, `text`, `time`, `status`, `attachments`, `quotedMessage`.
- Состояния: `incoming`, `outgoing`, `with attachment`, `quoted`, `multi-line`.
- Stories: `Incoming`, `Outgoing`, `WithAttachment`, `Quoted`, `LongText`.

### MSG-04 MessageComposer [P0]

- Назначение: поле ввода сообщения с вложениями и отправкой.
- Обязательные props: `value`, `attachments`, `disabled`, `placeholder`, `onSend`.
- Состояния: `empty`, `typing`, `with attachment`, `send loading`, `disabled`.
- Stories: `Empty`, `Typing`, `WithAttachment`, `Loading`, `Disabled`.

### NTF-01 NotificationBell [P0]

- Назначение: иконка уведомлений в `topbar`.
- Обязательные props: `count`, `hasUnread`, `onClick`.
- Состояния: `no unread`, `dot`, `numeric badge`.
- Stories: `Zero`, `DotOnly`, `CountTwo`, `Count99Plus`.

### NTF-02 NotificationItem [P0]

- Назначение: одна запись уведомления.
- Обязательные props: `avatar`, `title`, `description`, `timestamp`, `unread`, `actions`, `category`.
- Состояния: `read`, `unread`, `actionable`, `with secondary text`.
- Stories: `UnreadSimple`, `Read`, `WithActionButtons`, `WithQuote`.

### NTF-03 NotificationPopover [P0]

- Назначение: desktop-поповер уведомлений.
- Обязательные props: `items`, `filter`, `markAllAction`, `emptyState`.
- Состояния: `with items`, `empty`, `filtered`.
- Stories: `Default`, `Filtered`, `Empty`.

### NTF-04 NotificationMobileSheet [P0]

- Назначение: mobile / fullscreen представление уведомлений.
- Обязательные props: `items`, `title`, `onClose`, `filter`.
- Состояния: `list`, `empty`.
- Stories: `Default`, `Empty`, `LongList`.
- Примечание: mobile-вариант оправдан и макетами, и PWA-roadmap.

## 8. Аутентификация

ТЗ фиксирует вход по логину / паролю, роли и опциональную `2FA`; регистрация тоже есть в функционале.

### AUTH-01 AuthSplitLayout [P0]

- Назначение: экран авторизации с формой слева и иллюстрацией справа.
- Обязательные props: `formSlot`, `illustrationSlot`, `title`, `subtitle`.
- Состояния: `desktop`, `compact desktop`, `mobile stacked`.
- Stories: `Default`, `WithoutIllustration`, `Mobile`.

### AUTH-02 LoginForm [P0]

- Назначение: форма входа.
- Обязательные props: `fields`, `submitLabel`, `loading`, `fieldErrors`, `formError`, `consent`.
- Состояния: `pristine`, `validation error`, `server error`, `loading`.
- Примечание: `fieldErrors` отвечает за ошибки конкретных полей, а `formError` — за общий сбой формы или auth boundary.
- Stories: `Default`, `ValidationError`, `ServerError`, `Loading`.

### AUTH-03 TwoFactorForm [P1]

- Назначение: ввод `TOTP`-кода.
- Обязательные props: `value`, `error`, `loading`, `remainingSeconds`.
- Состояния: `default`, `invalid code`, `loading`, `resend timeout`.
- Stories: `Default`, `InvalidCode`, `Loading`.
- Примечание: `2FA` опциональна, поэтому это `P1`.

### AUTH-04 ConsentRow [P0]

- Назначение: строка согласия / подтверждения перед входом или регистрацией.
- Обязательные props: `checked`, `label`, `error`, `links`.
- Состояния: `unchecked`, `checked`, `error`.
- Stories: `Default`, `Checked`, `Error`.

### AUTH-05 RegisterForm [P1]

- Назначение: форма регистрации.
- Обязательные props: `fields`, `submitLabel`, `loading`, `error`, `consent`.
- Состояния: `pristine`, `validation error`, `loading`.
- Stories: `Default`, `ValidationErrors`, `Loading`.
- Примечание: в ТЗ регистрация есть, хотя в макетах упор на вход.

### AUTH-06 PlatformAdminInviteForm [P1]

- Назначение: выпуск приглашения первому администратору организации.
- Состояния: `default`, `error`.
- Stories: `Default`, `Error`.
- Story support: использует Storybook-only mock для `/api/platform/organization-shells`.

### AUTH-07 FirstAdminActivationForm [P1]

- Назначение: установка пароля по приглашению первого администратора или сотрудника.
- Состояния: `first admin`, `employee`.
- Stories: `FirstAdmin`, `Employee`.
- Story support: использует Storybook-only mock для accept route и router handoff.

## 9. Runtime-поверхности текущего web contour

Эти stories покрывают уже реализованные runtime UI без создания новых reusable component families. Они используют Storybook-only fixtures и mock API, чтобы не зависеть от backend при просмотре.

### RUN-01 CompanyStructureWorkspace [P1]

- Назначение: управление профилем организации, дивизионами, юнитами, доступным scope и conditional вкладкой сотрудников.
- Состояния: `organization admin`, `empty structure`, `division admin`, `unit admin`, `scoped read-only`, `organization head employees`, `division head employees`, `unit head employees`.
- Stories: `OrganizationAdmin`, `EmptyStructure`, `ScopedReadonly`, `OrganizationHeadEmployees`, `DivisionHeadEmployees`, `UnitHeadEmployees`.

### RUN-02 EmployeeAccessWorkspace [P1]

- Назначение: scoped registry активных сотрудников на вкладке `/company` → `Сотрудники`, с admin edit/deactivate controls и embedded invite manager для `organization_admin`, `division_admin` и `unit_admin` в пределах их области.
- Состояния: `admin editable`, `division admin editable`, `unit admin editable`, `organization head read-only`, `division head read-only`, `unit head read-only`, `empty`, `loading`, `error`.
- Stories: `AdminEditable`, `OrganizationHeadReadonly`, `DivisionHeadReadonly`, `UnitHeadReadonly`, `Empty`, `Loading`, `Error`.

### RUN-03 EmployeeInviteManager [P1]

- Назначение: создание, отправка, отзыв и просмотр статусов приглашений сотрудников.
- Состояния: `with invites`, `empty`, `loading`, `error`.
- Stories: `WithInvites`, `Empty`, `Loading`, `Error`.

### RUN-04 ContractsRegistry [P1]

- Назначение: реестр договоров заказчика, read-only договоры подрядчика и проверка маршрутизации.
- Состояния: `customer admin`, `division admin`, `unit admin`, `customer empty`, `customer restricted`, `contractor read-only`.
- Stories: `CustomerAdmin`, `CustomerEmpty`, `CustomerRestricted`, `ContractorReadonly`.

### RUN-05 EquipmentRegistryWorkspace [P1]

- Назначение: единый workspace оборудования с вкладками `Оборудование` и `Журнал операций`, owned standards внутри диагностических карточек, product-gallery для приватных фото оборудования и explicit archive visibility.
- Состояния: `equipment tab`, `journal tab`, `single photo`, `gallery`, `no-photo fallback`, `edit pending photo delete/upload`, `archive visible`, `scoped admin`, `scoped read-only`, `load error`.
- Stories: `TechnicalEquipmentList`, `TechnicalEquipmentSinglePhoto`, `TechnicalEquipmentGallery`, `TechnicalEquipmentNoPhotoFallback`, `DiagnosticEquipmentWithStandards`, `DiagnosticEquipmentEditPendingPhotos`, `UnifiedJournal`, `ArchiveVisible`, `ScopedReadonly`, `LoadError`, `LongEquipmentList`.
- Примечание: `EquipmentPhotoGallery` пока является feature-local domain UI внутри `EquipmentRegistryWorkspace`, а не shared reusable primitive; перед вынесением в shared нужно повторить lookup и добавить отдельную component-family запись.

## 10. P1: шаблоны реестров и отчетов

ТЗ отдельно требует страницы оборудования, договоров и отчетов, плюс фильтрацию и экспорт. В макетах их детально нет, но для Storybook это разумный второй слой.

### REG-01 RegistryPageTemplate [P1]

- Назначение: общий шаблон страниц-реестров: `title + filters + table/list + pagination`.
- Обязательные props: `title`, `filtersSlot`, `contentSlot`, `actions`, `pagination`.
- Состояния: `default`, `loading`, `empty`.
- Stories: `EquipmentRegistry`, `ContractsRegistry`, `ReportsRegistry`.

### REG-02 EquipmentHistoryTimeline [P1]

- Назначение: хронология обслуживания оборудования.
- Обязательные props: `items`, `nextServiceDate`, `overdue`, `documents`.
- Состояния: `normal`, `overdue`, `with documents`, `empty`.
- Stories: `Default`, `Overdue`, `WithDocuments`, `Empty`.
- Примечание: история обслуживания и напоминания о поверке прямо есть в ТЗ.

### REG-03 ContractCard [P1]

- Назначение: карточка или строка договора.
- Обязательные props: `contractNumber`, `signDate`, `startDate`, `endDate`, `customer`, `contractor`, `value`, `isActive`, `file`.
- Состояния: `active`, `expired`, `long subject`.
- Stories: `Active`, `Expired`, `LongSubject`.

### REG-04 ReportFiltersPanel [P1]

- Назначение: фильтры отчетов и аналитики.
- Обязательные props: `period`, `division`, `contractor`, `equipmentType`, `preset`, `onReset`.
- Состояния: `default`, `with active filters`, `loading`.
- Stories: `Default`, `WithPreset`, `WithActiveFilters`.

### REG-05 ExportActions [P1]

- Назначение: экспорт отчетов в `Excel / PDF`.
- Обязательные props: `formats`, `loading`, `disabled`.
- Состояния: `ready`, `loading`, `disabled`.
- Stories: `ExcelPdf`, `Loading`, `Disabled`.
- Примечание: экспорт в `Excel / PDF` зафиксирован в ТЗ.

## 11. Дополнительные доменные и платформенные компоненты

Ниже — дополнение к исходному backlog. Оно не повторяет уже описанные базовые primitives, layout, dashboard, список заявок, карточку заявки, документы, auth, мессенджер и уведомления, а закрывает те компоненты, которые с высокой вероятностью понадобятся из-за специфики продукта: создание и маршрутизация заявок, выполненные работы и материалы, версии документов, ЭП, метрологический учет, графики обслуживания, предустановленные отчеты, PWA-сценарии и интеграции.

Для этого блока сохраняются общие правила документа и дополнительно действуют следующие:

- все новые компоненты строятся поверх уже описанных primitives: `Card`, `Badge`, `DataTable`, `Dialog`, `Drawer`, `FileCard`, `Tabs`, `EmptyState`, `Skeleton`;
- у всех интерактивных компонентов обязательны stories: `Default`, `Hover`, `Focus`, `Disabled`;
- у form/data-компонентов обязательны stories: `Loading`, `Error`, `Empty`;
- адаптивные компоненты обязательно показывать в `Desktop` и `Mobile`;
- не создавать новые визуальные паттерны без необходимости: сначала reuse, потом domain-wrapper.

### 10.1. Формы, workflow и исполнение заявки

#### FORM-01 `TextareaField` [P0]

- Назначение: единое многострочное поле для описания проблемы, объема работ, комментариев, примечаний к работам и метрологическим операциям.
- Обязательные props: `label`, `value`, `placeholder`, `rows`, `maxLength`, `autoResize`, `hint`, `error`, `disabled`, `showCounter`.
- Состояния: `empty`, `filled`, `error`, `disabled`, `with counter`.
- Stories: `Default`, `AutoResize`, `WithCounter`, `ValidationError`, `Disabled`.
- Реализация: `apps/web/shared/ui/TextareaField.tsx`, stories в `apps/web/stories/primitives/TextareaField.stories.tsx`.

#### FORM-02 `AsyncEntityPicker` [P0]

- Назначение: поисковый выбор сущностей с асинхронной подгрузкой: договор, оборудование, подрядчик, исполнитель, дивизион.
- Обязательные props: `label`, `value`, `placeholder`, `items`, `loading`, `emptyText`, `onSearch`, `onSelect`, `renderOption`, `renderValue`, `disabled`.
- Состояния: `idle`, `searching`, `result list`, `empty result`, `selected`, `disabled`.
- Stories: `ContractPicker`, `DevicePicker`, `UserPicker`, `Searching`, `NoResults`, `LongOptionMeta`.

#### FORM-03 `MultiSelectField` [P0]

- Назначение: множественный выбор для фильтров по статусам, подрядчикам, дивизионам, типам оборудования, видам работ.
- Обязательные props: `label`, `value`, `options`, `placeholder`, `searchable`, `maxVisibleTags`, `clearable`, `disabled`.
- Состояния: `empty`, `selected few`, `selected many`, `searchable`, `disabled`.
- Stories: `Statuses`, `Contractors`, `ManySelected`, `Searchable`, `Disabled`.

#### FLOW-01 `RequestCreationWizard` [P0]

- Назначение: пошаговое создание заявки: договор -> оборудование -> тип/приоритет -> описание -> вложения -> проверка перед отправкой.
- Обязательные props: `steps`, `currentStep`, `values`, `validationState`, `canSubmit`, `summary`, `loading`, `onStepChange`, `onSubmit`, `onSaveDraft`.
- Состояния: `empty draft`, `partially filled`, `validation error`, `review step`, `submit loading`.
- Stories: `StartEmpty`, `WithValidationErrors`, `ReviewBeforeSubmit`, `SaveDraft`, `SubmitLoading`.
- Примечание: в ТЗ создание заявки включает выбор договора, оборудования, описание проблемы и загрузку вложений, а жизненный цикл начинается с черновика и согласования.

#### FLOW-02 `RequestWorkflowStepper` [P0]

- Назначение: визуализация жизненного цикла заявки и текущего этапа.
- Обязательные props: `items`, `currentStatus`, `timestamps`, `orientation`, `showDates`, `showBranching`, `complaintState`.
- Состояния: `draft`, `on approval`, `approved`, `in work`, `on signing`, `awaiting payment`, `completed`, `reclamation`.
- Stories: `HappyPath`, `OnApproval`, `InWork`, `Completed`, `ReclamationBranch`, `VerticalMobile`.
- Примечание: жизненный цикл заявки должен быть виден не только через badge статуса.

#### FLOW-03 `ApprovalActionBar` [P0]

- Назначение: панель доменных действий по этапу: согласовать, вернуть на доработку, отклонить, назначить исполнителя, перевести на подпись, подписать.
- Обязательные props: `availableActions`, `status`, `reasonRequired`, `loading`, `sticky`, `onAction`.
- Состояния: `approve available`, `reject with reason`, `sign available`, `readonly`, `loading`.
- Stories: `TechnicalLeadActions`, `ContractorHeadActions`, `CustomerSigningActions`, `WithReasonField`, `Loading`.
- Примечание: роли и маршрутизация различают согласование со стороны заказчика, назначение исполнителя подрядчиком и последующую подпись/оплату.

#### FLOW-04 `AssignmentPanel` [P0]

- Назначение: назначение исполнителя, плановых дат и ответственного подрядчика.
- Обязательные props: `assignee`, `organization`, `plannedStartDate`, `plannedEndDate`, `actualStartDate`, `actualEndDate`, `editable`, `loading`, `onAssign`.
- Состояния: `unassigned`, `partially assigned`, `fully assigned`, `read-only`, `overdue`.
- Stories: `Empty`, `Assigned`, `Readonly`, `WithActualDates`, `Overdue`.
- Примечание: в модели `requests` есть поля `assigned_to_id`, `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`.

#### FLOW-05 `DeadlineCountdownBadge` [P0]

- Назначение: компактная индикация срока: осталось N дней, сегодня дедлайн, просрочено, завершено вовремя.
- Обязательные props: `dueDate`, `completedAt`, `now`, `showIcon`, `toneMode`.
- Состояния: `future`, `today`, `due soon`, `overdue`, `completed`.
- Stories: `FiveDaysLeft`, `Today`, `Overdue`, `CompletedInTime`, `WithoutIcon`.

#### FLOW-06 `WorksEditorTable` [P0]

- Назначение: учет выполненных работ по заявке на базе `request_works`.
- Обязательные props: `rows`, `serviceTypeOptions`, `editable`, `totals`, `validation`, `loading`, `onAddRow`, `onChangeRow`, `onDeleteRow`.
- Состояния: `empty`, `with rows`, `validation errors`, `read-only`, `loading`.
- Stories: `Empty`, `Filled`, `ValidationErrors`, `Readonly`, `WithTotals`.
- Примечание: в модели данных есть отдельная сущность выполненных работ с видом услуги, количеством и примечанием.

#### FLOW-07 `MaterialsEditorTable` [P0]

- Назначение: учет использованных материалов и запчастей по заявке на базе `request_materials`.
- Обязательные props: `rows`, `materialOptions`, `editable`, `totals`, `validation`, `loading`, `onAddRow`, `onChangeRow`, `onDeleteRow`.
- Состояния: `empty`, `with rows`, `with custom price`, `validation errors`, `read-only`.
- Stories: `Empty`, `Filled`, `WithActualPrice`, `ValidationErrors`, `Readonly`.
- Примечание: в модели данных предусмотрены материалы, количество и фактическая цена, если она отличается от справочной.

#### FLOW-08 `CostSummaryPanel` [P0]

- Назначение: итоговый блок по стоимости заявки: работы, материалы, subtotal, НДС, total, статус закрывающих документов.
- Обязательные props: `workItems`, `materialItems`, `subtotal`, `vat`, `total`, `documentState`, `currency`, `loading`.
- Состояния: `no items`, `draft estimate`, `final cost`, `missing documents`, `loading`.
- Stories: `Empty`, `DraftEstimate`, `FinalCost`, `MissingFinancialDocs`, `Loading`.

#### FLOW-09 `RequiredDocumentsChecklist` [P0]

- Назначение: checklist обязательных документов по текущему этапу заявки.
- Обязательные props: `requirements`, `documents`, `blocking`, `canUpload`, `showSignStatus`, `onUpload`.
- Состояния: `all complete`, `partially complete`, `none uploaded`, `signed/incomplete`, `read-only`.
- Stories: `RepairChecklist`, `MetrologyChecklist`, `Complete`, `Incomplete`, `Readonly`.
- Примечание: отдельно перечислены дефектная ведомость, ТАВР, финансовые документы и свидетельство о поверке/калибровке.

### 10.2. Платформенные состояния, доступ и системная обратная связь

#### STATE-01 `AccessDeniedState` [P0]

- Назначение: единый `403 / No access` state для страниц, вкладок и действий, закрытых по ролям.
- Обязательные props: `title`, `description`, `action`, `compact`, `illustration`.
- Состояния: `full page`, `inline section`, `with back action`.
- Stories: `Page403`, `InlineTabDenied`, `WithBackAction`.

#### STATE-02 `ConfirmDialog` [P0]

- Назначение: подтверждение критических действий: отклонение, удаление файла, перевод статуса, отправка на подпись, завершение заявки.
- Обязательные props: `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone`, `reasonField`, `loading`, `onConfirm`, `onCancel`.
- Состояния: `standard confirm`, `destructive confirm`, `with required reason`, `loading`.
- Stories: `Standard`, `Destructive`, `WithReason`, `Loading`.
- Реализация: `apps/web/shared/ui/Dialog.tsx`, stories в `apps/web/stories/primitives/ConfirmDialog.stories.tsx`.

#### STATE-03 `ToastCenter` / `Toast` [P0]

- Назначение: краткая обратная связь по операциям: сохранено, файл загружен, ЭП проверена, экспорт готов, ошибка сервера.
- Обязательные props: `items`, `duration`, `placement`, `action`, `dismissible`.
- Состояния: `success`, `info`, `warning`, `error`, `timer progress`, `stacked toasts`.
- Stories: `Success`, `Warning`, `Error`, `WithAction`, `TimerProgress`, `Stacked`, `WithStickyHeaderOffset`.
- Реализация: `apps/web/shared/ui/Toast.tsx`, stories в `apps/web/stories/primitives/Toast.stories.tsx`.

#### STATE-04 `InlineAlert` / `FormAlert` [P0]

- Назначение: inline-предупреждения и ошибки в карточках, формах и документах.
- Обязательные props: `tone`, `title`, `description`, `icon`, `action`, `dismissible`.
- Состояния: `info`, `warning`, `error`, `success`, `with action`.
- Stories: `Info`, `Warning`, `Error`, `Success`, `WithAction`.
- Реализация: `apps/web/shared/ui/InlineAlert.tsx`, stories в `apps/web/stories/primitives/InlineAlert.stories.tsx`.

#### STATE-05 `SessionExpiredDialog` [P1]

- Назначение: уведомление об истечении JWT-сессии и безопасный возврат к логину.
- Обязательные props: `open`, `reason`, `countdown`, `loading`, `onRelogin`, `onDismiss`.
- Состояния: `session expiring soon`, `expired`, `relogin loading`.
- Stories: `ExpiringSoon`, `Expired`, `ReloginLoading`.
- Примечание: в ТЗ явно указаны JWT-сессии и повышенные требования к безопасности.

### 10.3. Документы, версии, ЭП и медиа

#### DOCX-01 `DocumentPreviewDrawer` [P0]

- Назначение: просмотр документа без ухода со страницы заявки.
- Обязательные props: `open`, `document`, `mode`, `loading`, `error`, `actions`, `relatedVersions`, `onClose`.
- Состояния: `pdf preview`, `image preview`, `unsupported file`, `loading`, `error`.
- Stories: `PdfDocument`, `ImageDocument`, `UnsupportedType`, `Loading`, `Error`.

#### DOCX-02 `DocumentVersionHistory` [P0]

- Назначение: история версий документа с указанием, кто и когда загрузил/заменил файл.
- Обязательные props: `versions`, `currentVersionId`, `loading`, `compareAction`, `downloadAction`, `canRestore`.
- Состояния: `single version`, `multiple versions`, `signed chain`, `loading`, `empty`.
- Stories: `SingleVersion`, `MultipleVersions`, `SignedVersions`, `Loading`, `Empty`.
- Примечание: требуется хранение всех версий документов, привязанных к заявке.

#### DOCX-03 `SignatureVerificationPanel` [P0]

- Назначение: расширенная панель проверки электронной подписи документа.
- Обязательные props: `status`, `signer`, `signedAt`, `certificateInfo`, `provider`, `errors`, `metadata`, `actions`.
- Состояния: `valid`, `invalid`, `pending verification`, `unavailable metadata`.
- Stories: `ValidSignature`, `InvalidSignature`, `PendingVerification`, `CertificateDetails`.
- Примечание: отдельно выделены визуализация подписанных документов и проверка корректности ЭП.

#### MEDIA-01 `ImageLightboxGallery` [P1]

- Назначение: просмотр фотофиксации и графических вложений в полноэкранном режиме.
- Обязательные props: `items`, `initialIndex`, `open`, `showMeta`, `downloadAction`, `onClose`.
- Состояния: `single image`, `gallery`, `broken image`, `with metadata`.
- Stories: `SinglePhoto`, `Gallery`, `BrokenImage`, `WithMetadata`.

### 10.4. Оборудование, метрология и договоры

#### EQP-01 `DevicePassportCard` [P1]

- Назначение: паспорт единицы оборудования с ключевыми атрибутами и быстрыми действиями.
- Обязательные props: `device`, `manufacturer`, `classification`, `type`, `branch`, `status`, `actions`.
- Состояния: `active`, `in service`, `decommissioned`, `metrological device`.
- Stories: `StandardDevice`, `InService`, `Decommissioned`, `MetrologicalDevice`.

#### EQP-02 `MetrologyStatusCard` [P1]

- Назначение: сводка по метрологическому состоянию средства измерения.
- Обязательные props: `registrationNumber`, `hasReferenceStandard`, `lastOperation`, `nextDueDate`, `status`, `documentLink`.
- Состояния: `valid`, `due soon`, `overdue`, `not configured`.
- Stories: `Valid`, `DueSoon`, `Overdue`, `NotConfigured`.

#### EQP-03 `CalibrationCountdownCard` [P1]

- Назначение: карточка-напоминание о следующей поверке/калибровке.
- Обязательные props: `nextDate`, `thresholds`, `now`, `assignee`, `actions`.
- Состояния: `30 days left`, `14 days left`, `7 days left`, `overdue`, `completed`.
- Stories: `ThirtyDays`, `FourteenDays`, `SevenDays`, `Overdue`, `Completed`.
- Примечание: в ТЗ прописаны напоминания за 30, 14 и 7 дней.

#### EQP-04 `MeasurementOperationLog` [P1]

- Назначение: журнал метрологических операций по конкретному средству измерения.
- Обязательные props: `rows`, `filters`, `loading`, `empty`, `documentActions`, `onFilterChange`.
- Состояния: `mixed operations`, `filtered`, `empty`, `loading`.
- Stories: `Default`, `FilteredByOperation`, `Empty`, `Loading`.

#### EQP-05 `ReferenceStandardCard` [P1]

- Назначение: карточка установочной меры/эталона, связанной со средством измерения.
- Обязательные props: `model`, `serialNumber`, `certificateNumber`, `calibrationDate`, `nextCalibrationDate`, `document`, `status`.
- Состояния: `valid`, `due soon`, `overdue`, `missing certificate`.
- Stories: `Valid`, `DueSoon`, `Overdue`, `MissingCertificate`.

#### CTR-01 `ContractDevicesMatrix` [P1]

- Назначение: таблица связи «договор <-> оборудование» с интервалом и датами обслуживания.
- Обязательные props: `contract`, `rows`, `filters`, `pagination`, `loading`, `onRowClick`.
- Состояния: `with devices`, `empty`, `next service due`, `loading`.
- Stories: `Default`, `NextServiceDue`, `Empty`, `Loading`.

#### CTR-02 `ServiceScheduleTable` [P1]

- Назначение: график планового обслуживания по договору и оборудованию.
- Обязательные props: `rows`, `loading`, `empty`, `onRowClick`, `statusFilter`.
- Состояния: `upcoming`, `mixed completed`, `all completed`, `empty`.
- Stories: `Upcoming`, `MixedStatuses`, `AllCompleted`, `Empty`.

#### CTR-03 `ContractValidityBanner` [P1]

- Назначение: компактный indicator статуса договора: активен, истекает, завершен, неактивен.
- Обязательные props: `contractNumber`, `startDate`, `endDate`, `isActive`, `showAction`.
- Состояния: `active`, `expiring soon`, `expired`, `inactive`.
- Stories: `Active`, `ExpiringSoon`, `Expired`, `Inactive`.

### 10.5. Аудит, отчеты и фоновые операции

#### AUD-01 `AuditDiffViewer` [P1]

- Назначение: просмотр изменений «было / стало» на основе `old_values` и `new_values`.
- Обязательные props: `oldValues`, `newValues`, `entityType`, `entityId`, `collapsedKeys`, `showRawJson`.
- Состояния: `simple field diff`, `grouped diff`, `nested JSON diff`, `no changed fields`.
- Stories: `StatusChange`, `RequestEdit`, `NestedJson`, `NoChanges`.

#### REP-01 `ReportPresetCatalog` [P1]

- Назначение: каталог предустановленных отчетов с описанием и быстрым запуском.
- Обязательные props: `items`, `selectedId`, `categoryFilter`, `preview`, `onSelect`.
- Состояния: `grid`, `selected`, `empty`, `loading`.
- Stories: `Default`, `SelectedPreset`, `Empty`, `Loading`.

#### REP-02 `DatePresetPicker` [P1]

- Назначение: пресеты периода для дашбордов и отчетов.
- Обязательные props: `value`, `customRange`, `allowFuture`, `size`, `onChange`.
- Состояния: `today`, `week`, `month`, `quarter`, `year`, `custom range`.
- Stories: `Today`, `ThisWeek`, `ThisMonth`, `Quarter`, `CustomRange`.

#### REP-03 `ExportJobStatusPanel` [P1]

- Назначение: панель статусов формирования экспортов и фоновых задач.
- Обязательные props: `jobs`, `filters`, `loading`, `retryAction`, `downloadAction`.
- Состояния: `queued`, `running`, `completed`, `failed`, `empty`.
- Stories: `Queued`, `Running`, `Completed`, `Failed`, `Empty`.
- Примечание: асинхронные статусы лучше вынести в отдельный reusable-pattern.

### 10.6. PWA, офлайн, интеграции и платежные сценарии

#### PWA-01 `PushPermissionBanner` [P2]

- Назначение: запрос разрешения на browser push с объяснением пользы уведомлений.
- Обязательные props: `permission`, `title`, `description`, `onRequest`, `onDismiss`.
- Состояния: `default`, `denied`, `granted`, `dismissed`.
- Stories: `Default`, `Denied`, `Granted`, `Dismissed`.

#### PWA-02 `PhotoCaptureField` [P2]

- Назначение: mobile-friendly поле для фотофиксации через камеру или загрузку снимков.
- Обязательные props: `value`, `multiple`, `captureMode`, `accept`, `uploadState`, `onCapture`, `onRemove`.
- Состояния: `empty`, `capturing`, `uploaded`, `upload error`, `multiple photos`.
- Stories: `Default`, `Capturing`, `Uploaded`, `UploadError`, `MultiplePhotos`.

#### PWA-03 `OfflineBanner` [P2]

- Назначение: общий banner о потере сети или ограниченном режиме работы.
- Обязательные props: `isOnline`, `pendingCount`, `description`, `showRetry`, `onRetry`.
- Состояния: `online hidden`, `offline`, `reconnecting`, `pending sync`.
- Stories: `Offline`, `Reconnecting`, `PendingSync`, `RetryAvailable`.

#### PWA-04 `SyncStatusIndicator` [P2]

- Назначение: статус синхронизации локальных черновиков, файлов и очередей.
- Обязательные props: `state`, `pendingDrafts`, `pendingUploads`, `lastSyncAt`, `showDetails`.
- Состояния: `synced`, `pending`, `syncing`, `failed`.
- Stories: `Synced`, `PendingDrafts`, `Syncing`, `Failed`.

#### INT-01 `IntegrationStatusCard` [P2]

- Назначение: карточка состояния интеграции с внешней системой.
- Обязательные props: `systemName`, `status`, `lastSyncAt`, `errorText`, `actions`.
- Состояния: `connected`, `degraded`, `failed`, `disabled`.
- Stories: `OneCConnected`, `BitrixFailed`, `Disabled`, `WithAction`.

#### INT-02 `SyncHistoryTable` [P2]

- Назначение: история обменов с внешними системами и ошибок синхронизации.
- Обязательные props: `rows`, `filters`, `loading`, `empty`, `onRetry`, `onOpenPayload`.
- Состояния: `success history`, `failed rows`, `empty`, `loading`.
- Stories: `Default`, `WithErrors`, `Empty`, `Loading`.

#### BILL-01 `TrialActivationModal` [P2]

- Назначение: модалка активации пробного периода при регистрации.
- Обязательные props: `open`, `trialDays`, `provider`, `cardRequired`, `loading`, `onConfirm`, `onClose`.
- Состояния: `default`, `loading`, `error from provider`, `success handoff`.
- Stories: `Default`, `Loading`, `ProviderError`, `SuccessRedirect`.

#### BILL-02 `TariffCard` [P2]

- Назначение: карточка тарифа для страницы лицензий/подписок.
- Обязательные props: `name`, `price`, `billingPeriod`, `features`, `isRecommended`, `cta`, `footnote`.
- Состояния: `standard`, `recommended`, `disabled`, `enterprise contact sales`.
- Stories: `StandardPlan`, `RecommendedPlan`, `Disabled`, `EnterprisePlan`.

### 10.7. Компоненты только на случай переноса части админки из Django Admin в React

#### ADM-01 `PermissionMatrix` [P2]

- Назначение: матрица ролей и прав по модулям системы.
- Обязательные props: `roles`, `permissions`, `values`, `readOnly`, `loading`, `onChange`.
- Состояния: `editable`, `read-only`, `loading`, `grouped by module`.
- Stories: `Editable`, `Readonly`, `Loading`, `GroupedByModule`.

#### ADM-02 `DictionaryEditorTable` [P2]

- Назначение: табличный CRUD-редактор справочников: классификации, виды работ, материалы, производители.
- Обязательные props: `dictionaryType`, `columns`, `rows`, `loading`, `empty`, `inlineEdit`, `onCreate`, `onDelete`.
- Состояния: `empty`, `inline edit`, `loading`, `validation error`.
- Stories: `Materials`, `ServiceTypes`, `InlineEdit`, `ValidationError`.

#### ADM-03 `NotificationTemplateEditor` [P2]

- Назначение: редактор шаблонов уведомлений с превью и подстановкой переменных.
- Обязательные props: `channel`, `template`, `variables`, `previewData`, `validation`, `onChange`, `onPreview`.
- Состояния: `email template`, `system template`, `validation error`, `preview mode`.
- Stories: `EmailTemplate`, `SystemTemplate`, `ValidationError`, `Preview`.

#### ADM-04 `GlobalAuditLogViewer` [P2]

- Назначение: глобальный центр аудита действий всех пользователей.
- Обязательные props: `rows`, `filters`, `pagination`, `loading`, `exportAction`, `onRowClick`.
- Состояния: `default`, `filtered`, `empty`, `loading`.
- Stories: `Default`, `FilteredByAction`, `Empty`, `Loading`.

## 12. Showcase stories

Это уже не атомы, а сборочные истории, чтобы агент мог показать цельную страницу из готовых компонентов.

### SHOW-01 DashboardPage.Showcase [P0]

Собирает: `AppShell`, `TopBar`, `SidebarNav`, `PageHeader`, `KpiStatCard`, `DataTable`, `DashboardLineChartCard`, `SummaryPanel`.

### SHOW-02 RequestsPage.Showcase [P0]

Собирает: `AppShell`, `PageHeader`, `RequestFiltersPanel`, `RequestList`, `Pagination`.

### SHOW-03 RequestDetailsPage.Showcase [P0]

Собирает: `AppShell`, `Breadcrumbs`, `RequestDetailsHeader`, `Tabs`, `EquipmentTable`, `DocumentList`, `CommentThread`, `AuditTimeline`.

### SHOW-04 MessengerPage.Showcase [P0]

Собирает: `AppShell`, `ChatListItem`, `ConversationHeader`, `MessageBubble`, `MessageComposer`.

### SHOW-05 NotificationsPopover.Showcase [P0]

Собирает: `NotificationBell`, `NotificationPopover`, `NotificationItem`.

### SHOW-06 NotificationsMobile.Showcase [P0]

Собирает: `NotificationMobileSheet`, `NotificationItem`.

### SHOW-07 AuthPage.Showcase [P0]

Собирает: `AuthSplitLayout`, `LoginForm`, `ConsentRow`.

### SHOW-08 EquipmentRegistry.Showcase [P1]

Собирает: `RegistryPageTemplate`, `DataTable`, `EquipmentHistoryTimeline`.

### SHOW-09 ContractsRegistry.Showcase [P1]

Собирает: `RegistryPageTemplate`, `ContractCard`.

### SHOW-10 ReportsPage.Showcase [P1]

Собирает: `RegistryPageTemplate`, `ReportFiltersPanel`, `ExportActions`, `DashboardLineChartCard`.

## 13. Что не делать отдельными компонентами

Чтобы агент не раздул библиотеку:

- `SearchInput` — это `InputField` с `type="search"`.
- `PasswordInput` — это `InputField` с `type="password"`.
- `RequestStatusBadge` — доменная обертка над `Badge`, а не отдельный визуальный паттерн с нуля.
- `RequestProgressBadge` — доменная обертка над `CircularProgress`.
- Мини-график в KPI — внутренняя часть `KpiStatCard`, не отдельный публичный компонент.
- Прикрепленный файл в чате — `FileCard` в `compact`-режиме.
- `EquipmentTable` лучше строить на `DataTable`, а не писать вторую таблицу с нуля.
- `Django Admin` не включать в Storybook продукта: в ТЗ это отдельный интерфейс.
- `WorksEditorTable` и `MaterialsEditorTable` строить на базе единого табличного ядра, а не писать две независимые таблицы.
- `DocumentPreviewDrawer`, `ImageLightboxGallery` и `FileCard` должны использовать единый файловый доменный слой.
- `MetrologyStatusCard`, `CalibrationCountdownCard` и `ContractValidityBanner` — это доменные обертки над общими `status/badge/panel` recipes.
- `AuditDiffViewer` не должен становиться новым JSON-редактором; это human-readable viewer поверх audit log.
- `RequestCreationWizard` не должен вшивать уникальные визуальные стили; шаги собираются из тех же field-компонентов и карточек.

## 14. Очередность реализации

### Волна 1

`TokenDocs`, `IconGallery`, весь базовый UI, `AppShell`, `SidebarNav`, `TopBar`, `PageHeader`, `RequestStatusBadge`, `RequestFiltersPanel`, `RequestListItem`, `RequestList`, `AuthSplitLayout`, `LoginForm`, `ConsentRow`.

### Волна 2

`DataTable`, `KpiStatCard`, `DashboardLineChartCard`, `SummaryPanel`, `RequestDetailsHeader`, `EquipmentTable`, `CommentThread`, `AuditTimeline`, `FileCard`, `DocumentCard`, `DocumentList`.

### Волна 3

Весь мессенджер, уведомления, `RegisterForm`, `TwoFactorForm`, шаблоны реестров/отчетов, `SignatureStamp`.

### Runtime sync 2026-04-29

`PlatformAdminInviteForm`, `FirstAdminActivationForm`, `CompanyStructureWorkspace`, `EmployeeInviteManager`, `ContractsRegistry`, `EquipmentRegistryWorkspace`, Storybook-only runtime fixtures и mock API.

### Дополнение: Волна 1

`TextareaField`, `AsyncEntityPicker`, `MultiSelectField`, `RequestCreationWizard`, `RequestWorkflowStepper`, `ApprovalActionBar`, `AssignmentPanel`, `WorksEditorTable`, `MaterialsEditorTable`, `RequiredDocumentsChecklist`, `DocumentPreviewDrawer`, `DocumentVersionHistory`, `SignatureVerificationPanel`, `ConfirmDialog`, `ToastCenter`, `InlineAlert`, `AccessDeniedState`.

### Дополнение: Волна 2

`DeadlineCountdownBadge`, `CostSummaryPanel`, `DevicePassportCard`, `MetrologyStatusCard`, `CalibrationCountdownCard`, `MeasurementOperationLog`, `ReferenceStandardCard`, `ContractDevicesMatrix`, `ServiceScheduleTable`, `ContractValidityBanner`, `AuditDiffViewer`, `ReportPresetCatalog`, `DatePresetPicker`, `ExportJobStatusPanel`, `SessionExpiredDialog`, `ImageLightboxGallery`.

### Дополнение: Волна 3

все `PWA-*`, все `INT-*`, `TrialActivationModal`, `TariffCard`, все `ADM-*`.
