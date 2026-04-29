import { cache } from "react";
import { BackendError, fetchBackend } from "./backend";
import { SESSION_TOKEN_HEADER_NAME, type SessionSummaryResponse } from "./bootstrap";

export const fetchSessionSummary = cache(async (sessionToken: string | undefined) => {
  if (!sessionToken) {
    return null;
  }

  try {
    const result = await fetchBackend<SessionSummaryResponse>("/api/v1/sessions/current", {
      headers: {
        [SESSION_TOKEN_HEADER_NAME]: sessionToken,
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
