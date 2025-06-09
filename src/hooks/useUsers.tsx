
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/auth';

interface DatabaseUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assigned_tabs: string[];
  assigned_cities: string[];
  is_active: boolean;
  created_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Carregando usuários...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        return;
      }

      console.log('Dados recebidos do Supabase:', data);

      const formattedUsers: User[] = (data as DatabaseUser[] || []).map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        assignedTabs: user.assigned_tabs || [],
        assignedCities: user.assigned_cities || [],
        createdAt: user.created_at
      }));

      console.log('Usuários formatados:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async (userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    assignedTabs: string[];
    assignedCities: string[];
  }) => {
    try {
      console.log('Criando usuário:', userData);
      const { data, error } = await supabase.rpc('create_user_with_hash', {
        p_username: userData.username,
        p_password: userData.password,
        p_name: userData.name,
        p_role: userData.role,
        p_assigned_tabs: userData.assignedTabs,
        p_assigned_cities: userData.assignedCities
      });

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }

      console.log('Usuário criado com sucesso:', data);
      // Forçar recarregamento da lista
      await loadUsers();
      return data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User & { password?: string }>) => {
    try {
      console.log('Atualizando usuário:', userId, userData);
      
      // Se uma senha foi fornecida, usar a função update_user_with_hash
      if (userData.password && userData.password.trim()) {
        const { error } = await supabase.rpc('update_user_with_hash', {
          p_user_id: userId,
          p_username: userData.username || null,
          p_password: userData.password,
          p_name: userData.name || null,
          p_role: userData.role || null,
          p_assigned_tabs: userData.assignedTabs || null,
          p_assigned_cities: userData.assignedCities || null
        });

        if (error) {
          console.error('Erro ao atualizar usuário com senha:', error);
          throw error;
        }
      } else {
        // Se não há senha, usar UPDATE normal (sem alterar password_hash)
        const updateData: any = {};
        
        if (userData.username) updateData.username = userData.username;
        if (userData.name) updateData.name = userData.name;
        if (userData.role) updateData.role = userData.role;
        if (userData.assignedTabs) updateData.assigned_tabs = userData.assignedTabs;
        if (userData.assignedCities) updateData.assigned_cities = userData.assignedCities;

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
      await loadUsers(); // Recarregar lista
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
