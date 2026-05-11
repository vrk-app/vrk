import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LogoSvgProps = SVGProps<SVGSVGElement> & {
  title: string;
};

type LogoOption = {
  id: string;
  title: string;
  fit: string;
  note: string;
  Logo: ComponentType<LogoSvgProps>;
};

const logoOptions: LogoOption[] = [
  {
    id: "route",
    title: "Контур маршрута",
    fit: "Основной продуктовый знак",
    note: "Маршрутизация заявки, контроль узлов и видимый путь от обращения до закрытия.",
    Logo: RouteContourLogo,
  },
  {
    id: "registry",
    title: "Реестр оборудования",
    fit: "Иконка приложения и браузерный знак",
    note: "Модульный реестр, инвентарные карточки и технический учет без лишней декоративности.",
    Logo: RegistryGridLogo,
  },
  {
    id: "precision",
    title: "Метрологический узел",
    fit: "Поверка и стандарты",
    note: "Точность, эталоны и проверяемый результат через спокойную геометрию измерения.",
    Logo: PrecisionNodeLogo,
  },
  {
    id: "shield",
    title: "Сервисный щит",
    fit: "Доверие и аудит",
    note: "Защищенный контур работ, подтверждения и трассируемость решений в сервисном процессе.",
    Logo: ServiceShieldLogo,
  },
  {
    id: "field",
    title: "Полевой сигнал",
    fit: "Полевой инженерный режим",
    note: "Работа инженера на объекте, офлайн-контур и последующая синхронизация.",
    Logo: FieldSignalLogo,
  },
];

export const metadata: Metadata = {
  title: "SVG-логотипы | VRK",
  description: "Пять SVG-направлений логотипа для веб-интерфейса VRK",
};

