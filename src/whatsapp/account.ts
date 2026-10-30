import type { Transport } from "../transport.js";
import type { Json } from "../types.js";

export class Account {
  constructor(private transport: Transport) {}

  async get(): Promise<Json> {
    return this.transport.request("GET", "/v1/account") as Promise<Json>;
  }
}
