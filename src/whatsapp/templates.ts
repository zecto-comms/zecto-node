import type { Transport } from "../transport.js";
import { InvalidRequestError } from "../errors.js";
import type { Json } from "../types.js";

export class Templates {
  constructor(private transport: Transport) {}

  async list(
    opts: { status?: string; category?: string; search?: string } = {},
  ): Promise<unknown> {
    const params = { status: opts.status, category: opts.category, search: opts.search };
    return this.transport.request("GET", "/v1/templates", params);
  }

  async exampleConfig(templateId: string): Promise<Json> {
    if (!templateId) {
      throw new InvalidRequestError("templateId is required");
    }
    return this.transport.request("GET", `/v1/templates/example-config/${encodeURIComponent(templateId)}`) as Promise<Json>;
  }
}
