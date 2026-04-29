import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { Cable, Ruler, Wrench } from "lucide-react";
import { Tabs } from "@/shared/ui";

const registryTabs = [
  { icon: Wrench, key: "equipment", label: "Оборудование" },
  { icon: Cable, key: "mi", label: "Средства измерения" },
  { icon: Ruler, key: "standards", label: "Эталоны" },
] as const;

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    activeKey: "equipment",
    ariaLabel: "Раздел реестра",
    items: registryTabs,
    onChange: () => undefined,
  },
  render: (args) => (
    <div className="w-[640px] max-w-full">
      <Tabs {...args} />
    </div>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveMiddle: Story = {
  args: {
    activeKey: "mi",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

export const ManyTabs: Story = {
  args: {
    items: [
      ...registryTabs,
      { key: "archive", label: "Архив" },
      { key: "journals", label: "Журналы операций" },
      { disabled: true, key: "documents", label: "Документы" },
    ],
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await canvas.getByRole("tab", { name: "Оборудование" }).focus();
  },
};
