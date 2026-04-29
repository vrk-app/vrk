import type { Meta, StoryObj } from "@storybook/react";
import { ConsentRow, LoginForm, AuthSplitLayout } from "@/widgets/Auth";

const defaultConsent = (
  <ConsentRow
    defaultChecked
    label="Я принимаю политику доступа VRK."
    links={[{ label: "политикой доступа", href: "/access-policy" }]}
  />
);

const meta = {
  title: "Auth/AuthSplitLayout",
  component: AuthSplitLayout,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Вход в VRK",
    subtitle: "Используйте корпоративную почту и пароль, выданные для работы в VRK.",
    formSlot: <LoginForm consent={defaultConsent} submitLabel="Войти" />,
  },
} satisfies Meta<typeof AuthSplitLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutIllustration: Story = {
  args: {
    illustrationSlot: null,
  },
};

export const FullBleedIllustration: Story = {
  args: {
    fullBleedIllustration: true,
    showAuthBadge: false,
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
