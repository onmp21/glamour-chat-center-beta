
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Palette, Monitor, Check } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface MobileAppearanceSettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const MobileAppearanceSettings: React.FC<MobileAppearanceSettingsProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  const { theme, setTheme } = useTheme();
  
  // Calcular o estado atual do tema
  const isCurrentlyDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-accent">
          <Palette size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Aparência
        </h2>
        <p className="text-sm text-muted-foreground">
          Personalize a interface do seu jeito
        </p>
      </div>
      
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-3 text-foreground">
            <Monitor size={20} className="text-primary" />
            Tema da Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => setTheme('light')}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start gap-4 border-2 transition-all duration-200",
                theme === 'light' 
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" 
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                theme === 'light' ? "bg-primary" : "bg-muted"
              )}>
                <Sun size={20} className={theme === 'light' ? "text-primary-foreground" : "text-muted-foreground"} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Modo Claro</div>
                <div className="text-sm opacity-80">
                  Interface com cores claras e vibrantes
                </div>
              </div>
              {theme === 'light' && (
                <div className="bg-primary rounded-full p-1">
                  <Check size={16} className="text-primary-foreground" />
                </div>
              )}
            </Button>
            
            <Button
              onClick={() => setTheme('dark')}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start gap-4 border-2 transition-all duration-200",
                theme === 'dark' 
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" 
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                theme === 'dark' ? "bg-primary" : "bg-muted"
              )}>
                <Moon size={20} className={theme === 'dark' ? "text-primary-foreground" : "text-muted-foreground"} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Modo Escuro</div>
                <div className="text-sm opacity-80">
                  Interface com cores escuras e suaves
                </div>
              </div>
              {theme === 'dark' && (
                <div className="bg-primary rounded-full p-1">
                  <Check size={16} className="text-primary-foreground" />
                </div>
              )}
            </Button>
          </div>
          
          <div className="p-4 rounded-xl border-l-4 border-primary bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="bg-primary rounded-full p-1 mt-0.5">
                <Check size={12} className="text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">
                  Tema Aplicado
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Suas preferências são salvas automaticamente e aplicadas em toda a interface do sistema.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-3 text-foreground">
            <Palette size={20} className="text-secondary" />
            Informações do Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-xs font-medium text-muted-foreground">
                Tema Atual
              </p>
              <p className="text-sm font-semibold mt-1 text-foreground">
                {theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Sistema'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted">
              <p className="text-xs font-medium text-muted-foreground">
                Auto-adaptação
              </p>
              <p className="text-sm font-semibold mt-1 text-foreground">
                {theme === 'system' ? 'Ativo' : 'Desabilitado'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
