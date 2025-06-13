
export class DetailedLogger {
  private context: string;
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  constructor(context: string) {
    this.context = context;
  }

  private static log(level: 'debug' | 'info' | 'warn' | 'error', context: string, message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.logLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
      
      if (data) {
        console[level](logMessage, data);
      } else {
        console[level](logMessage);
      }
    }
  }

  static debug(context: string, message: string, data?: any): void {
    this.log('debug', context, message, data);
  }

  static info(context: string, message: string, data?: any): void {
    this.log('info', context, message, data);
  }

  static warn(context: string, message: string, data?: any): void {
    this.log('warn', context, message, data);
  }

  static error(context: string, message: string, data?: any): void {
    this.log('error', context, message, data);
  }

  debug(message: string, data?: any): void {
    DetailedLogger.debug(this.context, message, data);
  }

  info(message: string, data?: any): void {
    DetailedLogger.info(this.context, message, data);
  }

  warn(message: string, data?: any): void {
    DetailedLogger.warn(this.context, message, data);
  }

  error(message: string, data?: any): void {
    DetailedLogger.error(this.context, message, data);
  }

  static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }
}
