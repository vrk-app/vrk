import type { Meta, StoryObj } from "@storybook/react";
import { RequestStatusBadge } from "@/entities/Request";

const meta = {
  title: "Requests/RequestStatusBadge",
  component: RequestStatusBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    showIcon: true,
    size: "md",
  },
  render: (args) => <RequestStatusBadge {...args} />,
} satisfies Meta<typeof RequestStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Draft: Story = {
  args: { status: "draft" },
};

export const OnApproval: Story = {
  args: { status: "on-approval" },
};

export const Approved: Story = {
  args: { status: "approved" },
};

export const InWork: Story = {
  args: { status: "in-work" },
};

export const OnSigning: Story = {
  args: { status: "on-signing" },
};

export const AwaitingPayment: Story = {
  args: { status: "awaiting-payment" },
};

export const Completed: Story = {
  args: { status: "completed" },
};

export const Reclamation: Story = {
  args: { status: "reclamation" },
};
