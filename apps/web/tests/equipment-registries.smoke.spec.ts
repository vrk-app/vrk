import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const backendBaseUrl =
  process.env.WEB_SMOKE_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:18080";
const platformAdminSecret = process.env.PLATFORM_ADMIN_SHARED_SECRET ?? "stage03-platform-admin-secret";

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type SessionSummaryResponse = {
  sessionToken: string;
  organization: {
    id: string;
    name: string;
  };
  units: Array<{
    id: string;
    name: string;
  }>;
};

type OrganizationShellResponse = {
  inviteToken: string;
};

type EmployeeInviteResponse = {
  id: string;
  inviteToken?: string;
};

type EquipmentRecord = {
  id: string;
  fullName: string;
};

type StandardRecord = {
  id: string;
  identifier: string;
};

type JournalRecord = {
  id: string;
  documentNumber: string;
};

type MeasuringInstrumentRecord = {
  id: string;
  name: string;
  registrationNumber: string;
  status: "active" | "inactive" | "retired";
  standards: Array<{
    id: string;
    identifier: string;
  }>;
  nextDueDate?: string;
  journalCount: number;
};

async function backend<T>(
  request: APIRequestContext,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
    platformAdmin?: boolean;
  } = {},
) {
  const response = await request.fetch(`${backendBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.platformAdmin ? { "X-VRK-Platform-Admin-Secret": platformAdminSecret } : {}),
    },
    data: options.body,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${JSON.stringify(payload)}`);
  }

  return payload.data;
}

