import { clearToken, getToken, SESSION_EXPIRED_EVENT } from "./token";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Calls the NestJS API under /v1. Throws ApiError with a readable message on any failure. */
export async function apiRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError("The API address is not configured (set NEXT_PUBLIC_API_URL).", 0);
  }

  // In the browser, a signed-in admin's token goes with every request (public endpoints ignore it).
  const token = getToken();
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/v1${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: init.signal,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error; // cancelled by the caller: not a connectivity problem
    throw new ApiError("Can't reach the API. Check that it is running.", 0);
  }

  // The token was refused (expired or no longer valid): end the session so the admin asks to sign in.
  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // Nest errors: { message: string | string[] } (validation errors come as an array).
    const message = (data as { message?: unknown } | null)?.message;
    const text = Array.isArray(message) ? message.join(". ") : typeof message === "string" ? message : null;
    throw new ApiError(text ?? `Request failed (${response.status})`, response.status);
  }
  return data as T;
}
