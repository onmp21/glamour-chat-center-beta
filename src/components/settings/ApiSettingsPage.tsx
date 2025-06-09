import React from 'react';
import { ApiInstanceManager } from './ApiInstanceManager';
import { ChannelApiMappingManager } from './ChannelApiMappingManager';

export const ApiSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <h1 className="text-2xl font-bold mb-6">Configurações da API Evolution</h1>
      
      <section className="bg-white shadow rounded-lg p-6">
        <ApiInstanceManager />
      </section>
      
      <section className="bg-white shadow rounded-lg p-6">
        <ChannelApiMappingManager />
      </section>
    </div>
  );
};

