import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { EmployeeInviteManager } from "@/features/Stage03Access";
import { employeeInvites, runtimeSession } from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const workspaceFrame: Decorator = (Story) => (
  <div className="story-shell">
    <div className="mx-auto w-full max-w-7xl">{Story()}</div>
  </div>
);

const meta = {
  title: "Access/EmployeeInviteManager",
  component: EmployeeInviteManager,
  decorators: [workspaceFrame],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    session: runtimeSession,
  },
  argTypes: {
    session: {
      control: false,
    },
  },
} satisfies Meta<typeof EmployeeInviteManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithInvites: Story = {
  decorators: [withRuntimeApi({ invites: employeeInvites, session: runtimeSession })],
};

export const Empty: Story = {
  decorators: [withRuntimeApi({ invites: [], session: runtimeSession })],
};

export const Loading: Story = {
  decorators: [withRuntimeApi({ pendingPaths: ["/api/auth/employee-invites"], session: runtimeSession })],
};

export const Error: Story = {
  decorators: [withRuntimeApi({ failurePaths: ["/api/auth/employee-invites"], session: runtimeSession })],
};
