
import React, { useState } from 'react'
import { useAIProviders } from '../hooks/useAIProviders'
import { useAuth } from '../contexts/AuthContext'

export function AIConfigSection() {
  const { providers, loading, error, createProvider, updateProvider, deleteProvider, testProvider } = useAIProviders()
  const { user } = useAuth()
  const [testingProvider, setTestingProvider] = useState<number | null>(null)

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Faça login para gerenciar provedores de IA.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-4">Carregando provedores...</div>
  }

  if (error) {
    return <div className="text-red-600 py-4">Erro: {error}</div>
  }

  const handleTestProvider = async (provider: any) => {
    try {
      setTestingProvider(provider.id)
      const result = await testProvider({
        provider_id: provider.id,
        provider_type: provider.provider_type,
        api_key: provider.api_key,
        base_url: provider.base_url,
        default_model: provider.default_model
      })
      
      alert(result.message || 'Teste realizado com sucesso!')
    } catch (error) {
      alert(`Erro no teste: ${error.message}`)
    } finally {
      setTestingProvider(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Provedores de IA</h2>
      
      {providers.length === 0 ? (
        <p className="text-gray-500">Nenhum provedor configurado.</p>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider: any) => (
            <div key={provider.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-gray-600">Tipo: {provider.provider_type}</p>
                  <p className="text-sm text-gray-600">Modelo: {provider.default_model}</p>
                  <p className="text-sm text-gray-600">
                    Status: {provider.is_active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestProvider(provider)}
                    disabled={testingProvider === provider.id}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {testingProvider === provider.id ? 'Testando...' : 'Testar'}
                  </button>
                  
                  <button
                    onClick={() => updateProvider(provider.id, { is_active: !provider.is_active })}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    {provider.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  
                  <button
                    onClick={() => deleteProvider(provider.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


