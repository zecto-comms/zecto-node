import type { Transport } from "../transport.js";
import { Messages } from "./messages.js";
import { Templates } from "./templates.js";
import { Numbers } from "./numbers.js";
import { Account } from "./account.js";
import { Flows } from "./flows.js";

export class WhatsApp {
  messages: Messages;
  templates: Templates;
  numbers: Numbers;
  account: Account;
  flows: Flows;

  constructor(transport: Transport) {
    this.messages = new Messages(transport);
    this.templates = new Templates(transport);
    this.numbers = new Numbers(transport);
    this.account = new Account(transport);
    this.flows = new Flows(transport);
  }
}
