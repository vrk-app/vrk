import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { ArrowRight, Plus, SendHorizontal } from "lucide-react";
import { Button } from "@/shared/ui";

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Оформить заявку",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button"));
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    await canvas.getByRole("button").focus();
  },
};

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Открыть историю",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Отложить",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Отклонить",
  },
};

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Plus className="size-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight className="size-4" />,
    children: "Перейти к смете",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Сохраняем…",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    rightIcon: <SendHorizontal className="size-4" />,
    children: "Отправить на согласование",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Запустить процесс приемки",
  },
  render: (args) => (
    <div className="w-[320px]">
      <Button {...args} />
    </div>
  ),
};
