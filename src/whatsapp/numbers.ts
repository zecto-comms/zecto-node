import type { Transport } from "../transport.js";
import { InvalidRequestError } from "../errors.js";
import type { Json } from "../types.js";

export class Numbers {
  constructor(private transport: Transport) {}

  async list(): Promise<unknown> {
    return this.transport.request("GET", "/v1/numbers");
  }

  async get(phoneNumberId: string): Promise<Json> {
    if (!phoneNumberId) {
      throw new InvalidRequestError("phoneNumberId is required");
    }
    return this.transport.request("GET", `/v1/numbers/${encodeURIComponent(phoneNumberId)}`) as Promise<Json>;
  }
}
