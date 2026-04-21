import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:18080";
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

type MeasuringInstrumentRecord = {
  id: string;
  name: string;
};

async function backend<T>(
  request: APIRequestContext,
  path: string,
  options: {
    method?: "GET" | "POST";
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
      structureMode: "subdivision",
      subdivision: {
        type: "Филиал",
        name: `${options.label} subdivision`,
      },
      unit: {
        type: "Юнит",
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

async function createStandardSeed(
  request: APIRequestContext,
  token: string,
  unitId: string,
  seed: string,
  identifier: string,
) {
  return backend<StandardRecord>(request, "/api/v1/standards", {
    method: "POST",
    token,
    body: {
      unitId,
      standardType: "Эталон напряжения",
      model: "STD-ARCHIVE",
      identifier,
      metrologicalCharacteristics: `0.2 В, ${seed}`,
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
  return backend<MeasuringInstrumentRecord>(request, "/api/v1/measuring-instruments", {
    method: "POST",
    token,
    body: {
      unitId,
      placementKind: "standalone",
      name,
      instrumentType: "Термометр",
      model: "MI-ARCHIVE",
      registrationNumber: `MI-ARCH-${seed}`,
      serialNumber: `SER-ARCH-${seed}`,
      standardIds: [],
    },
  });
}

async function createMIJournalSeed(request: APIRequestContext, token: string, measuringInstrumentId: string, seed: string) {
  return backend(request, `/api/v1/measuring-instruments/${measuringInstrumentId}/journals`, {
    method: "POST",
    token,
    body: {
      operationType: "verification",
      operationDate: "2026-03-01",
      documentNumber: `MI-ARCH-JOURNAL-${seed}`,
      validUntil: "2026-11-30",
      executorOrganization: "ФБУ Ростест-Москва",
      comment: "Архивная история СИ",
    },
  });
}

async function createStandardJournalSeed(request: APIRequestContext, token: string, standardId: string, seed: string) {
  return backend(request, `/api/v1/standards/${standardId}/journals`, {
    method: "POST",
    token,
    body: {
      operationType: "verification",
      operationDate: "2026-03-05",
      documentNumber: `STD-ARCH-JOURNAL-${seed}`,
      validUntil: "2026-12-15",
      executorOrganization: "ФБУ Ростест-Москва",
      comment: "Архивная история эталона",
    },
  });
}

function acceptNextArchiveConfirmation(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
}

test.describe("stage 03 metrology journals and archive contour", () => {
  test("customer admin uses one /equipment route for journals and archive while unit user stays read-only", async ({
    page,
    request,
  }) => {
    const seed = Date.now().toString();
    const admin = await bootstrapOrg(request, {
      label: `equipment-admin-${seed}`,
      role: "customer",
    });
    const employee = await createScopedEmployee(request, admin, seed);

    const equipmentName = `Насос Питательный ${seed}`;
    const standardIdentifier = `STD-${seed}`;
    const instrumentName = `Манометр ${seed}`;
    const archiveEquipmentName = `Оборудование в архив ${seed}`;
    const archiveStandardIdentifier = `STD-ARCHIVE-${seed}`;
    const archiveInstrumentName = `Термометр архив ${seed}`;

    const archiveEquipment = await createEquipmentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      archiveEquipmentName,
    );
    const archiveStandard = await createStandardSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      archiveStandardIdentifier,
    );
    const archiveInstrument = await createMeasuringInstrumentSeed(
      request,
      admin.sessionToken,
      admin.unit.id,
      seed,
      archiveInstrumentName,
    );
    await createMIJournalSeed(request, admin.sessionToken, archiveInstrument.id, seed);
    await createStandardJournalSeed(request, admin.sessionToken, archiveStandard.id, seed);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(admin.email);
    await page.getByLabel("Пароль").fill(admin.password);
    await page.getByRole("button", { name: "Войти и открыть рабочий contour" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.goto("/equipment");

    await expect(page.getByRole("heading", { level: 1, name: "Оборудование, средства измерения и эталоны" })).toBeVisible();
    await expect(page.getByText("`/equipment` keeps one public contour")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Оборудование/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Средства измерения/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Эталоны/ })).toBeVisible();

    await page.getByLabel("Производитель").fill("Трансмаш");
    await page.getByLabel("Класс / тип").fill("Насос");
    await page.getByLabel("Модель").first().fill("НП-01");
    await page.getByLabel("Полное наименование").fill(equipmentName);
    await page.getByLabel("Заводской номер").fill(`FAC-${seed}`);
    await page.getByRole("button", { name: "Создать оборудование" }).click();
    await expect(page.getByText("Equipment record создан и появился в реестре.")).toBeVisible();
    await expect(page.getByText(equipmentName).first()).toBeVisible();

    await page.goto("/equipment?tab=standards");
    await expect(page).toHaveURL(/\/equipment\?tab=standards$/);
    await page.getByLabel("Ownership scope").selectOption("unit");
    await page.getByLabel("Тип эталона").fill("Эталон давления");
    await page.getByLabel("Модель").first().fill("ED-77");
    await page.getByLabel("Идентификатор").fill(standardIdentifier);
    await page.getByLabel("Метрологические характеристики").fill("0.2 кПа, класс точности 0.1");
    await page.getByRole("button", { name: "Создать эталон" }).click();
    await expect(page.getByText("Эталон создан. Действующий статус и срок поверки станут производными после записи в журнал.")).toBeVisible();
    await expect(page.getByText(standardIdentifier).first()).toBeVisible();

    await page.getByLabel("Выбранный эталон").selectOption({ label: `Эталон давления • ${standardIdentifier}` });
    await page.getByLabel("Тип операции").selectOption("verification");
    await page.getByLabel("Дата операции").fill("2026-03-10");
    await page.getByLabel("Документ", { exact: true }).fill(`STD-DOC-${seed}`);
    await page.getByLabel("Действует до").fill("2026-12-20");
    await page.getByLabel("Организация-исполнитель").fill("ФБУ Ростест-Москва");
    await page.getByRole("button", { name: "Добавить запись журнала" }).click();
    await expect(page.getByText("Запись журнала эталона сохранена. Производный статус и срок действия пересчитаны.")).toBeVisible();
    await expect(page.getByText(`STD-DOC-${seed}`).first()).toBeVisible();
    await expect(page.getByText("Текущий статус: active")).toBeVisible();

    await page.goto("/equipment?tab=mi");
    await expect(page).toHaveURL(/\/equipment\?tab=mi$/);
    await page.getByLabel("Placement").selectOption("built_in");
    await page.getByLabel("Наименование").fill(instrumentName);
    await page.getByLabel("Тип / класс").fill("Манометр");
    await page.getByLabel("Модель").first().fill("MN-12");
    await page.getByLabel("Регистрационный номер").fill(`MI-${seed}`);
    await page.getByLabel("Серийный номер").fill(`SER-${seed}`);
    await page.getByLabel("Привязка к оборудованию").selectOption({ label: equipmentName });
    await page.getByLabel(standardIdentifier).check();
    await page.getByRole("button", { name: "Создать средство измерения" }).click();
    await expect(
      page.getByText("Средство измерения создано. Текущий метрологический статус теперь будет определяться журналом."),
    ).toBeVisible();
    await expect(page.getByText(instrumentName).first()).toBeVisible();
    await expect(page.getByText(standardIdentifier).first()).toBeVisible();

    await page.getByLabel("Выбранное средство измерения").selectOption({
      label: `${instrumentName} • MI-${seed}`,
    });
    await page.getByLabel("Тип операции").selectOption("verification");
    await page.getByLabel("Дата операции").fill("2026-03-12");
    await page.getByLabel("Документ", { exact: true }).fill(`MI-DOC-${seed}`);
    await page.getByLabel("Действует до").fill("2026-12-31");
    await page.getByLabel("Организация-исполнитель").fill("ФБУ Ростест-Москва");
    await page.getByRole("button", { name: "Добавить запись журнала" }).click();
    await expect(page.getByText("Запись журнала СИ сохранена. Производный статус и ближайшая дата пересчитаны.")).toBeVisible();
    await expect(page.getByText(`MI-DOC-${seed}`).first()).toBeVisible();
    await expect(page.getByText("Текущий статус: active")).toBeVisible();

    await page.goto("/equipment");
    await expect(page).toHaveURL(/\/equipment$/);
    await expect(page.getByText("СИ: 1").first()).toBeVisible();
    await expect(page.getByText(archiveEquipmentName).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Архивировать оборудование" }).first()).toBeVisible();
    await backend(request, `/api/v1/equipment/${archiveEquipment.id}/archive`, {
      method: "POST",
      token: admin.sessionToken,
    });
    await page.goto("/equipment");
    await expect(page.getByText(archiveEquipmentName)).toHaveCount(0);

    await page.goto("/equipment?tab=mi");
    await page.getByLabel("Выбранное средство измерения").selectOption({
      label: `${archiveInstrumentName} • MI-ARCH-${seed}`,
    });
    acceptNextArchiveConfirmation(page);
    await page.getByRole("button", { name: "Архивировать выбранное СИ" }).click();
    await expect(page.getByText("Средство измерения переведено в архив и убрано из активных pickers.")).toBeVisible();
    await expect(page.getByText(archiveInstrumentName)).toHaveCount(0);

    await page.goto("/equipment?tab=standards");
    await page.getByLabel("Выбранный эталон").selectOption({
      label: `Эталон напряжения • ${archiveStandardIdentifier}`,
    });
    acceptNextArchiveConfirmation(page);
    await page.getByRole("button", { name: "Архивировать выбранный эталон" }).click();
    await expect(page.getByText("Эталон переведен в архив и исключен из активных связей.")).toBeVisible();
    await expect(page.getByText(archiveStandardIdentifier)).toHaveCount(0);

    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByRole("button", { name: "Скрыть архив" })).toBeVisible();
    await expect(page.getByText(archiveStandardIdentifier).first()).toBeVisible();
    await expect(page.getByText("archived").first()).toBeVisible();

    await page.goto("/equipment");
    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByText(archiveEquipmentName).first()).toBeVisible();
    await page.goto("/equipment?tab=mi");
    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByText(archiveInstrumentName).first()).toBeVisible();

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await page.getByLabel("Пароль").fill(employee.password);
    await page.getByRole("button", { name: "Войти и открыть рабочий contour" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.goto("/equipment");
    await expect(page.getByText("Текущий workspace остается read-only")).toBeVisible();
    await expect(page.getByRole("button", { name: "Создать оборудование" })).toHaveCount(0);
    await expect(page.getByText(equipmentName).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Показать архив" })).toBeVisible();

    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByText(archiveEquipmentName).first()).toBeVisible();

    await page.goto("/equipment?tab=mi");
    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByRole("button", { name: "Создать средство измерения" })).toHaveCount(0);
    await expect(page.getByText(instrumentName).first()).toBeVisible();
    await page.getByLabel("Выбранное средство измерения").selectOption({
      label: `${archiveInstrumentName} • MI-ARCH-${seed}`,
    });
    await expect(page.getByText("Mutate surface скрыта", { exact: true })).toBeVisible();

    await page.goto("/equipment?tab=standards");
    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByRole("button", { name: "Создать эталон" })).toHaveCount(0);
    await expect(page.getByText(standardIdentifier).first()).toBeVisible();
    await expect(page.getByText(archiveStandardIdentifier).first()).toBeVisible();
  });
});
