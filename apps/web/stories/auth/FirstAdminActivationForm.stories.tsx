import type { Meta, StoryObj } from "@storybook/react";
import { FirstAdminActivationForm } from "@/features/Stage03Bootstrap";
import { employeeInviteInspection, firstAdminInvite } from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const meta = {
  title: "Auth/FirstAdminActivationForm",
  component: FirstAdminActivationForm,
  decorators: [withRuntimeApi()],
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    invite: firstAdminInvite,
    inviteToken: "first-admin-token",
  },
  render: (args) => (
    <div className="w-full max-w-[520px]">
      <FirstAdminActivationForm {...args} />
    </div>
  ),
} satisfies Meta<typeof FirstAdminActivationForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstAdmin: Story = {};

export const Employee: Story = {
  args: {
    invite: employeeInviteInspection,
    inviteToken: "employee-token",
  },
};
