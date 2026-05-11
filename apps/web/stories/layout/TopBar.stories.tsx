import { useEffect, useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DASHBOARD_BREADCRUMBS, REQUEST_BREADCRUMBS, SHELL_USER } from "@/shared/storybook/fixtures";
import { TopBar, type TopBarProps } from "@/widgets/OperatorShell";

function TopBarStory(args: TopBarProps) {
  const mobileMenuId = useId();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(args.searchValue);

  useEffect(() => {
    setSearchValue(args.searchValue);
  }, [args.searchValue]);

  return (
    <div className="story-shell px-0 py-0">
      <TopBar
        {...args}
        mobileMenuId={mobileMenuId}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuOpenChange={setMobileMenuOpen}
        onSearch={args.onSearch ?? setSearchValue}
        searchValue={args.onSearch ? args.searchValue : searchValue}
      />
      <div
        className="border-b border-border bg-card px-4 py-3 text-sm text-muted-foreground lg:hidden"
        hidden={!mobileMenuOpen}
        id={mobileMenuId}
      >
        Мобильная навигация открыта для проверки связки кнопки и управляемой панели.
      </div>
    </div>
  );
}

const meta = {
  title: "Layout/TopBar",
  component: TopBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    breadcrumbs: REQUEST_BREADCRUMBS,
    notificationsCount: 3,
    searchValue: "",
    user: SHELL_USER,
  },
  render: (args) => <TopBarStory {...args} />,
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithUnreadCount: Story = {
  args: {
    breadcrumbs: DASHBOARD_BREADCRUMBS,
    notificationsCount: 27,
    searchValue: "Поверка расходомера",
  },
};

export const WithWorkspaceTitle: Story = {
  args: {
    breadcrumbs: DASHBOARD_BREADCRUMBS,
    contextTitle: "ООО «ВРК Демо»",
    contextTitleAsHeading: true,
    eyebrow: null,
    notificationsCount: 4,
    searchValue: "",
  },
};

export const LongWorkspaceTitle: Story = {
  args: {
    breadcrumbs: DASHBOARD_BREADCRUMBS,
    contextTitle: "ООО «ВРК Северный промышленный контур с очень длинным названием организации»",
    contextTitleAsHeading: true,
    eyebrow: null,
    notificationsCount: 0,
    searchValue: "",
  },
};

export const WithoutNotifications: Story = {
  args: {
    notificationsCount: 0,
  },
};

export const SearchUnavailable: Story = {
  args: {
    notificationsCount: 2,
    searchValue: "VRK-24",
  },
  render: (args) => (
    <div className="story-shell px-0 py-0">
      <TopBar {...args} />
    </div>
  ),
};

export const ActionsUnavailable: Story = {
  args: {
    notificationsCount: 4,
    searchValue: "",
  },
};

export const LongUserName: Story = {
  args: {
    user: {
      ...SHELL_USER,
      name: "Александра Петровна Мироненко-Завьялова",
    },
  },
};