export default function LogosPage() {
  return (
    <>
      <a
        className="sr-only absolute left-4 top-4 rounded-[var(--radius-lg)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href="#logos-main"
      >
        Перейти к логотипам
      </a>
      <main
        className="min-h-screen overflow-x-hidden bg-background text-foreground"
        id="logos-main"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <section className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              href="/login"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              К входу
            </Link>

            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
              <div className="min-w-0 max-w-3xl">
                <p className="text-sm font-semibold text-accent">Лаборатория бренда</p>
                <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  5 вариантов <span translate="no">SVG</span>-логотипа для <span translate="no">VRK</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  Все варианты держатся на промышленной <span translate="no">B2B</span>-эстетике проекта: темный знак,
                  точная геометрия, умеренный синий акцент и читаемость в маленьких размерах.
                </p>
              </div>

              <div className="min-w-0 rounded-[var(--radius-xl)] border border-border bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">Формат:</span> встроенный <span translate="no">SVG</span>,
                без растровых ассетов. Подходят для дальнейшей адаптации под браузерный знак, иконку приложения,
                словесный знак и экран входа.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-6 md:grid-cols-2 md:px-8 lg:grid-cols-3">
          {logoOptions.map(({ fit, id, Logo, note, title }) => (
            <article
              className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-card shadow-xs"
              key={id}
            >
              <div className="flex min-h-52 items-center justify-center border-b border-border bg-muted/50 px-6 py-8">
                <Logo className="h-28 w-full max-w-72" title={title} />
              </div>
              <div className="flex min-h-48 flex-col gap-4 p-5">
                <div>
                  <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground">{title}</h2>
                  <p className="mt-2 text-sm font-medium text-accent">{fit}</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{note}</p>
                <div className="mt-auto flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                  <span className="rounded-[var(--radius-full)] bg-muted px-3 py-1" translate="no">
                    SVG
                  </span>
                  <span className="rounded-[var(--radius-full)] bg-accent-soft px-3 py-1 text-accent-strong">
                    операторский интерфейс
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

function RouteContourLogo({ title, ...props }: LogoSvgProps) {
  return (
    <svg aria-labelledby="route-contour-logo-title" role="img" viewBox="0 0 280 120" {...props}>
      <title id="route-contour-logo-title">{title}</title>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="text-brand-mark"
          d="M34 36l40 54 40-54"
          stroke="currentColor"
          strokeWidth="12"
        />
        <path
          className="text-accent"
          d="M132 88V38h38c15 0 25 9 25 22 0 14-10 23-25 23h-22l44 5"
          stroke="currentColor"
          strokeWidth="12"
        />
        <path className="text-primary" d="M218 34v54M218 62l42-29M218 62l42 29" stroke="currentColor" strokeWidth="12" />
        <path className="text-accent" d="M42 96h194" stroke="currentColor" strokeWidth="4" />
      </g>
      <g fill="currentColor">
        <circle className="text-accent" cx="42" cy="96" r="5" />
        <circle className="text-accent" cx="138" cy="96" r="5" />
        <circle className="text-accent" cx="236" cy="96" r="5" />
      </g>
    </svg>
  );
}

function RegistryGridLogo({ title, ...props }: LogoSvgProps) {
  return (
    <svg aria-labelledby="registry-grid-logo-title" role="img" viewBox="0 0 280 120" {...props}>
      <title id="registry-grid-logo-title">{title}</title>
      <rect className="fill-card stroke-border-strong" height="82" rx="18" width="88" x="22" y="19" />
      <path className="text-primary" d="M46 44h40M46 62h40M46 80h28" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <rect className="fill-accent-soft stroke-accent" height="82" rx="18" width="88" x="96" y="19" />
      <path
        className="text-accent"
        d="M124 78l17-34 15 20 9-13"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <rect className="fill-card stroke-border-strong" height="82" rx="18" width="88" x="170" y="19" />
      <path
        className="text-brand-mark"
        d="M204 80V40M204 61l33-21M204 61l33 19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path className="text-primary" d="M126 103h70" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
    </svg>
  );
}

function PrecisionNodeLogo({ title, ...props }: LogoSvgProps) {
  return (
    <svg aria-labelledby="precision-node-logo-title" role="img" viewBox="0 0 280 120" {...props}>
      <title id="precision-node-logo-title">{title}</title>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="text-border-strong" d="M50 92h180M70 79V31h140v48" stroke="currentColor" strokeWidth="5" />
        <path className="text-primary" d="M82 84l58-48 58 48" stroke="currentColor" strokeWidth="12" />
        <path className="text-accent" d="M140 36v58" stroke="currentColor" strokeWidth="8" />
        <path className="text-brand-mark" d="M114 95h52" stroke="currentColor" strokeWidth="12" />
      </g>
      <circle className="fill-accent" cx="140" cy="36" r="9" />
      <circle className="fill-card stroke-primary" cx="82" cy="84" r="10" strokeWidth="6" />
      <circle className="fill-card stroke-primary" cx="198" cy="84" r="10" strokeWidth="6" />
      <path className="text-accent" d="M216 39h18M216 54h12M216 69h18" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
    </svg>
  );
}

function ServiceShieldLogo({ title, ...props }: LogoSvgProps) {
  return (
    <svg aria-labelledby="service-shield-logo-title" role="img" viewBox="0 0 280 120" {...props}>
      <title id="service-shield-logo-title">{title}</title>
      <path
        className="fill-card stroke-primary"
        d="M140 17 205 37v30c0 14-8 25-21 32l-44 20-44-20C83 92 75 81 75 67V37l65-20Z"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        className="text-accent"
        d="m108 67 22 22 45-48"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="11"
      />
      <path className="text-brand-mark" d="M96 40h88" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path className="text-border-strong" d="M92 99h96" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
    </svg>
  );
}

function FieldSignalLogo({ title, ...props }: LogoSvgProps) {
  return (
    <svg aria-labelledby="field-signal-logo-title" role="img" viewBox="0 0 280 120" {...props}>
      <title id="field-signal-logo-title">{title}</title>
      <rect className="fill-card stroke-primary" height="90" rx="18" width="62" x="58" y="15" strokeWidth="9" />
      <path className="text-border-strong" d="M78 84h22" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <path className="text-accent" d="M152 83a33 33 0 0 0 0-46" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path className="text-accent" d="M180 96a58 58 0 0 0 0-72" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path className="text-brand-mark" d="M91 38v34l23-34" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
      <circle className="fill-success" cx="211" cy="60" r="12" />
      <path className="text-card" d="m205 60 5 5 9-11" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </svg>
  );
}
