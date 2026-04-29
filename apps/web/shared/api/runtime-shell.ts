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
      "Рабочие данные доступны после входа.",
      "Договоры доступны заказчику и привязанному подрядчику.",
      "Данные организации не показываются без доступа.",
    ],
  } as const;
}

export const companyShell = {
  stageLabel: "Company onboarding / profile",
  summary:
    "Войдите по приглашению, чтобы открыть профиль организации, структуру и доступы.",
  steps: [
    {
      title: "Профиль компании",
      detail: "Реквизиты и контактные лица доступны после входа.",
      status: "Открытый обзор",
    },
    {
      title: "Подразделения и юниты",
      detail: "Рабочая структура отображается согласно выданному доступу.",
      status: "По правам доступа",
    },
    {
      title: "Доступ сотрудников",
      detail: "Роль и область доступа задаются в приглашении.",
      status: "Доступ включен",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Открытый просмотр",
      detail: "Данные организации скрыты до входа.",
      tone: "interactive",
    },
    {
      label: "Ограниченная область",
      detail: "Пользователь видит только назначенную часть структуры.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;

export const equipmentShell = {
  summary:
    "Войдите, чтобы открыть рабочие реестры оборудования, средств измерения и эталонов.",
  steps: [
    {
      title: "Добавить вручную",
      detail: "Создание доступно пользователям с правом управления реестром.",
      status: "После входа",
    },
    {
      title: "Импорт реестра",
      detail: "Файловая загрузка подготавливается отдельно.",
      status: "Не подключен",
    },
    {
      title: "Привязка к структуре",
      detail: "Записи закрепляются за подразделениями и юнитами.",
      status: "По структуре",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Для заявок",
      detail: "Заполненный реестр используется при оформлении заявок.",
      tone: "warning",
    },
    {
      label: "Справочники",
      detail: "Категории и статусы выбираются из рабочих справочников.",
      tone: "info",
    },
  ] satisfies BoundaryNote[],
} as const;

export const contractsShell = {
  summary:
    "Войдите, чтобы открыть договоры и привязку подрядчиков.",
  steps: [
    {
      title: "Карточка договора",
      detail: "Договор фиксирует подрядчика, работы, сроки и область действия.",
      status: "Основа маршрута",
    },
    {
      title: "Подрядчик",
      detail: "Доступ подрядчика ограничен привязанными договорами.",
      status: "По договору",
    },
    {
      title: "Связь с заявками",
      detail: "Подходящий договор определяет исполнителя заявки.",
      status: "Для заявок",
    },
  ] satisfies ShellStep[],
  boundaries: [
    {
      label: "Единый раздел",
      detail: "Заказчик управляет договорами, подрядчик видит назначенные ему записи.",
      tone: "interactive",
    },
    {
      label: "Доступ подрядчика",
      detail: "Внутренняя структура заказчика подрядчику не показывается.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;

export const requestsShell = {
  summary:
    "Раздел заявок временно недоступен.",
  prerequisites: [
    "Проверьте профиль компании",
    "Заполните реестр оборудования",
    "Подготовьте договоры с подрядчиками",
  ],
  boundaries: [
    {
      label: "Заявки недоступны",
      detail: "Создание и сопровождение заявок еще не открыты.",
      tone: "warning",
    },
  ] satisfies BoundaryNote[],
} as const;
