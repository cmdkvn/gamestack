// Tiny fetch wrapper for the gamestack engine SDK's localhost HTTP endpoints.
// Stays small on purpose — Bun's native fetch covers everything; this module
// just adds typed helpers, retry/backoff, and a useful error surface.

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  constructor(public baseUrl: string) {
    if (this.baseUrl.endsWith("/")) this.baseUrl = this.baseUrl.slice(0, -1);
  }

  async get<T>(path: string, opts: FetchOptions = {}): Promise<T> {
    return this.request<T>("GET", path, undefined, opts);
  }

  async post<T>(path: string, body: unknown, opts: FetchOptions = {}): Promise<T> {
    return this.request<T>("POST", path, body, opts);
  }

  async postRaw(path: string, body: unknown, opts: FetchOptions = {}): Promise<Response> {
    const url = this.baseUrl + path;
    const headers: Record<string, string> = { "content-type": "application/json", ...(opts.headers ?? {}) };
    const init: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
    };
    return await fetch(url, init);
  }

  private async request<T>(method: string, path: string, body: unknown, opts: FetchOptions): Promise<T> {
    const url = this.baseUrl + path;
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (body !== undefined) headers["content-type"] = "application/json";

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    let resp: Response;
    try {
      resp = await fetch(url, init);
    } catch (err) {
      throw new HttpError(`network error calling ${method} ${url}: ${(err as Error).message}`, 0);
    }
    if (!resp.ok) {
      let text = "";
      try { text = await resp.text(); } catch { /* ignore */ }
      throw new HttpError(`${method} ${url} → HTTP ${resp.status}${text ? `: ${text}` : ""}`, resp.status);
    }
    const ct = resp.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await resp.json()) as T;
    }
    // Caller asked for typed JSON but server returned something else; surface raw text.
    return (await resp.text()) as unknown as T;
  }
}

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "HttpError";
  }
}

export async function pollUntil<T>(
  fetcher: () => Promise<T>,
  predicate: (value: T) => boolean,
  opts: { timeoutMs: number; intervalMs?: number },
): Promise<{ value: T; elapsedMs: number; timedOut: boolean }> {
  const interval = opts.intervalMs ?? 100;
  const start = Date.now();
  let last: T;
  while (true) {
    last = await fetcher();
    if (predicate(last)) return { value: last, elapsedMs: Date.now() - start, timedOut: false };
    if (Date.now() - start >= opts.timeoutMs) {
      return { value: last, elapsedMs: Date.now() - start, timedOut: true };
    }
    await new Promise((r) => setTimeout(r, interval));
  }
}
