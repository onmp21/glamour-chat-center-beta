
import { useState, useEffect } from 'react';

interface RememberUserState {
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  saveCredentials: (username: string, password: string) => void;
  getSavedCredentials: () => { username: string; password: string } | null;
  clearSavedCredentials: () => void;
}

export const useRememberUser = (): RememberUserState => {
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('villa_glamour_remember') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('villa_glamour_remember', rememberMe.toString());
  }, [rememberMe]);

  const saveCredentials = (username: string, password: string) => {
    if (rememberMe) {
      localStorage.setItem('villa_glamour_username', username);
      localStorage.setItem('villa_glamour_password', password);
      localStorage.setItem('villa_glamour_last_login', new Date().toISOString());
    }
  };

  const getSavedCredentials = () => {
    if (rememberMe) {
      const username = localStorage.getItem('villa_glamour_username');
      const password = localStorage.getItem('villa_glamour_password');
      const lastLogin = localStorage.getItem('villa_glamour_last_login');
      
      // Verificar se as credenciais não são muito antigas (30 dias)
      if (username && password && lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const now = new Date();
        const daysDiff = (now.getTime() - lastLoginDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff <= 30) {
          return { username, password };
        }
      }
    }
    return null;
  };

  const clearSavedCredentials = () => {
    localStorage.removeItem('villa_glamour_username');
    localStorage.removeItem('villa_glamour_password');
    localStorage.removeItem('villa_glamour_last_login');
    localStorage.removeItem('villa_glamour_remember');
    setRememberMe(false);
  };

  return {
    rememberMe,
    setRememberMe,
    saveCredentials,
    getSavedCredentials,
    clearSavedCredentials
  };
};
