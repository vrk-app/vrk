import type { ApiEnvelope, ApiMeta } from "./bootstrap";

const DEFAULT_INTERNAL_API_BASE_URL = "http://127.0.0.1:18080";

export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export type ApiResult<T> = {
  data: T;
  meta?: ApiMeta;
};

export function getInternalApiBaseUrl() {
  const configured =
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    DEFAULT_INTERNAL_API_BASE_URL;

  return configured;
}

export async function fetchBackend<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getInternalApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  const text = await response.text();
  let payload: ApiEnvelope<T> | undefined;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new BackendError("backend returned invalid JSON", 502);
    }
  }

  if (!response.ok) {
    throw new BackendError(payload?.error ?? "backend request failed", response.status);
  }

  if (!payload?.success || payload.data === undefined) {
    throw new BackendError(payload?.error ?? "backend payload missing data", response.status);
  }

  return {
    data: payload.data,
    meta: payload.meta,
  };
}
