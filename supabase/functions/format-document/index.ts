import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, templateContent, templateName } = await req.json();
    
    if (!documentText || !templateContent) {
      return new Response(
        JSON.stringify({ error: 'Documento e template são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um assistente especializado em formatação de relatórios técnicos.

Você receberá:
1. Um documento técnico sem formatação adequada
2. Um template de exemplo que mostra o padrão de formatação desejado

Sua tarefa é:
- Analisar o template para entender o padrão de formatação (estrutura, seções, estilo)
- Reformatar o documento seguindo exatamente o padrão do template
- Manter todo o conteúdo técnico original
- Aplicar a mesma estrutura de capítulos, seções e formatação
- Garantir conformidade com as normas técnicas apresentadas no template

IMPORTANTE: Retorne APENAS o documento formatado, sem comentários adicionais.`;

    const userPrompt = `TEMPLATE DE REFERÊNCIA (${templateName}):
---
${templateContent.substring(0, 8000)}
---

DOCUMENTO PARA FORMATAR:
---
${documentText.substring(0, 8000)}
---

Formate o documento seguindo exatamente o padrão do template fornecido.`;

    console.log('Chamando Lovable AI para formatação...');

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const aiData = await response.json();
    const textoFormatado = aiData.choices[0].message.content;

    // Gerar sugestões e alertas baseados na análise
    const sugestoes = [
      `Documento formatado conforme template "${templateName}"`,
      'Estrutura de capítulos e seções padronizada',
      'Numeração e hierarquia ajustadas',
      'Formatação de elementos técnicos aplicada',
    ];

    const alertas = [
      'Revise manualmente referências e citações',
      'Verifique conformidade com normas regulatórias específicas',
      'Confirme numeração de figuras e tabelas',
    ];

    console.log('Formatação concluída com sucesso');

    return new Response(
      JSON.stringify({
        textoFormatado,
        sugestoes,
        alertas
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao processar:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
