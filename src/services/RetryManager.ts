export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number; // em millisegundos
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalDuration: number;
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      // Retry em erros de rede, timeout, ou 5xx
      if (error?.code === 'NETWORK_ERROR') return true;
      if (error?.code === 'TIMEOUT') return true;
      if (error?.status >= 500) return true;
      if (error?.message?.includes('timeout')) return true;
      if (error?.message?.includes('network')) return true;
      return false;
    }
  };

  /**
   * Executa uma função com retry automático
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 [RETRY_MANAGER] Tentativa ${attempt}/${config.maxAttempts}`);
        
        const result = await operation();
        
        const totalDuration = Date.now() - startTime;
        console.log(`✅ [RETRY_MANAGER] Sucesso na tentativa ${attempt} (${totalDuration}ms)`);
        
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ [RETRY_MANAGER] Falha na tentativa ${attempt}:`, error);

        // Verificar se deve tentar novamente
        const shouldRetry = attempt < config.maxAttempts && 
                           (config.retryCondition ? config.retryCondition(error) : true);

        if (!shouldRetry) {
          console.error(`🚫 [RETRY_MANAGER] Não tentando novamente. Condição: ${!config.retryCondition || config.retryCondition(error)}, Tentativas restantes: ${config.maxAttempts - attempt}`);
          break;
        }

        // Callback de retry
        config.onRetry?.(attempt, error);

        // Calcular delay com backoff exponencial
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        console.log(`⏳ [RETRY_MANAGER] Aguardando ${delay}ms antes da próxima tentativa`);
        await this.sleep(delay);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.error(`💥 [RETRY_MANAGER] Todas as tentativas falharam (${totalDuration}ms)`);

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalDuration
    };
  }

  /**
   * Retry específico para reconexão de instâncias
   */
  static async retryInstanceConnection(
    instanceName: string,
    connectionFunction: () => Promise<boolean>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<boolean>> {
    const config: RetryOptions = {
      ...this.defaultOptions,
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      retryCondition: (error) => {
        // Sempre tentar reconectar instâncias
        return true;
      },
      onRetry: (attempt, error) => {
        console.log(`🔌 [INSTANCE_RETRY] Tentando reconectar instância ${instanceName} - Tentativa ${attempt}`);
      },
      ...options
    };

    return this.executeWithRetry(connectionFunction, config);
  }

  /**
   * Retry específico para envio de mensagens
   */
  static async retryMessageSend<T>(
    messageData: any,
    sendFunction: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config: RetryOptions = {
      ...this.defaultOptions,
      maxAttempts: 3,
      baseDelay: 1500,
      retryCondition: (error) => {
        // Não retry em erros de validação ou autenticação
        if (error?.status === 400) return false; // Bad Request
        if (error?.status === 401) return false; // Unauthorized
        if (error?.status === 403) return false; // Forbidden
        if (error?.message?.includes('invalid')) return false;
        return true;
      },
      onRetry: (attempt, error) => {
        console.log(`📤 [MESSAGE_RETRY] Tentando reenviar mensagem - Tentativa ${attempt}`);
      },
      ...options
    };

    return this.executeWithRetry(sendFunction, config);
  }

  /**
   * Retry específico para operações de mídia
   */
  static async retryMediaOperation<T>(
    mediaType: string,
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config: RetryOptions = {
      ...this.defaultOptions,
      maxAttempts: 2, // Menos tentativas para mídia (arquivos grandes)
      baseDelay: 3000,
      maxDelay: 15000,
      retryCondition: (error) => {
        // Retry apenas em erros de rede/timeout para mídia
        if (error?.message?.includes('timeout')) return true;
        if (error?.message?.includes('network')) return true;
        if (error?.status >= 500) return true;
        return false;
      },
      onRetry: (attempt, error) => {
        console.log(`🎬 [MEDIA_RETRY] Tentando reprocessar ${mediaType} - Tentativa ${attempt}`);
      },
      ...options
    };

    return this.executeWithRetry(operation, config);
  }

  /**
   * Retry com circuit breaker pattern
   */
  static async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreakerKey: string,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const circuitState = this.getCircuitState(circuitBreakerKey);
    
    // Se o circuit está aberto, falhar imediatamente
    if (circuitState.isOpen) {
      console.warn(`🚫 [CIRCUIT_BREAKER] Circuit aberto para ${circuitBreakerKey}`);
      return {
        success: false,
        error: new Error('Circuit breaker is open'),
        attempts: 0,
        totalDuration: 0
      };
    }

    const result = await this.executeWithRetry(operation, options);
    
    // Atualizar estado do circuit breaker
    this.updateCircuitState(circuitBreakerKey, result.success);
    
    return result;
  }

  /**
   * Utilitário para sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Circuit breaker state management (simplificado)
   */
  private static circuitStates: Map<string, {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }> = new Map();

  private static getCircuitState(key: string) {
    if (!this.circuitStates.has(key)) {
      this.circuitStates.set(key, {
        failures: 0,
        lastFailure: 0,
        isOpen: false
      });
    }
    
    const state = this.circuitStates.get(key)!;
    
    // Verificar se deve fechar o circuit (após timeout)
    if (state.isOpen && Date.now() - state.lastFailure > 60000) { // 1 minuto
      state.isOpen = false;
      state.failures = 0;
    }
    
    return state;
  }

  private static updateCircuitState(key: string, success: boolean) {
    const state = this.getCircuitState(key);
    
    if (success) {
      state.failures = 0;
      state.isOpen = false;
    } else {
      state.failures++;
      state.lastFailure = Date.now();
      
      // Abrir circuit após 5 falhas consecutivas
      if (state.failures >= 5) {
        state.isOpen = true;
        console.warn(`🚫 [CIRCUIT_BREAKER] Circuit aberto para ${key} após ${state.failures} falhas`);
      }
    }
  }

  /**
   * Limpar estados do circuit breaker
   */
  static clearCircuitStates() {
    this.circuitStates.clear();
    console.info('🔄 [CIRCUIT_BREAKER] Estados limpos');
  }

  /**
   * Obter estatísticas de retry
   */
  static getRetryStats(): {
    circuitStates: Array<{
      key: string;
      failures: number;
      isOpen: boolean;
      lastFailure: Date | null;
    }>;
  } {
    const states = Array.from(this.circuitStates.entries()).map(([key, state]) => ({
      key,
      failures: state.failures,
      isOpen: state.isOpen,
      lastFailure: state.lastFailure > 0 ? new Date(state.lastFailure) : null
    }));

    return { circuitStates: states };
  }
}

