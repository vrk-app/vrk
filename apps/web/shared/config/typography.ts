export const sansFontVariable = "--font-inter";
export const monoFontVariable = "--font-jetbrains-mono";
export const storybookFontStyleElementId = "vrk-storybook-fonts";

export const storybookFontImportCss = `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap");

:root {
  ${sansFontVariable}: "Inter";
  ${monoFontVariable}: "JetBrains Mono";
}`;
