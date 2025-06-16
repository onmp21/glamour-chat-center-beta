import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTableNameForChannel } from '@/utils/channelMapping';
import type { Database } from '@/integrations/supabase/types';

interface NewContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: {
    nome: string;
    telefone: string;
    canal: string;
  }) => void;
  isDarkMode: boolean;
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    canal: ''
  });

  const { channels: internalChannels } = useInternalChannels();
  const { getAccessibleChannels } = usePermissions();
  const { user } = useAuth();

  // Obter canais disponíveis baseado no role do usuário
  const getAvailableChannels = () => {
    if (user?.role === 'admin') {
      // Admin pode ver todos os canais ativos, exceto Pedro
      return internalChannels
        .filter(channel =>
          channel.isActive &&
          channel.name &&
          channel.name.toLowerCase() !== 'pedro'
        )
        .map(channel => ({
          id: channel.legacyId,
          name: getChannelDisplayName(channel.name, channel.type)
        }));
    } else {
      // Usuário comum vê apenas canais acessíveis
      const accessibleChannels = getAccessibleChannels();
      return internalChannels
        .filter(channel =>
          channel.isActive &&
          channel.name &&
          channel.name.toLowerCase() !== 'pedro' &&
          accessibleChannels.includes(channel.legacyId)
        )
        .map(channel => ({
          id: channel.legacyId,
          name: getChannelDisplayName(channel.name, channel.type)
        }));
    }
  };

  const getChannelDisplayName = (name: string, type: string): string => {
    const typeLabel = type === 'general' ? 'IA Assistant' :
                     type === 'store' ? 'Loja' :
                     type === 'manager' ? 'Gerente' : 'Canal';
    return `${name} (${typeLabel})`;
  };

  const availableChannels = getAvailableChannels();

  const createNewConversation = async (channelId: string, phoneNumber: string, contactName: string) => {
    try {
      console.log('🆕 [NEW_CONTACT] Criando nova conversa:', { channelId, phoneNumber, contactName });
      
      const tableName = getTableNameForChannel(channelId);
      if (!tableName) {
        throw new Error('Canal não encontrado');
      }

      // Criar primeira mensagem para inicializar a conversa
      const welcomeMessage = `Conversa iniciada com ${contactName}`;
      
      // Type assertion for table name to satisfy TypeScript
      const { data, error } = await supabase
        .from(tableName as keyof Database['public']['Tables'])
        .insert({
          session_id: phoneNumber,
          message: welcomeMessage,
          tipo_remetente: 'USUARIO_INTERNO',
          nome_do_contato: user?.name || 'Sistema',
          mensagemtype: 'text',
          is_read: true,
          read_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        console.error('❌ [NEW_CONTACT] Erro ao criar conversa:', error);
        throw error;
      }

      console.log('✅ [NEW_CONTACT] Conversa criada com sucesso:', data);
      return true;
    } catch (error) {
      console.error('❌ [NEW_CONTACT] Erro ao criar nova conversa:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome && formData.telefone && formData.canal) {
      console.log('🚀 [NEW_CONTACT] Processando novo contato:', formData);
      
      // Criar nova conversa no backend
      const success = await createNewConversation(formData.canal, formData.telefone, formData.nome);
      
      if (success) {
        // Chamar callback para abrir o chat
        onSubmit(formData);
        setFormData({ nome: '', telefone: '', canal: '' });
        onClose();
      } else {
        console.error('❌ [NEW_CONTACT] Falha ao criar conversa');
        // Ainda assim chama o callback, mas avisa o usuário
        onSubmit(formData);
        setFormData({ nome: '', telefone: '', canal: '' });
        onClose();
      }
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Adiciona o código do país se necessário
    if (numbers.length <= 11 && !numbers.startsWith('55')) {
      return '55' + numbers;
    }
    
    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, telefone: formattedPhone });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-md",
        isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
              Novo Contato
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome" className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Nome do Contato *
            </Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome do contato"
              className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone" className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Número de Telefone *
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={handlePhoneChange}
              placeholder="Ex: 5562992631631"
              className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}
              required
            />
            <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
              Inclua o código do país (55) + DDD + número
            </p>
          </div>

          <div>
            <Label className={cn("text-sm font-medium", isDarkMode ? "text-white" : "text-gray-900")}>
              Canal para Envio *
            </Label>
            <Select value={formData.canal} onValueChange={(value) => setFormData({ ...formData, canal: value })}>
              <SelectTrigger className={cn(
                "mt-1",
                isDarkMode ? "bg-[#27272a] border-[#3f3f46] text-white" : "bg-white border-gray-300"
              )}>
                <SelectValue placeholder="Selecione um canal" />
              </SelectTrigger>
              <SelectContent className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-200"
              )}>
                {availableChannels.length > 0 ? (
                  availableChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Nenhum canal disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {availableChannels.length === 0 && (
              <p className={cn("text-xs mt-1 text-red-500")}>
                Nenhum canal está disponível para criação de contatos
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={availableChannels.length === 0}
              className="flex-1 bg-[#b5103c] hover:bg-[#9d0e34] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Contato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
