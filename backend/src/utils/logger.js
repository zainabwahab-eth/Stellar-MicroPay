/**
 * src/utils/logger.js
 * Minimal structured logger with pino-style call signatures, backed by console.
 * Accepts either `logger.info("message")` or `logger.info({ context }, "message")`.
 */

"use strict";

function format(args) {
  const [first, ...rest] = args;
  if (typeof first === "string" || first instanceof Error) {
    return args;
  }
  return [...rest, first];
}

module.exports = {
  info: (...args) => console.info(...format(args)),
  warn: (...args) => console.warn(...format(args)),
  error: (...args) => console.error(...format(args)),
  debug: (...args) => console.debug(...format(args)),
};
