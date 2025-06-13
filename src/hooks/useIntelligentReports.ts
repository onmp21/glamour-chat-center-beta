import { useState, useEffect } from 'react'
import { IntelligentReportsService, ReportGenerationRequest, ReportHistoryOptions } from '../services/IntelligentReportsService'
import { useAuth } from '../contexts/AuthContext'

export function useIntelligentReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const { user } = useAuth()

  const fetchReports = async (options: ReportHistoryOptions = {}) => {
    try {
      setLoading(true)
      setError(null)
      const data = await IntelligentReportsService.getReportHistory(options)
      setReports(data.reports)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (request: ReportGenerationRequest) => {
    try {
      setGenerating(true)
      setError(null)
      const result = await IntelligentReportsService.generateReport(request)
      await fetchReports()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setGenerating(false)
    }
  }

  const deleteReport = async (reportId: number) => {
    try {
      await IntelligentReportsService.deleteReport(reportId)
      await fetchReports()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user])

  return {
    reports,
    loading,
    error,
    generating,
    fetchReports,
    generateReport,
    deleteReport
  }
}

