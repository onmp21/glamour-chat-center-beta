import { ApiInstance } from "../types/domain/api/ApiInstance";

interface WebhookPayload {
  webhook: {
    url: string;
    events: string[];
    webhookByEvents: boolean;
    webhookBase64: boolean;
  };
  enabled: boolean;
}

export class WebhookService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  public async setWebhook(instanceName: string, webhookUrl: string, events: string[]): Promise<boolean> {
    const endpoint = `/webhook/set/${instanceName}`;
    const payload: WebhookPayload = {
      webhook: {
        url: webhookUrl,
        events: events,
        webhookByEvents: true, // Enviar eventos específicos
        webhookBase64: true, // Enviar arquivos em base64 quando disponíveis
      },
      enabled: true,
    };

    try {
      console.log(`[WEBHOOK_SERVICE] Tentando configurar webhook para instância: ${instanceName} com URL: ${webhookUrl}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[WEBHOOK_SERVICE] Erro ao configurar webhook para ${instanceName}:`, response.status, errorData);
        return false;
      }

      console.log(`[WEBHOOK_SERVICE] Webhook configurado com sucesso para ${instanceName}.`);
      return true;
    } catch (error) {
      console.error(`[WEBHOOK_SERVICE] Exceção ao configurar webhook para ${instanceName}:`, error);
      return false;
    }
  }

  public async disableWebhook(instanceName: string): Promise<boolean> {
    const endpoint = `/webhook/set/${instanceName}`;
    const payload: WebhookPayload = {
      webhook: {
        url: "", // URL vazia para desabilitar
        events: [],
        webhookByEvents: false,
        webhookBase64: false,
      },
      enabled: false,
    };

    try {
      console.log(`[WEBHOOK_SERVICE] Tentando desabilitar webhook para instância: ${instanceName}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[WEBHOOK_SERVICE] Erro ao desabilitar webhook para ${instanceName}:`, response.status, errorData);
        return false;
      }

      console.log(`[WEBHOOK_SERVICE] Webhook desabilitado com sucesso para ${instanceName}.`);
      return true;
    } catch (error) {
      console.error(`[WEBHOOK_SERVICE] Exceção ao desabilitar webhook para ${instanceName}:`, error);
      return false;
    }
  }
}


