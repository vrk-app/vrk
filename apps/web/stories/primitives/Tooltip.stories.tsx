import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Tooltip } from "@/shared/ui";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    "aria-label": "Справка по ОГРН",
    description: "Для ООО, ПАО и НАО укажите 13 цифр. Для ИП используется ОГРНИП из 15 цифр.",
    title: "Формат ОГРН",
    variant: "dark",
  },
  render: (args) => (
    <div className="flex min-h-32 w-[360px] items-end justify-center">
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span>ОГРН</span>
        <Tooltip {...args} />
      </div>
    </div>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole("button", { name: "Справка по ОГРН" }));
    await expect(canvas.getByRole("tooltip")).toBeVisible();
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Справка по ОГРН" });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("tooltip")).toBeVisible();
  },
};

export const Light: Story = {
  args: {
    variant: "light",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
  },
};

export const DescriptionOnly: Story = {
  args: {
    title: undefined,
  },
};
