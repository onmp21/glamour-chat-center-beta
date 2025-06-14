
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useRememberUser } from '@/hooks/useRememberUser';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export const LoginForm: React.FC = () => {
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
    <div
      className="w-full min-h-screen flex items-center justify-start px-8 md:px-16 lg:px-24"
      style={{
        background: `url('/lovable-uploads/1c661b9c-0e2b-4ca8-a326-90cdc8c73635.png') center center / cover no-repeat`,
      }}
    >
      <div
        className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full p-8 md:p-10 flex flex-col justify-center"
        style={{ minHeight: '480px', maxWidth: '410px' }}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/lovable-uploads/ea397861-5fcd-451b-872e-727208c03a67.png"
            alt="Villa Glamour Logo"
            className="w-20 h-20 object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-[#b5103c]">
            Villa Glamour
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Sistema de Atendimento
          </p>
        </div>
        <Card className="border-0 shadow-none bg-transparent p-0">
          <CardContent className="p-0">
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
                  autoComplete="username"
                  className="h-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50"
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
                    autoComplete="current-password"
                    className="h-12 pr-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50"
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
                className="w-full h-12 bg-[#9f1239] hover:bg-[#b5103c] text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
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
    </div>
  );
};
