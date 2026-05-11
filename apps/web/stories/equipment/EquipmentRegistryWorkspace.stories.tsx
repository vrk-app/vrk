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

const manyEquipmentRecords = [
  ...equipmentRecords,
  ...Array.from({ length: 12 }, (_, index) => ({
    ...equipmentRecords[index % equipmentRecords.length],
    factoryNumber: `EQ-LONG-${String(index + 1).padStart(3, "0")}`,
    fullName: `Оборудование производственного контура ${String(index + 1).padStart(2, "0")}`,
    id: `equipment-long-${index + 1}`,
    inventoryNumber: `INV-LONG-${String(index + 1).padStart(3, "0")}`,
  })),
];

const manyMeasuringInstrumentRecords = [
  ...measuringInstrumentRecords,
  ...Array.from({ length: 12 }, (_, index) => ({
    ...measuringInstrumentRecords[index % measuringInstrumentRecords.length],
    id: `mi-long-${index + 1}`,
    name: `Средство измерения ${String(index + 1).padStart(2, "0")}`,
    registrationNumber: `ФИФ-${String(index + 1).padStart(5, "0")}`,
    serialNumber: `MI-LONG-${String(index + 1).padStart(3, "0")}`,
  })),
];

const manyStandardRecords = [
  ...standardRecords,
  ...Array.from({ length: 12 }, (_, index) => ({
    ...standardRecords[index % standardRecords.length],
    id: `standard-long-${index + 1}`,
    identifier: `STD-LONG-${String(index + 1).padStart(3, "0")}`,
    serialNumber: `SER-LONG-${String(index + 1).padStart(3, "0")}`,
  })),
];

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

export const LongEquipmentList: Story = {
  decorators: [withRuntimeApi({ ...defaultApi, equipment: manyEquipmentRecords })],
};

export const LongMeasuringInstrumentList: Story = {
  args: {
    initialTab: "mi",
  },
  decorators: [withRuntimeApi({ ...defaultApi, measuringInstruments: manyMeasuringInstrumentRecords })],
};

export const LongStandardsList: Story = {
  args: {
    initialTab: "standards",
  },
  decorators: [withRuntimeApi({ ...defaultApi, standards: manyStandardRecords })],
};
