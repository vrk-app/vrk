import type { Meta, StoryObj } from "@storybook/react";
import { ICON_SECTIONS, type IconSection } from "@/shared/storybook/fixtures";
import { StoryFrame } from "@/shared/storybook/StoryFrame";

type IconGalleryShowcaseProps = {
  section?: IconSection["title"];
};

function IconGalleryShowcase({ section }: IconGalleryShowcaseProps) {
  const sizes = [16, 20, 24, 32];
  const sections = section
    ? ICON_SECTIONS.filter((item) => item.title === section)
    : ICON_SECTIONS;

  return (
    <StoryFrame
      title="IconGallery"
      description="Каталог навигационных, action, file и status icons для интерфейса VRK."
    >
      <div className="grid gap-6">
        {sections.map((sectionItem) => (
          <section key={sectionItem.title} className="grid gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">{sectionItem.title}</h2>
              <p className="text-sm text-muted-foreground">
                Stroke должен оставаться спокойным и консистентным на плотных B2B-поверхностях.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {sectionItem.items.map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="rounded-[var(--radius-xl)] border border-border bg-card p-4 shadow-xs"
                >
                  <p className="font-mono text-sm text-foreground">{name}</p>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {sizes.map((size) => (
                      <div
                        key={size}
                        className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-muted px-2 py-3 text-muted-foreground"
                      >
                        <Icon size={size} strokeWidth={1.75} />
                        <span className="text-[11px]">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </StoryFrame>
  );
}

const meta = {
  title: "Foundations/IconGallery",
  component: IconGalleryShowcase,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof IconGalleryShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NavigationIcons: Story = {
  args: {
    section: "Навигация",
  },
};

export const ActionIcons: Story = {
  args: {
    section: "Действия",
  },
};

export const FileTypeIcons: Story = {
  args: {
    section: "Документы и файлы",
  },
};

export const StatusIcons: Story = {
  args: {
    section: "Статусы",
  },
};
