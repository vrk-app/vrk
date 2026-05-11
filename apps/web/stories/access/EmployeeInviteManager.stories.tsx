import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { EmployeeInviteManager } from "@/features/Stage03Access";
import { employeeInvites, runtimeSession } from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const manyEmployeeInvites = [
  ...employeeInvites,
  ...Array.from({ length: 12 }, (_, index) => ({
    ...employeeInvites[index % employeeInvites.length],
    email: `employee-${index + 1}@vrk.local`,
    fullName: `Сотрудник контура ${String(index + 1).padStart(2, "0")}`,
    id: `invite-long-${index + 1}`,
  })),
];

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

export const RevokeConfirmation: Story = {
  decorators: [withRuntimeApi({ invites: employeeInvites, session: runtimeSession })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await expect(await canvas.findByText("Мария Кузнецова")).toBeVisible();
    await userEvent.click((await canvas.findAllByRole("button", { name: "Отозвать" }))[0]);

    const dialog = await body.findByRole("dialog", { name: "Отозвать приглашение?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveTextContent("Мария Кузнецова");

    await userEvent.click(within(dialog).getByRole("button", { name: "Отозвать" }));
    await expect(await canvas.findByText("Отозвано")).toBeVisible();
  },
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

export const LongStatusList: Story = {
  decorators: [withRuntimeApi({ invites: manyEmployeeInvites, session: runtimeSession })],
};
