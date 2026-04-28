import { cache } from "react";
import { BackendError, fetchBackend } from "./backend";
import type { SessionSummaryResponse } from "./bootstrap";

export const fetchSessionSummary = cache(async (sessionToken: string | undefined) => {
  if (!sessionToken) {
    return null;
  }

  try {
    const result = await fetchBackend<SessionSummaryResponse>("/api/v1/sessions/current", {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    return result.data;
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return null;
    }

    throw error;
  }
});
