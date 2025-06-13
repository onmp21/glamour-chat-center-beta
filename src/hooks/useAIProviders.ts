import { useState, useEffect } from 'react'
import { AIProviderService } from '../services/AIProviderService'
import { useAuth } from '../contexts/AuthContext'

export function useAIProviders() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AIProviderService.getProviders()
      setProviders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [user]) // Recarregar quando o usuário mudar

  const createProvider = async (providerData: any) => {
    try {
      const result = await AIProviderService.createProvider(providerData)
      await fetchProviders() // Recarregar lista
      return result
    } catch (err) {
      throw err
    }
  }

  const updateProvider = async (id: number, updates: any) => {
    try {
      const result = await AIProviderService.updateProvider(id, updates)
      await fetchProviders() // Recarregar lista
      return result
    } catch (err) {
      throw err
    }
  }

  const deleteProvider = async (id: number) => {
    try {
      await AIProviderService.deleteProvider(id)
      await fetchProviders() // Recarregar lista
    } catch (err) {
      throw err
    }
  }

  const testProvider = async (providerData: any) => {
    try {
      return await AIProviderService.testProvider(providerData)
    } catch (err) {
      throw err
    }
  }

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider
  }
}

