
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';

interface LayoutContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isSidebarVisible: boolean;
  setIsSidebarVisible: (visible: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  urlParams: URLSearchParams;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [urlParams, setUrlParams] = useState(new URLSearchParams(window.location.search));
  
  // Usar o ThemeProvider para gerenciar o tema
  const { theme, setTheme } = useTheme();
  
  // Calcular se está em modo escuro baseado no tema atual
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Detectar parâmetros da URL e definir seção ativa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);
    
    const sectionParam = params.get('section');
    if (sectionParam) {
      console.log('🔍 [LAYOUT_PROVIDER] URL section detected:', sectionParam);
      setActiveSection(sectionParam);
    }
  }, []);

  // Escutar mudanças na URL
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setUrlParams(params);
      
      const sectionParam = params.get('section');
      if (sectionParam) {
        setActiveSection(sectionParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const setIsDarkMode = (dark: boolean) => {
    setTheme(dark ? 'dark' : 'light');
  };

  const value = {
    activeSection,
    setActiveSection,
    isSidebarVisible,
    setIsSidebarVisible,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isDarkMode,
    setIsDarkMode,
    toggleDarkMode,
    urlParams
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
