import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuditLogger } from '@/hooks/useAuditLogger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NotificationsSectionProps {
  isDarkMode: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  dailySummary: boolean;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({ isDarkMode }) => {
  const { logNotificationAction } = useAuditLogger();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: false,
    pushNotifications: false,
    soundNotifications: true,
    dailySummary: false
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (setting: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      await logNotificationAction('update', {
        settings,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Sucesso",
        description: "Configurações de notificação salvas com sucesso!",
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
    const savedSettings = localStorage.getItem('notificationSettings');
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
          Preferências de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Notificações por Email
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Receber notificações de novas mensagens por email
            </p>
          </div>
          <Switch 
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle('emailNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Notificações Push
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Receber notificações push no navegador
            </p>
          </div>
          <Switch 
            checked={settings.pushNotifications}
            onCheckedChange={() => handleToggle('pushNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Sons de Notificação
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Reproduzir som quando receber novas mensagens
            </p>
          </div>
          <Switch 
            checked={settings.soundNotifications}
            onCheckedChange={() => handleToggle('soundNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className={cn(
              "text-base font-medium",
              isDarkMode ? "text-card-foreground" : "text-gray-900"
            )}>
              Resumo Diário
            </Label>
            <p className={cn(
              "text-sm",
              isDarkMode ? "text-muted-foreground" : "text-gray-600"
            )}>
              Receber resumo diário de atividades
            </p>
          </div>
          <Switch 
            checked={settings.dailySummary}
            onCheckedChange={() => handleToggle('dailySummary')}
          />
        </div>

        <div className="pt-6 border-t border-border">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
