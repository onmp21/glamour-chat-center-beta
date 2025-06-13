
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ChannelProvider } from './contexts/ChannelContext';
import { MainLayout } from './components/MainLayout';

const queryClient = new QueryClient();

function App() {
  console.log('🚀 [APP] Inicializando aplicação - estrutura corrigida');
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <TooltipProvider>
              <ChannelProvider>
                <MainLayout />
                <Toaster />
                <Sonner />
              </ChannelProvider>
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
