
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Wifi, RotateCcw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: any[];
}

interface ApiConnectionSectionProps {
  apiConnection: ApiConnection;
  setApiConnection: (connection: ApiConnection) => void;
  validatingApi: boolean;
  onValidateApi: () => void;
  isDarkMode: boolean;
}

export const ApiConnectionSection: React.FC<ApiConnectionSectionProps> = ({
  apiConnection,
  setApiConnection,
  validatingApi,
  onValidateApi,
  isDarkMode
}) => {
  return (
    <Card className={cn(
      "border-2",
      isDarkMode ? "bg-[#18181b] border-[#3f3f46]" : "bg-white border-gray-200"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Conectar API Evolution
        </CardTitle>
        <CardDescription>
          Configure a URL e API Key para conectar com a Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="baseUrl">URL Base da API</Label>
            <Input
              id="baseUrl"
              placeholder="https://evolution.estudioonmp.com"
              value={apiConnection.baseUrl}
              onChange={(e) => setApiConnection(prev => ({
                ...prev,
                baseUrl: e.target.value,
                isValidated: false
              }))}
              disabled={validatingApi}
              className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}
            />
          </div>
          
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Sua API Key"
              value={apiConnection.apiKey}
              onChange={(e) => setApiConnection(prev => ({
                ...prev,
                apiKey: e.target.value,
                isValidated: false
              }))}
              disabled={validatingApi}
              className={cn(
                isDarkMode ? "bg-[#27272a] border-[#3f3f46]" : "bg-white border-gray-300"
              )}
            />
          </div>
        </div>
        <Button
          onClick={onValidateApi}
          disabled={validatingApi}
          variant={apiConnection.isValidated ? "default" : "default"}
          className={cn(
            "w-full",
            isDarkMode ? "text-white" : "text-white"
          )}
        >
          {validatingApi ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : apiConnection.isValidated ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              API Validada
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Validar API
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
