import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

const Configuracoes = () => {
  const [assistantName, setAssistantName] = useState('Assistente');
  const [userNickname, setUserNickname] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setUserNickname(data?.full_name || '');
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: userNickname })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize sua experiência com a assistente
        </p>
      </div>

      {/* Configurações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Como a assistente deve se referir a você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Como você gostaria de ser chamado(a)?</Label>
            <Input
              id="nickname"
              placeholder="Ex: Dr. Silva, Maria, João..."
              value={userNickname}
              onChange={(e) => setUserNickname(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              A assistente usará este nome ao se comunicar com você
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da Assistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Personalização da Assistente
          </CardTitle>
          <CardDescription>
            Configure o comportamento e o estilo da assistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assistant-name">Nome da Assistente</Label>
            <Input
              id="assistant-name"
              placeholder="Ex: Assistente, iDoc, Consultora..."
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções Personalizadas</Label>
            <Textarea
              id="instructions"
              placeholder="Ex: Seja mais formal ao revisar documentos jurídicos. Use tom profissional e técnico..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Oriente a assistente sobre como você prefere que ela trabalhe com seus documentos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exemplos de uso */}
      <Card className="bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Dicas de Personalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Tom de voz:</strong> "Use linguagem técnica e formal"</p>
          <p>• <strong>Foco:</strong> "Priorize conformidade legal em documentos contratuais"</p>
          <p>• <strong>Detalhamento:</strong> "Seja detalhista ao identificar inconsistências"</p>
          <p>• <strong>Estilo:</strong> "Mantenha sugestões concisas e objetivas"</p>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
