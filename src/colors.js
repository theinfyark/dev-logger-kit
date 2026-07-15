/** ANSI helpers (zero deps). */
export const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  white: "\x1b[37m",
};

/**
 * @param {boolean} enabled
 * @param {string} color
 * @param {string} text
 */
export function paint(enabled, color, text) {
  if (!enabled) return text;
  return `${color}${text}${ansi.reset}`;
}
