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
  photos: [],
  standards: [],
};

const technicalSinglePhoto = {
  ...cloneFixture(equipmentRecords[0]),
  id: "equipment-single-photo",
  fullName: "Вагонный подъемник ВП-22",
  photos: [equipmentRecords[0].photos[0]],
};

const technicalWithoutPhotos = {
  ...cloneFixture(equipmentRecords[0]),
  id: "equipment-without-photos",
  fullName: "Домкрат гидравлический ДГ-50",
  photos: [],
  journalCount: 0,
  latestJournal: undefined,
  nextDueDate: undefined,
};

const archivedTechnicalWithJournal = {
  ...cloneFixture(equipmentRecords[0]),
  id: "equipment-archived-journal",
  archivedAt: "2026-04-18T09:00:00.000Z",
  fullName: "Стенд проверки тяговых редукторов",
  status: "inactive" as const,
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

async function expectUnifiedJournalPassportLayout(
  canvasElement: HTMLElement,
  {
    equipmentName,
    mediaTestId,
  }: {
    equipmentName: string;
    mediaTestId: "equipment-photo-gallery" | "equipment-photo-fallback";
  },
) {
  const canvas = within(canvasElement);
  const equipmentTitle = await canvas.findByRole("heading", { level: 3, name: equipmentName });
  const passportCard = equipmentTitle.closest(".equipment-passport-card");
  if (!(passportCard instanceof HTMLElement)) {
    throw new Error("Journal equipment was not rendered inside an equipment passport card.");
  }

  const layout = passportCard.querySelector(".equipment-passport-layout--with-media");
  if (!(layout instanceof HTMLElement)) {
    throw new Error("Journal passport layout with media was not rendered.");
  }

  const main = passportCard.querySelector(".equipment-passport-main");
  if (!(main instanceof HTMLElement)) {
    throw new Error("Journal passport main column was not rendered.");
  }
  const fullWidth = passportCard.querySelector(".equipment-passport-full");
  if (!(fullWidth instanceof HTMLElement)) {
    throw new Error("Journal timeline was not rendered in the full-width passport row.");
  }

  const cardCanvas = within(passportCard);
  await expect(cardCanvas.getByTestId(mediaTestId)).toBeVisible();
  await expect(cardCanvas.getByText("Реквизиты записи")).toBeVisible();
  await expect(cardCanvas.getByText("Хронология операций")).toBeVisible();
  await expect(cardCanvas.getByText("Область учета")).toBeVisible();

  if (passportCard.querySelector(".equipment-passport-aside")) {
    throw new Error("Journal passport card rendered secondary sections instead of one primary column.");
  }

  const mainText = main.textContent ?? "";
  const requisitesIndex = mainText.indexOf("Реквизиты записи");
  const scopeIndex = mainText.indexOf("Область учета");
  if (requisitesIndex < 0 || scopeIndex < 0) {
    throw new Error("Journal passport main column is missing required sections.");
  }
  if (mainText.includes("Хронология операций")) {
    throw new Error("Journal timeline should be outside the right-side requisites column.");
  }
  if (!(requisitesIndex < scopeIndex)) {
    throw new Error("Journal passport sections are not ordered as requisites, scope.");
  }
  if (!fullWidth.textContent?.includes("Хронология операций")) {
    throw new Error("Journal timeline is missing from the full-width passport row.");
  }

  return { equipmentTitle };
}

async function selectStoryFieldOption(
  canvasElement: HTMLElement,
  fieldLabel: string | RegExp,
  optionName: string | RegExp,
) {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByRole("combobox", { name: fieldLabel }));
  await userEvent.click(await within(document.body).findByRole("option", { name: optionName }));
}

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
    await expect(canvas.getByRole("button", { name: "Показать архив" })).toBeVisible();
    await expect(canvas.queryByText("Только активные")).toBeNull();
    await expect(canvas.queryByText("Активные и архив")).toBeNull();
    await expect(canvas.queryByText(/^Активных:/)).toBeNull();
    await expect(canvas.getByText("Техническое")).toBeVisible();
    const technicalTitle = await canvas.findByRole("heading", { level: 3, name: "Паровой котел PT-400" });
    const technicalTitleLine = technicalTitle.parentElement?.parentElement;
    if (!technicalTitleLine) {
      throw new Error("Technical equipment title line was not rendered.");
    }
    await expect(technicalTitleLine.querySelector(".size-14 .lucide-wrench.size-7")).not.toBeNull();
    const requisitesHeading = await canvas.findByText("Реквизиты записи");
    const requisitesHeadingLine = requisitesHeading.closest("div");
    if (!requisitesHeadingLine) {
      throw new Error("Technical requisites heading line was not rendered.");
    }
    await expect(requisitesHeadingLine.querySelector(".lucide-clipboard-list")).not.toBeNull();
    await expect(requisitesHeadingLine.querySelector(".lucide-wrench")).toBeNull();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeNull();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Новое оборудование" })).toBeNull();
    await userEvent.click(await canvas.findByRole("button", { name: "Добавить оборудование" }));

    const dialog = await body.findByRole("dialog", { name: "Новое оборудование" });
    await expect(dialog).toBeVisible();
    const dialogCanvas = within(dialog);
    await expect(dialogCanvas.getByLabelText("Тип оборудования")).toBeVisible();
    await expect(dialogCanvas.queryByText("Заполните обязательные поля перед созданием.")).toBeNull();
    await expect(dialogCanvas.queryByText("Карточка появится в реестре после сохранения.")).toBeNull();
  },
};

