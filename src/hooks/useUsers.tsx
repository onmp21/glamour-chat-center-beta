
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

      // Adaptar para consumir tanto assigned_channels (moderno) quanto assigned_cities (legado)
      const formattedUsers: User[] = (data as DatabaseUser[] || []).map(user => {
        console.log('🔍 [useUsers] Formatando usuário:', user);
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role as UserRole,
          assignedTabs: user.assigned_tabs || [],
          assignedChannels: (user as any).assigned_channels || user.assigned_cities || [], // novo > legado
          assignedCities: user.assigned_cities || [], // mantém para transição
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

  // Novo formato: Salva assignedChannels no lugar de assignedCities (compatível com backend atual)
  const createUser = async (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedChannels: string[];
  }) => {
    try {
      console.log('Criando usuário:', userData);
      const { data, error } = await supabase.rpc('create_user_with_hash', {
        p_username: userData.username,
        p_password: userData.password,
        p_name: userData.name,
        p_role: userData.role as any,
        p_assigned_tabs: userData.assignedTabs,
        p_assigned_cities: userData.assignedChannels // Mapeia canais para o campo cities (até migrar banco)
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }

      console.log('Usuário criado com sucesso:', data);
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
          p_assigned_cities: userData.assignedChannels || null // Só assumimos canais
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
        if (userData.assignedChannels) updateData.assigned_cities = userData.assignedChannels; // assumimos canais

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (error) {
          console.error('Erro ao atualizar usuário:', error);
          throw error;
        }
      }

      console.log('Usuário atualizado com sucesso');
      await loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      console.log('Excluindo usuário:', userId);
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao excluir usuário:', error);
        throw error;
      }

      console.log('Usuário excluído com sucesso');
      await loadUsers(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
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
