const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const repoRoot = path.resolve(__dirname, "../../../..");
const webRoot = path.join(repoRoot, "apps/web");
const staticRoot = path.join(webRoot, "storybook-static");
const webRequire = createRequire(path.join(webRoot, "package.json"));
const { chromium, expect } = webRequire("@playwright/test");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function serveFile(request, response) {
  const url = new URL(request.url, "http://127.0.0.1");
  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  const target = path.join(staticRoot, safePath || "index.html");

  if (!target.startsWith(staticRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const filePath = fs.existsSync(target) && fs.statSync(target).isDirectory()
    ? path.join(target, "index.html")
    : target;

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

function visibleExactTextBelowInput(page, text, inputSelector) {
  return page.evaluate(
    ({ expectedText, selector }) => {
      const input = document.querySelector(selector);
      if (!input) {
        throw new Error(`Missing input for selector ${selector}`);
      }

      const inputBottom = input.getBoundingClientRect().bottom;

      function isVisible(element) {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0.01 &&
          rect.width > 1 &&
          rect.height > 1 &&
          style.position !== "absolute"
        );
      }

      return Array.from(document.querySelectorAll("body *"))
        .filter((element) => element.childElementCount === 0)
        .filter((element) => element.textContent?.trim() === expectedText)
        .filter((element) => isVisible(element))
        .filter((element) => element.getBoundingClientRect().top >= inputBottom - 1)
        .length;
    },
    { expectedText: text, selector: inputSelector },
  );
}

async function inspectWithHint(page, baseUrl) {
  const hint = "Используйте корпоративный логин без домена.";
  await page.goto(`${baseUrl}/iframe.html?id=primitives-inputfield--with-hint&viewMode=story`, {
    waitUntil: "networkidle",
  });

  const input = page.locator('input[name="username"]');
  const helpTrigger = page.getByRole("button", { name: "Справка: Логин" });
  const tooltip = page.locator('[role="tooltip"]');

  await expect(input).toBeVisible();
  await expect(helpTrigger).toBeVisible();
  await expect(input).not.toHaveAttribute("aria-describedby", /.+/);
  await expect(helpTrigger).toHaveAccessibleDescription(hint);

  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const persistentHintRows = await visibleExactTextBelowInput(page, hint, 'input[name="username"]');

  await helpTrigger.hover();
  await expect(tooltip).toBeVisible();
  const tooltipAfterHover = await tooltip.isVisible();

  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await helpTrigger.focus();
  await expect(helpTrigger).toBeFocused();
  await expect(tooltip).toBeVisible();
  const tooltipAfterFocus = await tooltip.isVisible();

  return {
    story: "WithHint",
    inputAriaDescribedBy: await input.getAttribute("aria-describedby"),
    helpTriggerDescription: await helpTrigger.evaluate((node) => {
      const id = node.getAttribute("aria-describedby");
      return id ? document.getElementById(id)?.textContent?.trim() : null;
    }),
    persistentHintRows,
    tooltipAfterHover,
    tooltipAfterFocus,
  };
}

async function inspectWithHintAndError(page, baseUrl) {
  const hint = "9 цифр.";
  const errorText = "КПП должен содержать 9 цифр.";
  await page.goto(`${baseUrl}/iframe.html?id=primitives-inputfield--with-hint-and-error&viewMode=story`, {
    waitUntil: "networkidle",
  });

  const input = page.locator('input[name="kpp"]');
  const helpTrigger = page.getByRole("button", { name: "Справка: КПП" });
  const tooltip = page.locator('[role="tooltip"]');
  const error = page.getByText(errorText);

  await expect(input).toBeVisible();
  await expect(error).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(errorText);
  await expect(helpTrigger).toHaveAccessibleDescription(hint);

  const inputAriaDescribedBy = await input.getAttribute("aria-describedby");
  const describedByText = await input.evaluate((node) => {
    const id = node.getAttribute("aria-describedby");
    return id ? document.getElementById(id)?.textContent?.trim() : null;
  });
  const errorBelowInput = await page.evaluate((expectedError) => {
    const inputElement = document.querySelector('input[name="kpp"]');
    const errorElement = Array.from(document.querySelectorAll("body *")).find(
      (element) => element.textContent?.trim() === expectedError,
    );
    if (!inputElement || !errorElement) {
      return false;
    }
    return errorElement.getBoundingClientRect().top > inputElement.getBoundingClientRect().bottom;
  }, errorText);
  const persistentHintRows = await visibleExactTextBelowInput(page, hint, 'input[name="kpp"]');

  await helpTrigger.hover();
  await expect(tooltip).toBeVisible();
  const tooltipAfterHover = await tooltip.isVisible();

  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await helpTrigger.focus();
  await expect(helpTrigger).toBeFocused();
  await expect(tooltip).toBeVisible();
  const tooltipAfterFocus = await tooltip.isVisible();

  return {
    story: "WithHintAndError",
    inputAriaDescribedBy,
    describedByText,
    errorBelowInput,
    helpTriggerDescription: await helpTrigger.evaluate((node) => {
      const id = node.getAttribute("aria-describedby");
      return id ? document.getElementById(id)?.textContent?.trim() : null;
    }),
    persistentHintRows,
    tooltipAfterHover,
    tooltipAfterFocus,
  };
}

async function main() {
  if (!fs.existsSync(path.join(staticRoot, "iframe.html"))) {
    throw new Error(`Storybook static output is missing at ${staticRoot}`);
  }

  const server = http.createServer(serveFile);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    const withHint = await inspectWithHint(page, baseUrl);
    const withHintAndError = await inspectWithHintAndError(page, baseUrl);

    const result = {
      status: "PASS",
      staticRoot,
      baseUrl,
      checks: [withHint, withHintAndError],
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
