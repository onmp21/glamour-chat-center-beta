
import React from 'react';
import { Brain } from 'lucide-react';
import { AIProviderList } from './AIProviderList';
import { useAIProviders } from '@/hooks/useAIProviders';

export const AIProviderSettings: React.FC = () => {
  const { providers, loading, error } = useAIProviders();

  return (
    <div className="space-y-6">
      {/* Cabeçalho seguindo o padrão da aba de configurações */}
      <div className="bg-[#18181b] dark:bg-[#18181b] rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#27272a] rounded-lg">
            <Brain className="h-6 w-6 text-[#b5103c]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações de IA</h1>
            <p className="text-[#a1a1aa] mt-1">
              Configure e gerencie provedores de inteligência artificial para geração de relatórios avançados
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="bg-white dark:bg-[#212121] rounded-lg shadow-sm border border-gray-200 dark:border-[#3f3f46]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Provedores de IA</h2>
              <p className="text-sm text-gray-600 dark:text-[#a1a1aa] mt-1">
                Gerencie suas configurações de provedores de LLM para relatórios inteligentes
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <AIProviderList isDarkMode={true} />
        </div>
      </div>
    </div>
  );
};
