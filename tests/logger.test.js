import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../src/index.js";

describe("dev-logger-kit", () => {
  it("emits INFO / ERROR / SUCCESS / WARN / DEBUG lines", () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      showFile: false,
      timestamps: false,
      sink: (line) => lines.push(line),
    });

    log.debug("d");
    log.info("i");
    log.success("s");
    log.warn("w");
    log.error("e");

    assert.match(lines[0], /DEBUG/);
    assert.match(lines[1], /INFO/);
    assert.match(lines[2], /SUCCESS/);
    assert.match(lines[3], /WARN/);
    assert.match(lines[4], /ERROR/);
  });

  it("includes request id and execution time", async () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      showFile: false,
      timestamps: false,
      sink: (line) => lines.push(line),
    });

    await log.withRequest("abc12345", async () => {
      await new Promise((r) => setTimeout(r, 5));
      log.info("inside");
    });

    assert.match(lines[0], /req:abc12345/);
    assert.match(lines[0], /\+\d+ms/);
  });

  it("prints stack traces for Error args", () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      showFile: false,
      timestamps: false,
      sink: (line) => lines.push(line),
    });

    log.error("boom", new Error("Nope"));
    assert.match(lines[0], /ERROR/);
    assert.match(lines[0], /Error: Nope/);
    assert.match(lines[0], /at /);
  });

  it("includes file name when enabled", () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      timestamps: false,
      showFile: true,
      sink: (line) => lines.push(line),
    });

    log.info("where");
    assert.match(lines[0], /logger\.test\.js:\d+/);
  });

  it("times work with log.time()", async () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      showFile: false,
      timestamps: false,
      sink: (line) => lines.push(line),
    });

    const value = await log.time("job", async () => 42);
    assert.equal(value, 42);
    assert.ok(lines.some((l) => /SUCCESS/.test(l) && /job done/.test(l)));
  });

  it("respects log level", () => {
    /** @type {string[]} */
    const lines = [];
    const log = createLogger({
      color: false,
      level: "warn",
      showFile: false,
      timestamps: false,
      sink: (line) => lines.push(line),
    });

    log.debug("no");
    log.info("no");
    log.warn("yes");
    assert.equal(lines.length, 1);
    assert.match(lines[0], /WARN/);
  });
});
