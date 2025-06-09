
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useRememberUser } from '@/hooks/useRememberUser';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export const LoginFormFixed: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();
  const { 
    rememberMe, 
    setRememberMe, 
    saveCredentials, 
    getSavedCredentials,
    clearSavedCredentials 
  } = useRememberUser();

  useEffect(() => {
    const savedCredentials = getSavedCredentials();
    if (savedCredentials) {
      setUsername(savedCredentials.username);
      setPassword(savedCredentials.password);
    }
  }, [getSavedCredentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login({ username, password });
      
      if (success) {
        if (rememberMe) {
          saveCredentials(username, password);
        } else {
          clearSavedCredentials();
        }
        
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Credenciais inválidas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#b5103c] to-[#8a0c2e] rounded-2xl flex items-center justify-center shadow-lg">
            <img 
              src="/lovable-uploads/63318fcc-a543-4299-aa65-5274d6eb987e.png" 
              alt="Villa Glamour Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#b5103c] to-[#8a0c2e] bg-clip-text text-transparent">
              Villa Glamour
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-lg">
              Sistema de Atendimento
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                disabled={isLoading}
                className="h-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-200 dark:border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  className="h-12 pr-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 py-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
                className="data-[state=checked]:bg-[#b5103c] data-[state=checked]:border-[#b5103c]"
              />
              <Label 
                htmlFor="remember" 
                className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer font-medium"
              >
                Lembrar usuário por 30 dias
              </Label>
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#b5103c] to-[#8a0c2e] hover:from-[#8a0c2e] hover:to-[#b5103c] text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
