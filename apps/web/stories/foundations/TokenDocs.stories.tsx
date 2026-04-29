import type { Meta, StoryObj } from "@storybook/react";
import {
  COLOR_TOKEN_GROUPS,
  ELEVATION_TOKENS,
  RADIUS_TOKENS,
  SPACING_TOKENS,
  TYPOGRAPHY_TOKENS,
} from "@/shared/config/design-tokens";
import { StoryFrame } from "@/shared/storybook/StoryFrame";

type TokenDocsSection = "colors" | "typography" | "spacing" | "elevation" | "radii";

type TokenDocsShowcaseProps = {
  section?: TokenDocsSection;
};

const TOKEN_DOCS_DESCRIPTION =
  "Связка между канонической дизайн-системой, историями и базовыми UI-компонентами.";

const SECTION_DESCRIPTIONS: Record<TokenDocsSection, string> = {
  colors: "Только цветовые роли: primary CTA, интерактивный контур, поверхности и семантика.",
  typography: "Фиксированная продуктовая типографика без повторного рендера остальных токенов.",
  spacing: "Базовая 4px-шкала и фиксированные card padding-значения для операторских поверхностей.",
  elevation: "Спокойные elevation-токены, где тень остается вторичной по отношению к border-first языку.",
  radii: "Набор радиусов, которым ограничиваются карточки, поля и quiet-panels.",
};

function TokenDocsSectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function getTypographyPreviewStyle(token: (typeof TYPOGRAPHY_TOKENS)[number]) {
  return {
    fontSize: `${token.fontSize}px`,
    lineHeight: `${token.lineHeight}px`,
    fontWeight: token.fontWeight,
    letterSpacing: token.letterSpacing,
  };
}

function TokenDocsShowcase({ section }: TokenDocsShowcaseProps) {
  const isSectionVisible = (targetSection: TokenDocsSection) =>
    section === undefined || section === targetSection;

  return (
    <StoryFrame
      title="TokenDocs"
      description={section ? SECTION_DESCRIPTIONS[section] : TOKEN_DOCS_DESCRIPTION}
    >
      <div className="grid gap-8">
        {isSectionVisible("colors") ? (
          <section className="grid gap-4">
            <TokenDocsSectionHeading
              title="Цвета"
              description="Primary CTA остается темным, а синий зарезервирован для интерактива и выделения."
            />
            <div className="grid gap-6">
              {COLOR_TOKEN_GROUPS.map((group) => (
                <div key={group.title} className="grid gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {group.items.map((token) => (
                      <div
                        key={token.name}
                        className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs"
                      >
                        <div
                          className="h-20 rounded-[var(--radius-lg)] border border-border"
                          style={{ backgroundColor: token.value }}
                        />
                        <div className="mt-3 space-y-1">
                          <p className="font-mono text-sm text-foreground">{token.name}</p>
                          <p className="text-sm text-muted-foreground">{token.usage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {isSectionVisible("typography") ? (
          <section className="grid gap-4">
            <TokenDocsSectionHeading
              title="Типографика"
              description="Фиксированная продуктовая шкала из дизайн-системы: плотная, спокойная и читаемая."
            />
            <div className="grid gap-3">
              {TYPOGRAPHY_TOKENS.map((token) => (
                <div
                  key={token.name}
                  className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs md:flex-row md:items-end md:justify-between"
                >
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{token.name}</p>
                    <p style={getTypographyPreviewStyle(token)}>
                      Поверка оборудования по договору №24/11
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {token.fontSize} / {token.lineHeight} • {token.fontWeight} • {token.usage}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {isSectionVisible("spacing") ? (
          <section className="grid gap-4">
            <TokenDocsSectionHeading
              title="Отступы"
              description="Базовая 4px-шкала с фиксированными 20px и 24px внутренними отступами карточек для операторских поверхностей."
            />
            <div className="grid gap-3">
              {SPACING_TOKENS.map((token) => (
                <div
                  key={token.name}
                  className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-foreground">{token.name}</span>
                    <span className="text-sm text-muted-foreground">{token.value}</span>
                  </div>
                  <div
                    className="mt-3 rounded-full bg-accent"
                    style={{ height: "0.5rem", width: token.value }}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {isSectionVisible("radii") ? (
          <section className="grid gap-3">
            <TokenDocsSectionHeading
              title="Радиусы"
              description="На одном экране обычно сосуществуют только три радиуса: 10, 12 и 16."
            />
            {RADIUS_TOKENS.map((token) => (
              <div
                key={token.name}
                className="flex items-center justify-between rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs"
              >
                <div className="space-y-1">
                  <p className="font-mono text-sm text-foreground">{token.name}</p>
                  <p className="text-sm text-muted-foreground">{token.value}</p>
                </div>
                <div
                  className="size-16 border border-border bg-muted"
                  style={{ borderRadius: token.value }}
                />
              </div>
            ))}
          </section>
        ) : null}

        {isSectionVisible("elevation") ? (
          <section className="grid gap-3">
            <TokenDocsSectionHeading
              title="Тени и подъем"
              description="Базовые карточки остаются спокойными; подъем зарезервирован для hover и overlay-поверхностей."
            />
            {ELEVATION_TOKENS.map((token) => (
              <div
                key={token.name}
                className="rounded-[var(--radius-xl)] border border-border bg-card p-4"
                style={{ boxShadow: token.value }}
              >
                <p className="font-mono text-sm text-foreground">{token.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{token.value}</p>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </StoryFrame>
  );
}

const meta = {
  title: "Foundations/TokenDocs",
  component: TokenDocsShowcase,
  argTypes: {
    section: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TokenDocsShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

function createSectionStory(section: TokenDocsSection): Story {
  return {
    args: {
      section,
    },
    parameters: {
      docs: {
        description: {
          story: SECTION_DESCRIPTIONS[section],
        },
      },
    },
  };
}

export const All: Story = {
  parameters: {
    docs: {
      description: {
        story: TOKEN_DOCS_DESCRIPTION,
      },
    },
  },
};

export const Colors: Story = createSectionStory("colors");

export const Typography: Story = createSectionStory("typography");

export const Spacing: Story = createSectionStory("spacing");

export const Elevation: Story = createSectionStory("elevation");

export const Radii: Story = createSectionStory("radii");
