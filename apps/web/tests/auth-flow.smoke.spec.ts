import { expect, test } from "@playwright/test";

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

test.describe("stage 03 first-admin bootstrap", () => {
  test("platform admin boots organization, issues employee invite, and scope-aware login works", async ({ page }) => {
    const seed = Date.now().toString();
    const admin = uniqueAdmin(seed);
    const employee = uniqueEmployee(seed);

    await page.goto("/register");

    await page.getByLabel("Название организации").fill(admin.organizationName);
    await page.getByLabel("Первый администратор").fill(admin.adminName);
    await page.getByLabel("Email приглашения").fill(admin.email);
    await page.getByRole("button", { name: "Создать shell и выдать приглашение" }).click();

    const invitePath = await page.getByTestId("first-admin-invite-path").textContent();
    expect(invitePath).toContain("/register/");

    await page.getByRole("link", { name: "Открыть invite link" }).click();
    await expect(page).toHaveURL(/\/register\/.+$/);

    await page.getByLabel(/^Пароль$/).fill(admin.password);
    await page.getByLabel("Повторите пароль").fill(admin.password);
    await page.getByRole("button", { name: "Активировать доступ и перейти в wizard" }).click();

    await expect(page).toHaveURL(/\/company\/setup$/);
    await expect(page.getByRole("heading", { level: 1, name: "Первичный запуск организации" })).toBeVisible();

    await page.getByLabel("Полное наименование").fill(admin.organizationName);
    await page.getByLabel("Краткое наименование").fill("ВРК Тест");
    await page.getByLabel("ОПФ").fill("ООО");
    await page.getByLabel("ИНН").fill("1234567890");
    await page.getByLabel("КПП").fill("123456789");
    await page.getByLabel("Контактный email").fill(admin.email);
    await page.getByLabel("Контактный телефон").fill("+7 (999) 123-45-67");
    await page.getByLabel("Юридический адрес").fill("г. Москва, ул. Тестовая, д. 1");
    await page.getByLabel("Тип подразделения").fill("Филиал");
    await page.getByLabel("Название подразделения").fill("Северный филиал");
    await page.getByLabel("Тип юнита").fill("Лаборатория");
    await page.getByLabel("Название юнита").fill("Юнит 01");
    await page.getByRole("button", { name: "Завершить первичный запуск" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: admin.organizationName })).toBeVisible();
    await expect(page.locator("#main-content").getByText(admin.adminName, { exact: true })).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Северный филиал")).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Юнит 01")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Пригласить сотрудника" })).toBeVisible();

    await page.getByLabel("Имя сотрудника").fill(employee.fullName);
    await page.getByLabel("Email приглашения").fill(employee.email);
    await page.getByRole("button", { name: "Создать draft приглашения" }).click();

    await expect(page.getByText(employee.email)).toBeVisible();
    await expect(page.getByText("draft").first()).toBeVisible();

    await page.getByRole("button", { name: "Отправить" }).first().click();
    await expect(page.getByText("sent").first()).toBeVisible();

    const employeeInvitePath = await page.getByTestId("employee-invite-path").first().textContent();
    expect(employeeInvitePath).toContain("/register/");

    await page.goto(employeeInvitePath!);
    await page.getByLabel(/^Пароль$/).fill(employee.password);
    await page.getByLabel("Повторите пароль").fill(employee.password);
    await page.getByRole("button", { name: "Подключиться и открыть workspace" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect(page.getByText("unit workspace")).toBeVisible();
    await expect(page.getByTestId("scope-graph").getByText("Юнит 01")).toBeVisible();
    await expect(page.getByText("Северный филиал")).toHaveCount(0);
    await expect(page.getByText("Пригласить сотрудника")).toHaveCount(0);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(employee.email);
    await page.getByLabel("Пароль").fill(employee.password);
    await page.getByRole("button", { name: "Войти и открыть рабочий contour" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Юнит 01" })).toBeVisible();
    await expect(page.getByText("Северный филиал")).toHaveCount(0);

    await page.goto("/login?logout=1");
    await page.getByLabel("Корпоративная почта").fill(admin.email);
    await page.getByLabel("Пароль").fill(admin.password);
    await page.getByRole("button", { name: "Войти и открыть рабочий contour" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: admin.organizationName })).toBeVisible();
    await expect(page.getByText("accepted").first()).toBeVisible();

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
