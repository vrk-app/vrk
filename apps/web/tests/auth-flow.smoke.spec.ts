import { expect, test } from "@playwright/test";

test.describe("auth browser smoke", () => {
  test("login submit routes to company shell", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Корпоративная почта").fill("operator@vrk.local");
    await page.getByLabel("Пароль").fill("stage-02-shell");
    await page.getByRole("button", { name: "Открыть company shell" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Компания и профиль площадки" })).toBeVisible();
    await expect(page.getByText("API base: http://backend:8080")).toBeVisible();
    await expect(page.getByText("Mode: seed-read")).toBeVisible();
  });

  test("register submit routes to company shell", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Контактное лицо").fill("Анна Волкова");
    await page.getByLabel("Компания").fill("ВРК Север");
    await page.getByLabel("Рабочая почта").fill("admin@vrk.local");
    await page.getByLabel("Телефон").fill("+7 999 123-45-67");
    await page.getByRole("button", { name: "Создать shell-профиль" }).click();

    await expect(page).toHaveURL(/\/company$/);
    await expect(page.getByRole("heading", { level: 1, name: "Компания и профиль площадки" })).toBeVisible();
    await expect(page.getByText("Contracts adapter: /contracts")).toBeVisible();
    await expect(page.getByText("Mode: seed-read")).toBeVisible();
  });
});
