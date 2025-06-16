
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole, DatabaseUser } from '@/types/auth';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [useUsers] Carregando usuários da tabela users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('🔍 [useUsers] Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ [useUsers] Erro ao carregar usuários:', error);
        return;
      }

      console.log('🔍 [useUsers] Dados brutos recebidos:', data);
      console.log('🔍 [useUsers] Quantidade de usuários encontrados:', data?.length || 0);

      // Adaptado para nova estrutura: assigned_channels, assigned_tabs
      const formattedUsers: User[] = (data as DatabaseUser[] || []).map(user => {
        console.log('🔍 [useUsers] Formatando usuário:', user);
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role as UserRole,
          assignedTabs: user.assigned_tabs || [],
          assignedChannels: user.assigned_channels || [],
          // assignedSettingsSections: user.assigned_settings_sections || [], // Not present in DB
          createdAt: user.created_at
        };
      });

      console.log('🔍 [useUsers] Usuários formatados:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('❌ [useUsers] Erro inesperado ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Novo: cria usuário para nova estrutura (assigned_channels passa direto)
  const createUser = async (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedChannels: string[];
    // assignedSettingsSections?: string[]; // <-- Removido: não suportado pela API/backend
  }) => {
    try {
      console.log('Criando usuário:', userData);
      const { data, error } = await supabase.rpc('create_user_with_hash', {
        p_username: userData.username,
        p_password: userData.password,
        p_name: userData.name,
        p_role: userData.role as any,
        p_assigned_tabs: userData.assignedTabs,
        p_assigned_channels: userData.assignedChannels
        // p_assigned_settings_sections: userData.assignedSettingsSections || [] // <-- Não suportado pela função
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }

      await loadUsers();
      return data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  // Atualizar campo assignedChannels ao salvar usuário
  const updateUser = async (userId: string, userData: Partial<User & { password?: string }>) => {
    try {
      console.log('Atualizando usuário:', userId, userData);
      if (userData.password && userData.password.trim()) {
        const { error } = await supabase.rpc('update_user_with_hash', {
          p_user_id: userId,
          p_username: userData.username || null,
          p_password: userData.password,
          p_name: userData.name || null,
          p_role: userData.role as any || null,
          p_assigned_tabs: userData.assignedTabs || null,
          p_assigned_channels: userData.assignedChannels || null
          // p_assigned_settings_sections: userData.assignedSettingsSections || null // <-- Não suportado pela função
        });

        if (error) {
          console.error('Erro ao atualizar usuário com senha:', error);
          throw error;
        }
      } else {
        const updateData: any = {};

        if (userData.username) updateData.username = userData.username;
        if (userData.name) updateData.name = userData.name;
        if (userData.role) updateData.role = userData.role;
        if (userData.assignedTabs) updateData.assigned_tabs = userData.assignedTabs;
        if (userData.assignedChannels) updateData.assigned_channels = userData.assignedChannels;
        // if (userData.assignedSettingsSections) updateData.assigned_settings_sections = userData.assignedSettingsSections; // <-- Não suportado pela tabela

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (error) {
          console.error('Erro ao atualizar usuário:', error);
          throw error;
        }
      }

      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadUsers();
    } catch (error) {
      throw error;
    }
  };

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: loadUsers
  };
};

