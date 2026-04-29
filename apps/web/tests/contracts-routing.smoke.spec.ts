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
  account: {
    email: string;
  };
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
    organizationId: launched.organization.id,
    sessionToken: launched.sessionToken,
    unit: launched.units[0],
  };
}

async function selectFieldOption(page: Page, fieldLabel: string | RegExp, optionName: string | RegExp) {
  await page.getByLabel(fieldLabel).click();
  await page.getByRole("option", { name: optionName, exact: typeof optionName === "string" }).click();
}

test.describe("stage 03 contracts contour", () => {
  test("customer uses /contracts registry and contractor lands in restricted contracts workspace", async ({
    page,
    request,
  }) => {
    const seed = Date.now().toString();
    const customer = await bootstrapOrg(request, {
      label: `customer-contracts-${seed}`,
      role: "customer",
    });
    const contractor = await bootstrapOrg(request, {
      label: `contractor-alpha-${seed}`,
      role: "contractor",
    });

    const contractNumber = `CTR-UI-${seed}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    const isoDate = (value: Date) => value.toISOString().slice(0, 10);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(customer.email);
    await page.getByLabel(/^Пароль$/).fill(customer.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.goto("/contracts");

    await expect(page.getByRole("heading", { level: 1, name: "Договоры и маршрутизация" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Создать договор и привязать подрядчика" })).toBeVisible();

    await page.getByLabel("Номер договора").fill(contractNumber);
    await selectFieldOption(page, "Подрядчик", contractor.organizationName);
    await selectFieldOption(page, "Статус", "Активен");
    await page.getByLabel("Дата начала").fill(isoDate(startDate));
    await page.getByLabel("Дата окончания").fill(isoDate(endDate));
    await page.getByLabel("Тип оборудования").first().fill("Насос");
    await page.getByLabel("Регион").first().fill("Москва");
    await page.getByLabel("Предмет договора").fill("UI smoke contract");
    await selectFieldOption(page, "Область действия заказчика", "Юнит");
    await selectFieldOption(page, "Точка привязки", customer.unit.name);
    await page.getByRole("button", { name: "Сохранить договор" }).click();

    await expect(page.getByText(contractNumber)).toBeVisible();
    await expect(page.locator("p").filter({ hasText: contractor.organizationName }).first()).toBeVisible();
    await expect(page.getByText("Подходит").first()).toBeVisible();

    await page.getByLabel("Тип оборудования").nth(1).fill("Насос");
    await page.getByLabel("Регион").nth(1).fill("Москва");
    await page.getByRole("button", { name: "Проверить договор" }).click();

    await expect(page.getByText(`Подрядчик: ${contractor.organizationName}. Область: ${customer.unit.name}.`)).toBeVisible();

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(contractor.email);
    await page.getByLabel(/^Пароль$/).fill(contractor.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/contracts$/);
    await expect(page.getByRole("heading", { level: 2, name: "Доступные договоры" })).toBeVisible();
    await expect(page.getByText(contractNumber)).toBeVisible();
    await expect(page.getByText(customer.organizationName)).toBeVisible();
    await expect(page.getByText("Создать договор и привязать подрядчика")).toHaveCount(0);
  });
});
