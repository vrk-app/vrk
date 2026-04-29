import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, getInternalApiBaseUrl } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, SESSION_TOKEN_HEADER_NAME } from "@/shared/api";
import { backendErrorResponse, unauthorizedResponse } from "@/shared/api/route-proxy";

async function sessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

async function parseBackendError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "backend request failed";
  } catch {
    return "backend request failed";
  }
}

async function proxyLogoJson(method: "POST" | "DELETE", request?: Request) {
  const token = await sessionToken();
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const headers = new Headers();
    headers.set(SESSION_TOKEN_HEADER_NAME, token);

    const response = await fetch(`${getInternalApiBaseUrl()}/api/v1/company/logo`, {
      method,
      cache: "no-store",
      headers,
      ...(request ? { body: await request.formData() } : {}),
    });
    const text = await response.text();

    if (!response.ok) {
      let message = "backend request failed";
      if (text) {
        try {
          message = ((JSON.parse(text) as { error?: string }).error ?? message);
        } catch {
          message = text;
        }
      }
      throw new BackendError(message, response.status);
    }

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function GET() {
  const token = await sessionToken();
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const response = await fetch(`${getInternalApiBaseUrl()}/api/v1/company/logo`, {
      method: "GET",
      cache: "no-store",
      headers: {
        [SESSION_TOKEN_HEADER_NAME]: token,
      },
    });

    if (!response.ok) {
      throw new BackendError(await parseBackendError(response), response.status);
    }

    const headers = new Headers();
    for (const header of ["Content-Type", "Content-Length", "Content-Disposition"]) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function POST(request: Request) {
  return proxyLogoJson("POST", request);
}

export async function DELETE() {
  return proxyLogoJson("DELETE");
}
