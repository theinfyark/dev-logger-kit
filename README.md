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

## Introduction

**dev-logger-kit** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **dev-logger-kit** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install dev-logger-kit
# or
pnpm add dev-logger-kit
yarn add dev-logger-kit
```

Requires Node.js 18+.

## API Reference

See the exports from `dev-logger-kit` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { /* symbols */ } from "dev-logger-kit";
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts
This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor
Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_MODULE_NOT_FOUND` | Wrong Node version / bad import path | Use Node 18+ and package `exports` |
| Types not resolving | Old moduleResolution | Use `bundler` or `node16`+ |
| Auth / network failures | Missing env or blocked egress | Check credentials and firewall |
| Unexpected runtime errors | Invalid input | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.

