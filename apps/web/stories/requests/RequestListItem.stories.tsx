import type { Meta, StoryObj } from "@storybook/react";
import { REQUEST_LIST_ITEMS } from "@/shared/storybook/fixtures";
import { RequestListItem } from "@/entities/Request";

const meta = {
  title: "Requests/RequestListItem",
  component: RequestListItem,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    ...REQUEST_LIST_ITEMS[0],
  },
} satisfies Meta<typeof RequestListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Base: Story = {};

export const Selected: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[1],
  },
};

export const LongEnterpriseName: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[2],
  },
};

export const WithoutNote: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[2],
    note: undefined,
  },
};

export const Completed: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[3],
  },
};

export const ZeroProgress: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[0],
    progressPercent: 0,
  },
};

export const OverflowInput: Story = {
  args: {
    ...REQUEST_LIST_ITEMS[1],
    progressPercent: 140,
  },
};
