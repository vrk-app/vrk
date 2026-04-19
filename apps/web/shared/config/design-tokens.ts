export type ColorToken = {
  name: string;
  value: string;
  usage: string;
};

export type TypographyToken = {
  name: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing?: string;
  usage: string;
};

export type TokenGroup<T> = {
  title: string;
  description: string;
  items: T[];
};

export const COLOR_TOKEN_GROUPS: TokenGroup<ColorToken>[] = [
  {
    title: "Primary и интерактив",
    description: "Темный primary CTA и отдельный синий контур для интерактивных состояний.",
    items: [
      { name: "primary", value: "hsl(var(--primary))", usage: "Главные кнопки и сильные действия" },
      { name: "primary-hover", value: "hsl(var(--primary-hover))", usage: "Hover и pressed для primary" },
      { name: "interactive", value: "hsl(var(--accent))", usage: "Tabs, links, focus, selection" },
      { name: "interactive-hover", value: "hsl(var(--interactive-hover))", usage: "Hover и active-controls" },
      { name: "interactive-soft", value: "hsl(var(--accent-soft))", usage: "Selected rows, soft chips, calm backgrounds" },
    ],
  },
  {
    title: "Поверхности и текст",
    description: "Border-first surface language from the ServiceOps design system.",
    items: [
      { name: "background", value: "hsl(var(--background))", usage: "Фон приложения" },
      { name: "surface", value: "hsl(var(--card))", usage: "Карточки, панели, inputs" },
      { name: "surface-muted", value: "hsl(var(--muted))", usage: "Вложенные quiet-панели" },
      { name: "surface-hover", value: "hsl(var(--surface-hover))", usage: "Hover для list/nav surfaces" },
      { name: "border", value: "hsl(var(--border))", usage: "Основные бордеры" },
      { name: "border-strong", value: "hsl(var(--border-strong))", usage: "Усиленные разделители и active рамки" },
      { name: "text-primary", value: "hsl(var(--foreground))", usage: "Основной текст" },
      { name: "text-secondary", value: "hsl(var(--muted-foreground))", usage: "Вторичный текст и мета" },
      { name: "text-tertiary", value: "hsl(var(--text-tertiary))", usage: "Placeholder и timestamps" },
      { name: "text-disabled", value: "hsl(var(--text-disabled))", usage: "Disabled text и icons" },
    ],
  },
  {
    title: "Семантика",
    description: "Soft-background status semantics for dense operator UIs.",
    items: [
      { name: "success", value: "hsl(var(--success))", usage: "Успех, завершение, подтверждение" },
      { name: "success-soft", value: "hsl(var(--success-soft))", usage: "Мягкий фон успешного статуса" },
      { name: "warning", value: "hsl(var(--warning))", usage: "Ожидание и внимательность" },
      { name: "warning-soft", value: "hsl(var(--warning-soft))", usage: "Мягкий фон warning" },
      { name: "destructive", value: "hsl(var(--destructive))", usage: "Ошибка, просрочка, рекламация" },
      { name: "destructive-soft", value: "hsl(var(--destructive-soft))", usage: "Мягкий фон danger" },
      { name: "info", value: "hsl(var(--info))", usage: "Справочная информация" },
      { name: "info-soft", value: "hsl(var(--info-soft))", usage: "Мягкий фон info" },
      { name: "violet", value: "hsl(var(--violet))", usage: "Промежуточный статусный акцент" },
      { name: "violet-soft", value: "hsl(var(--violet-soft))", usage: "Мягкий фон violet" },
    ],
  },
];

export const TYPOGRAPHY_TOKENS: TypographyToken[] = [
  { name: "text-xs", fontSize: 12, lineHeight: 16, fontWeight: 500, usage: "Caption, timestamps и meta" },
  { name: "text-sm", fontSize: 13, lineHeight: 18, fontWeight: 500, usage: "Лейблы, table meta, badges" },
  { name: "text-base", fontSize: 14, lineHeight: 20, fontWeight: 400, usage: "Основной UI-текст и формы" },
  { name: "text-md", fontSize: 16, lineHeight: 24, fontWeight: 400, usage: "Карточки деталей и auth-формы" },
  { name: "text-lg", fontSize: 18, lineHeight: 26, fontWeight: 600, usage: "Заголовки карточек" },
  { name: "text-xl", fontSize: 20, lineHeight: 28, fontWeight: 600, usage: "Заголовки секций" },
  { name: "text-2xl", fontSize: 24, lineHeight: 32, fontWeight: 700, usage: "Подзаголовки страниц" },
  {
    name: "text-3xl",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    usage: "Главные заголовки страниц",
  },
  {
    name: "text-4xl",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    usage: "Auth / major hero title",
  },
];

export const SPACING_TOKENS = [
  { name: "space-1", value: "4px" },
  { name: "space-2", value: "8px" },
  { name: "space-3", value: "12px" },
  { name: "space-4", value: "16px" },
  { name: "space-5", value: "20px" },
  { name: "space-6", value: "24px" },
  { name: "space-8", value: "32px" },
  { name: "space-10", value: "40px" },
  { name: "space-12", value: "48px" },
  { name: "space-16", value: "64px" },
];

export const RADIUS_TOKENS = [
  { name: "radius-xs", value: "6px" },
  { name: "radius-sm", value: "8px" },
  { name: "radius-md", value: "10px" },
  { name: "radius-lg", value: "12px" },
  { name: "radius-xl", value: "16px" },
  { name: "radius-2xl", value: "20px" },
  { name: "radius-3xl", value: "28px" },
  { name: "radius-full", value: "9999px" },
];

export const ELEVATION_TOKENS = [
  { name: "shadow-xs", value: "0 1px 2px rgba(16, 24, 40, 0.04)" },
  { name: "shadow-sm", value: "0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)" },
  { name: "shadow-md", value: "0 8px 24px rgba(16, 24, 40, 0.08)" },
  { name: "shadow-lg", value: "0 16px 40px rgba(16, 24, 40, 0.12)" },
  { name: "shadow-xl", value: "0 24px 64px rgba(16, 24, 40, 0.16)" },
];
