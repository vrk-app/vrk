import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, fetchBackend } from "./backend";
import type { ApiMeta } from "./bootstrap";
import { SESSION_COOKIE_NAME } from "./bootstrap";

const PLATFORM_ADMIN_HEADER_NAME = "X-VRK-Platform-Admin-Secret";

type ProxyOptions = {
  request?: Request;
  body?: unknown;
  method?: string;
  successStatus?: number;
  headers?: HeadersInit;
};

function successResponse<T>(data: T, meta?: ApiMeta, status?: number) {
  return new NextResponse(JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }), {
    status: status ?? 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export function backendErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
}

async function buildProxyInit({ request, body, headers, method }: ProxyOptions): Promise<RequestInit> {
  const resolvedHeaders = new Headers(headers);
  let resolvedBody = body;

  if (resolvedBody === undefined && request) {
    try {
      resolvedBody = await request.json();
    } catch {
      throw new BackendError("invalid request body", 400);
    }
  }

  return {
    method,
    headers: resolvedHeaders,
    ...(resolvedBody === undefined ? {} : { body: JSON.stringify(resolvedBody) }),
  };
}

function platformAdminHeaders(headers?: HeadersInit) {
  const secret = process.env.PLATFORM_ADMIN_SHARED_SECRET?.trim();
  if (!secret) {
    throw new BackendError("platform admin proxy is not configured", 500);
  }

  const resolvedHeaders = new Headers(headers);
  resolvedHeaders.set(PLATFORM_ADMIN_HEADER_NAME, secret);
  return resolvedHeaders;
}

export async function proxyPublicBackend<T>(path: string, options: ProxyOptions = {}) {
  try {
    const result = await fetchBackend<T>(path, await buildProxyInit(options));
    return successResponse(result.data, result.meta, options.successStatus);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function proxyPlatformAdminBackend<T>(path: string, options: ProxyOptions = {}) {
  try {
    const result = await fetchBackend<T>(
      path,
      await buildProxyInit({
        ...options,
        headers: platformAdminHeaders(options.headers),
      }),
    );
    return successResponse(result.data, result.meta, options.successStatus);
  } catch (error) {
    return backendErrorResponse(error);
  }
}

export async function proxySessionBackend<T>(path: string, options: ProxyOptions = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const init = await buildProxyInit({
      ...options,
      headers,
    });
    const result = await fetchBackend<T>(path, init);

    return successResponse(result.data, result.meta, options.successStatus);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      cookieStore.delete(SESSION_COOKIE_NAME);
    }

    return backendErrorResponse(error);
  }
}

export function withRequestSearch(path: string, request: Request) {
  const { search } = new URL(request.url);
  return search ? `${path}${search}` : path;
}
