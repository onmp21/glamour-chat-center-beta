
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChannelProvider } from '@/contexts/ChannelContext';
import { MainLayout } from '@/components/MainLayout';

const Index = () => {
  return (
    <AuthProvider>
      <ChannelProvider>
        <MainLayout />
      </ChannelProvider>
    </AuthProvider>
  );
};

export default Index;
