import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { LockKeyhole, Mail, Search } from "lucide-react";
import { InputField } from "@/shared/ui";

const meta = {
  title: "Primitives/InputField",
  component: InputField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Логин",
    name: "username",
    autoComplete: "username",
    placeholder: "Введите логин…",
    spellCheck: false,
  },
  render: (args) => (
    <div className="w-[360px]">
      <InputField {...args} />
    </div>
  ),
} satisfies Meta<typeof InputField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByLabelText("Логин"));
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Логин"));
  },
};

export const Text: Story = {
  args: {
    defaultValue: "dispatcher.vrk",
  },
};

export const Email: Story = {
  args: {
    label: "Корпоративная почта",
    name: "email",
    autoComplete: "email",
    placeholder: "name@vrk.local…",
    spellCheck: false,
    type: "email",
    leftIcon: <Mail className="size-4" />,
  },
};

export const Password: Story = {
  args: {
    defaultValue: "vrk-secret-2026",
    label: "Пароль",
    name: "current-password",
    autoComplete: "current-password",
    placeholder: "Введите пароль…",
    type: "password",
    leftIcon: <LockKeyhole className="size-4" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Пароль");

    await userEvent.click(canvas.getByRole("button", { name: "Показать пароль" }));
    await expect(input).toHaveAttribute("type", "text");

    await userEvent.click(canvas.getByRole("button", { name: "Скрыть пароль" }));
    await expect(input).toHaveAttribute("type", "password");
  },
};

export const SearchField: Story = {
  name: "Search",
  args: {
    autoComplete: "off",
    label: "Поиск заявки",
    name: "request-search",
    placeholder: "Номер, подрядчик или оборудование…",
    spellCheck: false,
    leftIcon: <Search className="size-4" />,
  },
};

export const WithHint: Story = {
  args: {
    hint: "Используйте корпоративный логин без домена.",
    hintTitle: "Формат логина",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Логин");
    const helpTrigger = canvas.getByRole("button", { name: "Справка: Логин" });

    await expect(input).not.toHaveAttribute("aria-describedby");
    await expect(helpTrigger).toHaveAccessibleDescription(/Используйте корпоративный логин/);

    const tooltip = canvas.getByRole("tooltip", { hidden: true });

    await userEvent.tab();
    await expect(helpTrigger).toHaveFocus();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveTextContent("Формат логина");
  },
};

export const WithError: Story = {
  args: {
    error: "Проверьте логин и пароль. Данные не совпадают с учетной записью.",
    defaultValue: "dispatcher.vrk",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Логин");
    const error = canvas.getByText(
      "Проверьте логин и пароль. Данные не совпадают с учетной записью.",
    );

    await expect(error).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(
      "Проверьте логин и пароль. Данные не совпадают с учетной записью.",
    );
  },
};

export const WithHintAndError: Story = {
  args: {
    autoComplete: "off",
    defaultValue: "123",
    error: "КПП должен содержать 9 цифр.",
    hint: "9 цифр.",
    hintTitle: "Формат КПП",
    label: "КПП",
    name: "kpp",
    placeholder: "770501001…",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("КПП");
    const error = canvas.getByText("КПП должен содержать 9 цифр.");
    const helpTrigger = canvas.getByRole("button", { name: "Справка: КПП" });

    await expect(error).toBeVisible();
    await expect(input).toHaveAccessibleDescription("КПП должен содержать 9 цифр.");
    await expect(helpTrigger).toHaveAccessibleDescription(/9 цифр/);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "readonly@vrk.local",
    label: "Сервисный адрес",
  },
};
