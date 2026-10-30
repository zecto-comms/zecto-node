# Zecto Node/TypeScript SDK

Node/TypeScript SDK for the Zecto multi-channel messaging platform.

Works in any Node framework (Express, Fastify, NestJS, Koa, and others) and in server-side code for full-stack frameworks (Next.js, Remix, Nuxt, SvelteKit). Because it is built on the native `fetch` API with no runtime dependencies, it also runs on Deno, Bun, and edge runtimes.

## Requirements

- Node.js 18 or newer (for native `fetch`)

## Installation

```
npm install zecto
```

## Quick start

```ts
import { ZectoClient } from "zecto";

const client = new ZectoClient({ apiKey: process.env.ZECTO_API_KEY });

const res = await client.whatsapp.messages.sendText(
  "PHONE_NUMBER_ID",
  "923001234567",
  "Hello from Zecto",
);

console.log(res.message_id);
```

Every method is asynchronous and returns a `Promise`, so calls must be awaited inside an `async` function or with top-level `await` in an ES module.

## Configuration

The client is created with an options object:

```ts
const client = new ZectoClient({
  apiKey: "your-api-key",
  timeout: 30000,
});
```

| Option    | Required | Default                 | Description                     |
| --------- | -------- | ----------------------- | ------------------------------- |
| `apiKey`  | yes      | none                    | Your Zecto API key              |
| `timeout` | no       | `30000`                 | Request timeout in milliseconds |

## Keep your API key on the server

Your API key is a secret. Use this SDK only in server-side code (a backend service, or the server side of a full-stack framework such as an API route or server action). Never import it into browser or client-side code, where the key would be exposed to end users. Load the key from an environment variable rather than hardcoding it.

## Messages

All message methods live under `client.whatsapp.messages`.

### Text

```ts
await client.whatsapp.messages.sendText("PID", "923001234567", "Plain text");
await client.whatsapp.messages.sendText("PID", "923001234567", "With link https://zecto.com", true);
```

### Media

Media methods take the required arguments positionally and the optional ones in an options object. Provide either `link` or `mediaId`.

```ts
await client.whatsapp.messages.sendImage("PID", "923001234567", {
  link: "https://example.com/image.jpg",
  caption: "An image",
});

await client.whatsapp.messages.sendVideo("PID", "923001234567", { link: "https://example.com/video.mp4" });

await client.whatsapp.messages.sendAudio("PID", "923001234567", { link: "https://example.com/audio.mp3" });

await client.whatsapp.messages.sendDocument("PID", "923001234567", {
  link: "https://example.com/file.pdf",
  filename: "file.pdf",
  caption: "A document",
});
```

### Location

```ts
await client.whatsapp.messages.sendLocation("PID", "923001234567", 31.5204, 74.3587, {
  name: "Lahore",
  address: "Lahore, Pakistan",
});
```

### Contacts

```ts
await client.whatsapp.messages.sendContacts("PID", "923001234567", [
  {
    name: { formatted_name: "Jane Doe", first_name: "Jane" },
    phones: [{ phone: "+92 300 1234567" }],
  },
]);
```

### Interactive buttons

Buttons can be plain strings or objects with an explicit `id`. A maximum of three is allowed.

```ts
await client.whatsapp.messages.sendButtons("PID", "923001234567", "Please choose:", ["Yes", "No", "Maybe"], {
  header: "Header text",
  footer: "Footer text",
});
```

### Interactive list

```ts
await client.whatsapp.messages.sendList(
  "PID",
  "923001234567",
  "Choose an option",
  "Open menu",
  [
    {
      title: "Section 1",
      rows: [
        { title: "Option A", description: "First option" },
        { title: "Option B", description: "Second option" },
      ],
    },
  ],
  { header: "List header", footer: "List footer" },
);
```

### Call-to-action URL

```ts
await client.whatsapp.messages.sendCtaUrl(
  "PID",
  "923001234567",
  "Visit our site",
  "Open Zecto",
  "https://zecto.com",
  { header: "Header", footer: "Footer" },
);
```

### Templates

Fetch a template's expected parameters, then send it. The example config returned by the API shows the exact shape a template expects.

