export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface ILoggerOptions {
  level?: LogLevel
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const VALID_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

function parseLogLevel(raw?: string): LogLevel {
  const lower = (raw ?? 'info').trim().toLowerCase() as LogLevel
  return VALID_LEVELS.includes(lower) ? lower : 'info'
}

const CURRENT_LEVEL = parseLogLevel(import.meta.env.VITE_LOG_LEVEL as string | undefined)

function formatTimestamp() {
  return new Date().toISOString()
}

function shouldLog(targetLevel: LogLevel): boolean {
  return LEVEL_ORDER[targetLevel] >= LEVEL_ORDER[CURRENT_LEVEL]
}

function formatMessage(
  level: LogLevel,
  module: string,
  message: string,
  extra?: unknown
) {
  const timestamp = formatTimestamp()
  const base = `[${timestamp}] [${module}] [${level.toUpperCase()}] ${message}`
  return extra !== undefined ? `${base} ${JSON.stringify(extra)}` : base
}

export interface ILogger {
  debug: (message: string, extra?: unknown) => void
  info: (message: string, extra?: unknown) => void
  warn: (message: string, extra?: unknown) => void
  error: (message: string, extra?: unknown) => void
}

export function createLogger(moduleName: string): ILogger {
  return {
    debug(message: string, extra?: unknown) {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', moduleName, message, extra))
      }
    },
    info(message: string, extra?: unknown) {
      if (shouldLog('info')) {
        console.info(formatMessage('info', moduleName, message, extra))
      }
    },
    warn(message: string, extra?: unknown) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', moduleName, message, extra))
      }
    },
    error(message: string, extra?: unknown) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', moduleName, message, extra))
      }
    },
  }
}
