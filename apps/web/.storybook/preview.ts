import type { Decorator, Preview } from "@storybook/react";
import { createElement } from "react";
import "../app/globals.css";
import {
  storybookFontImportCss,
  storybookFontStyleElementId,
} from "@/shared/config/typography";
import { ToastProvider } from "@/shared/ui";

function ensureStorybookTypographyBaseline() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(storybookFontStyleElementId)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = storybookFontStyleElementId;
  styleElement.textContent = storybookFontImportCss;
  document.head.appendChild(styleElement);
}

ensureStorybookTypographyBaseline();

const withTypographyBaseline: Decorator = (Story) =>
  createElement(
    ToastProvider,
    null,
    createElement("div", { className: "min-h-full antialiased" }, Story()),
  );

const preview: Preview = {
  decorators: [withTypographyBaseline],
  parameters: {
    backgrounds: {
      default: "shell",
      values: [
        { name: "shell", value: "hsl(var(--background))" },
        { name: "surface", value: "hsl(var(--card))" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
  },
};

export default preview;
