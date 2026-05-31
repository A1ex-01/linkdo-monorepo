export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || "info"
).toLowerCase() as LogLevel;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

interface ILogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function createLogger(moduleName: string): ILogger {
  const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    if (!shouldLog(level)) return;
    const prefix = `[${formatTimestamp()}] [${moduleName}] [${level.toUpperCase()}]`;
    const formatted = `${prefix} ${message}`;
    if (level === "error") {
      console.error(formatted, ...args);
    } else if (level === "warn") {
      console.warn(formatted, ...args);
    } else {
      console.log(formatted, ...args);
    }
  };

  return {
    debug: (message: string, ...args: unknown[]) => log("debug", message, ...args),
    info: (message: string, ...args: unknown[]) => log("info", message, ...args),
    warn: (message: string, ...args: unknown[]) => log("warn", message, ...args),
    error: (message: string, ...args: unknown[]) => log("error", message, ...args),
  };
}
