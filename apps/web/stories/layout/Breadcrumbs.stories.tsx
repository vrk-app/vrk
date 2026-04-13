import type { Meta, StoryObj } from "@storybook/react";
import { DASHBOARD_BREADCRUMBS, REQUEST_BREADCRUMBS } from "@/shared/storybook/fixtures";
import { Breadcrumbs } from "@/widgets/OperatorShell";

const meta = {
  title: "Layout/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    items: DASHBOARD_BREADCRUMBS,
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoLevels: Story = {};

export const ThreeLevels: Story = {
  args: {
    items: REQUEST_BREADCRUMBS,
  },
};
