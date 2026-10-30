import type { Json } from "./types.js";

const STATUS_NAMES: Record<number, string> = {
  400: "Bad Request",
  401: "Authentication Error",
  403: "Permission Denied",
  404: "Not Found",
  409: "Conflict",
  422: "Validation Error",
  429: "Rate Limit Exceeded",
  502: "Upstream Error",
};

const RED = "\x1b[91m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function useColor(): boolean {
  return Boolean(process?.stderr?.isTTY);
}

function color(text: string, ...codes: string[]): string {
  if (!useColor()) return text;
  return codes.join("") + text + RESET;
}

export class ZectoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidRequestError extends ZectoError {
  detail: string;
  constructor(detail: string) {
    super(detail);
    this.detail = detail;
  }
  format(): string {
    const header = color("Invalid Request", BOLD, RED);
    return `\n\n${header}\n${this.detail}\n`;
  }
}

export class APIConnectionError extends ZectoError {
  constructor(message = "Could not connect to the Zecto API") {
    super(message);
  }
  format(): string {
    const header = color("Connection Error", BOLD, RED);
    const body = `${this.message}\nCould not reach the Zecto API. Check your network connection.`;
    return `\n\n${header}\n${body}\n`;
  }
}

export class APIError extends ZectoError {
  statusCode: number;
  detail: string;
  body: Json;
  requestMethod?: string;
  path?: string;

  constructor(
    statusCode: number,
    detail: string,
    body?: Json,
    requestMethod?: string,
    path?: string,
  ) {
    super(`[${statusCode}] ${detail}`);
    this.statusCode = statusCode;
    this.detail = detail;
    this.body = body ?? {};
    this.requestMethod = requestMethod;
    this.path = path;
  }

  format(): string {
    const name = STATUS_NAMES[this.statusCode] ?? "API Error";
    const header = color(`${name} [${this.statusCode}]`, BOLD, RED);
    const lines = ["", "", header, this.detail];
    if (this.requestMethod && this.path) {
      lines.push(color(`Request: ${this.requestMethod} ${this.path}`, DIM));
    }
    lines.push("");
    return lines.join("\n");
  }
}

export class ValidationError extends APIError {}
export class AuthenticationError extends APIError {}
export class PermissionDeniedError extends APIError {}
export class NotFoundError extends APIError {}
export class ConflictError extends APIError {}
export class RateLimitError extends APIError {}
export class UpstreamError extends APIError {}
export class ServerError extends APIError {}

const STATUS_MAP: Record<number, new (...args: ConstructorParameters<typeof APIError>) => APIError> = {
  400: ValidationError,
  401: AuthenticationError,
  403: PermissionDeniedError,
  404: NotFoundError,
  409: ConflictError,
  422: ValidationError,
  429: RateLimitError,
  502: UpstreamError,
};

export function errorForStatus(
  statusCode: number,
  detail: string,
  body?: Json,
  requestMethod?: string,
  path?: string,
): APIError {
  let cls = STATUS_MAP[statusCode];
  if (!cls) {
    cls = statusCode >= 500 ? ServerError : APIError;
  }
  return new cls(statusCode, detail, body, requestMethod, path);
}
