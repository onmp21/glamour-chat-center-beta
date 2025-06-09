
import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';

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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // Sempre true por padrão
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const [urlParams, setUrlParams] = useState(new URLSearchParams(window.location.search));

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
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
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
