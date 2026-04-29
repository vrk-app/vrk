import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { CompanyStructureWorkspace } from "@/app/(runtime)/company/_components/CompanyStructureWorkspace";
import {
  divisionHeadSession,
  divisionScopeSession,
  emptyStructureSession,
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
  title: "Company/CompanyStructureWorkspace",
  component: CompanyStructureWorkspace,
  decorators: [workspaceFrame],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    initialSession: runtimeSession,
  },
  argTypes: {
    initialSession: {
      control: false,
    },
  },
} satisfies Meta<typeof CompanyStructureWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OrganizationAdmin: Story = {
  decorators: [withRuntimeApi({ session: runtimeSession })],
};

export const EmptyStructure: Story = {
  args: {
    initialSession: emptyStructureSession,
  },
  decorators: [withRuntimeApi({ invites: [], session: emptyStructureSession })],
};

export const ScopedReadonly: Story = {
  args: {
    initialSession: divisionScopeSession,
  },
  decorators: [withRuntimeApi({ session: divisionScopeSession })],
};

export const OrganizationHeadEmployees: Story = {
  args: {
    initialSession: organizationHeadSession,
  },
  decorators: [withRuntimeApi({ session: organizationHeadSession })],
};

export const DivisionHeadEmployees: Story = {
  args: {
    initialSession: divisionHeadSession,
  },
  decorators: [withRuntimeApi({ session: divisionHeadSession })],
};

export const UnitHeadEmployees: Story = {
  args: {
    initialSession: unitHeadSession,
  },
  decorators: [withRuntimeApi({ session: unitHeadSession })],
};
