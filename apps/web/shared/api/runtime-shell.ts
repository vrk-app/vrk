import { getPublicEnv } from "@/shared/config/env";

export type BoundaryTone = "interactive" | "warning" | "info";

export type BoundaryNote = {
  label: string;
  detail: string;
  tone: BoundaryTone;
};

export type ShellStep = {
  title: string;
  detail: string;
  status: string;
};

export function getRuntimeBootstrap() {
  const publicEnv = getPublicEnv();

  return {
    apiBaseUrl: publicEnv.apiBaseUrl,
    runtimeDataMode: publicEnv.runtimeDataMode,
    resources: {
      organizations: "/api/v1/organizations",
      equipment: "/api/v1/equipment",
      contracts: "/api/v1/agreements",
    },
    notes: [
      "Вход и регистрация пока не подключены к backend auth/session contract.",
      "Публичный web contour использует contracts naming, а backend resource пока остается agreements.",
      "Route shells могут показывать seeded или stubbed state, но не должны выдавать persisted CRUD за готовый Stage 03 behavior.",
    ],
  } as const;
}

export const companyShell = {
  stageLabel: "Company onboarding / profile",
  summary:
    "Контур собирает базовые реквизиты компании и подразделения, но еще не создает persisted org/subdivision/unit model.",
  steps: [
    {
      title: "Профиль компании",
      detail: "Юрлицо, ИНН и контактные данные собираются как shell-форма для будущего Stage 03 сохранения.",
      status: "Shell-only",
    },
    {
      title: "Подразделение и площадка",
      detail: "Рабочая площадка уже видна в UX как обязательный следующий шаг, но storage еще не активирован.",
      status: "Stub boundary",
    },
    {
      title: "Доступ и согласование",
      detail: "Следы аудита и роль доступа пока описаны как bootstrap boundary без live auth flow.",
      status: "Stage 03 later",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Seed-read ready",
      detail: "Backend organizations resource можно использовать только как будущую boundary reference, не как live onboarding submit.",
      tone: "interactive",
    },
    {
      label: "No persisted submit",
      detail: "Кнопка завершения онбординга в этом slice фиксирует только следующий шаг и не выполняет сохранение.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;

export const equipmentShell = {
  summary:
    "Экран показывает пустой registry contour с точками входа для ручного добавления и импорта, но без live CRUD и без реальной привязки к subdivision/unit.",
  steps: [
    {
      title: "Добавить вручную",
      detail: "Форма и статусный copy готовы как route shell, но submit будет подключен позже.",
      status: "Disabled entry point",
    },
    {
      title: "Импорт реестра",
      detail: "Импорт из файла обозначен как отдельный вход в процесс без загрузки и парсинга в этом slice.",
      status: "Placeholder",
    },
    {
      title: "Привязка к подразделению",
      detail: "Пользователь уже видит, что оборудование живет внутри company contour, но без persisted subdivision/unit model.",
      status: "Truthful dependency",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Request precondition",
      detail: "Requests остаются gated до тех пор, пока equipment contour не станет live в Stage 04 поверх Stage 03 master data.",
      tone: "warning",
    },
    {
      label: "Seed-backed vocabulary",
      detail: "Названия категорий и статусов можно выровнять по seed/openapi, но не включать реальный mutate path.",
      tone: "info",
    },
  ] satisfies BoundaryNote[],
} as const;

export const contractsShell = {
  summary:
    "Контур показывает подготовку договора и приглашения подрядчика как product-shaped shell, но без persisted contractor invitation state machine.",
  steps: [
    {
      title: "Карточка договора",
      detail: "Публичный web contour называет этот раздел contracts, даже если backend resource пока называется agreements.",
      status: "Normalized in web",
    },
    {
      title: "Подрядчик",
      detail: "Поиск и приглашение подрядчика показаны как следующий шаг без live invitation workflow.",
      status: "Stub boundary",
    },
    {
      title: "Связь с requests",
      detail: "Договор фиксируется как обязательный prerequisite для будущего request contour.",
      status: "Stage 04 gate",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Agreements adapter",
      detail: "Shared API boundary прячет backend agreements naming от public runtime route /contracts.",
      tone: "interactive",
    },
    {
      label: "No contractor activation",
      detail: "Статусы приглашения и activation остаются вне этого slice.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;

export const requestsShell = {
  summary:
    "Контур requests существует только как truthful gated placeholder и ссылается на company, equipment и contracts как на необходимые prerequisites.",
  prerequisites: [
    "Компания и площадка должны пройти onboarding shell",
    "Оборудование должно появиться в live реестре Stage 03/04",
    "Договор и подрядчик должны быть активированы позднее",
  ],
  boundaries: [
    {
      label: "Stage 04",
      detail: "Создание и просмотр заявок специально не включаются в Stage 02 route shell.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;
