import type { AsyncLocalStorage } from "node:async_hooks";

/** Minimal Express/Connect middleware shape (no express dependency required). */
export type RequestHandler = (
  req: any,
  res: any,
  next: (err?: any) => void,
) => void;

export type LogLevel =
  | "debug"
  | "info"
  | "success"
  | "warn"
  | "error"
  | "silent";

export interface LogEntry {
  level: Exclude<LogLevel, "silent">;
  message: string;
  requestId?: string;
  file?: string;
  line?: number | null;
  ms?: number;
  error?: Error;
  time: string;
}

export interface LoggerOptions {
  color?: boolean;
  level?: LogLevel | string;
  timestamps?: boolean;
  showFile?: boolean;
  showRequestId?: boolean;
  sink?: (line: string, entry: LogEntry) => void;
  name?: string;
}

export interface RequestStore {
  requestId: string;
  startedAt: number;
}

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  success(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  withRequest<T>(
    requestId: string | undefined,
    fn: () => T | Promise<T>,
  ): T | Promise<T>;
  middleware(opts?: { header?: string }): RequestHandler;
  time<T>(label: string, fn: () => T | Promise<T>): Promise<T>;
  child(next?: Partial<LoggerOptions>): Logger;
}

export interface AnsiColors {
  reset: string;
  bold: string;
  dim: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  gray: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  white: string;
}

export declare const ansi: AnsiColors;
export function paint(enabled: boolean, color: string, text: string): string;

export function createLogger(options?: LoggerOptions): Logger;
export declare const log: Logger;
export declare const requestStore: AsyncLocalStorage<RequestStore>;
