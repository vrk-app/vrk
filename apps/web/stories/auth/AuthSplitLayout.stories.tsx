import type { Meta, StoryObj } from "@storybook/react";
import { ConsentRow, LoginForm, AuthSplitLayout } from "@/widgets/Auth";

const defaultConsent = (
  <ConsentRow
    defaultChecked
    label="Я работаю под своей корпоративной учетной записью и подтверждаю правила доступа."
    links={[
      { label: "политикой обработки", href: "#policy" },
      { label: "регламентом входа", href: "#policy" },
    ]}
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
    title: "Вход в сервисный контур VRK",
    subtitle:
      "Экран входа остаётся более выразительным, но всё ещё выглядит как корпоративный инструмент с понятной и спокойной иерархией.",
    formSlot: <LoginForm consent={defaultConsent} submitLabel="Войти в систему" />,
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

export const Mobile: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Доказывает mobile stacked contract: форма остаётся первым блоком, а иллюстрация переносится под неё вместо скрытия.",
      },
    },
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
