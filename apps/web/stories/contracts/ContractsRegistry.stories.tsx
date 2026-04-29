import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { ContractsRegistry } from "@/features/Stage03Contracts";
import {
  contractRecords,
  contractorOptions,
  contractorSession,
  divisionAdminSession,
  restrictedCustomerSession,
  runtimeSession,
  unitAdminSession,
} from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const workspaceFrame: Decorator = (Story) => (
  <div className="story-shell">
    <div className="mx-auto w-full max-w-7xl">{Story()}</div>
  </div>
);

const meta = {
  title: "Contracts/ContractsRegistry",
  component: ContractsRegistry,
  decorators: [workspaceFrame],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    contractorOptions,
    initialContracts: contractRecords,
    session: runtimeSession,
  },
  argTypes: {
    contractorOptions: { control: false },
    initialContracts: { control: false },
    session: { control: false },
  },
} satisfies Meta<typeof ContractsRegistry>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CustomerAdmin: Story = {
  decorators: [
    withRuntimeApi({ contracts: contractRecords, contractorOptions, session: runtimeSession }),
  ],
};

export const CustomerEmpty: Story = {
  args: {
    initialContracts: [],
  },
  decorators: [withRuntimeApi({ contracts: [], contractorOptions, session: runtimeSession })],
};

export const CustomerRestricted: Story = {
  args: {
    session: restrictedCustomerSession,
  },
  decorators: [
    withRuntimeApi({ contracts: contractRecords, contractorOptions, session: restrictedCustomerSession }),
  ],
};

export const DivisionAdminScoped: Story = {
  args: {
    initialContracts: contractRecords.filter((contract) => contract.locationScope.scopeId === "unit-metrology"),
    session: divisionAdminSession,
  },
  decorators: [
    withRuntimeApi({
      contracts: contractRecords.filter((contract) => contract.locationScope.scopeId === "unit-metrology"),
      contractorOptions,
      session: divisionAdminSession,
    }),
  ],
};

export const UnitAdminScoped: Story = {
  args: {
    initialContracts: contractRecords.filter((contract) => contract.locationScope.scopeId === "unit-metrology"),
    session: unitAdminSession,
  },
  decorators: [
    withRuntimeApi({
      contracts: contractRecords.filter((contract) => contract.locationScope.scopeId === "unit-metrology"),
      contractorOptions,
      session: unitAdminSession,
    }),
  ],
};

export const ContractorReadonly: Story = {
  args: {
    session: contractorSession,
  },
  decorators: [
    withRuntimeApi({ contracts: contractRecords, contractorOptions, session: contractorSession }),
  ],
};
