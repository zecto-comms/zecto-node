export interface ClientOptions {
  apiKey: string;
  timeout?: number;
}

export type Json = Record<string, unknown>;

export interface Phone {
  phone?: string;
  wa_id?: string;
  type?: string;
}

export interface Contact {
  name?: Record<string, unknown>;
  phones?: Phone[];
  [key: string]: unknown;
}

export interface ButtonObject {
  id?: string;
  title?: string;
}

export type Button = string | ButtonObject;

export interface RowObject {
  id?: string;
  title?: string;
  description?: string;
}

export type Row = string | RowObject;

export interface Section {
  title?: string;
  rows: Row[];
}

export interface ListParams {
  phoneNumberId?: string;
  status?: string;
  toNumber?: string;
  limit?: number;
  offset?: number;
}

export interface RequestOptions {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  json?: unknown;
}