```ts
const config = await client.whatsapp.templates.exampleConfig("TEMPLATE_ID");

await client.whatsapp.messages.sendTemplate("PID", "923001234567", "TEMPLATE_ID", {
  body: ["value1"],
  buttons: ["yes", "PROMO2026"],
});
```

`body` and `buttons` accept a single value or an array; a single value is wrapped into an array automatically.

### Other message operations

```ts
await client.whatsapp.messages.markRead("PID", "MESSAGE_ID");
await client.whatsapp.messages.markRead("PID", "MESSAGE_ID", true);

await client.whatsapp.messages.list({ status: "sent", limit: 20, offset: 0 });

await client.whatsapp.messages.get("MESSAGE_ID");
```

## Templates

```ts
await client.whatsapp.templates.list();
await client.whatsapp.templates.list({ status: "approved", category: "MARKETING", search: "otp" });
await client.whatsapp.templates.exampleConfig("TEMPLATE_ID");
```

## Numbers

```ts
await client.whatsapp.numbers.list();
await client.whatsapp.numbers.get("PHONE_NUMBER_ID");
```

## Account

```ts
await client.whatsapp.account.get();
```

## Flows

```ts
await client.whatsapp.flows.list();
await client.whatsapp.flows.list("published");
await client.whatsapp.flows.rename("FLOW_ID", "New name");
await client.whatsapp.flows.setStatus("FLOW_ID", "published");
await client.whatsapp.flows.trigger("FLOW_ID", "923001234567");
```

## Error handling

All errors extend `ZectoError`. API responses map to specific classes by status code, so you can catch the case you care about.

```ts
import { ZectoClient, AuthenticationError, ValidationError, RateLimitError } from "zecto";

try {
  await client.whatsapp.messages.sendText("PID", "923001234567", "Hi");
} catch (err) {
  if (err instanceof AuthenticationError) {
    // invalid API key
  } else if (err instanceof ValidationError) {
    // malformed request payload
  } else if (err instanceof RateLimitError) {
    // slow down
  } else {
    throw err;
  }
}
```

| Class                   | Trigger                            |
| ----------------------- | ---------------------------------- |
| `InvalidRequestError`   | Client-side validation before send |
| `APIConnectionError`    | Network failure or timeout         |
| `ValidationError`       | HTTP 400 / 422                      |
| `AuthenticationError`   | HTTP 401                            |
| `PermissionDeniedError` | HTTP 403                            |
| `NotFoundError`         | HTTP 404                            |
| `ConflictError`         | HTTP 409                            |
| `RateLimitError`        | HTTP 429                            |
| `UpstreamError`         | HTTP 502                            |
| `ServerError`           | Other 5xx                          |
| `APIError`              | Base class for all HTTP errors     |
| `ZectoError`            | Base class for all SDK errors      |

`APIError` instances expose `statusCode`, `detail`, and `body` for inspection.

## Usage with frameworks

### Express

```ts
import express from "express";
import { ZectoClient } from "zecto";

const app = express();
app.use(express.json());

const client = new ZectoClient({ apiKey: process.env.ZECTO_API_KEY });

app.post("/notify", async (req, res) => {
  try {
    const result = await client.whatsapp.messages.sendText(
      process.env.ZECTO_PID,
      req.body.to,
      req.body.message,
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

### Next.js (API route)

```ts
// app/api/notify/route.ts
import { ZectoClient } from "zecto";

const client = new ZectoClient({ apiKey: process.env.ZECTO_API_KEY });

export async function POST(req: Request) {
  const { to, message } = await req.json();
  const result = await client.whatsapp.messages.sendText(process.env.ZECTO_PID, to, message);
  return Response.json(result);
}
```

Keep the client in server-only files. Do not import it into React components that run in the browser.

## TypeScript

The package ships with type declarations. Exported types include `ClientOptions`, `Contact`, `Phone`, `Button`, `Section`, and `Row`, so payloads are checked at compile time.

## Development

```
npm install
npm run build       # builds dist/ (ESM, CJS, and type declarations)
npm run typecheck   # type-checks without emitting
```

## License

MIT