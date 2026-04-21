import type { ApiEnvelope } from "./bootstrap";

async function readApiEnvelope<T>(response: Response) {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

export async function parseApiResponse<T>(response: Response, fallbackMessage: string) {
  const body = await readApiEnvelope<T>(response);

  if (!response.ok || !body?.success || body.data === undefined) {
    throw new Error(body?.error ?? fallbackMessage);
  }

  return body.data;
}
