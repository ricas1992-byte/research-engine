/**
 * Minimal logger that respects build environment.
 *
 * Why: `console.*` in production leaked user IDs and category
 * names to the browser devtools. We still want dev logging.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const isDev = import.meta.env.DEV

function emit(level: Level, tag: string, args: unknown[]): void {
  if (!isDev && (level === 'debug' || level === 'info')) return
  // eslint-disable-next-line no-console
  const fn = level === 'debug' ? console.log : console[level]
  fn(`[${tag}]`, ...args)
}

export const logger = {
  debug: (tag: string, ...args: unknown[]) => emit('debug', tag, args),
  info:  (tag: string, ...args: unknown[]) => emit('info',  tag, args),
  warn:  (tag: string, ...args: unknown[]) => emit('warn',  tag, args),
  error: (tag: string, ...args: unknown[]) => emit('error', tag, args),
}
