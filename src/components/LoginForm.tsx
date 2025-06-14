
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
      className="w-full min-h-screen flex items-stretch"
      style={{
        background: `url('/lovable-uploads/56cf76b7-506e-4187-b17f-14ca7ef3306a.png') center center / cover no-repeat`,
        // O mesmo padrão para escuro/claro pois o pedido foi igual:
      }}
    >
      <div
        className="flex items-center w-full md:w-[480px] max-w-full bg-white/80 dark:bg-[#101012e6] p-8 md:p-14 min-h-screen shadow-2xl"
        style={{
          // opção para ficar um pouco translúcido e trazer efeito "glass" leve
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="w-full space-y-8">
          {/* Logo maior e sem fundo */}
          <div className="flex flex-col items-start">
            <img
              src="/lovable-uploads/2e823263-bd82-49e9-84f6-6327c136da53.png"
              alt="Villa Glamour Logo"
              className="w-24 h-24 md:w-36 md:h-36 object-contain mb-1"
              style={{ background: 'transparent' }}
            />
            <div>
              <div className="font-extrabold text-4xl md:text-5xl bg-gradient-to-r from-[#b5103c] to-[#8a0c2e] bg-clip-text text-transparent leading-tight mb-1 md:mb-2 tracking-tight">
                Villa Glamour
              </div>
              <div className="font-medium text-lg md:text-xl text-slate-600 dark:text-slate-300 opacity-80 mb-2">
                Sistema de Atendimento
              </div>
            </div>
          </div>
          <Card className="border-0 shadow-none bg-transparent p-0">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                    className="h-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#222229e8]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                      className="h-12 pr-12 transition-all duration-200 focus:ring-2 focus:ring-[#b5103c] border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#222229e8]"
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
      </div>
      {/* Espaço vazio à direita - deixa a imagem aparecendo totalmente */}
      <div className="flex-1 hidden md:block" />
    </div>
  );
};
