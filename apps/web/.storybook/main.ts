import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["../public"],
  viteFinal: async (config) => ({
    ...config,
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
    },
    optimizeDeps: {
      ...(config.optimizeDeps ?? {}),
      esbuildOptions: {
        ...(config.optimizeDeps?.esbuildOptions ?? {}),
        jsx: "automatic",
        jsxImportSource: "react",
      },
    },
    resolve: {
      ...(config.resolve ?? {}),
      alias: {
        ...(config.resolve?.alias ?? {}),
        "@": path.resolve(currentDir, "../"),
        "next/image": path.resolve(currentDir, "../shared/storybook/next-image-mock.tsx"),
        "next/link": path.resolve(currentDir, "../shared/storybook/next-link-mock.tsx"),
        "next/navigation": path.resolve(currentDir, "../shared/storybook/next-navigation-mock.ts"),
      },
    },
  }),
};
export default config;
