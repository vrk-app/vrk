import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { CopyableText } from "@/shared/ui";

const meta = {
  title: "Primitives/CopyableText",
  component: CopyableText,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    value: "https://vrk.example/register/55eb0604-8957-4f44-9ef8-7578dfa85bf7",
  },
  render: (args) => (
    <div className="w-[420px] max-w-[calc(100vw-32px)]">
      <CopyableText {...args} data-testid="copyable-text-story" />
    </div>
  ),
} satisfies Meta<typeof CopyableText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByTestId("copyable-text-story"));
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await canvas.getByRole("button", { name: "Скопировать" }).focus();
  },
};

export const LongValue: Story = {
  args: {
    value:
      "https://platform.vrk.example/register/55eb0604-8957-4f44-9ef8-7578dfa85bf7?source=platform-admin&issued_at=2026-04-29T03%3A00%3A00Z",
  },
};
