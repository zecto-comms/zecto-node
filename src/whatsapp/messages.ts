import type { Transport } from "../transport.js";
import * as payloads from "../payloads.js";
import { InvalidRequestError } from "../errors.js";
import type { Button, Contact, Json, Section } from "../types.js";

export class Messages {
  constructor(private transport: Transport) {}

  async send(payload: Json): Promise<Json> {
    return this.transport.request("POST", "/v1/messages/send", undefined, payload) as Promise<Json>;
  }

  async sendText(
    phoneNumberId: string,
    to: string,
    body: string,
    previewUrl = false,
    replyTo?: string,
  ): Promise<Json> {
    return this.send(payloads.text(phoneNumberId, to, body, previewUrl, replyTo));
  }

  async sendImage(
    phoneNumberId: string,
    to: string,
    opts: { link?: string; mediaId?: string; caption?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.image(phoneNumberId, to, opts.link, opts.mediaId, opts.caption, opts.replyTo),
    );
  }

  async sendVideo(
    phoneNumberId: string,
    to: string,
    opts: { link?: string; mediaId?: string; caption?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.video(phoneNumberId, to, opts.link, opts.mediaId, opts.caption, opts.replyTo),
    );
  }

  async sendAudio(
    phoneNumberId: string,
    to: string,
    opts: { link?: string; mediaId?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.audio(phoneNumberId, to, opts.link, opts.mediaId, opts.replyTo),
    );
  }

  async sendDocument(
    phoneNumberId: string,
    to: string,
    opts: { link?: string; mediaId?: string; caption?: string; filename?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.document(phoneNumberId, to, opts.link, opts.mediaId, opts.caption, opts.filename, opts.replyTo),
    );
  }

  async sendLocation(
    phoneNumberId: string,
    to: string,
    latitude: number,
    longitude: number,
    opts: { name?: string; address?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.location(phoneNumberId, to, latitude, longitude, opts.name, opts.address, opts.replyTo),
    );
  }

  async sendContacts(
    phoneNumberId: string,
    to: string,
    contactsList: Contact[],
    replyTo?: string,
  ): Promise<Json> {
    return this.send(payloads.contacts(phoneNumberId, to, contactsList, replyTo));
  }

  async sendButtons(
    phoneNumberId: string,
    to: string,
    body: string,
    buttons: Button[],
    opts: { header?: string; footer?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.interactiveButtons(phoneNumberId, to, body, buttons, opts.header, opts.footer, opts.replyTo),
    );
  }

  async sendList(
    phoneNumberId: string,
    to: string,
    body: string,
    button: string,
    sections: Section[],
    opts: { header?: string; footer?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.interactiveList(phoneNumberId, to, body, button, sections, opts.header, opts.footer, opts.replyTo),
    );
  }

  async sendCtaUrl(
    phoneNumberId: string,
    to: string,
    body: string,
    displayText: string,
    url: string,
    opts: { header?: string; footer?: string; replyTo?: string } = {},
  ): Promise<Json> {
    return this.send(
      payloads.interactiveCtaUrl(phoneNumberId, to, body, displayText, url, opts.header, opts.footer, opts.replyTo),
    );
  }

  async sendTemplate(
    phoneNumberId: string,
    to: string,
    templateId: string,
    opts: { body?: unknown; header?: unknown; buttons?: unknown } = {},
  ): Promise<Json> {
    const payload = payloads.template(phoneNumberId, to, templateId, opts.body, opts.header, opts.buttons);
    return this.transport.request("POST", "/v1/messages/send-template", undefined, payload) as Promise<Json>;
  }

  async markRead(
    phoneNumberId: string,
    messageId: string,
    typing = false,
  ): Promise<Json> {
    const payload = payloads.readReceipt(phoneNumberId, messageId, typing);
    return this.transport.request("POST", "/v1/messages/read", undefined, payload) as Promise<Json>;
  }

  async list(
    opts: { phoneNumberId?: string; status?: string; toNumber?: string; limit?: number; offset?: number } = {},
  ): Promise<unknown> {
    const params = {
      phone_number_id: opts.phoneNumberId,
      status: opts.status,
      to_number: opts.toNumber,
      limit: opts.limit ?? 50,
      offset: opts.offset ?? 0,
    };
    return this.transport.request("GET", "/v1/messages", params);
  }

  async get(messageId: string): Promise<Json> {
    if (!messageId) {
      throw new InvalidRequestError("messageId is required");
    }
    return this.transport.request("GET", `/v1/messages/${encodeURIComponent(messageId)}`) as Promise<Json>;
  }
}
