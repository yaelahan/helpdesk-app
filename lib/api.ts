import type { ApiError } from "@/lib/types";

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
  extraHeaders?: HeadersInit,
): Response {
  const body: ApiError = { error: { code, message, details } };
  return Response.json(body, { status, headers: extraHeaders });
}

export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}
