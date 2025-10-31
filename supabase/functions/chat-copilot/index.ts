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
    const systemPrompt = `Você é um COPILOTO TÉCNICO especializado em relatórios de incentivos fiscais brasileiros (Regime Automotivo, Lei de Informática, PPB, MOVER).

EXPERTISE:
- Formatação e padronização de documentos regulatórios
- Conformidade com requisitos de prestação de contas
- Análise técnica de projetos de P&D e inovação
- Conhecimento profundo da legislação brasileira de incentivos fiscais

CONTEXTO DO DOCUMENTO EM ANÁLISE:

📄 DOCUMENTO ORIGINAL (amostra):
${documentoOriginal.substring(0, 1200)}
[...]

📝 DOCUMENTO FORMATADO (amostra):
${documentoFormatado.substring(0, 1200)}
[...]

✅ FORMATAÇÕES APLICADAS (${sugestoes.length} itens):
${sugestoes.map((s, i) => `${i + 1}. ${s}`).join('\n')}

⚠️ ALERTAS DE CONFORMIDADE IDENTIFICADOS (${alertas.length} itens):
${alertas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

COMO VOCÊ PODE AJUDAR:
1. **Melhorias de Texto**: Sugerir reformulações para clareza, precisão técnica e conformidade
2. **Análise de Conformidade**: Validar se trechos atendem aos requisitos regulatórios
3. **Correções Específicas**: Revisar seções, tabelas, nomenclaturas e referências normativas
4. **Esclarecimentos**: Explicar alertas, requisitos e melhores práticas
5. **Sugestões Contextuais**: Recomendar melhorias baseadas no tipo de regime fiscal

DIRETRIZES DE RESPOSTA:
- Seja OBJETIVO e TÉCNICO, sem prolixidade
- Priorize CONFORMIDADE REGULATÓRIA sobre preferências estilísticas
- Cite SEMPRE que possível as normativas aplicáveis (leis, portarias, instruções normativas)
- Use linguagem profissional adequada para analistas técnicos
- Forneça respostas ACIONÁVEIS com passos concretos
- Quando aplicável, sugira texto formatado pronto para uso

IMPORTANTE: Você está auxiliando profissionais qualificados. Suas respostas devem ser precisas, fundamentadas e diretamente aplicáveis ao contexto regulatório brasileiro.`;

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