async function expectBackendFailure(
  request: APIRequestContext,
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
  },
) {
  const response = await request.fetch(`${backendBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    data: options.body,
  });
  const payload = (await response.json()) as ApiEnvelope<unknown>;

  expect(response.ok(), `${options.method ?? "GET"} ${path} should fail`).toBe(false);
  expect(payload.success).toBe(false);
}

async function bootstrapOrg(
  request: APIRequestContext,
  options: {
    label: string;
    role: "customer" | "contractor";
  },
) {
  const email = `${options.label}@vrk.local`;
  const password = `stage03-${options.label}-secret`;
  const organizationName = `ВРК ${options.label}`;

  const created = await backend<OrganizationShellResponse>(request, "/api/v1/platform/organization-shells", {
    method: "POST",
    platformAdmin: true,
    body: {
      organizationName,
      organizationRole: options.role,
      firstAdminName: `${options.label} admin`,
      firstAdminEmail: email,
    },
  });

  await backend(request, `/api/v1/first-admin-invites/${created.inviteToken}`, { method: "GET" });

  const accepted = await backend<SessionSummaryResponse>(
    request,
    `/api/v1/first-admin-invites/${created.inviteToken}/accept`,
    {
      method: "POST",
      body: { password },
    },
  );

  const launched = await backend<SessionSummaryResponse>(request, "/api/v1/launch-wizard", {
    method: "POST",
    token: accepted.sessionToken,
    body: {
      organizationName,
      propertyType: "ООО",
      inn: "1234567890",
      kpp: "123456789",
      legalAddress: "г. Москва, ул. Тестовая, д. 1",
      contactEmail: email,
      contactPhone: "+7 (999) 123-45-67",
      structureMode: "division",
      division: {
        type: "Дивизион",
        name: `${options.label} division`,
      },
      unit: {
        type: "ВРД",
        name: `${options.label} unit`,
      },
    },
  });

  return {
    email,
    password,
    organizationName,
    sessionToken: launched.sessionToken,
    unit: launched.units[0],
  };
}

async function createScopedEmployee(
  request: APIRequestContext,
  admin: {
    sessionToken: string;
    unit: {
      id: string;
      name: string;
    };
  },
  seed: string,
) {
  const email = `equipment-employee-${seed}@vrk.local`;
  const password = `stage03-equipment-employee-${seed}`;

  const created = await backend<EmployeeInviteResponse>(request, "/api/v1/employee-invites", {
    method: "POST",
    token: admin.sessionToken,
    body: {
      fullName: `Equipment Employee ${seed}`,
      email,
      roleTemplate: "unit_operator",
      scopeType: "unit",
      scopeId: admin.unit.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  const sent = await backend<EmployeeInviteResponse>(
    request,
    `/api/v1/employee-invites/${created.id}/send`,
    {
      method: "POST",
      token: admin.sessionToken,
    },
  );

  if (!sent.inviteToken) {
    throw new Error("employee invite token missing after send");
  }

  await backend(request, `/api/v1/invites/${sent.inviteToken}`, { method: "GET" });
  await backend<SessionSummaryResponse>(request, `/api/v1/invites/${sent.inviteToken}/accept`, {
    method: "POST",
    body: { password },
  });

  return { email, password };
}

async function createEquipmentSeed(
  request: APIRequestContext,
  token: string,
  unitId: string,
  seed: string,
  fullName: string,
) {
  return backend<EquipmentRecord>(request, "/api/v1/equipment", {
    method: "POST",
    token,
    body: {
      unitId,
      manufacturer: "Трансмаш",
      classification: "Резерв",
      model: "ARCHIVE-01",
      fullName,
      factoryNumber: `FAC-${seed}-${fullName.length}`,
      inventoryNumber: `INV-${seed}-${fullName.length}`,
      manufactureYear: 2021,
      status: "active",
      comment: "Seeded archive candidate",
    },
  });
}

async function createMeasuringInstrumentSeed(
  request: APIRequestContext,
  token: string,
  unitId: string,
  seed: string,
  name: string,
) {
  const nameCode = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return backend<MeasuringInstrumentRecord>(request, "/api/v1/measuring-instruments", {
    method: "POST",
    token,
    body: {
      unitId,
      placementKind: "standalone",
      name,
      instrumentType: "Диагностическое",
      model: "DIAG-ARCHIVE",
      registrationNumber: `DIAG-${seed}-${nameCode}`,
      serialNumber: `SER-${seed}-${nameCode}`,
      standardIds: [],
    },
  });
}

async function createDiagnosticStandardSeed(
  request: APIRequestContext,
  token: string,
  diagnosticEquipmentId: string,
  seed: string,
  identifier: string,
) {
  return backend<StandardRecord>(request, `/api/v1/measuring-instruments/${diagnosticEquipmentId}/standards`, {
    method: "POST",
    token,
    body: {
      standardType: "Установочная мера",
      model: "STD-OWNED",
      identifier,
      serialNumber: `STD-SER-${seed}`,
      metrologicalCharacteristics: `0.2 В, ${seed}`,
    },
  });
}

async function createMIJournalSeed(request: APIRequestContext, token: string, measuringInstrumentId: string, seed: string) {
  return backend<JournalRecord>(request, `/api/v1/measuring-instruments/${measuringInstrumentId}/journals`, {
    method: "POST",
    token,
    body: {
      operationType: "verification",
      operationDate: "2026-03-01",
      documentNumber: `MI-ARCH-JOURNAL-${seed}`,
      validUntil: "2026-11-30",
      executorOrganization: "ФБУ Ростест-Москва",
      comment: "Архивная история диагностического оборудования",
    },
  });
}

async function confirmArchiveModal(page: Page) {
  await page
    .getByRole("dialog", { name: "Архивировать запись?" })
    .getByRole("button", { name: "Архивировать", exact: true })
    .click();
}

async function selectFieldOption(page: Page, fieldLabel: string | RegExp, optionName: string | RegExp) {
  await page.getByRole("combobox", { name: fieldLabel, exact: typeof fieldLabel === "string" }).click();
  await page.getByRole("option", { name: optionName, exact: typeof optionName === "string" }).click();
}

const obsoleteStandaloneHeadings = [
  ["Эталоны", "в учете"].join(" "),
  ["Средства", "измерения", "в учете"].join(" "),
  ["Журнал", "операций", "по эталонам"].join(" "),
];

async function expectNoStandaloneMetrologySurfaces(page: Page) {
  for (const heading of obsoleteStandaloneHeadings) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toHaveCount(0);
  }
}

test.describe("stage 03 unified equipment workspace", () => {
  test("customer admin uses one /equipment surface with owned standards while scoped and contractor access stay bounded", async ({
    page,
    request,
  }) => {
    const seed = Date.now().toString();
    const admin = await bootstrapOrg(request, {
      label: `equipment-admin-${seed}`,
      role: "customer",
    });
    const employee = await createScopedEmployee(request, admin, seed);
    const contractor = await bootstrapOrg(request, {
      label: `equipment-contractor-${seed}`,
      role: "contractor",
    });

    const equipmentName = `Насос Питательный ${seed}`;
    const updatedEquipmentName = `Насос Питательный обновлен ${seed}`;
    const diagnosticName = `Манометр диагностический ${seed}`;
    const updatedDiagnosticName = `Манометр диагностический обновлен ${seed}`;
    const diagnosticStandardOne = `STD-OWNED-A-${seed}`;
    const diagnosticStandardTwo = `STD-OWNED-B-${seed}`;
    const diagnosticStandardThree = `STD-OWNED-C-${seed}`;
    const archiveEquipmentName = `Оборудование в архив ${seed}`;
    const archiveInstrumentName = `Диагностическое в архив ${seed}`;
    const archiveStandardIdentifier = `STD-ARCHIVE-${seed}`;
    const reuseStandardIdentifier = `STD-REUSE-${seed}`;
    const deleteStandardKeepIdentifier = `STD-DELETE-KEEP-${seed}`;
    const deleteStandardRemoveIdentifier = `STD-DELETE-REMOVE-${seed}`;

    const archiveEquipment = await createEquipmentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      archiveEquipmentName,
    );
    const archiveInstrument = await createMeasuringInstrumentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      archiveInstrumentName,
    );
    const archivedInstrumentStandard = await createDiagnosticStandardSeed(
      request,
      admin.sessionToken,
      archiveInstrument.id,
      seed,
      archiveStandardIdentifier,
    );
    await createMIJournalSeed(request, admin.sessionToken, archiveInstrument.id, seed);
    const journaledInstrument = await backend<MeasuringInstrumentRecord>(
      request,
      `/api/v1/measuring-instruments/${archiveInstrument.id}`,
      { token: admin.sessionToken },
    );
    expect(journaledInstrument.status).toBe("active");
    expect(journaledInstrument.nextDueDate).toBe("2026-11-30");
    expect(journaledInstrument.journalCount).toBeGreaterThan(0);

    const reuseSource = await createMeasuringInstrumentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      `Диагностическое источник ${seed}`,
    );
    const ownedStandard = await createDiagnosticStandardSeed(
      request,
      admin.sessionToken,
      reuseSource.id,
      seed,
      reuseStandardIdentifier,
    );
    const reuseTarget = await createMeasuringInstrumentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      `Диагностическое цель ${seed}`,
    );
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${reuseTarget.id}`, {
      method: "PATCH",
      token: admin.sessionToken,
      body: {
        standardIds: [ownedStandard.id],
      },
    });
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${reuseTarget.id}/standards/${ownedStandard.id}`, {
      method: "DELETE",
      token: admin.sessionToken,
    });

    const deleteSource = await createMeasuringInstrumentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      `Диагностическое удаление ${seed}`,
    );
    const deleteKeepStandard = await createDiagnosticStandardSeed(
      request,
      admin.sessionToken,
      deleteSource.id,
      seed,
      deleteStandardKeepIdentifier,
    );
    const deleteRemoveStandard = await createDiagnosticStandardSeed(
      request,
      admin.sessionToken,
      deleteSource.id,
      seed,
      deleteStandardRemoveIdentifier,
    );
    const readonlySession = await backend<SessionSummaryResponse>(request, "/api/v1/sessions", {
      method: "POST",
      body: {
        email: employee.email,
        password: employee.password,
      },
    });
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${deleteSource.id}/standards/${deleteRemoveStandard.id}`, {
      method: "DELETE",
      token: readonlySession.sessionToken,
    });
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${deleteSource.id}/standards/${deleteRemoveStandard.id}`, {
      method: "DELETE",
      token: contractor.sessionToken,
    });
    await backend<{ id: string }>(
      request,
      `/api/v1/measuring-instruments/${deleteSource.id}/standards/${deleteRemoveStandard.id}`,
      {
        method: "DELETE",
        token: admin.sessionToken,
      },
    );
    const afterStandardDelete = await backend<MeasuringInstrumentRecord>(
      request,
      `/api/v1/measuring-instruments/${deleteSource.id}`,
      { token: admin.sessionToken },
    );
    expect(afterStandardDelete.standards.some((standard) => standard.id === deleteRemoveStandard.id)).toBe(false);
    expect(afterStandardDelete.standards.some((standard) => standard.id === deleteKeepStandard.id)).toBe(true);

    await backend(request, `/api/v1/equipment/${archiveEquipment.id}/archive`, {
      method: "POST",
      token: admin.sessionToken,
    });
    await backend(request, `/api/v1/measuring-instruments/${archiveInstrument.id}/archive`, {
      method: "POST",
      token: admin.sessionToken,
    });
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${archiveInstrument.id}/standards`, {
      method: "POST",
      token: admin.sessionToken,
      body: {
        standardType: "Установочная мера",
        model: "STD-ARCHIVE-BLOCKED",
        identifier: `STD-BLOCKED-${seed}`,
        metrologicalCharacteristics: "0.1 мм",
      },
    });
    await expectBackendFailure(
      request,
      `/api/v1/measuring-instruments/${archiveInstrument.id}/standards/${archivedInstrumentStandard.id}`,
      {
        method: "DELETE",
        token: admin.sessionToken,
      },
    );
    await expectBackendFailure(request, `/api/v1/measuring-instruments/${archiveInstrument.id}/journals`, {
      method: "POST",
      token: admin.sessionToken,
      body: {
        operationType: "verification",
        operationDate: "2026-04-01",
        documentNumber: `MI-ARCH-BLOCKED-${seed}`,
        validUntil: "2026-12-01",
        executorOrganization: "ФБУ Ростест-Москва",
      },
    });
    const archivedHistory = await backend<JournalRecord[]>(
      request,
      `/api/v1/measuring-instruments/${archiveInstrument.id}/journals`,
      { token: admin.sessionToken },
    );
    expect(archivedHistory.some((entry) => entry.documentNumber === `MI-ARCH-JOURNAL-${seed}`)).toBe(true);

    await page.goto("/login?logout=1");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Корпоративная почта").fill(admin.email);
    await page.getByLabel(/^Пароль$/).fill(admin.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.goto("/equipment");

    await expect(page.getByRole("heading", { level: 1, name: "Оборудование" })).toBeVisible();
    await expect(page.getByText("Управление реестром").first()).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Разделы оборудования" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Оборудование" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Журнал операций" })).toHaveAttribute("aria-selected", "false");
    await expect(page.getByRole("tab", { name: "Средства измерения" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Эталоны" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Новое оборудование" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Добавить оборудование" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toHaveCount(0);
    await expectNoStandaloneMetrologySurfaces(page);

    await page.getByRole("button", { name: "Добавить оборудование" }).click();
    const equipmentCreateDialog = page.getByRole("dialog", { name: "Новое оборудование" });
    await expect(equipmentCreateDialog).toBeVisible();
    await expect(equipmentCreateDialog.getByLabel("Тип оборудования")).toBeVisible();
    await page.getByLabel("Тип оборудования").click();
    await expect(page.getByRole("option", { name: "Техническое" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Диагностическое" })).toBeVisible();
    await page.keyboard.press("Escape");

    await equipmentCreateDialog.getByLabel("Производитель").fill("Трансмаш");
    await equipmentCreateDialog.getByLabel("Класс / тип").fill("Насос");
    await equipmentCreateDialog.getByLabel("Модель").first().fill("НП-01");
    await equipmentCreateDialog.getByLabel("Полное наименование").fill(equipmentName);
    await equipmentCreateDialog.getByLabel("Заводской номер").fill(`FAC-${seed}`);
    await equipmentCreateDialog.getByRole("button", { name: "Создать оборудование" }).click();
    await expect(equipmentCreateDialog).toHaveCount(0);
    await expect(page.getByText("Техническое оборудование создано и появилось в учете.", { exact: true })).toBeVisible();
    await expect(page.getByText(equipmentName).first()).toBeVisible();
    await expect(page.getByText("Техническое").first()).toBeVisible();

    await page.setViewportSize({ height: 844, width: 390 });
    await page.getByRole("button", { name: `Редактировать оборудование ${equipmentName}` }).click();
    const equipmentEditDialog = page.getByRole("dialog", { name: "Редактировать оборудование" });
    await expect(equipmentEditDialog).toBeVisible();
    await equipmentEditDialog.getByLabel("Полное наименование").fill(updatedEquipmentName);
    await equipmentEditDialog.getByLabel("Инвентарный номер").fill(`INV-EDIT-${seed}`);
    await equipmentEditDialog.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(page.getByText("Оборудование обновлено.", { exact: true })).toBeVisible();
    await expect(page.getByText(updatedEquipmentName).first()).toBeVisible();
    await page.setViewportSize({ height: 720, width: 1280 });

    await page.getByRole("button", { name: "Добавить оборудование" }).click();
    const diagnosticCreateDialog = page.getByRole("dialog", { name: "Новое оборудование" });
    await expect(diagnosticCreateDialog).toBeVisible();
    await selectFieldOption(page, "Тип оборудования", "Диагностическое");
    await diagnosticCreateDialog.getByLabel("Наименование").fill(diagnosticName);
    await diagnosticCreateDialog.getByLabel("Тип / класс").fill("Манометр");
    await diagnosticCreateDialog.getByLabel("Модель").first().fill("MN-12");
    await diagnosticCreateDialog.getByLabel("ФИФ").fill(`DIAG-${seed}`);
    await diagnosticCreateDialog.getByLabel("Серийный номер").fill(`SER-${seed}`);
    await diagnosticCreateDialog.getByRole("button", { name: "Добавить меру" }).click();
    await diagnosticCreateDialog.getByRole("button", { name: "Добавить меру" }).click();
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-type-"]').nth(0).fill("Кольцо установочное");
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-model-"]').nth(0).fill("КУ-25");
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-identifier-"]').nth(0).fill(diagnosticStandardOne);
    await diagnosticCreateDialog.locator('textarea[name^="diagnostic-standard-characteristics-"]').nth(0).fill("25 мм, класс 0.01");
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-type-"]').nth(1).fill("Скоба контрольная");
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-model-"]').nth(1).fill("СК-40");
    await diagnosticCreateDialog.locator('input[name^="diagnostic-standard-identifier-"]').nth(1).fill(diagnosticStandardTwo);
    await diagnosticCreateDialog.locator('textarea[name^="diagnostic-standard-characteristics-"]').nth(1).fill("40 мм, класс 0.01");
    await diagnosticCreateDialog.getByRole("button", { name: "Создать оборудование" }).click();
    await expect(diagnosticCreateDialog).toHaveCount(0);
    await expect(page.getByText("Диагностическое оборудование создано с комплектом эталонов.", { exact: true })).toBeVisible();
    await expect(page.getByText(diagnosticName).first()).toBeVisible();
    await expect(page.getByText("Эталоны: 2").first()).toBeVisible();
    await expect(page.getByText(diagnosticStandardOne).first()).toBeVisible();
    await expect(page.getByText(diagnosticStandardTwo).first()).toBeVisible();

    await page.getByRole("button", { name: `Редактировать диагностическое оборудование ${diagnosticName}` }).click();
    const diagnosticEditDialog = page.getByRole("dialog", { name: "Редактировать диагностическое оборудование" });
    await expect(diagnosticEditDialog).toBeVisible();
    await diagnosticEditDialog.getByLabel("Наименование").fill(updatedDiagnosticName);
    await diagnosticEditDialog.getByRole("button", { name: "Добавить меру" }).click();
    await diagnosticEditDialog.locator('input[name^="edit-diagnostic-standard-type-"]').fill("Шаблон контрольный");
    await diagnosticEditDialog.locator('input[name^="edit-diagnostic-standard-model-"]').fill("ШК-60");
    await diagnosticEditDialog.locator('input[name^="edit-diagnostic-standard-identifier-"]').fill(diagnosticStandardThree);
    await diagnosticEditDialog
      .locator('textarea[name^="edit-diagnostic-standard-characteristics-"]')
      .fill("60 мм, класс 0.02");
    await diagnosticEditDialog.getByRole("button", { name: `Удалить эталон ${diagnosticStandardOne}` }).click();
    await expect(diagnosticEditDialog.getByText("К удалению отмечено: 1.")).toBeVisible();
    await diagnosticEditDialog.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(page.getByText("Диагностическое оборудование обновлено.", { exact: true })).toBeVisible();
    await expect(page.getByText(updatedDiagnosticName).first()).toBeVisible();
    await expect(page.getByText("Эталоны: 2").first()).toBeVisible();
    await expect(page.getByText(diagnosticStandardOne)).toHaveCount(0);
    await expect(page.getByText(diagnosticStandardTwo).first()).toBeVisible();
    await expect(page.getByText(diagnosticStandardThree).first()).toBeVisible();

    await page.getByRole("tab", { name: "Журнал операций" }).click();
    await expect(page.getByRole("tab", { name: "Журнал операций" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeVisible();
    await selectFieldOption(page, "Оборудование", `${updatedDiagnosticName} • DIAG-${seed}`);
    await selectFieldOption(page, "Тип операции", "Поверка");
    await page.getByLabel("Дата операции").fill("2026-03-12");
    await page.getByLabel("Документ", { exact: true }).fill(`EQ-DOC-${seed}`);
    await page.getByLabel("Действует до").fill("2026-12-31");
    await page.getByLabel("Организация-исполнитель").fill("ФБУ Ростест-Москва");
    await page.getByRole("button", { name: "Добавить запись журнала" }).click();
    await expect(
      page.getByText("Запись журнала сохранена. Производный статус и ближайшая дата пересчитаны.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(`EQ-DOC-${seed}`).first()).toBeVisible();
    await expect(page.getByText(/Текущий статус: Активно/).first()).toBeVisible();

    await page.goto("/equipment?tab=standards");
    await expect(page).toHaveURL(/\/equipment$/);
    await expect(page.getByRole("tablist", { name: "Разделы оборудования" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Оборудование" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Средства измерения" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Эталоны" })).toHaveCount(0);
    await expectNoStandaloneMetrologySurfaces(page);

    await page.goto("/equipment?tab=mi&archived=1");
    await expect(page).toHaveURL(/\/equipment\?archived=1$/);
    await expect(page.getByRole("button", { name: "Архив показан" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(archiveEquipmentName).first()).toBeVisible();
    await expect(page.getByText(archiveInstrumentName).first()).toBeVisible();
    await expect(page.getByText(archiveStandardIdentifier).first()).toBeVisible();
    await expect(page.getByRole("button", { name: `Редактировать оборудование ${archiveEquipmentName}` })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Редактировать диагностическое оборудование ${archiveInstrumentName}` })).toHaveCount(0);

    await page.goto("/equipment");
    await page.getByRole("tab", { name: "Журнал операций" }).click();
    await selectFieldOption(page, "Оборудование", `${updatedDiagnosticName} • DIAG-${seed}`);
    await page.getByRole("button", { name: "Архивировать выбранное оборудование" }).click();
    await confirmArchiveModal(page);
    await expect(
      page.getByText("Диагностическое оборудование переведено в архив и убрано из активного списка.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText(updatedDiagnosticName)).toHaveCount(0);

    await page.goto("/login?logout=1");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { level: 2, name: "Новое оборудование" })).toHaveCount(0);
    await expect(page.getByRole("tablist", { name: "Разделы оборудования" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Оборудование" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { level: 2, name: "Оборудование в учете" })).toBeVisible();
    await expect(page.getByText(updatedEquipmentName).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toHaveCount(0);
    await page.getByRole("tab", { name: "Журнал операций" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Журнал операций по оборудованию" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Хронология операций" })).toBeVisible();
    await expect(page.getByText("Редактирование скрыто")).toHaveCount(0);
    await expect(page.getByLabel("Тип оборудования")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Создать оборудование" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Добавить оборудование" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Редактировать/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Архивировать/ })).toHaveCount(0);
    await page.getByRole("tab", { name: "Оборудование" }).click();
    await expect(page.getByRole("button", { name: "Показать архив" })).toBeVisible();

    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByText(archiveEquipmentName).first()).toBeVisible();
    await expect(page.getByText(archiveInstrumentName).first()).toBeVisible();

    await page.goto("/login?logout=1");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Корпоративная почта").fill(contractor.email);
    await page.getByLabel(/^Пароль$/).fill(contractor.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { level: 1, name: "Оборудование недоступно в текущей области" })).toBeVisible();
    await expect(page.getByText("Раздел закрыт для подрядчика")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Оборудование в учете" })).toHaveCount(0);
  });
});
