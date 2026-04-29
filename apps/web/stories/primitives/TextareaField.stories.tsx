import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { TextareaField } from "@/shared/ui";

const meta = {
  title: "Primitives/TextareaField",
  component: TextareaField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Комментарий",
    name: "comment",
    placeholder: "Добавьте рабочее примечание…",
  },
  render: (args) => (
    <div className="w-[420px]">
      <TextareaField {...args} />
    </div>
  ),
} satisfies Meta<typeof TextareaField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByLabelText("Комментарий"));
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Комментарий"));
  },
};

export const WithHint: Story = {
  args: {
    hint: "Комментарий виден только внутри карточки записи.",
  },
};

export const WithCounter: Story = {
  args: {
    defaultValue: "Проверить документ перед архивированием.",
    maxLength: 120,
    showCounter: true,
  },
};

export const AutoResize: Story = {
  args: {
    autoResize: true,
    hint: "Поле увеличивается по мере ввода.",
    rows: 2,
  },
};

export const WithError: Story = {
  args: {
    error: "Комментарий не должен превышать допустимую длину.",
    defaultValue: "Слишком длинное рабочее примечание.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Запись доступна только для чтения.",
  },
};
