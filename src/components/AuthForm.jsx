import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, UserPlus, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function AuthForm({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(!!onLogin);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        if (!onLogin) return;
        await onLogin(formData.email, formData.password);
        // Toast for login is handled in the context to avoid duplication
      } else {
        if (!onRegister) return;
        await onRegister(formData.email, formData.password, { data: { nome: formData.name } });
        // Toast for register is handled in the context
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Algo deu errado. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
       <Link to="/" className="absolute top-4 left-4 flex items-center gap-2 text-foreground hover:text-primary transition-colors">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold">Lumify</span>
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
             <CardTitle className="text-2xl font-semibold">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Acesse seu controle financeiro pessoal'
                : 'Comece sua jornada de educação financeira'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                {isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              {isLogin ? (
                <div className="flex flex-col gap-2 items-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={async () => {
                      const email = formData.email?.trim();
                      if (!email) {
                        toast({
                          title: 'Informe seu e-mail',
                          description: 'Digite seu e-mail no campo acima para enviar o link.',
                        });
                        return;
                      }
                      await resetPassword(email);
                    }}
                  >
                    Esqueceu sua senha?
                  </button>
                  <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Não tem uma conta? Criar conta
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Já tem uma conta? Fazer login
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}