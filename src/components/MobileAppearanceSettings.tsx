
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Palette, Monitor, Check } from 'lucide-react';

interface MobileAppearanceSettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const MobileAppearanceSettings: React.FC<MobileAppearanceSettingsProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <div className={cn(
          "w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center",
          isDarkMode ? "bg-gray-800" : "bg-blue-50"
        )}>
          <Palette size={32} className="text-blue-500" />
        </div>
        <h2 className={cn("text-2xl font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>
          Aparência
        </h2>
        <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
          Personalize a interface do seu jeito
        </p>
      </div>
      
      <Card className={cn(
        "border-0 shadow-lg",
        isDarkMode ? "bg-gray-900" : "bg-white"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className={cn("text-lg flex items-center gap-3", isDarkMode ? "text-white" : "text-gray-900")}>
            <Monitor size={20} className="text-blue-500" />
            Tema da Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => isDarkMode && toggleDarkMode()}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start gap-4 border-2 transition-all duration-200",
                !isDarkMode 
                  ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100" 
                  : "border-gray-600 text-gray-300 hover:bg-gray-800"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                !isDarkMode ? "bg-blue-500" : "bg-gray-700"
              )}>
                <Sun size={20} className={!isDarkMode ? "text-white" : "text-gray-400"} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Modo Claro</div>
                <div className="text-sm opacity-80">
                  Interface com cores claras e vibrantes
                </div>
              </div>
              {!isDarkMode && (
                <div className="bg-blue-500 rounded-full p-1">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </Button>
            
            <Button
              onClick={() => !isDarkMode && toggleDarkMode()}
              variant="outline"
              className={cn(
                "h-auto p-4 justify-start gap-4 border-2 transition-all duration-200",
                isDarkMode 
                  ? "border-blue-500 bg-blue-950 text-blue-300 hover:bg-blue-900" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "rounded-full p-2",
                isDarkMode ? "bg-blue-500" : "bg-gray-200"
              )}>
                <Moon size={20} className={isDarkMode ? "text-white" : "text-gray-600"} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Modo Escuro</div>
                <div className="text-sm opacity-80">
                  Interface com cores escuras e suaves
                </div>
              </div>
              {isDarkMode && (
                <div className="bg-blue-500 rounded-full p-1">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </Button>
          </div>
          
          <div className={cn(
            "p-4 rounded-xl border-l-4 border-blue-500",
            isDarkMode ? "bg-gray-800" : "bg-blue-50"
          )}>
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                <Check size={12} className="text-white" />
              </div>
              <div>
                <p className={cn("font-medium text-sm", isDarkMode ? "text-white" : "text-gray-900")}>
                  Tema Aplicado
                </p>
                <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                  Suas preferências são salvas automaticamente e aplicadas em toda a interface do sistema.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn(
        "border-0 shadow-lg",
        isDarkMode ? "bg-gray-900" : "bg-white"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className={cn("text-lg flex items-center gap-3", isDarkMode ? "text-white" : "text-gray-900")}>
            <Palette size={20} className="text-purple-500" />
            Informações do Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "p-3 rounded-xl",
              isDarkMode ? "bg-gray-800" : "bg-gray-50"
            )}>
              <p className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Tema Atual
              </p>
              <p className={cn("text-sm font-semibold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                {isDarkMode ? 'Escuro' : 'Claro'}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              isDarkMode ? "bg-gray-800" : "bg-gray-50"
            )}>
              <p className={cn("text-xs font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                Auto-adaptação
              </p>
              <p className={cn("text-sm font-semibold mt-1", isDarkMode ? "text-white" : "text-gray-900")}>
                Desabilitado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
