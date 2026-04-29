import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { SelectField } from "@/shared/ui";

const roleOptions = [
  { label: "Администратор организации", value: "organization_admin" },
  { label: "Руководитель организации", value: "organization_head" },
  { label: "Руководитель дивизиона", value: "division_head" },
  { label: "Сотрудник дивизиона", value: "division_operator" },
  { label: "Руководитель юнита", value: "unit_head" },
  { label: "Сотрудник юнита", value: "unit_operator" },
  { label: "Аудитор", value: "auditor" },
] as const;

const meta = {
  title: "Primitives/SelectField",
  component: SelectField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Роль доступа",
    name: "role",
    options: roleOptions,
    defaultValue: "auditor",
  },
  render: (args) => (
    <div className="w-[360px]">
      <SelectField {...args} />
    </div>
  ),
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const Default: Story = Single;

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByLabelText("Роль доступа"));
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Роль доступа"));
  },
};

export const WithPlaceholder: Story = {
  args: {
    clearable: true,
    defaultValue: "",
    label: "Подрядчик",
    placeholder: "Выберите подрядчика",
    options: [
      { label: "ВРК Север", value: "north" },
      { label: "Метрология Центр", value: "metrology-center" },
    ],
  },
};

export const Multiple: Story = {
  args: {
    defaultValue: ["unit-a", "unit-c"],
    label: "Юниты",
    multiple: true,
    options: [
      { label: "Юнит 01", value: "unit-a" },
      { label: "Юнит 02", value: "unit-b" },
      { label: "Юнит 03", value: "unit-c" },
    ],
  },
};

export const WithHint: Story = {
  args: {
    hint: "Выберите роль, которую сотрудник получит после активации приглашения.",
  },
};

export const WithError: Story = {
  args: {
    error: "Для выбранного scope нет доступных целей.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: "Дивизион",
    options: [{ label: "Нет доступных дивизионов", value: "" }],
    value: "",
  },
};

export const LoadingOptions: Story = {
  args: {
    hint: "Список обновляется.",
    label: "Подрядчик",
    loading: true,
    options: [],
    value: "",
  },
};
