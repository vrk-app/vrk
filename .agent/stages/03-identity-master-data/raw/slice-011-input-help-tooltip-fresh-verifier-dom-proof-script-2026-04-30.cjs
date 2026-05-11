const fs = require("fs");
const http = require("http");
const path = require("path");
const { createRequire } = require("module");

const repoRoot = "/Users/yura-posledov/cursor/vrk";
const webRoot = path.join(repoRoot, "apps/web");
const storybookRoot = path.join(webRoot, "storybook-static");
const requireFromWeb = createRequire(path.join(webRoot, "package.json"));
const { chromium } = requireFromWeb("@playwright/test");

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createStaticServer(root) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath === "/" ? "index.html" : safePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": mimeTypes.get(path.extname(filePath)) || "application/octet-stream",
      });
      response.end(content);
    });
  });
}

async function visibleLeafTextCount(page, text) {
  return page.evaluate((targetText) => {
    function isVisible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 1 &&
        rect.height > 1
      );
    }

    return Array.from(document.querySelectorAll("body *")).filter((element) => {
      if (element.children.length !== 0) {
        return false;
      }
      if ((element.textContent || "").trim() !== targetText) {
        return false;
      }
      return isVisible(element);
    }).length;
  }, text);
}

async function main() {
  assert(fs.existsSync(path.join(storybookRoot, "iframe.html")), "storybook-static iframe.html missing");

  const server = createStaticServer(storybookRoot);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });

  try {
    await page.goto(`${baseUrl}/iframe.html?id=primitives-inputfield--with-hint&viewMode=story`);
    await page.getByRole("textbox", { name: "Логин" }).waitFor({ state: "visible" });

    const hintText = "Используйте корпоративный логин без домена.";
    const hintInput = page.getByRole("textbox", { name: "Логин" });
    const hintHelp = page.getByRole("button", { name: "Справка: Логин" });
    const hintTooltip = page.getByRole("tooltip");

    await page.mouse.move(5, 5);
    await hintInput.focus();
    await hintTooltip.waitFor({ state: "hidden" });
    assert((await visibleLeafTextCount(page, hintText)) === 0, "WithHint exposes persistent visible hint text before hover/focus");
    assert((await hintInput.getAttribute("aria-describedby")) === null, "WithHint input has aria-describedby without error");
    assert((await hintHelp.getAttribute("aria-describedby")) !== null, "WithHint help trigger lacks aria-describedby");

    await hintHelp.hover();
    await hintTooltip.waitFor({ state: "visible" });
    const hoverTooltipText = (await hintTooltip.textContent() || "").trim();
    assert(hoverTooltipText === hintText, "WithHint tooltip did not become visible on hover");

    await page.mouse.move(5, 5);
    await page.waitForTimeout(100);
    await hintHelp.focus();
    await hintTooltip.waitFor({ state: "visible" });
    const focusTooltipText = (await hintTooltip.textContent() || "").trim();
    assert(focusTooltipText === hintText, "WithHint tooltip did not become visible on focus");

    await page.goto(`${baseUrl}/iframe.html?id=primitives-inputfield--with-hint-and-error&viewMode=story`);
    await page.getByRole("textbox", { name: "КПП" }).waitFor({ state: "visible" });

    const errorText = "КПП должен содержать 9 цифр.";
    const shortHintText = "9 цифр.";
    const errorInput = page.getByRole("textbox", { name: "КПП" });
    const errorElement = page.getByText(errorText);
    const errorHelp = page.getByRole("button", { name: "Справка: КПП" });

    assert((await visibleLeafTextCount(page, errorText)) >= 1, "WithHintAndError error is not visible");
    assert((await errorInput.getAttribute("aria-invalid")) === "true", "WithHintAndError input lacks aria-invalid=true");
    const describedBy = await errorInput.getAttribute("aria-describedby");
    assert(Boolean(describedBy), "WithHintAndError input lacks aria-describedby");
    const describedText = await page.locator(`#${describedBy}`).textContent();
    assert((describedText || "").trim() === errorText, "WithHintAndError aria-describedby does not prioritize error");

    const inputBox = await errorInput.boundingBox();
    const errorBox = await errorElement.boundingBox();
    assert(Boolean(inputBox) && Boolean(errorBox), "Unable to measure input/error layout");
    assert(errorBox.y > inputBox.y + inputBox.height, "WithHintAndError error is not below input");
    assert((await errorHelp.getAttribute("aria-describedby")) !== null, "WithHintAndError help trigger lacks aria-describedby");

    await errorHelp.hover();
    const errorTooltip = page.getByRole("tooltip");
    await errorTooltip.waitFor({ state: "visible" });
    assert((await errorTooltip.textContent() || "").trim() === shortHintText, "WithHintAndError hint tooltip did not become visible on hover");

    console.log(JSON.stringify({
      status: "PASS",
      server: baseUrl,
      stories: {
        WithHint: {
          persistentVisibleHintRowsBeforeHoverFocus: 0,
          tooltipVisibleOnHover: hoverTooltipText === hintText,
          tooltipVisibleOnFocus: focusTooltipText === hintText,
          inputAriaDescribedByWithoutError: null,
        },
        WithHintAndError: {
          errorVisibleBelowInput: true,
          inputAriaDescribedBy: describedBy,
          inputDescriptionText: (describedText || "").trim(),
          helpTriggerHasHintDescription: true,
          hintTooltipVisibleOnHover: true,
        },
      },
    }, null, 2));
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
