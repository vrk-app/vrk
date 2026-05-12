import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
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

const longStructureSession = {
  ...runtimeSession,
  divisions: [
    ...runtimeSession.divisions,
    ...Array.from({ length: 10 }, (_, index) => ({
      ...runtimeSession.divisions[index % runtimeSession.divisions.length],
      id: `division-long-${index + 1}`,
      name: `Производственный дивизион ${String(index + 1).padStart(2, "0")}`,
      region: index % 2 === 0 ? "Москва" : "Санкт-Петербург",
    })),
  ],
  units: [
    ...runtimeSession.units,
    ...Array.from({ length: 12 }, (_, index) => ({
      ...runtimeSession.units[index % runtimeSession.units.length],
      divisionId: runtimeSession.divisions[index % runtimeSession.divisions.length]?.id,
      id: `unit-long-${index + 1}`,
      name: `Участок эксплуатации ${String(index + 1).padStart(2, "0")}`,
      region: index % 2 === 0 ? "Москва" : "Ленинградская область",
    })),
  ],
} satisfies typeof runtimeSession;

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(await canvas.findByRole("tab", { name: "Дивизионы" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Активные дивизионы" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Новый дивизион" })).toBeNull();

    await userEvent.click(await canvas.findByRole("button", { name: "Создать дивизион" }));
    const dialog = await body.findByRole("dialog", { name: "Новый дивизион" });
    await expect(dialog).toBeVisible();
    await expect(within(dialog).getByLabelText("Наименование")).toBeVisible();
    await expect(within(dialog).queryByText("Заполните обязательные поля перед созданием.")).toBeNull();
    await expect(within(dialog).queryByText("Запись появится в текущей структуре после сохранения.")).toBeNull();
    await userEvent.click(within(dialog).getByRole("button", { name: "Отмена" }));
  },
};

export const OrganizationAdminEditDialog: Story = {
  decorators: [withRuntimeApi({ session: runtimeSession })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(await canvas.findByRole("tab", { name: "Дивизионы" }));
    await userEvent.click(await canvas.findByRole("button", { name: /^Редактировать дивизион/ }));
    const editDialog = await body.findByRole("dialog", { name: "Редактировать дивизион" });
    await expect(editDialog).toBeVisible();
    await expect(within(editDialog).getByLabelText("Наименование")).toBeVisible();
    await expect(within(editDialog).queryByText("Редактирование")).toBeNull();
    await expect(within(editDialog).queryByText("Заполните обязательные поля перед сохранением.")).toBeNull();
    await expect(within(editDialog).queryByText("Изменения попадут в текущую структуру после сохранения.")).toBeNull();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Дивизионы" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Активные дивизионы" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Создать дивизион" })).toBeNull();
    await userEvent.click(await canvas.findByRole("tab", { name: "Юниты" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Активные юниты" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Создать юнит" })).toBeNull();
  },
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

export const DivisionsLongList: Story = {
  args: {
    initialSession: longStructureSession,
  },
  decorators: [withRuntimeApi({ session: longStructureSession })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Дивизионы" }));
    await expect(await canvas.findByText("Производственный дивизион 10")).toBeVisible();
  },
};
