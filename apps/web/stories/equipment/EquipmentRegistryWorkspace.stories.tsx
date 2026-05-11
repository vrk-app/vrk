import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { EquipmentRegistryWorkspace } from "@/features/Stage03Equipment";
import {
  cloneFixture,
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

const diagnosticWithoutStandards = {
  ...cloneFixture(measuringInstrumentRecords[0]),
  id: "mi-without-standards",
  name: "Осциллограф контрольный",
  registrationNumber: "SI-2026-088",
  serialNumber: "OSC-8840",
  standards: [],
};

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

const manyDiagnosticRecords = [
  ...measuringInstrumentRecords,
  ...Array.from({ length: 8 }, (_, index) => ({
    ...measuringInstrumentRecords[index % measuringInstrumentRecords.length],
    id: `diagnostic-long-${index + 1}`,
    name: `Диагностическое оборудование ${String(index + 1).padStart(2, "0")}`,
    registrationNumber: `ФИФ-${String(index + 1).padStart(5, "0")}`,
    serialNumber: `DIAG-LONG-${String(index + 1).padStart(3, "0")}`,
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
    session: runtimeSession,
  },
  argTypes: {
    session: {
      control: false,
    },
  },
} satisfies Meta<typeof EquipmentRegistryWorkspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TechnicalEquipmentList: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      measuringInstruments: [],
      standards: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await expect(await canvas.findByRole("tab", { name: "Оборудование" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tab", { name: "Журнал операций" })).toHaveAttribute("aria-selected", "false");
    await expect(canvas.queryByRole("tab", { name: "Средства измерения" })).toBeNull();
    await expect(canvas.queryByRole("tab", { name: "Эталоны" })).toBeNull();
    await expect(await canvas.findByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeNull();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Новое оборудование" })).toBeNull();
    await userEvent.click(await canvas.findByRole("button", { name: "Добавить оборудование" }));

    const dialog = await body.findByRole("dialog", { name: "Новое оборудование" });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByLabelText("Тип оборудования")).toBeVisible();
  },
};

export const DiagnosticEquipmentWithStandards: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [],
      measuringInstruments: [measuringInstrumentRecords[0]],
    }),
  ],
};

export const DiagnosticEquipmentWithoutStandards: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [],
      measuringInstruments: [diagnosticWithoutStandards],
      standards: [],
    }),
  ],
};

export const DiagnosticEquipmentEditStandards: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [],
      measuringInstruments: [measuringInstrumentRecords[0]],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("button", { name: /Редактировать диагностическое оборудование/ }));
    const dialog = await within(document.body).findByRole("dialog", {
      name: "Редактировать диагностическое оборудование",
    });
    const dialogCanvas = within(dialog);

    await expect(dialogCanvas.getByText("Комплект эталонов")).toBeVisible();
    await expect(dialogCanvas.getByRole("button", { name: "Добавить меру" })).toBeVisible();
    await expect(dialogCanvas.getByRole("button", { name: /Удалить эталон/ })).toBeVisible();
  },
};

export const UnifiedJournal: Story = {
  decorators: [withRuntimeApi(defaultApi)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeVisible();
    await expect(await canvas.findByText("Хронология операций")).toBeVisible();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeNull();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("tab", { name: "Оборудование" })).toHaveAttribute("aria-selected", "true");
    await expect(await canvas.findByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeNull();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Новое оборудование" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Добавить оборудование" })).toBeNull();
    await userEvent.click(canvas.getByRole("tab", { name: "Журнал операций" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeVisible();
    await expect(await canvas.findByText("Хронология операций")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Создать оборудование" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /^Редактировать/ })).toBeNull();
    await expect(canvas.queryByRole("button", { name: /^Архивировать/ })).toBeNull();
    await expect(canvas.queryByText("Редактирование скрыто")).toBeNull();
  },
};

export const ArchiveVisible: Story = {
  args: {
    initialShowArchived: true,
  },
  decorators: [withRuntimeApi(defaultApi)],
};

export const LoadError: Story = {
  decorators: [withRuntimeApi({ ...defaultApi, failurePaths: ["/api/equipment"] })],
};

export const LongEquipmentList: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: manyEquipmentRecords,
      measuringInstruments: manyDiagnosticRecords,
    }),
  ],
};
