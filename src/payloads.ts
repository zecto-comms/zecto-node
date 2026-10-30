import { InvalidRequestError } from "./errors.js";
import type { Button, Contact, Json, Row, Section } from "./types.js";

function digitsOnly(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function fillWaIds(contactsList: Contact[]): Contact[] {
  // Copy rather than mutate the caller's objects.
  return contactsList.map((contact) => {
    if (!contact.phones) return contact;
    return {
      ...contact,
      phones: contact.phones.map((phone) =>
        !phone.wa_id && phone.phone
          ? { ...phone, wa_id: digitsOnly(phone.phone) }
          : phone,
      ),
    };
  });
}

function base(
  phoneNumberId: string,
  to: string,
  msgType: string,
  replyTo?: string,
): Json {
  const payload: Json = { phone_number_id: phoneNumberId, to, type: msgType };
  if (replyTo) {
    payload.context = { message_id: replyTo };
  }
  return payload;
}

function mediaObject(
  link?: string,
  mediaId?: string,
  caption?: string,
  filename?: string,
): Json {
  if (!link && !mediaId) {
    throw new InvalidRequestError("Provide either 'link' or 'mediaId'");
  }
  const obj: Json = {};
  if (link) obj.link = link;
  if (mediaId) obj.id = mediaId;
  if (caption !== undefined) obj.caption = caption;
  if (filename !== undefined) obj.filename = filename;
  return obj;
}

export function text(
  phoneNumberId: string,
  to: string,
  body: string,
  previewUrl = false,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "text", replyTo);
  payload.text = { body, preview_url: previewUrl };
  return payload;
}

export function image(
  phoneNumberId: string,
  to: string,
  link?: string,
  mediaId?: string,
  caption?: string,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "image", replyTo);
  payload.image = mediaObject(link, mediaId, caption);
  return payload;
}

export function video(
  phoneNumberId: string,
  to: string,
  link?: string,
  mediaId?: string,
  caption?: string,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "video", replyTo);
  payload.video = mediaObject(link, mediaId, caption);
  return payload;
}

export function audio(
  phoneNumberId: string,
  to: string,
  link?: string,
  mediaId?: string,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "audio", replyTo);
  payload.audio = mediaObject(link, mediaId);
  return payload;
}

export function document(
  phoneNumberId: string,
  to: string,
  link?: string,
  mediaId?: string,
  caption?: string,
  filename?: string,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "document", replyTo);
  payload.document = mediaObject(link, mediaId, caption, filename);
  return payload;
}

export function location(
  phoneNumberId: string,
  to: string,
  latitude: number,
  longitude: number,
  name?: string,
  address?: string,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "location", replyTo);
  const loc: Json = { latitude, longitude };
  if (name !== undefined) loc.name = name;
  if (address !== undefined) loc.address = address;
  payload.location = loc;
  return payload;
}

export function contacts(
  phoneNumberId: string,
  to: string,
  contactsList: Contact[],
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "contacts", replyTo);
  payload.contacts = fillWaIds(contactsList);
  return payload;
}

export function interactive(
  phoneNumberId: string,
  to: string,
  interactiveObj: Json,
  replyTo?: string,
): Json {
  const payload = base(phoneNumberId, to, "interactive", replyTo);
  payload.interactive = interactiveObj;
  return payload;
}

function interactiveShell(
  itype: string,
  body: string,
  header?: string,
  footer?: string,
): Json {
  const obj: Json = { type: itype, body: { text: body } };
  if (header !== undefined) obj.header = { type: "text", text: header };
  if (footer !== undefined) obj.footer = { text: footer };
  return obj;
}

function slugifyId(title: string | undefined, index: number): string {
  const slug = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `option_${index}`;
}

