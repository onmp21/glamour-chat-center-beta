
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  phone_number: string;
  contact_name: string;
  created_at: string;
  updated_at: string;
}

export class ContactService {
  
  static async getContactByPhone(phoneNumber: string): Promise<Contact | null> {
    try {
      console.log('🔍 [CONTACT_SERVICE] Buscando contato por telefone:', phoneNumber);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [CONTACT_SERVICE] Contato não encontrado:', phoneNumber);
          return null;
        }
        console.error('❌ [CONTACT_SERVICE] Erro ao buscar contato:', error);
        throw error;
      }

      console.log('✅ [CONTACT_SERVICE] Contato encontrado:', data.contact_name);
      return data;
    } catch (error) {
      console.error('❌ [CONTACT_SERVICE] Erro inesperado:', error);
      return null;
    }
  }

  static async saveContact(phoneNumber: string, contactName: string): Promise<Contact> {
    try {
      console.log('💾 [CONTACT_SERVICE] Salvando contato:', { phoneNumber, contactName });
      
      const { data, error } = await supabase
        .from('contacts')
        .upsert({
          phone_number: phoneNumber,
          contact_name: contactName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CONTACT_SERVICE] Erro ao salvar contato:', error);
        throw error;
      }

      console.log('✅ [CONTACT_SERVICE] Contato salvo com sucesso:', data.id);
      return data;
    } catch (error) {
      console.error('❌ [CONTACT_SERVICE] Erro inesperado:', error);
      throw error;
    }
  }

  static async getAllContacts(): Promise<Contact[]> {
    try {
      console.log('📋 [CONTACT_SERVICE] Carregando todos os contatos...');
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ [CONTACT_SERVICE] Erro ao carregar contatos:', error);
        throw error;
      }

      console.log('✅ [CONTACT_SERVICE] Contatos carregados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [CONTACT_SERVICE] Erro inesperado:', error);
      throw error;
    }
  }

  static async updateContact(id: string, contactName: string): Promise<Contact> {
    try {
      console.log('🔄 [CONTACT_SERVICE] Atualizando contato:', id);
      
      const { data, error } = await supabase
        .from('contacts')
        .update({
          contact_name: contactName,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CONTACT_SERVICE] Erro ao atualizar contato:', error);
        throw error;
      }

      console.log('✅ [CONTACT_SERVICE] Contato atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('❌ [CONTACT_SERVICE] Erro inesperado:', error);
      throw error;
    }
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      console.log('🗑️ [CONTACT_SERVICE] Deletando contato:', id);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [CONTACT_SERVICE] Erro ao deletar contato:', error);
        throw error;
      }

      console.log('✅ [CONTACT_SERVICE] Contato deletado com sucesso');
    } catch (error) {
      console.error('❌ [CONTACT_SERVICE] Erro inesperado:', error);
      throw error;
    }
  }
}
