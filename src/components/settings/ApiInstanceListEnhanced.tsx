
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { DeleteInstanceModal } from '@/components/modals/DeleteInstanceModal';
import { cn } from '@/lib/utils';
import { useApiInstancesEnhanced } from '@/hooks/useApiInstancesEnhanced';
import { EvolutionInstanceCard } from './EvolutionInstanceCard';
import { ApiInstanceCard } from './ApiInstanceCard';
import { QRCodeModal } from './QRCodeModal';

interface ApiInstanceListEnhancedProps {
  isDarkMode?: boolean;
}

export const ApiInstanceListEnhanced: React.FC<ApiInstanceListEnhancedProps> = ({ isDarkMode = false }) => {
  const {
    instances,
    evolutionInstances,
    loading,
    checkingStatus,
    fetchInstances,
    checkConnectionStatus,
    deleteInstance
  } = useApiInstancesEnhanced();

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; instance?: any }>({ isOpen: false });
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; channelId?: string }>({ isOpen: false });

  if (loading) {
    return (
      <div className={cn("p-6", isDarkMode ? "text-white" : "text-gray-900")}>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Carregando instâncias...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
          Instâncias Cadastradas ({instances.length})
        </h3>
        <Button onClick={fetchInstances} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {evolutionInstances.length > 0 && (
        <div className="space-y-4">
          <h4 className={cn("text-md font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
            Instâncias do Evolution API ({evolutionInstances.length})
          </h4>
          
          <div className="grid gap-4">
            {evolutionInstances.map((evolutionInstance, index) => (
              <EvolutionInstanceCard
                key={`${evolutionInstance.instanceId}-${index}`}
                evolutionInstance={evolutionInstance}
                index={index}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}

      {instances.length === 0 ? (
        <Card className={cn(isDarkMode ? "bg-[#18181b] border-[#27272a]" : "bg-white border-gray-200")}>
          <CardContent className="py-8">
            <div className={cn("text-center", isDarkMode ? "text-zinc-400" : "text-gray-500")}>
              <p>Nenhuma instância cadastrada</p>
              <p className="text-sm mt-1">Adicione uma nova instância para começar</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <h4 className={cn("text-md font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
            Configurações da API ({instances.length})
          </h4>
          {instances.map((instance) => (
            <ApiInstanceCard
              key={instance.id}
              instance={instance}
              checkingStatus={checkingStatus}
              isDarkMode={isDarkMode}
              onCheckConnectionStatus={checkConnectionStatus}
              onShowQRCode={(channelId) => setQrModal({ isOpen: true, channelId })}
              onDelete={(instance) => setDeleteModal({ isOpen: true, instance })}
            />
          ))}
        </div>
      )}

      <DeleteInstanceModal
        isOpen={deleteModal.isOpen}
        instanceName={deleteModal.instance?.instance_name || ''}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={() => {
          if (deleteModal.instance) {
            deleteInstance(deleteModal.instance);
          }
          setDeleteModal({ isOpen: false });
        }}
        isDarkMode={isDarkMode}
      />

      <QRCodeModal
        isOpen={qrModal.isOpen}
        channelId={qrModal.channelId || null}
        isDarkMode={isDarkMode}
        onClose={() => setQrModal({ isOpen: false })}
      />
    </div>
  );
};
