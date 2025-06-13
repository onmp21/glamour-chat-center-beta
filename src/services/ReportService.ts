import { supabase } from "../lib/supabase"

export class ReportService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

  static async generateReport(prompt: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/intelligent-reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao gerar relatório")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      throw error
    }
  }

  static async getReportHistory() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/intelligent-reports/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao buscar histórico de relatórios")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao buscar histórico de relatórios:", error)
      throw error
    }
  }

  static async deleteReport(id: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("Usuário não autenticado")
      }

      const response = await fetch(`${this.FUNCTION_URL}/intelligent-reports/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao deletar relatório")
      }

      return await response.json()
    } catch (error) {
      console.error("Erro ao deletar relatório:", error)
      throw error
    }
  }
}


