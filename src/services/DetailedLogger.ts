export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  channelId?: string;
}

export interface LogFilter {
  level?: LogLevel;
  category?: string;
  channelId?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

export class DetailedLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 1000;
  private static logLevel: LogLevel = LogLevel.INFO;

  constructor(private context: string) {}

  private static log(level: LogLevel, context: string, message: string, data?: any): void {
    const levels = { 
      [LogLevel.DEBUG]: 0, 
      [LogLevel.INFO]: 1, 
      [LogLevel.WARN]: 2, 
      [LogLevel.ERROR]: 3 
    };
    
    if (levels[level] >= levels[this.logLevel]) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
      
      // Add to internal logs
      const logEntry: LogEntry = {
        timestamp,
        level,
        category: context,
        message,
        data
      };
      
      this.logs.push(logEntry);
      
      // Keep only last maxLogs entries
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      
      // Console output
      if (data) {
        console[level](logMessage, data);
      } else {
        console[level](logMessage);
      }
    }
  }

  static debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  static info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  static warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  static error(context: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data);
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

  static setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  static getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (filter) {
      if (filter.level) {
        const levels = { 
          [LogLevel.DEBUG]: 0, 
          [LogLevel.INFO]: 1, 
          [LogLevel.WARN]: 2, 
          [LogLevel.ERROR]: 3 
        };
        const minLevel = levels[filter.level];
        filteredLogs = filteredLogs.filter(log => levels[log.level] >= minLevel);
      }
      
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => 
          log.category.toLowerCase().includes(filter.category!.toLowerCase())
        );
      }
      
      if (filter.channelId) {
        filteredLogs = filteredLogs.filter(log => log.channelId === filter.channelId);
      }
      
      if (filter.searchTerm) {
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(filter.searchTerm!.toLowerCase()) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(filter.searchTerm!.toLowerCase()))
        );
      }
    }
    
    return filteredLogs.reverse(); // Most recent first
  }

  static exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  static clearLogs(): void {
    this.logs = [];
  }
}
