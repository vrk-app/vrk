import type { Meta, StoryObj } from "@storybook/react";
import { ConsentRow, LoginForm } from "@/widgets/Auth";

const consent = (
  <ConsentRow
    defaultChecked
    label="Я подтверждаю вход в сервисный контур и согласие с правилами доступа."
    links={[
      { label: "политикой обработки", href: "#policy" },
      { label: "регламентом входа", href: "#policy" },
    ]}
  />
);

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    submitLabel: "Войти в систему",
    consent,
  },
  render: (args) => (
    <div className="w-full max-w-[480px]">
      <LoginForm {...args} />
    </div>
  ),
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
  args: {
    fieldErrors: {
      password: "Введите пароль не короче 8 символов.",
    },
  },
};

export const ServerError: Story = {
  args: {
    formError: "Сервис авторизации временно недоступен. Повторите попытку через пару минут.",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
