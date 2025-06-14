import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

interface SystemSectionProps {
  isDarkMode: boolean;
}

interface SystemSettings {
  notifications: boolean;
  soundAlerts: boolean;
  autoSave: boolean;
  debugMode: boolean;
}

export const SystemSection: React.FC<SystemSectionProps> = ({ isDarkMode }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: true,
    soundAlerts: false,
    autoSave: true,
    debugMode: false
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (setting: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      toast({
        title: "Sucesso",
        description: "Configurações do sistema salvas com sucesso!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  return (
    <Card className={cn(
      "border",
      isDarkMode ? "bg-card border-border" : "bg-white border-gray-200"
    )}>
      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "flex items-center gap-3 text-lg",
          isDarkMode ? "text-card-foreground" : "text-gray-900"
        )}>
          Configurações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Notificações
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Receber notificações do sistema
            </p>
          </div>
          <Switch 
            checked={settings.notifications}
            onCheckedChange={() => handleToggle('notifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Salvamento Automático
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Salvar alterações automaticamente sem confirmação
            </p>
          </div>
          <Switch 
            checked={settings.autoSave}
            onCheckedChange={() => handleToggle('autoSave')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Alertas Sonoros
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Reproduzir sons para alertas e notificações
            </p>
          </div>
          <Switch 
            checked={settings.soundAlerts}
            onCheckedChange={() => handleToggle('soundAlerts')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Modo Debug
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Exibir informações de debug no console
            </p>
          </div>
          <Switch 
            checked={settings.debugMode}
            onCheckedChange={() => handleToggle('debugMode')}
          />
        </div>

        <div className="pt-6 border-t border-border">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
