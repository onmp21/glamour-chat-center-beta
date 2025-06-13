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
  userId?: string;
  sessionId?: string;
  instanceName?: string;
  channelId?: string;
}

export interface LogFilter {
  level?: LogLevel;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  sessionId?: string;
  instanceName?: string;
  channelId?: string;
  searchTerm?: string;
}

export class DetailedLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 10000; // Máximo de logs em memória
  private static enableConsole = true;
  private static enableStorage = true;

  /**
   * Configura o logger
   */
  static configure(options: {
    maxLogs?: number;
    enableConsole?: boolean;
    enableStorage?: boolean;
  }) {
    this.maxLogs = options.maxLogs ?? this.maxLogs;
    this.enableConsole = options.enableConsole ?? this.enableConsole;
    this.enableStorage = options.enableStorage ?? this.enableStorage;
  }

  /**
   * Log de debug
   */
  static debug(category: string, message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LogLevel.DEBUG, category, message, data, context);
  }

  /**
   * Log de informação
   */
  static info(category: string, message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LogLevel.INFO, category, message, data, context);
  }

  /**
   * Log de aviso
   */
  static warn(category: string, message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LogLevel.WARN, category, message, data, context);
  }

  /**
   * Log de erro
   */
  static error(category: string, message: string, data?: any, context?: Partial<LogEntry>) {
    this.log(LogLevel.ERROR, category, message, data, context);
  }

  /**
   * Log principal
   */
  private static log(
    level: LogLevel, 
    category: string, 
    message: string, 
    data?: any, 
    context?: Partial<LogEntry>
  ) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      ...context
    };

    // Log no console se habilitado
    if (this.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Armazenar em memória se habilitado
    if (this.enableStorage) {
      this.storeLog(logEntry);
    }

    // Enviar para serviço externo se configurado
    this.sendToExternalService(logEntry);
  }

  /**
   * Log no console com formatação
   */
  private static logToConsole(entry: LogEntry) {
    const emoji = this.getLevelEmoji(entry.level);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString('pt-BR');
    const prefix = `${emoji} [${entry.category.toUpperCase()}] ${timestamp}`;
    
    const contextInfo = this.buildContextInfo(entry);
    const fullMessage = `${prefix} ${entry.message}${contextInfo}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, entry.data);
        break;
    }
  }

  /**
   * Armazenar log em memória
   */
  private static storeLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Remover logs antigos se exceder o limite
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Enviar para serviço externo (placeholder)
   */
  private static sendToExternalService(entry: LogEntry) {
    // Em produção, enviar para serviços como Sentry, LogRocket, etc.
    if (entry.level === LogLevel.ERROR) {
      // Enviar erros críticos para monitoramento
    }
  }

  /**
   * Obter emoji para o nível
   */
  private static getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌'
    };
    return emojis[level];
  }

  /**
   * Construir informações de contexto
   */
  private static buildContextInfo(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (entry.instanceName) parts.push(`Instance: ${entry.instanceName}`);
    if (entry.channelId) parts.push(`Channel: ${entry.channelId}`);
    if (entry.sessionId) parts.push(`Session: ${entry.sessionId.substring(0, 8)}...`);
    if (entry.userId) parts.push(`User: ${entry.userId}`);
    
    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }

  /**
   * Sanitizar dados sensíveis
   */
  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveKeys = ['password', 'token', 'apikey', 'secret', 'key'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '***REDACTED***';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Buscar logs com filtros
   */
  static getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => 
          log.category.toLowerCase().includes(filter.category!.toLowerCase())
        );
      }
      
      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filter.startDate!
        );
      }
      
      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= filter.endDate!
        );
      }
      
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
      
      if (filter.sessionId) {
        filteredLogs = filteredLogs.filter(log => log.sessionId === filter.sessionId);
      }
      
      if (filter.instanceName) {
        filteredLogs = filteredLogs.filter(log => log.instanceName === filter.instanceName);
      }
      
      if (filter.channelId) {
        filteredLogs = filteredLogs.filter(log => log.channelId === filter.channelId);
      }
      
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(term) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(term))
        );
      }
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Exportar logs para download
   */
  static exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Limpar logs
   */
  static clearLogs() {
    this.logs = [];
    console.info('🗑️ [LOGGER] Logs limpos');
  }

  /**
   * Obter estatísticas dos logs
   */
  static getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
    lastHour: number;
    lastDay: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0
    };

    const byCategory: Record<string, number> = {};
    let lastHour = 0;
    let lastDay = 0;

    this.logs.forEach(log => {
      // Contar por nível
      byLevel[log.level]++;
      
      // Contar por categoria
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      
      // Contar por tempo
      const logTime = new Date(log.timestamp);
      if (logTime >= oneHourAgo) lastHour++;
      if (logTime >= oneDayAgo) lastDay++;
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
      lastHour,
      lastDay
    };
  }
}

// Logs específicos para Evolution API
export class EvolutionApiLogger {
  static logRequest(instanceName: string, endpoint: string, payload?: any) {
    DetailedLogger.info('EVOLUTION_API_REQUEST', `Request to ${endpoint}`, {
      endpoint,
      payload: payload ? DetailedLogger['sanitizeData'](payload) : undefined
    }, { instanceName });
  }

  static logResponse(instanceName: string, endpoint: string, response: any, success: boolean) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    DetailedLogger.log(level, 'EVOLUTION_API_RESPONSE', 
      `Response from ${endpoint} - ${success ? 'Success' : 'Failed'}`, {
      endpoint,
      response: DetailedLogger['sanitizeData'](response),
      success
    }, { instanceName });
  }

  static logInstanceEvent(instanceName: string, event: string, data?: any) {
    DetailedLogger.info('EVOLUTION_API_INSTANCE', `Instance event: ${event}`, data, { instanceName });
  }

  static logWebhookReceived(instanceName: string, payload: any) {
    DetailedLogger.info('EVOLUTION_API_WEBHOOK', 'Webhook received', {
      messageType: payload.data?.messageType,
      from: payload.data?.key?.remoteJid,
      hasMedia: !!payload.data?.message?.audioMessage || !!payload.data?.message?.imageMessage
    }, { instanceName });
  }
}

// Logs específicos para mensagens
export class MessageLogger {
  static logMessageSent(channelId: string, sessionId: string, messageType: string, success: boolean) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    DetailedLogger.log(level, 'MESSAGE_SEND', 
      `Message ${success ? 'sent' : 'failed'} - Type: ${messageType}`, {
      messageType,
      success
    }, { channelId, sessionId });
  }

  static logMessageReceived(channelId: string, sessionId: string, messageType: string) {
    DetailedLogger.info('MESSAGE_RECEIVE', `Message received - Type: ${messageType}`, {
      messageType
    }, { channelId, sessionId });
  }

  static logMediaProcessing(messageId: string, mediaType: string, success: boolean, error?: string) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    DetailedLogger.log(level, 'MEDIA_PROCESSING', 
      `Media processing ${success ? 'completed' : 'failed'} - Type: ${mediaType}`, {
      mediaType,
      success,
      error
    }, { sessionId: messageId });
  }
}

// Logs específicos para database
export class DatabaseLogger {
  static logQuery(tableName: string, operation: string, success: boolean, duration?: number) {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    DetailedLogger.log(level, 'DATABASE', 
      `${operation} on ${tableName} - ${success ? 'Success' : 'Failed'}`, {
      tableName,
      operation,
      success,
      duration
    });
  }

  static logRealtimeEvent(tableName: string, event: string, payload?: any) {
    DetailedLogger.debug('DATABASE_REALTIME', `Realtime event: ${event} on ${tableName}`, {
      tableName,
      event,
      payload
    });
  }
}

