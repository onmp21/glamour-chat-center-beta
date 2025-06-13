import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('villa_glamour_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setAuthState({ user, isAuthenticated: true });
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log('Tentando fazer login com:', credentials.username);
      
      // BYPASS TEMPORÁRIO APENAS PARA DEMONSTRAÇÃO - CONFIGURAR SUPABASE EM PRODUÇÃO
      if (credentials.username === 'demo' && credentials.password === 'demo') {
        const user: User = {
          id: 'demo-user',
          username: 'demo',
          name: 'Usuário Demonstração',
          role: 'admin' as UserRole,
          assignedTabs: [],
          assignedCities: [],
          createdAt: new Date().toISOString()
        };

        setAuthState({ user, isAuthenticated: true });
        localStorage.setItem('villa_glamour_user', JSON.stringify(user));
        console.log('Login demo realizado com sucesso');
        return true;
      }
      
      // Login via Supabase - Sistema de autenticação completo
      
      // Usar apenas a função verify_user_credentials para todos os usuários
      const { data: userData, error: userError } = await supabase.rpc('verify_user_credentials', {
        input_username: credentials.username,
        input_password: credentials.password
      });

      console.log('Resultado verificação usuário:', { userData, userError });

      if (!userError && userData && userData.length > 0) {
        const userInfo = userData[0];
        const user: User = {
          id: userInfo.user_id,
          username: userInfo.user_username,
          name: userInfo.user_name,
          role: userInfo.user_role as UserRole,
          assignedTabs: userInfo.user_assigned_tabs || [],
          assignedCities: userInfo.user_assigned_cities || [],
          createdAt: new Date().toISOString()
        };

        setAuthState({ user, isAuthenticated: true });
        localStorage.setItem('villa_glamour_user', JSON.stringify(user));
        console.log('Login realizado com sucesso para usuário:', user.role);
        return true;
      }

      // Se chegou aqui, as credenciais são inválidas
      console.log('Credenciais inválidas ou usuário não encontrado');
      return false;
      
    } catch (error) {
      console.error('Erro durante login:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem('villa_glamour_user');
  };

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

