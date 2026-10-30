import { APIConnectionError, errorForStatus } from "./errors.js";

export const BASE_URL = "https://api.zecto.io/whatsapp";
export const DEFAULT_TIMEOUT = 30000;

function cleanParams(
  params?: Record<string, unknown>,
): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) {
      out[k] = String(v);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function formatDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts: string[] = [];
    for (const item of detail) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const rec = item as Record<string, unknown>;
        let loc = Array.isArray(rec.loc) ? rec.loc : [];
        if (loc.length > 0 && loc[0] === "body") {
          loc = loc.slice(1);
        }
        const field = loc.map(String).join(".");
        const msg = typeof rec.msg === "string" ? rec.msg : "invalid";
        parts.push(field ? `${field}: ${msg}` : msg);
      } else {
        parts.push(String(item));
      }
    }
    return parts.join("; ");
  }
  return String(detail);
}

export interface TransportConfig {
  apiKey: string;
  timeout?: number;
}

export class Transport {
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: TransportConfig) {
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.headers = {
      "X-API-Key": config.apiKey,
      "Content-Type": "application/json",
    };
  }

  async request(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    json?: unknown,
  ): Promise<unknown> {
    const cleaned = cleanParams(params);
    const url = new URL(BASE_URL + path);
    if (cleaned) {
      for (const [k, v] of Object.entries(cleaned)) {
        url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let resp: Response;
    try {
      resp = await fetch(url, {
        method,
        headers: this.headers,
        body: json !== undefined && json !== null ? JSON.stringify(json) : undefined,
        signal: controller.signal,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new APIConnectionError(message);
    } finally {
      clearTimeout(timer);
    }

    return this.handleResponse(resp, method, path);
  }

  private async handleResponse(
    resp: Response,
    method: string,
    path: string,
  ): Promise<unknown> {
    const text = await resp.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    if (resp.status >= 200 && resp.status < 300) {
      return body ?? {};
    }

    const rec = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
    const rawDetail = rec.detail ?? rec.error ?? text ?? "Unknown error";
    const detail = formatDetail(rawDetail);
    throw errorForStatus(resp.status, detail, rec, method, path);
  }

  async close(): Promise<void> {
    // native fetch holds no persistent client to close
  }
}
