
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, UserRole, AuthContextType } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  console.log('🔐 [AUTH_PROVIDER] Inicializando AuthProvider');

  useEffect(() => {
    console.log('🔐 [AUTH_PROVIDER] Verificando usuário salvo no localStorage');
    
    const savedUser = localStorage.getItem('villa_glamour_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log('🔐 [AUTH_PROVIDER] Usuário restaurado:', user.name);
        setAuthState({ user, isAuthenticated: true });
      } catch (error) {
        console.error('🔐 [AUTH_PROVIDER] Erro ao parsear usuário:', error);
        localStorage.removeItem('villa_glamour_user');
      }
    } else {
      console.log('🔐 [AUTH_PROVIDER] Nenhum usuário no localStorage');
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log('🔐 [AUTH_PROVIDER] Tentando login:', credentials.username);

      // Novo: login via função que retorna assigned_tabs/assigned_channels
      const { data: userData, error: userError } = await supabase.rpc('verify_user_credentials', {
        input_username: credentials.username,
        input_password: credentials.password
      });

      console.log('🔐 [AUTH_PROVIDER] Resultado verificação:', { userData, userError });

      if (!userError && userData && userData.length > 0) {
        const userInfo = userData[0];
        const user: User = {
          id: userInfo.user_id,
          username: userInfo.user_username,
          name: userInfo.user_name,
          role: userInfo.user_role as UserRole,
          assignedTabs: userInfo.user_assigned_tabs || [],
          assignedChannels: userInfo.user_assigned_channels || [],
          createdAt: new Date().toISOString()
        };

        setAuthState({ user, isAuthenticated: true });
        localStorage.setItem('villa_glamour_user', JSON.stringify(user));
        console.log('✅ [AUTH_PROVIDER] Login realizado com sucesso:', user.role);
        return true;
      }

      console.log('❌ [AUTH_PROVIDER] Credenciais inválidas');
      return false;

    } catch (error) {
      console.error('❌ [AUTH_PROVIDER] Erro durante login:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🔐 [AUTH_PROVIDER] Fazendo logout');
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('villa_glamour_user');
  };

  // Debug do estado atual
  useEffect(() => {
    console.log('🔐 [AUTH_PROVIDER] Estado atual:', {
      isAuthenticated: authState.isAuthenticated,
      user: authState.user?.name || 'nenhum'
    });
  }, [authState]);

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
