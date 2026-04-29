import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { EquipmentRegistryWorkspace } from "@/features/Stage03Equipment";
import {
  divisionScopeSession,
  equipmentRecords,
  journalRecords,
  measuringInstrumentRecords,
  runtimeSession,
  standardRecords,
} from "@/shared/storybook/runtime-fixtures";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const workspaceFrame: Decorator = (Story) => (
  <div className="story-shell">
    <div className="mx-auto w-full max-w-7xl">{Story()}</div>
  </div>
);

const defaultApi = {
  equipment: equipmentRecords,
  journals: journalRecords,
  measuringInstruments: measuringInstrumentRecords,
  session: runtimeSession,
  standards: standardRecords,
};

const meta = {
  title: "Equipment/EquipmentRegistryWorkspace",
  component: EquipmentRegistryWorkspace,
  decorators: [workspaceFrame],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    initialShowArchived: false,
    initialTab: "equipment",
    session: runtimeSession,
  },
  argTypes: {
    initialTab: {
      control: "select",
      options: ["equipment", "mi", "standards"],
    },
    session: {
      control: false,
    },
  },
} satisfies Meta<typeof EquipmentRegistryWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EquipmentTab: Story = {
  decorators: [withRuntimeApi(defaultApi)],
};

export const MeasuringInstrumentsTab: Story = {
  args: {
    initialTab: "mi",
  },
  decorators: [withRuntimeApi(defaultApi)],
};

export const StandardsTab: Story = {
  args: {
    initialTab: "standards",
  },
  decorators: [withRuntimeApi(defaultApi)],
};

export const WithArchiveVisible: Story = {
  args: {
    initialShowArchived: true,
    initialTab: "mi",
  },
  decorators: [withRuntimeApi(defaultApi)],
};

export const ScopedReadonly: Story = {
  args: {
    session: divisionScopeSession,
  },
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      session: divisionScopeSession,
    }),
  ],
};

export const LoadError: Story = {
  decorators: [withRuntimeApi({ ...defaultApi, failurePaths: ["/api/equipment"] })],
};
