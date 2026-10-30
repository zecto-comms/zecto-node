import { Transport, DEFAULT_TIMEOUT } from "./transport.js";
import { WhatsApp } from "./whatsapp/index.js";
import type { ClientOptions } from "./types.js";

export class ZectoClient {
  private transport: Transport;
  whatsapp: WhatsApp;

  constructor(options: ClientOptions) {
    if (!options || !options.apiKey) {
      throw new Error("apiKey is required");
    }
    this.transport = new Transport({
      apiKey: options.apiKey,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
    });
    this.whatsapp = new WhatsApp(this.transport);
  }

  async close(): Promise<void> {
    await this.transport.close();
  }
}
