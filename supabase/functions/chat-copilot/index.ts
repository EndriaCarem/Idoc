import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  documentoOriginal: string;
  documentoFormatado: string;
  sugestoes: string[];
  alertas: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages, 
      documentoOriginal, 
      documentoFormatado, 
      sugestoes, 
      alertas 
    }: RequestBody = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Construir contexto do sistema com informações do documento
    const systemPrompt = `Você é um assistente especializado em formatação de relatórios técnicos de incentivos fiscais (Regime Automotivo, Lei de Informática e MOVER).

CONTEXTO DO DOCUMENTO:
- O usuário enviou um documento para formatação conforme um template específico
- Você tem acesso ao documento original e ao documento formatado
- ${sugestoes.length} formatações foram aplicadas
- ${alertas.length} alertas de conformidade foram identificados

SUAS RESPONSABILIDADES:
1. Responder perguntas sobre o documento e as formatações aplicadas
2. Sugerir melhorias específicas em trechos do texto
3. Explicar questões de conformidade regulatória
4. Ajudar a padronizar terminologia técnica
5. Identificar pontos que podem gerar dúvidas na prestação de contas

FORMATAÇÕES APLICADAS:
${sugestoes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

ALERTAS DE CONFORMIDADE:
${alertas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

INSTRUÇÕES:
- Seja conciso e direto nas respostas
- Quando sugerir melhorias, forneça exemplos práticos
- Foque em conformidade regulatória e clareza técnica
- Use linguagem profissional mas acessível
- Sempre que possível, referencie os alertas e sugestões já identificados`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Limite de requisições excedido. Por favor, aguarde um momento e tente novamente.' 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta Lovable AI.' 
          }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const errorText = await response.text();
      console.error('Erro na API Lovable AI:', response.status, errorText);
      throw new Error('Erro ao processar mensagem com IA');
    }

    const data = await response.json();
    const assistantResponse = data.choices[0]?.message?.content;

    if (!assistantResponse) {
      throw new Error('Resposta inválida da IA');
    }

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no chat-copilot:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