export function interactiveButtons(
  phoneNumberId: string,
  to: string,
  body: string,
  buttons: Button[],
  header?: string,
  footer?: string,
  replyTo?: string,
): Json {
  if (!buttons || buttons.length === 0) {
    throw new InvalidRequestError("At least one button is required");
  }
  if (buttons.length > 3) {
    throw new InvalidRequestError("A maximum of 3 reply buttons is allowed");
  }

  const actionButtons: Json[] = [];
  buttons.forEach((b, i) => {
    let title: string | undefined;
    let bid: string;
    if (typeof b === "string") {
      bid = slugifyId(b, i);
      title = b;
    } else {
      title = b.title;
      bid = b.id || slugifyId(title, i);
    }
    if (!title) {
      throw new InvalidRequestError(`Button ${i + 1}: title is required`);
    }
    actionButtons.push({ type: "reply", reply: { id: bid, title } });
  });

  const obj = interactiveShell("button", body, header, footer);
  obj.action = { buttons: actionButtons };
  return interactive(phoneNumberId, to, obj, replyTo);
}

export function interactiveList(
  phoneNumberId: string,
  to: string,
  body: string,
  button: string,
  sections: Section[],
  header?: string,
  footer?: string,
  replyTo?: string,
): Json {
  if (!button) {
    throw new InvalidRequestError("A menu 'button' label is required");
  }
  if (!sections || sections.length === 0) {
    throw new InvalidRequestError("At least one section is required");
  }

  const normSections: Json[] = [];
  sections.forEach((section, si) => {
    const rows = section.rows ?? [];
    if (rows.length === 0) {
      throw new InvalidRequestError(`Section ${si + 1}: at least one row is required`);
    }
    const normRows: Json[] = [];
    rows.forEach((row: Row, ri) => {
      let title: string | undefined;
      let desc: string | undefined;
      let rid: string;
      if (typeof row === "string") {
        rid = slugifyId(row, ri);
        title = row;
        desc = undefined;
      } else {
        title = row.title;
        rid = row.id || slugifyId(title, ri);
        desc = row.description;
      }
      if (!title) {
        throw new InvalidRequestError(`Section ${si + 1} row ${ri + 1}: title is required`);
      }
      const nr: Json = { id: rid, title };
      if (desc !== undefined) nr.description = desc;
      normRows.push(nr);
    });
    const ns: Json = { rows: normRows };
    if (section.title !== undefined) ns.title = section.title;
    normSections.push(ns);
  });

  const obj = interactiveShell("list", body, header, footer);
  obj.action = { button, sections: normSections };
  return interactive(phoneNumberId, to, obj, replyTo);
}

export function interactiveCtaUrl(
  phoneNumberId: string,
  to: string,
  body: string,
  displayText: string,
  url: string,
  header?: string,
  footer?: string,
  replyTo?: string,
): Json {
  if (!displayText) {
    throw new InvalidRequestError("'displayText' is required");
  }
  if (!url) {
    throw new InvalidRequestError("'url' is required");
  }

  const obj = interactiveShell("cta_url", body, header, footer);
  obj.action = { name: "cta_url", parameters: { display_text: displayText, url } };
  return interactive(phoneNumberId, to, obj, replyTo);
}

export function template(
  phoneNumberId: string,
  to: string,
  templateId: string,
  body?: unknown,
  header?: unknown,
  buttons?: unknown,
): Json {
  const payload: Json = {
    phone_number_id: phoneNumberId,
    to,
    template_id: templateId,
  };
  if (body !== undefined && body !== null) {
    payload.body = Array.isArray(body) ? body : [body];
  }
  if (header !== undefined && header !== null) {
    payload.header = header;
  }
  if (buttons !== undefined && buttons !== null) {
    payload.buttons = Array.isArray(buttons) ? buttons : [buttons];
  }
  return payload;
}

export function readReceipt(
  phoneNumberId: string,
  messageId: string,
  typing = false,
): Json {
  return {
    phone_number_id: phoneNumberId,
    message_id: messageId,
    typing,
  };
}