export const TechnicalEquipmentSinglePhoto: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [technicalSinglePhoto],
      measuringInstruments: [],
      standards: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByTestId("equipment-photo-gallery")).toBeVisible();
    await expect(canvas.queryByText("1 фото")).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Показать фото 1/ })).toBeNull();
  },
};

export const TechnicalEquipmentGallery: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [equipmentRecords[0]],
      measuringInstruments: [],
      standards: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByTestId("equipment-photo-gallery")).toBeVisible();
    await expect(canvas.getByText("1/3")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Показать фото 2/ })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Показать фото 2/ }));
    await expect(canvas.getByText("2/3")).toBeVisible();
  },
};

export const TechnicalEquipmentNoPhotoFallback: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [technicalWithoutPhotos],
      measuringInstruments: [],
      standards: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByTestId("equipment-photo-fallback")).toBeVisible();
    await expect(canvas.queryByText("нет фото")).toBeNull();
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeVisible();
    await expect(await canvas.findByTestId("equipment-photo-gallery")).toBeVisible();
    await expect(canvas.getByText("1/3")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Показать фото 2/ })).toBeVisible();
    await expect(canvas.getByText("Диагностическое")).toBeVisible();
    await expect(canvas.getByText("Активно")).toBeVisible();
    const diagnosticTitle = await canvas.findByRole("heading", { level: 3, name: "Расходомер линии подготовки" });
    const diagnosticTitleLine = diagnosticTitle.parentElement?.parentElement;
    if (!diagnosticTitleLine) {
      throw new Error("Diagnostic equipment title line was not rendered.");
    }
    await expect(diagnosticTitleLine.querySelector(".size-14 .lucide-gauge.size-7")).not.toBeNull();
    const requisitesHeading = await canvas.findByText("Реквизиты записи");
    const requisitesHeadingLine = requisitesHeading.closest("div");
    if (!requisitesHeadingLine) {
      throw new Error("Diagnostic requisites heading line was not rendered.");
    }
    await expect(requisitesHeadingLine.querySelector(".lucide-clipboard-list")).not.toBeNull();
    await expect(requisitesHeadingLine.querySelector(".lucide-wrench")).toBeNull();
    const standardsHeading = await canvas.findByText("Эталоны");
    const standardsHeadingLine = standardsHeading.parentElement;
    if (!standardsHeadingLine) {
      throw new Error("Standards heading line was not rendered.");
    }
    await expect(standardsHeading).toBeVisible();
    await expect(standardsHeadingLine).toHaveTextContent(/Эталоны\s*·\s*1/);
    await expect(canvas.queryByText("Эталоны / установочные меры")).toBeNull();
    await expect(canvas.queryByText(/^Эталоны:/)).toBeNull();
  },
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
    await expect(dialogCanvas.queryByText("Редактирование")).toBeNull();
    await expect(dialogCanvas.queryByText("Заполните обязательные поля перед сохранением.")).toBeNull();
    await expect(dialogCanvas.queryByText("Изменения попадут в текущий реестр после сохранения.")).toBeNull();
  },
};

export const DiagnosticEquipmentEditPendingPhotos: Story = {
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
    await userEvent.click(dialogCanvas.getByRole("button", { name: /Удалить фото/ }));

    const file = new File(["equipment-photo"], "new-detector-photo.png", { type: "image/png" });
    await userEvent.upload(dialogCanvas.getByLabelText("Добавить фото"), file);

    await expect(dialogCanvas.getByText("Будет удалено")).toBeVisible();
    await expect(dialogCanvas.getByText("Новое")).toBeVisible();
  },
};

