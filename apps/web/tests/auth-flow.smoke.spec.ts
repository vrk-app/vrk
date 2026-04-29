import { expect, test, type Page } from "@playwright/test";

function uniqueAdmin(seed: string) {
  return {
    organizationName: `ВРК Тест ${seed}`,
    adminName: `Анна Волкова ${seed}`,
    email: `admin-${seed}@vrk.local`,
    password: `stage03-${seed}-secret`,
  };
}

function uniqueEmployee(seed: string) {
  return {
    fullName: `Мария Кузнецова ${seed}`,
    email: `employee-${seed}@vrk.local`,
    password: `stage03-employee-${seed}`,
  };
}

function uniqueUnitHead(seed: string) {
  return {
    fullName: `Сергей Лебедев ${seed}`,
    email: `unit-head-${seed}@vrk.local`,
    password: `stage03-unit-head-${seed}`,
  };
}

async function getSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === "vrk_session");
}

async function hasWorkspaceHintForEmail(page: Page, email: string) {
  return page.evaluate(async (value) => {
    const normalizedEmail = value.trim().toLowerCase();
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedEmail));
    const emailHash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return window.localStorage.getItem(`vrk:last-workspace:${emailHash}`) !== null;
  }, email);
}

async function selectFieldOption(page: Page, fieldLabel: string | RegExp, optionName: string | RegExp) {
  await page.getByLabel(fieldLabel).click();
  await page.getByRole("option", { name: optionName, exact: typeof optionName === "string" }).click();
}

