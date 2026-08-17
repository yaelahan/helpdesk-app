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

/**
 * Best-effort client IP for rate-limit keying. On Vercel the platform sets
 * x-forwarded-for and strips client-supplied copies at the edge, so the first
 * entry is trustworthy there. Locally it is usually absent, which is why the
 * SQL side treats 'unknown' as a value that skips the per-IP bound rather than
 * lumping every local request into one bucket.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
