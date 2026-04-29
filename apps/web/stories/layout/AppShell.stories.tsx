import type { ComponentProps } from "react";
import { useEffect, useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BarChart3, ClipboardList, Files, Shield } from "lucide-react";
import { Card } from "@/shared/ui";
import {
  REQUEST_BREADCRUMBS,
  SHELL_FOOTER_ITEMS,
  SHELL_NAV_ITEMS,
  SHELL_USER,
} from "@/shared/storybook/fixtures";
import { AppShell, PageHeader, SidebarNav, TopBar } from "@/widgets/OperatorShell";

type AppShellStoryArgs = ComponentProps<typeof AppShell> & {
  mobileSidebarOpen?: boolean;
};

function ShellContent() {
  return (
    <>
      <PageHeader
        actions={null}
        subtitle="Навигация, верхняя панель и рабочая зона собраны в единую оболочку."
        title="Каркас приложения"
      />
      <div className="grid gap-4 xl:grid-cols-3">
        {[
          {
            icon: ClipboardList,
            title: "Список заявок",
            text: "Секции остаются крупными и читаемыми, без дробления на десятки карточек.",
          },
          {
            icon: Shield,
            title: "Статусы и аудит",
            text: "Статусы, права и служебные события остаются заметными в рабочей зоне.",
          },
          {
            icon: Files,
            title: "Документы и платежи",
            text: "Оболочка не конкурирует с основным рабочим содержимым.",
          },
        ].map((item) => (
          <Card className="gap-3" key={item.title} padding="md">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
              <item.icon aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="gap-4" padding="lg">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-muted text-foreground">
            <BarChart3 aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Рабочая зона</h3>
            <p className="text-sm text-muted-foreground">
              Контентные разделы используют общий ритм отступов, навигации и заголовков.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function AppShellPreview(args: AppShellStoryArgs) {
  const { mobileSidebarOpen: initialMobileSidebarOpen = false, ...shellArgs } = args;
  const sidebarId = useId();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(Boolean(initialMobileSidebarOpen));

  useEffect(() => {
    setMobileSidebarOpen(Boolean(initialMobileSidebarOpen));
  }, [initialMobileSidebarOpen]);

  return (
    <AppShell
      {...shellArgs}
      header={
        <TopBar
          breadcrumbs={REQUEST_BREADCRUMBS}
          mobileMenuId={sidebarId}
          mobileMenuOpen={mobileSidebarOpen}
          notificationsCount={4}
          onMobileMenuOpenChange={setMobileSidebarOpen}
          searchValue=""
          user={SHELL_USER}
        />
      }
      sidebar={
        <SidebarNav
          activeKey="requests"
          footerItems={SHELL_FOOTER_ITEMS}
          id={sidebarId}
          items={SHELL_NAV_ITEMS}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />
      }
    >
      <ShellContent />
    </AppShell>
  );
}

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    header: null,
    mobileSidebarOpen: false,
    sidebar: null,
  },
  argTypes: {
    mobileSidebarOpen: {
      control: "boolean",
      description: "Открывает мобильное меню в примере.",
      table: {
        category: "Story",
      },
    },
  },
  render: (args) => <AppShellPreview {...args} />,
} satisfies Meta<AppShellStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DesktopShell: Story = {};

export const MobileShell: Story = {
  args: {
    mobileSidebarOpen: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
