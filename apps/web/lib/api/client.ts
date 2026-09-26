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
export async function apiRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("The API address is not configured (set NEXT_PUBLIC_API_URL).", 0);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/v1${path}`, {
      method: init.method ?? "GET",
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Can't reach the API. Check that it is running.", 0);
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
