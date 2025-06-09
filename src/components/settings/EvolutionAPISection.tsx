
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EvolutionAPISectionProps {
  isDarkMode?: boolean;
}

export const EvolutionAPISection: React.FC<EvolutionAPISectionProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();

  const handleNavigateToAPISettings = () => {
    navigate('/?section=configuracoes&subsection=api');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#b5103c]" />
          API Evolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Configure e gerencie suas instâncias da API Evolution para envio de mensagens via WhatsApp.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Database className="h-5 w-5 text-[#b5103c]" />
            <div>
              <h4 className="font-medium">Repositório de Instâncias</h4>
              <p className="text-sm text-gray-500">Gerencie suas instâncias da API</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Link className="h-5 w-5 text-[#b5103c]" />
            <div>
              <h4 className="font-medium">Mapeamento de Canais</h4>
              <p className="text-sm text-gray-500">Vincule canais às instâncias</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleNavigateToAPISettings}
          className="w-full bg-[#b5103c] hover:bg-[#9d0e34] text-white"
        >
          <Settings className="mr-2 h-4 w-4" />
          Configurar API Evolution
        </Button>
      </CardContent>
    </Card>
  );
};