export const UnifiedJournal: Story = {
  decorators: [withRuntimeApi(defaultApi)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await expect(await canvas.findByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeVisible();
    const { equipmentTitle: journalEquipmentTitle } = await expectUnifiedJournalPassportLayout(canvasElement, {
      equipmentName: "Паровой котел PT-400",
      mediaTestId: "equipment-photo-gallery",
    });
    const journalEquipmentTitleLine = journalEquipmentTitle.parentElement?.parentElement;
    if (!journalEquipmentTitleLine) {
      throw new Error("Journal equipment title line was not rendered.");
    }
    await expect(journalEquipmentTitleLine.querySelector(".size-14 .lucide-wrench.size-7")).not.toBeNull();
    await expect(canvas.getByText("1/3")).toBeVisible();
    await expect(canvas.getByText("Техническое")).toBeVisible();
    await expect(canvas.getByText("Активно")).toBeVisible();
    await expect(canvas.queryByLabelText("Тип операции")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Добавить запись журнала" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Добавить запись журнала" }));
    const dialog = await body.findByRole("dialog", { name: "Новая запись журнала" });
    const dialogCanvas = within(dialog);

    await expect(dialogCanvas.getByLabelText("Оборудование")).toBeVisible();
    await expect(dialogCanvas.getByLabelText("Тип операции")).toBeVisible();
    await expect(dialogCanvas.getByLabelText("Оборудование")).toHaveTextContent("Техническое");
    await expect(dialogCanvas.queryByText("Новая операция")).toBeNull();
    await expect(dialogCanvas.queryByText("Запись попадет в журнал выбранного оборудования.")).toBeNull();
    await expect(dialogCanvas.queryByText("Выберите оборудование и заполните обязательные поля.")).toBeNull();
    await expect(dialogCanvas.queryByText("История и производный статус обновятся после сохранения.")).toBeNull();
  },
};

export const UnifiedJournalDiagnosticTarget: Story = {
  decorators: [withRuntimeApi(defaultApi)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await selectStoryFieldOption(canvasElement, "Оборудование", /Диагностическое.*Расходомер линии подготовки/);
    await expectUnifiedJournalPassportLayout(canvasElement, {
      equipmentName: "Расходомер линии подготовки",
      mediaTestId: "equipment-photo-gallery",
    });
    await expect(canvas.getByText("Диагностическое")).toBeVisible();
    await expect(await canvas.findByText("СВ-2026-041")).toBeVisible();
  },
};

export const UnifiedJournalNoPhotoEmpty: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [],
      journals: [],
      measuringInstruments: [diagnosticWithoutStandards],
      standards: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await expectUnifiedJournalPassportLayout(canvasElement, {
      equipmentName: "Осциллограф контрольный",
      mediaTestId: "equipment-photo-fallback",
    });
    await expect(canvas.queryByText("нет фото")).toBeNull();
    await expect(await canvas.findByText("Журнал пока пуст")).toBeVisible();
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
    await expectUnifiedJournalPassportLayout(canvasElement, {
      equipmentName: "Паровой котел PT-400",
      mediaTestId: "equipment-photo-gallery",
    });
    await expect(canvas.getByText("Техническое")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Создать оборудование" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Добавить запись журнала" })).toBeNull();
    await expect(within(document.body).queryByRole("dialog", { name: "Новая запись журнала" })).toBeNull();
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

export const ArchivedJournalReadonly: Story = {
  args: {
    initialShowArchived: true,
  },
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      equipment: [archivedTechnicalWithJournal],
      measuringInstruments: [],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await expectUnifiedJournalPassportLayout(canvasElement, {
      equipmentName: "Стенд проверки тяговых редукторов",
      mediaTestId: "equipment-photo-gallery",
    });
    await expect(canvas.getByText("В архиве")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Добавить запись журнала" })).toBeNull();
  },
};

export const JournalCreateFailure: Story = {
  decorators: [
    withRuntimeApi({
      ...defaultApi,
      failurePaths: [`/api/equipment/${equipmentRecords[0].id}/journals`],
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await userEvent.click(await canvas.findByRole("tab", { name: "Журнал операций" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Добавить запись журнала" }));
    const dialog = await body.findByRole("dialog", { name: "Новая запись журнала" });
    const dialogCanvas = within(dialog);
    await userEvent.clear(dialogCanvas.getByLabelText("Дата операции"));
    await userEvent.type(dialogCanvas.getByLabelText("Дата операции"), "2026-03-12");
    await userEvent.type(dialogCanvas.getByLabelText("Документ", { exact: true }), "TECH-ERR-001");
    await userEvent.type(dialogCanvas.getByLabelText("Организация-исполнитель"), "Служба главного механика");
    await userEvent.click(dialogCanvas.getByRole("button", { name: "Добавить запись журнала" }));
    await expect(await body.findByText("Не удалось добавить запись в журнал оборудования.")).toBeVisible();
  },
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
