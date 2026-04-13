import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  CalendarClock,
  CircleCheckBig,
  CircleDashed,
  CircleDollarSign,
  CreditCard,
  FileClock,
  FileCheck2,
  FileSpreadsheet,
  FolderOpen,
  House,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRoundCog,
  WalletCards,
  Wrench,
} from "lucide-react";

export const REQUEST_STATUSES = [
  { value: "draft", label: "Черновик", tone: "neutral" as const },
  { value: "on-approval", label: "На согласовании", tone: "interactive" as const },
  { value: "approved", label: "Согласована", tone: "success" as const },
  { value: "in-work", label: "В работе", tone: "info" as const },
  { value: "on-signing", label: "На подписи", tone: "violet" as const },
  { value: "awaiting-payment", label: "Ожидает оплаты", tone: "warning" as const },
  { value: "completed", label: "Завершена", tone: "success" as const },
  { value: "reclamation", label: "Рекламация", tone: "danger" as const },
] as const;

export const REQUEST_TYPES = [
  "Ремонт",
  "Техническое обслуживание",
  "Метрологическое обслуживание",
  "Аварийный выезд",
] as const;

export const REQUEST_PRIORITIES = ["Обычный", "Высокий", "Критический"] as const;

export const DOCUMENT_TYPES = [
  "Дефектная ведомость",
  "ТАВР",
  "Финансовый акт",
  "Счет",
  "Свидетельство",
  "Фото",
] as const;

export const USER_ROLES = [
  "Администратор",
  "Техрук",
  "Мастер / метролог",
  "Руководитель сервисной службы",
  "Инженер",
  "Бухгалтер",
] as const;

export const MOCK_REQUESTS = [
  {
    requestNumber: "VRK-24018",
    title: "Поверка расходомера цеха подготовки",
    enterprise: "ВРК Север",
    contractor: "ТехСервис Метролоджик",
    status: "on-signing",
    priority: "Высокий",
  },
  {
    requestNumber: "VRK-24021",
    title: "Внеплановый ремонт стенда тормозной магистрали",
    enterprise: "ВРК Юг",
    contractor: "РемЛиния-24",
    status: "in-work",
    priority: "Критический",
  },
] as const;

export type ShellNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type ShellUser = {
  name: string;
  role: string;
  initials: string;
};

export type BreadcrumbFixture = {
  label: string;
  href?: string;
};

export type RequestListRecord = {
  requestNumber: string;
  createdAt: string;
  title: string;
  enterprise: string;
  contractor: string;
  contract: string;
  sum: number;
  status: (typeof REQUEST_STATUSES)[number]["value"];
  progressPercent: number;
  selected?: boolean;
  note?: string;
};

export const SHELL_NAV_ITEMS: ShellNavItem[] = [
  { key: "dashboard", label: "Сводка", href: "#dashboard", icon: LayoutGrid },
  { key: "requests", label: "Заявки", href: "#requests", icon: Sparkles, badge: "18" },
  { key: "documents", label: "Документы", href: "#documents", icon: FolderOpen },
  { key: "payments", label: "Оплаты", href: "#payments", icon: WalletCards },
  { key: "messages", label: "Сообщения", href: "#messages", icon: MessageSquareText, badge: "3" },
];

export const SHELL_FOOTER_ITEMS: ShellNavItem[] = [
  { key: "billing", label: "Реквизиты", href: "#billing", icon: CreditCard },
  { key: "support", label: "Поддержка", href: "#support", icon: ShieldCheck },
  { key: "logout", label: "Завершить смену", href: "#logout", icon: LogOut },
];

export const SHELL_USER: ShellUser = {
  name: "Екатерина Носкова",
  role: "Диспетчер сервисного контура",
  initials: "ЕН",
};

export const REQUEST_BREADCRUMBS: BreadcrumbFixture[] = [
  { label: "Главная", href: "#dashboard" },
  { label: "Заявки", href: "#requests" },
  { label: "Оперативный список" },
];

export const DASHBOARD_BREADCRUMBS: BreadcrumbFixture[] = [
  { label: "Главная", href: "#dashboard" },
  { label: "Сводка" },
];

export const REQUEST_LIST_ITEMS: RequestListRecord[] = [
  {
    requestNumber: "VRK-24018",
    createdAt: "12 апр 2026, 09:20",
    title: "Поверка расходомера цеха подготовки",
    enterprise: "ВРК Север",
    contractor: "ТехСервис Метролоджик",
    contract: "Договор №14/24-М",
    sum: 184000,
    status: "on-signing",
    progressPercent: 82,
    note: "Ожидает подпись подрядчика",
  },
  {
    requestNumber: "VRK-24021",
    createdAt: "12 апр 2026, 08:42",
    title: "Внеплановый ремонт стенда тормозной магистрали",
    enterprise: "ВРК Юг",
    contractor: "РемЛиния-24",
    contract: "Рамочный договор №91-ТО",
    sum: 296500,
    status: "in-work",
    progressPercent: 56,
    selected: true,
    note: "2 комментария в заявке",
  },
  {
    requestNumber: "VRK-23997",
    createdAt: "11 апр 2026, 17:14",
    title: "Согласование акта по ревизии осушителя воздуха компрессорной станции №2",
    enterprise: "ВРК Центр с очень длинным названием промышленной площадки",
    contractor: "ПромСервис Контроль и Диагностика",
    contract: "Договор №88/25-С",
    sum: 74800,
    status: "awaiting-payment",
    progressPercent: 100,
  },
  {
    requestNumber: "VRK-23971",
    createdAt: "10 апр 2026, 12:06",
    title: "Плановое метрологическое обслуживание весового терминала",
    enterprise: "ВРК Запад",
    contractor: "ЛабКонтур",
    contract: "Договор №52/25-М",
    sum: 123400,
    status: "completed",
    progressPercent: 100,
    note: "Акт подписан",
  },
];

export const REQUEST_FILTER_CHIPS = [
  { label: "На подписи", icon: FileClock },
  { label: "Только срочные", icon: BadgeCheck },
  { label: "Оплата сегодня", icon: CircleDollarSign },
  { label: "Контракт 91-ТО", icon: Receipt },
];

export type IconSection = {
  title: string;
  items: {
    name: string;
    icon: LucideIcon;
  }[];
};

export const ICON_SECTIONS: IconSection[] = [
  {
    title: "Навигация",
    items: [
      { name: "dashboard", icon: House },
      { name: "requests", icon: Sparkles },
      { name: "messages", icon: MessageSquareText },
      { name: "notifications", icon: Bell },
    ],
  },
  {
    title: "Действия",
    items: [
      { name: "assign", icon: UserRoundCog },
      { name: "service", icon: Wrench },
      { name: "schedule", icon: CalendarClock },
      { name: "confirm", icon: CircleCheckBig },
    ],
  },
  {
    title: "Документы и файлы",
    items: [
      { name: "invoice", icon: ReceiptText },
      { name: "report", icon: FileSpreadsheet },
      { name: "certificate", icon: FileCheck2 },
      { name: "folder", icon: FolderOpen },
    ],
  },
  {
    title: "Статусы",
    items: [
      { name: "approved", icon: ShieldCheck },
      { name: "pending", icon: CircleDashed },
      { name: "warning", icon: TriangleAlert },
      { name: "done", icon: CircleCheckBig },
    ],
  },
];
