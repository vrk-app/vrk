const DEFAULT_API_BASE_URL = "http://localhost:8080";

export type RuntimeDataMode = "stub" | "seed-read";

export type PublicEnv = {
  apiBaseUrl: string;
  runtimeDataMode: RuntimeDataMode;
  storybookUrl: string | null;
};

function readPublicValue(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function getPublicEnv(): PublicEnv {
  const storybookUrl = readPublicValue(process.env.NEXT_PUBLIC_STORYBOOK_URL);
  const apiBaseUrl = readPublicValue(process.env.NEXT_PUBLIC_API_BASE_URL) ?? DEFAULT_API_BASE_URL;
  const runtimeDataMode = readPublicValue(process.env.NEXT_PUBLIC_RUNTIME_DATA_MODE) === "seed-read"
    ? "seed-read"
    : "stub";

  return {
    apiBaseUrl,
    runtimeDataMode,
    storybookUrl,
  };
}
