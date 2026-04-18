const DEFAULT_API_BASE_URL = "http://localhost:8080";

export type FieldEnv = {
  apiBaseUrl: string;
  manualSyncMode: "queue-preview" | "manual-only";
};

function readValue(value: string | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

export function getFieldEnv(): FieldEnv {
  const apiBaseUrl = readValue(process.env.NEXT_PUBLIC_API_BASE_URL) ?? DEFAULT_API_BASE_URL;
  const manualSyncMode = readValue(process.env.NEXT_PUBLIC_MANUAL_SYNC_MODE) === "manual-only"
    ? "manual-only"
    : "queue-preview";

  return {
    apiBaseUrl,
    manualSyncMode,
  };
}
