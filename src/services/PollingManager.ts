
class PollingManager {
  private static instance: PollingManager;
  private activePollers: Map<string, {
    intervalId: NodeJS.Timeout;
    callbacks: Map<string, () => void>;
  }> = new Map();
  
  private callbackCounter = 0;

  public static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager();
    }
    return PollingManager.instance;
  }

  public startPolling(
    key: string,
    callback: () => void,
    intervalMs: number = 2000 // Reduzido para 2 segundos para melhor responsividade
  ): string {
    const callbackId = `${key}_${++this.callbackCounter}_${Date.now()}`;
    
    console.log(`[POLLING_MANAGER] Starting polling for ${key} with callback ID: ${callbackId}`);

    let pollerInfo = this.activePollers.get(key);
    
    if (!pollerInfo) {
      // Criar novo poller
      const intervalId = setInterval(() => {
        const currentPoller = this.activePollers.get(key);
        if (currentPoller) {
          currentPoller.callbacks.forEach((cb, id) => {
            try {
              cb();
            } catch (error) {
              console.error(`[POLLING_MANAGER] Error in callback ${id}:`, error);
            }
          });
        }
      }, intervalMs);

      pollerInfo = {
        intervalId,
        callbacks: new Map()
      };
      
      this.activePollers.set(key, pollerInfo);
    }

    // Adicionar callback
    pollerInfo.callbacks.set(callbackId, callback);
    console.log(`[POLLING_MANAGER] Total callbacks for ${key}: ${pollerInfo.callbacks.size}`);

    return callbackId;
  }

  public stopPolling(key: string, callbackId: string): void {
    console.log(`[POLLING_MANAGER] Stopping polling ${callbackId} for ${key}`);
    
    const pollerInfo = this.activePollers.get(key);
    if (!pollerInfo) {
      console.warn(`[POLLING_MANAGER] No poller found for ${key}`);
      return;
    }

    // Remover callback específico
    pollerInfo.callbacks.delete(callbackId);
    console.log(`[POLLING_MANAGER] Remaining callbacks for ${key}: ${pollerInfo.callbacks.size}`);

    // Se não há mais callbacks, parar o polling
    if (pollerInfo.callbacks.size === 0) {
      console.log(`[POLLING_MANAGER] No more callbacks, stopping polling for ${key}`);
      clearInterval(pollerInfo.intervalId);
      this.activePollers.delete(key);
    }
  }

  public getActivePollers(): string[] {
    return Array.from(this.activePollers.keys());
  }

  public cleanup(): void {
    console.log(`[POLLING_MANAGER] Cleaning up all pollers`);
    
    for (const [key, pollerInfo] of this.activePollers.entries()) {
      try {
        clearInterval(pollerInfo.intervalId);
        console.log(`[POLLING_MANAGER] Cleaned up poller: ${key}`);
      } catch (error) {
        console.warn(`[POLLING_MANAGER] Error during cleanup for ${key}:`, error);
      }
    }
    
    this.activePollers.clear();
  }
}

export default PollingManager;
