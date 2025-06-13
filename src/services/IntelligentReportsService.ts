
import { supabase } from '../lib/supabase';

export interface ReportGenerationRequest {
  provider_id: string
  report_type: 'conversations' | 'channels' | 'custom'
  data: any
  custom_prompt?: string
  filters?: any
}

export interface ReportHistoryOptions {
  page?: number
  per_page?: number
  report_type?: string
}

export class IntelligentReportsService {
  private static readonly FUNCTION_URL = `https://uxccfhptochnfomurulr.supabase.co/functions/v1`

  static async generateReport(request: ReportGenerationRequest) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`${this.FUNCTION_URL}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      throw error
    }
  }

  static async getReportHistory(options: ReportHistoryOptions = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.per_page) params.append('per_page', options.per_page.toString())
      if (options.report_type) params.append('report_type', options.report_type)

      const response = await fetch(`${this.FUNCTION_URL}/generate-report/history?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar histórico')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      throw error
    }
  }

  static async deleteReport(reportId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`${this.FUNCTION_URL}/generate-report/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar relatório')
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao deletar relatório:', error)
      throw error
    }
  }
}
