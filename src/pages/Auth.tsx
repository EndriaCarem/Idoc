import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Fingerprint, Mail, Lock, User, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import loginIcon from '@/assets/idoc-logo-new.png';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    department: ''
  });

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Simulate biometric availability (fake for demo)
    const hasBiometric = localStorage.getItem('biometric_registered') === 'true';
    setBiometricAvailable(hasBiometric);
  }, [navigate]);

  const handleBiometricAuth = async () => {
    setLoading(true);
    
    // Simulate biometric authentication
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const savedEmail = localStorage.getItem('biometric_email');
    const savedPassword = localStorage.getItem('biometric_password');
    
    if (savedEmail && savedPassword) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: savedEmail,
        password: savedPassword,
      });

      if (error) {
        toast({
          title: 'Erro na autenticação',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Autenticação biométrica realizada!',
          description: 'Login seguro confirmado',
        });
        navigate('/');
      }
    }
    
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo de volta',
        });
        
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName,
              department: formData.department,
            }
          }
        });

        if (error) throw error;

        toast({
          title: 'Conta criada!',
          description: 'Você já pode fazer login',
        });

        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const enableBiometric = () => {
    localStorage.setItem('biometric_registered', 'true');
    localStorage.setItem('biometric_email', formData.email);
    localStorage.setItem('biometric_password', formData.password);
    setBiometricAvailable(true);
    
    toast({
      title: 'Biometria ativada!',
      description: 'Você pode usar sua digital para acessos futuros',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-48 h-48 flex items-center justify-center mx-auto -mb-4">
            <img 
              src={loginIcon} 
              alt="Idoc" 
              className="w-48 h-48 object-contain !border-0 !outline-none !ring-0 !shadow-none" 
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Idoc</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {biometricAvailable && isLogin && (
          <Button
            onClick={handleBiometricAuth}
            disabled={loading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            size="lg"
          >
            <Fingerprint className="w-6 h-6 mr-2" />
            Autenticar com Biometria
          </Button>
        )}

        {biometricAvailable && isLogin && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com email
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Seu nome"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="department"
                    placeholder="Ex: P&D, Engenharia..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </Button>

          {isLogin && !biometricAvailable && formData.email && formData.password && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={enableBiometric}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Ativar Biometria
            </Button>
          )}
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
          </button>
        </div>
      </Card>
    </div>
  );
}
