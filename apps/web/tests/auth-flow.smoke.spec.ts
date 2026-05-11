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
    const divisionName = "Северный дивизион";
    const editedDivisionName = "Северный дивизион Центр";
    const unitName = "Юнит 01";
    const editedUnitName = "Юнит 01А";

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

    await page.getByLabel("Краткое наименование", { exact: true }).fill("ВРК Тест");
    await page.getByLabel("ИНН", { exact: true }).fill("1234567890");
    await page.getByLabel("КПП", { exact: true }).fill("123456789");
    await page.getByLabel("Контактный email", { exact: true }).fill(admin.email);
    await page.getByLabel("Контактный телефон", { exact: true }).fill("+7 (999) 123-45-67");
    await page.getByLabel("Руководитель", { exact: true }).fill(admin.adminName);
    await page.getByLabel("Юридический адрес", { exact: true }).fill("г. Москва, ул. Тестовая, д. 1");
    await page.getByRole("button", { name: "Сохранить профиль" }).click();

    await page.getByRole("tab", { name: "Дивизионы" }).click();
    await page.getByRole("button", { name: "Создать дивизион" }).first().click();
    const divisionCreateDialog = page.getByRole("dialog", { name: "Новый дивизион" });
    await expect(divisionCreateDialog).toBeVisible();
    await divisionCreateDialog.getByLabel("Наименование").fill(divisionName);
    await divisionCreateDialog.getByLabel("Регион").fill("Москва");
    await divisionCreateDialog.getByRole("button", { name: "Создать дивизион" }).click();
    await expect(divisionCreateDialog).toHaveCount(0);
    await expect(page.getByTestId("scope-graph").getByText(divisionName)).toBeVisible();

    await page.getByRole("button", { name: `Редактировать дивизион ${divisionName}` }).click();
    const divisionEditDialog = page.getByRole("dialog", { name: "Редактировать дивизион" });
    await expect(divisionEditDialog).toBeVisible();
    await divisionEditDialog.getByLabel("Наименование").fill(editedDivisionName);
    await divisionEditDialog.getByLabel("Регион").fill("Московская область");
    await divisionEditDialog.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(divisionEditDialog).toHaveCount(0);
    await expect(page.getByTestId("scope-graph").getByText(editedDivisionName)).toBeVisible();

    await page.getByRole("tab", { name: "Юниты" }).click();
    await page.getByRole("button", { name: "Создать юнит" }).first().click();
    const unitCreateDialog = page.getByRole("dialog", { name: "Новый юнит" });
    await expect(unitCreateDialog).toBeVisible();
    await selectFieldOption(page, "Родитель", editedDivisionName);
    await unitCreateDialog.getByLabel("Наименование").fill(unitName);
    await unitCreateDialog.getByLabel("Регион").fill("Москва");
    await unitCreateDialog.getByRole("button", { name: "Создать юнит" }).click();
    await expect(unitCreateDialog).toHaveCount(0);
    await expect(page.getByTestId("scope-graph").getByText(unitName)).toBeVisible();

    await page.getByRole("button", { name: `Редактировать юнит ${unitName}` }).click();
    const unitEditDialog = page.getByRole("dialog", { name: "Редактировать юнит" });
    await expect(unitEditDialog).toBeVisible();
    await unitEditDialog.getByLabel("Наименование").fill(editedUnitName);
    await unitEditDialog.getByLabel("Регион").fill("Москва, участок 2");
    await unitEditDialog.getByRole("button", { name: "Сохранить изменения" }).click();
    await expect(unitEditDialog).toHaveCount(0);

    await expect(page.getByText(admin.adminName, { exact: true })).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText(editedDivisionName)).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText(editedUnitName)).toBeVisible();

    await page.getByRole("tab", { name: "Сотрудники" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Сотрудники и доступ" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Пригласить сотрудника" })).toBeVisible();

    await page.getByRole("button", { name: "Пригласить сотрудника" }).first().click();
    const unitHeadInviteDialog = page.getByRole("dialog", { name: "Пригласить сотрудника" });
    await expect(unitHeadInviteDialog).toBeVisible();
    await unitHeadInviteDialog.getByLabel("Имя сотрудника").fill(unitHead.fullName);
    await unitHeadInviteDialog.getByLabel("Email приглашения").fill(unitHead.email);
    await selectFieldOption(page, "Роль доступа", "Руководитель юнита");
    await selectFieldOption(page, "Уровень доступа", "Юнит");
    await selectFieldOption(page, "Объект доступа", editedUnitName);
    await unitHeadInviteDialog.getByRole("button", { name: "Создать черновик приглашения" }).click();
    await expect(unitHeadInviteDialog).toHaveCount(0);
    await page.getByRole("button", { name: "Отправить" }).first().click();

    const unitHeadInvitePath = await page.getByTestId("employee-invite-path").first().textContent();
    expect(unitHeadInvitePath).toContain("/register/");

    await page.goto(unitHeadInvitePath!);
    await page.getByLabel(/^Пароль$/).fill(unitHead.password);
    await page.getByLabel("Повторите пароль").fill(unitHead.password);
    await page.getByRole("button", { name: "Подключиться" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: editedUnitName })).toBeVisible();
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
    await expect(page.getByRole("button", { name: "Пригласить сотрудника" })).toBeVisible();

    await page.getByRole("button", { name: "Пригласить сотрудника" }).first().click();
    const employeeInviteDialog = page.getByRole("dialog", { name: "Пригласить сотрудника" });
    await expect(employeeInviteDialog).toBeVisible();
    await employeeInviteDialog.getByLabel("Имя сотрудника").fill(employee.fullName);
    await employeeInviteDialog.getByLabel("Email приглашения").fill(employee.email);
    await selectFieldOption(page, "Роль доступа", "Сотрудник юнита");
    await selectFieldOption(page, "Уровень доступа", "Юнит");
    await selectFieldOption(page, "Объект доступа", editedUnitName);
    await employeeInviteDialog.getByRole("button", { name: "Создать черновик приглашения" }).click();
    await expect(employeeInviteDialog).toHaveCount(0);

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
    await expect(page.getByRole("heading", { level: 1, name: editedUnitName })).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText(editedUnitName)).toBeVisible();
    await expect(page.getByText(editedDivisionName)).toHaveCount(0);
    await expect(page.getByText("Пригласить сотрудника")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toHaveCount(0);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: editedUnitName })).toBeVisible();
    await expect(page.getByText(editedDivisionName)).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Сотрудники" })).toHaveCount(0);
    await expect.poll(() => hasWorkspaceHintForEmail(page, employee.email)).toBe(true);
    expect((await getSessionCookie(page))?.expires).toBeGreaterThan(Math.floor(Date.now() / 1000));

    await page.goto("/login?logout=1");
    await expect(page.getByTestId("last-workspace-hint")).toHaveCount(0);
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await expect(page.getByTestId("last-workspace-hint")).toContainText(editedUnitName);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.locator('input[name="remember-session"]').uncheck({ force: true });
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: editedUnitName })).toBeVisible();
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
