import { BackendError, fetchBackend } from "./backend";
import type { SessionSummaryResponse } from "./bootstrap";

export async function fetchSessionSummary(sessionToken: string | undefined) {
  if (!sessionToken) {
    return null;
  }

  try {
    return await fetchBackend<SessionSummaryResponse>("/api/v1/sessions/current", {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
