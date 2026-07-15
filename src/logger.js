import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { ansi, paint } from "./colors.js";
import { getCaller, formatStack } from "./caller.js";

const LEVELS = {
  debug: 10,
  info: 20,
  success: 25,
  warn: 30,
  error: 40,
  silent: 100,
};

const LEVEL_STYLE = {
  debug: { label: "DEBUG", color: ansi.magenta, bg: ansi.bgMagenta },
  info: { label: "INFO", color: ansi.blue, bg: ansi.bgBlue },
  success: { label: "SUCCESS", color: ansi.green, bg: ansi.bgGreen },
  warn: { label: "WARN", color: ansi.yellow, bg: ansi.bgYellow },
  error: { label: "ERROR", color: ansi.red, bg: ansi.bgRed },
};

const requestStore = new AsyncLocalStorage();

/**
 * @typedef {object} LoggerOptions
 * @property {boolean} [color]
 * @property {keyof typeof LEVELS} [level]
 * @property {boolean} [timestamps]
 * @property {boolean} [showFile]
 * @property {boolean} [showRequestId]
 * @property {(line: string, entry: object) => void} [sink]
 * @property {string} [name]
 */

/**
 * Create a beautiful development logger.
 *
 * @param {LoggerOptions} [options]
 */
export function createLogger(options = {}) {
  const state = {
    color: options.color ?? process.stdout.isTTY,
    level: options.level ?? (process.env.LOG_LEVEL || "debug"),
    timestamps: options.timestamps ?? true,
    showFile: options.showFile ?? true,
    showRequestId: options.showRequestId ?? true,
    sink: options.sink,
    name: options.name,
  };

  /**
   * @param {keyof typeof LEVEL_STYLE} level
   * @param {unknown[]} args
   */
  function write(level, args) {
    const min = LEVELS[/** @type {keyof typeof LEVELS} */ (state.level)] ?? LEVELS.debug;
    if ((LEVELS[level] ?? 0) < min) return;

    const style = LEVEL_STYLE[level];
    const caller = state.showFile ? getCaller() : null;
    const store = requestStore.getStore();
    const requestId = store?.requestId;
    const startedAt = store?.startedAt;

    const badge = paint(
      state.color,
      `${style.bg}${ansi.white}${ansi.bold}`,
      ` ${style.label} `,
    );

    const parts = [badge];

    if (state.timestamps) {
      const ts = new Date().toISOString().replace("T", " ").replace("Z", "");
      parts.push(paint(state.color, ansi.gray, ts));
    }

    if (state.name) {
      parts.push(paint(state.color, ansi.cyan, `[${state.name}]`));
    }

    if (state.showRequestId && requestId) {
      parts.push(paint(state.color, ansi.dim + ansi.cyan, `req:${requestId}`));
    }

    if (startedAt != null) {
      const ms = Date.now() - startedAt;
      parts.push(paint(state.color, ansi.dim + ansi.yellow, `+${ms}ms`));
    }

    if (caller?.file) {
      const loc =
        caller.line != null ? `${caller.file}:${caller.line}` : caller.file;
      parts.push(paint(state.color, ansi.gray, loc));
    }

    /** @type {unknown[]} */
    const messages = [];
    /** @type {Error | null} */
    let errorObj = null;

    for (const arg of args) {
      if (arg instanceof Error) {
        errorObj = arg;
        messages.push(arg.message);
      } else if (typeof arg === "object" && arg !== null) {
        try {
          messages.push(JSON.stringify(arg, null, 2));
        } catch {
          messages.push(String(arg));
        }
      } else {
        messages.push(String(arg));
      }
    }

    const message = paint(
      state.color,
      style.color,
      messages.join(" "),
    );

    let line = `${parts.join(" ")} ${message}`;

    if (errorObj) {
      const stack = formatStack(errorObj);
      if (stack) {
        line += `\n${paint(state.color, ansi.dim + ansi.red, stack)}`;
      }
    }

    const entry = {
      level,
      message: messages.join(" "),
      requestId,
      file: caller?.file,
      line: caller?.line,
      ms: startedAt != null ? Date.now() - startedAt : undefined,
      error: errorObj || undefined,
      time: new Date().toISOString(),
    };

    if (typeof state.sink === "function") {
      state.sink(line, entry);
      return;
    }

    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  const logger = {
    /**
     * @param {...unknown} args
     */
    debug(...args) {
      write("debug", args);
    },
    /**
     * @param {...unknown} args
     */
    info(...args) {
      write("info", args);
    },
    /**
     * @param {...unknown} args
     */
    success(...args) {
      write("success", args);
    },
    /**
     * @param {...unknown} args
     */
    warn(...args) {
      write("warn", args);
    },
    /**
     * @param {...unknown} args
     */
    error(...args) {
      write("error", args);
    },

    /**
     * Run `fn` with a request id + start time for timing logs.
     *
     * @template T
     * @param {string | undefined} requestId
     * @param {() => T | Promise<T>} fn
     * @returns {T | Promise<T>}
     */
    withRequest(requestId, fn) {
      return requestStore.run(
        {
          requestId: requestId || randomUUID().slice(0, 8),
          startedAt: Date.now(),
        },
        fn,
      );
    },

    /**
     * Express/Connect middleware — sets request id and logs duration.
     *
     * @param {{ header?: string }} [opts]
     * @returns {import('express').RequestHandler}
     */
    middleware(opts = {}) {
      const header = opts.header ?? "x-request-id";
      return (req, res, next) => {
        const incoming = req.headers[header];
        const id =
          typeof incoming === "string" && incoming.trim()
            ? incoming.trim()
            : randomUUID().slice(0, 8);

        req.id = id;
        res.setHeader("X-Request-Id", id);

        const started = Date.now();
        requestStore.run({ requestId: id, startedAt: started }, () => {
          logger.info(`${req.method} ${req.originalUrl || req.url}`);
          res.on("finish", () => {
            const ms = Date.now() - started;
            const msg = `${req.method} ${req.originalUrl || req.url} → ${res.statusCode} (${ms}ms)`;
            if (res.statusCode >= 500) logger.error(msg);
            else if (res.statusCode >= 400) logger.warn(msg);
            else logger.success(msg);
          });
          next();
        });
      };
    },

    /**
     * Time an async/sync function and log duration.
     *
     * @template T
     * @param {string} label
     * @param {() => T | Promise<T>} fn
     * @returns {Promise<T>}
     */
    async time(label, fn) {
      const start = Date.now();
      logger.debug(`⏱ start ${label}`);
      try {
        const result = await fn();
        logger.success(`⏱ ${label} done in ${Date.now() - start}ms`);
        return result;
      } catch (err) {
        logger.error(`⏱ ${label} failed in ${Date.now() - start}ms`, err);
        throw err;
      }
    },

    /**
     * @param {Partial<LoggerOptions>} next
     */
    child(next = {}) {
      return createLogger({ ...state, ...next });
    },
  };

  return logger;
}

/** Default shared logger */
export const log = createLogger();

export { requestStore };
