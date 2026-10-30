import type { Transport } from "../transport.js";
import { InvalidRequestError } from "../errors.js";
import type { Json } from "../types.js";

export class Flows {
  constructor(private transport: Transport) {}

  async list(status?: string): Promise<unknown> {
    return this.transport.request("GET", "/v1/flows", { status });
  }

  async rename(flowId: string, name: string): Promise<Json> {
    if (!flowId) {
      throw new InvalidRequestError("flowId is required");
    }
    if (!name) {
      throw new InvalidRequestError("name is required");
    }
    return this.transport.request("POST", `/v1/flows/${encodeURIComponent(flowId)}/rename`, undefined, { name }) as Promise<Json>;
  }

  async setStatus(flowId: string, status: string): Promise<Json> {
    if (!flowId) {
      throw new InvalidRequestError("flowId is required");
    }
    if (!status) {
      throw new InvalidRequestError("status is required");
    }
    return this.transport.request("POST", `/v1/flows/${encodeURIComponent(flowId)}/status`, undefined, { status }) as Promise<Json>;
  }

  async trigger(flowId: string, to: string): Promise<Json> {
    if (!flowId) {
      throw new InvalidRequestError("flowId is required");
    }
    if (!to) {
      throw new InvalidRequestError("to is required");
    }
    return this.transport.request("POST", `/v1/flows/${encodeURIComponent(flowId)}/trigger`, undefined, { to }) as Promise<Json>;
  }
}
