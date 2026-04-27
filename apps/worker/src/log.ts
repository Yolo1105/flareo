/**
 * JSON-lines logger. One object per line on stdout; systemd journal
 * and any downstream log aggregator can parse these without much
 * ceremony.
 *
 * We deliberately do NOT pull in pino or winston. Build-worker logs
 * are high-value low-volume; a 20-line logger keeps the dependency
 * tree minimal and the log format predictable.
 */

type Level = "debug" | "info" | "warn" | "error";

interface LogContext {
  [k: string]: unknown;
}

function write(level: Level, msg: string, ctx?: LogContext): void {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  };
  // stderr for warn/error so systemd can pick them up separately;
  // info/debug go to stdout.
  const stream = level === "warn" || level === "error" ? process.stderr : process.stdout;
  stream.write(JSON.stringify(line) + "\n");
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => {
    if (process.env.LOG_LEVEL === "debug") write("debug", msg, ctx);
  },
  info: (msg: string, ctx?: LogContext) => write("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => write("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => write("error", msg, ctx),
};
