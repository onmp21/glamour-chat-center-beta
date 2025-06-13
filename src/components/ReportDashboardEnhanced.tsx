import React, { useState } from 'react'
import { Label } from '@/components/ui/label'

import { useIntelligentReports } from '../hooks/useIntelligentReports'
import { useAIProviders } from '../hooks/useAIProviders'
import { useAuth } from '../contexts/AuthContext'

export function ReportDashboardEnhanced() {
  const { reports, loading, generating, generateReport } = useIntelligentReports()
  const { providers } = useAIProviders()
  const { user } = useAuth()
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null)
  const [reportType, setReportType] = useState<'conversations' | 'channels' | 'custom'>('conversations')
  const [customPrompt, setCustomPrompt] = useState('')

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Faça login para acessar relatórios inteligentes.</p>
      </div>
    )
  }

  const handleGenerateReport = async () => {
    if (!selectedProvider) {
      alert('Selecione um provedor de IA')
      return
    }

    try {
      // Dados mock para demonstração
      const mockData = reportType === 'conversations' 
        ? [
            { id: 1, status: 'active', messages: [{}, {}] },
            { id: 2, status: 'closed', messages: [{}] }
          ]
        : [
            { id: 1, type: 'whatsapp', is_active: true },
            { id: 2, type: 'telegram', is_active: false }
          ]

      const result = await generateReport({
        provider_id: selectedProvider,
        report_type: reportType,
        data: mockData,
        custom_prompt: customPrompt || undefined
      })

      // Mostrar resultado
      console.log('Relatório gerado:', result)
    } catch (error) {
      alert(`Erro ao gerar relatório: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Relatórios Inteligentes</h2>
      
      <div>
        <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700">Provedor de IA</label>
        <select
          id="provider-select"
          value={selectedProvider || ''}
          onChange={(e) => setSelectedProvider(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Selecione um provedor</option>
          {providers.map((provider: any) => (
            <option key={provider.id} value={provider.id}>{provider.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="report-type-select" className="block text-sm font-medium text-gray-700">Tipo de Relatório</label>
        <select
          id="report-type-select"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as 'conversations' | 'channels' | 'custom')}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="conversations">Conversas</option>
          <option value="channels">Canais</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      {reportType === 'custom' && (
        <div>
          <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700">Prompt Personalizado</label>
          <textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Descreva o relatório que você deseja gerar..."
          ></textarea>
        </div>
      )}

      <button
        onClick={handleGenerateReport}
        disabled={generating || !selectedProvider}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {generating ? 'Gerando Relatório...' : 'Gerar Relatório'}
      </button>

      <h3 className="text-lg font-bold mt-6">Histórico de Relatórios</h3>
      {loading ? (
        <p>Carregando histórico...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">Nenhum relatório gerado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((report: any) => (
            <li key={report.id} className="border rounded-md p-3 text-sm">
              <p><strong>Tipo:</strong> {report.report_type}</p>
              <p><strong>Provedor:</strong> {report.ai_providers?.name || 'N/A'}</p>
              <p><strong>Modelo:</strong> {report.model_used}</p>
              <p><strong>Gerado em:</strong> {new Date(report.created_at).toLocaleString()}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600 hover:underline">Ver Relatório Completo</summary>
                <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">{report.generated_report}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}



