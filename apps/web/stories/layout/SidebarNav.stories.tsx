import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import { WEB_BRAND_ALT, WEB_BRAND_COMPACT_MARK_SRC } from "@/shared/config/brand";
import { SHELL_FOOTER_ITEMS, SHELL_NAV_ITEMS } from "@/shared/storybook/fixtures";
import { Button } from "@/shared/ui";
import { SidebarNav, type SidebarNavProps } from "@/widgets/OperatorShell";

const LONG_LABEL_ITEMS: SidebarNavProps["items"] = SHELL_NAV_ITEMS.map((item, index) => ({
  ...item,
  label:
    index === 0
      ? "Сводка по эксплуатационным метрикам сервисного контура"
      : index === 1
        ? "Заявки на обслуживание и согласование выездных работ"
        : index === 2
          ? "Документы, акты и реестры по сервисным операциям"
          : index === 3
            ? "Оплаты, сверка реестров и финансовые подтверждения"
            : "Сообщения, уведомления и комментарии по подрядчикам",
}));

const LONG_LABEL_FOOTER_ITEMS: SidebarNavProps["footerItems"] = SHELL_FOOTER_ITEMS.map(
  (item, index) => ({
    ...item,
    label:
      index === 0
        ? "Реквизиты и настройки финансового профиля сервисной площадки"
        : index === 1
          ? "Поддержка и операционные регламенты по рабочему месту"
          : "Завершить смену и безопасно выйти из сервисного контура",
  }),
);

const MANY_NAV_ITEMS: SidebarNavProps["items"] = Array.from({ length: 4 }).flatMap(
  (_, groupIndex) =>
    SHELL_NAV_ITEMS.map((item) => ({
      ...item,
      badge: groupIndex === 0 ? item.badge : undefined,
      key: `${item.key}-${groupIndex + 1}`,
      label: `${item.label} ${groupIndex + 1}`,
    })),
);

function SidebarNavPreview(args: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(args.collapsed ?? false);
  const [mobileOpen, setMobileOpen] = useState(args.mobileOpen ?? false);

  useEffect(() => {
    setCollapsed(args.collapsed ?? false);
  }, [args.collapsed]);

  useEffect(() => {
    setMobileOpen(args.mobileOpen ?? false);
  }, [args.mobileOpen]);

  return (
    <div className="story-shell space-y-3">
      {args.mobileOpen !== undefined && !mobileOpen ? (
        <div className="flex justify-end lg:hidden">
          <Button onClick={() => setMobileOpen(true)} size="sm" variant="secondary">
            Открыть меню
          </Button>
        </div>
      ) : null}
      <div className="h-[760px] overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-background">
        <SidebarNav
          {...args}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapsedChange={setCollapsed}
          onMobileOpenChange={setMobileOpen}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Layout/SidebarNav",
  component: SidebarNav,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    items: SHELL_NAV_ITEMS,
    footerItems: SHELL_FOOTER_ITEMS,
    activeKey: "dashboard",
    brandLogoAlt: WEB_BRAND_ALT,
    brandLogoSrc: WEB_BRAND_COMPACT_MARK_SRC,
    metaLabel: null,
    metaTitle: "VRK",
  },
  render: (args) => <SidebarNavPreview {...args} />,
} satisfies Meta<typeof SidebarNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const brandTitle = await canvas.findByText("VRK");
    await expect(brandTitle).toBeVisible();
    await expect(brandTitle).toHaveClass("text-lg");
    await expect(canvas.queryByText("Рабочая область")).toBeNull();
  },
};

export const ActiveRequests: Story = {
  args: {
    activeKey: "requests",
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
    activeKey: "documents",
  },
};

export const LongLabels: Story = {
  args: {
    items: LONG_LABEL_ITEMS,
    footerItems: LONG_LABEL_FOOTER_ITEMS,
    activeKey: "requests",
  },
};

export const LongNavigation: Story = {
  args: {
    items: MANY_NAV_ITEMS,
    activeKey: "requests-3",
  },
};

export const MobileDrawer: Story = {
  args: {
    mobileOpen: true,
    activeKey: "requests",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const CollapsedMobileDrawer: Story = {
  args: {
    collapsed: true,
    mobileOpen: true,
    activeKey: "requests",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
