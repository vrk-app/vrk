import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import { EmployeeAccessWorkspace } from "@/features/Stage03Access";
import {
  divisionHeadSession,
  employeeAccessRows,
  organizationHeadSession,
  runtimeSession,
  unitHeadSession,
} from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const workspaceFrame: Decorator = (Story) => (
  <div className="story-shell">
    <div className="mx-auto w-full max-w-7xl">{Story()}</div>
  </div>
);

const meta = {
  title: "Access/EmployeeAccessWorkspace",
  component: EmployeeAccessWorkspace,
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
} satisfies Meta<typeof EmployeeAccessWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AdminEditable: Story = {
  decorators: [withRuntimeApi({ employees: employeeAccessRows, session: runtimeSession })],
};

export const DeactivateConfirmation: Story = {
  decorators: [withRuntimeApi({ employees: employeeAccessRows, session: runtimeSession })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const deactivateButtons = await canvas.findAllByRole("button", { name: "Отключить" });
    const activeDeactivateButton = deactivateButtons.find((button) => !button.hasAttribute("disabled"));

    await expect(canvas.getByText("Дмитрий Ковалев")).toBeVisible();
    await expect(activeDeactivateButton).toBeDefined();
    await userEvent.click(activeDeactivateButton!);

    const dialog = await body.findByRole("dialog", { name: "Отключить сотрудника?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveTextContent("Дмитрий Ковалев");

    await userEvent.click(within(dialog).getByRole("button", { name: "Отмена" }));
    await waitFor(() =>
      expect(body.queryByRole("dialog", { name: "Отключить сотрудника?" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByText("Дмитрий Ковалев")).toBeVisible();

    await userEvent.click(activeDeactivateButton!);
    const confirmDialog = await body.findByRole("dialog", { name: "Отключить сотрудника?" });
    await userEvent.click(within(confirmDialog).getByRole("button", { name: "Отключить" }));
    await waitFor(() => expect(canvas.queryByText("Дмитрий Ковалев")).not.toBeInTheDocument());
  },
};

export const OrganizationHeadReadonly: Story = {
  args: {
    session: organizationHeadSession,
  },
  decorators: [withRuntimeApi({ employees: employeeAccessRows, session: organizationHeadSession })],
};

export const DivisionHeadReadonly: Story = {
  args: {
    session: divisionHeadSession,
  },
  decorators: [withRuntimeApi({ employees: employeeAccessRows, session: divisionHeadSession })],
};

export const UnitHeadReadonly: Story = {
  args: {
    session: unitHeadSession,
  },
  decorators: [withRuntimeApi({ employees: employeeAccessRows, session: unitHeadSession })],
};

export const Empty: Story = {
  decorators: [withRuntimeApi({ employees: [], session: runtimeSession })],
};

export const Loading: Story = {
  decorators: [withRuntimeApi({ pendingPaths: ["/api/auth/employees"], session: runtimeSession })],
};

export const Error: Story = {
  decorators: [withRuntimeApi({ failurePaths: ["/api/auth/employees"], session: runtimeSession })],
};
