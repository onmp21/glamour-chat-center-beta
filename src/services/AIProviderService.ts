
import { supabase } from "../lib/supabase"

export class AIProviderService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

  static async getProviders() {
    try {
      const response = await fetch(`${this.FUNCTION_URL}/ai-providers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.providers
    } catch (error) {
      console.error("Erro ao buscar provedores:", error)
      throw error
    }
  }

  static async createProvider(providerData: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/ai-providers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(providerData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar provedor")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao criar provedor:", error)
      throw error
    }
  }

  static async updateProvider(id: number, updates: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/ai-providers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar provedor")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao atualizar provedor:", error)
      throw error
    }
  }

  static async deleteProvider(id: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/ai-providers/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao deletar provedor")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao deletar provedor:", error)
      throw error
    }
  }

  static async testProvider(providerData: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(`${this.FUNCTION_URL}/test-provider`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session ? `Bearer ${session.access_token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(providerData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao testar provedor")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao testar provedor:", error)
      throw error
    }
  }

  static async getActiveProviders() {
    return this.getProviders();
  }

  static getProviderTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic', 
      google: 'Google',
      custom: 'Custom'
    };
    return labels[type] || type;
  }

  static getDefaultBaseUrl(type: string): string {
    const baseUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com',
      custom: ''
    };
    return baseUrls[type] || '';
  }

  static getDefaultModels(type: string): string[] {
    const models: Record<string, string[]> = {
      openai: ['gpt-4', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-sonnet', 'claude-3-haiku'],
      google: ['gemini-pro', 'gemini-pro-vision'],
      custom: []
    };
    return models[type] || [];
  }
}
