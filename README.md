# dev-logger-kit

Beautiful colored Node.js logger for development.

> `devlogger` was previously unpublished on npm, so this ships as **`dev-logger-kit`**.

```bash
npm install dev-logger-kit
```

## Levels

`DEBUG` · `INFO` · `SUCCESS` · `WARN` · `ERROR`

## Features

- Colored badges
- Request IDs
- Execution time (`+12ms`)
- File name + line
- Stack traces for `Error` objects
- Express middleware
- Zero dependencies

## Quick start

```js
import { log, createLogger } from "dev-logger-kit";

log.info("Server started");
log.success("Connected to DB");
log.warn("Cache miss");
log.error("Boom", new Error("DB down"));
log.debug({ userId: 1 });
```

Example output:

```text
 INFO  2026-07-15 16:40:01.123  app.js:12  Server started
 SUCCESS  2026-07-15 16:40:01.130  app.js:13  Connected to DB
 ERROR  2026-07-15 16:40:01.140  app.js:14  Boom
Error: DB down
    at ...
```

## Request IDs + execution time

```js
import { log } from "dev-logger-kit";

await log.withRequest("req_abc", async () => {
  log.info("handling request");
  // → INFO ... req:req_abc +3ms handling request
});
```

### Express middleware

```js
import express from "express";
import { log } from "dev-logger-kit";

const app = express();
app.use(log.middleware());

app.get("/hello", (req, res) => {
  log.info("hello handler", { id: req.id });
  res.json({ ok: true });
});
```

## Time a function

```js
await log.time("load-users", async () => {
  // ...
});
// → SUCCESS ⏱ load-users done in 42ms
```

## Options

```js
const log = createLogger({
  color: true,
  level: "info",      // debug | info | success | warn | error | silent
  timestamps: true,
  showFile: true,
  showRequestId: true,
  name: "api",
});
```

Env: `LOG_LEVEL=warn`

## License

MIT