test.describe("stage 03 first-admin bootstrap", () => {
  test("platform admin boots organization, issues employee invite, and scope-aware login works", async ({ page }) => {
    const seed = Date.now().toString();
    const admin = uniqueAdmin(seed);
    const employee = uniqueEmployee(seed);
    const unitHead = uniqueUnitHead(seed);

    await page.goto("/register");

    await page.getByLabel("Название организации").fill(admin.organizationName);
    await page.getByLabel("Первый администратор").fill(admin.adminName);
    await page.getByLabel("Email приглашения").fill(admin.email);
    await page.getByRole("button", { name: "Выдать приглашение" }).click();

    const invitePath = await page.getByTestId("first-admin-invite-path").textContent();
    expect(invitePath).toContain("/register/");
    await expect(page.getByRole("button", { name: "Выдать приглашение" })).toHaveCount(0);

    await page.goto(invitePath!);
    await expect(page).toHaveURL(/\/register\/.+$/);

    await page.getByLabel(/^Пароль$/).fill(admin.password);
    await page.getByLabel("Повторите пароль").fill(admin.password);
    await page.getByRole("button", { name: "Перейти к компании" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: admin.organizationName })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toBeVisible();

    await page.getByLabel("Краткое наименование").fill("ВРК Тест");
    await page.getByLabel("ИНН").fill("1234567890");
    await page.getByLabel("КПП").fill("123456789");
    await page.getByLabel("Контактный email").fill(admin.email);
    await page.getByLabel("Контактный телефон").fill("+7 (999) 123-45-67");
    await page.getByLabel("Руководитель").fill(admin.adminName);
    await page.getByLabel("Юридический адрес").fill("г. Москва, ул. Тестовая, д. 1");
    await page.getByRole("button", { name: "Сохранить профиль" }).click();

    await page.getByRole("tab", { name: "Подразделения" }).click();
    await page.getByLabel("Наименование").fill("Северный филиал");
    await page.getByLabel("Регион").fill("Москва");
    await page.getByRole("button", { name: "Создать подразделение" }).click();
    await expect(page.getByTestId("scope-graph").getByText("Северный филиал")).toBeVisible();

    await page.getByRole("tab", { name: "Юниты" }).click();
    await selectFieldOption(page, "Родитель", "Северный филиал");
    await page.getByLabel("Наименование").fill("Юнит 01");
    await page.getByLabel("Регион").fill("Москва");
    await page.getByRole("button", { name: "Создать юнит" }).click();

    await expect(page.getByText(admin.adminName, { exact: true })).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Северный филиал")).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Юнит 01")).toBeVisible();

    await page.getByRole("tab", { name: "Сотрудники" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Сотрудники и доступ" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Пригласить сотрудника" })).toBeVisible();

    await page.getByLabel("Имя сотрудника").fill(unitHead.fullName);
    await page.getByLabel("Email приглашения").fill(unitHead.email);
    await selectFieldOption(page, "Роль доступа", "Руководитель юнита");
    await selectFieldOption(page, "Уровень доступа", "Юнит");
    await selectFieldOption(page, "Объект доступа", "Юнит 01");
    await page.getByRole("button", { name: "Создать черновик приглашения" }).click();
    await page.getByRole("button", { name: "Отправить" }).first().click();

    const unitHeadInvitePath = await page.getByTestId("employee-invite-path").first().textContent();
    expect(unitHeadInvitePath).toContain("/register/");

    await page.goto(unitHeadInvitePath!);
    await page.getByLabel(/^Пароль$/).fill(unitHead.password);
    await page.getByLabel("Повторите пароль").fill(unitHead.password);
    await page.getByRole("button", { name: "Подключиться" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toBeVisible();
    await page.getByRole("tab", { name: "Сотрудники" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Сотрудники и доступ" })).toBeVisible();
    await expect(page.getByText(unitHead.email)).toBeVisible();
    await expect(page.getByText("Пригласить сотрудника")).toHaveCount(0);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(admin.email);
    await page.getByLabel(/^Пароль$/).fill(admin.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await page.getByRole("tab", { name: "Сотрудники" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Пригласить сотрудника" })).toBeVisible();

    await page.getByLabel("Имя сотрудника").fill(employee.fullName);
    await page.getByLabel("Email приглашения").fill(employee.email);
    await selectFieldOption(page, "Роль доступа", "Сотрудник юнита");
    await selectFieldOption(page, "Уровень доступа", "Юнит");
    await selectFieldOption(page, "Объект доступа", "Юнит 01");
    await page.getByRole("button", { name: "Создать черновик приглашения" }).click();

    await expect(page.getByText(employee.email)).toBeVisible();
    await expect(page.getByText("Черновик").first()).toBeVisible();

    await page.getByRole("button", { name: "Отправить" }).first().click();
    await expect(page.getByText("Отправлено").first()).toBeVisible();

    const employeeInvitePath = await page.getByTestId("employee-invite-path").first().textContent();
    expect(employeeInvitePath).toContain("/register/");

    await page.goto(employeeInvitePath!);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.getByLabel("Повторите пароль").fill(employee.password);
    await page.getByRole("button", { name: "Подключиться" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Юнит 01")).toBeVisible();
    await expect(page.getByText("Северный филиал")).toHaveCount(0);
    await expect(page.getByText("Пригласить сотрудника")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toHaveCount(0);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect(page.getByText("Северный филиал")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toHaveCount(0);
    await expect.poll(() => hasWorkspaceHintForEmail(page, employee.email)).toBe(true);
    expect((await getSessionCookie(page))?.expires).toBeGreaterThan(Math.floor(Date.now() / 1000));

    await page.goto("/login?logout=1");
    await expect(page.getByTestId("last-workspace-hint")).toHaveCount(0);
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await expect(page.getByTestId("last-workspace-hint")).toContainText("Юнит 01");
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.locator('input[name="remember-session"]').uncheck({ force: true });
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect.poll(() => hasWorkspaceHintForEmail(page, employee.email)).toBe(false);
    expect((await getSessionCookie(page))?.expires).toBe(-1);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await expect(page.getByTestId("last-workspace-hint")).toHaveCount(0);

    await page.getByLabel("Корпоративная почта").fill(admin.email);
    await page.getByLabel(/^Пароль$/).fill(admin.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: admin.organizationName })).toBeVisible();
    await page.getByRole("tab", { name: "Сотрудники" }).click();
    await expect(page.getByText("Принято").first()).toBeVisible();

    if (employeeInvitePath) {
      await page.goto(employeeInvitePath);
      await expect(page.getByText("Одноразовая ссылка больше не активна")).toBeVisible();
    }

    if (invitePath) {
      await page.goto(invitePath);
      await expect(page.getByText("Одноразовая ссылка больше не активна")).toBeVisible();
    }
  });
});
