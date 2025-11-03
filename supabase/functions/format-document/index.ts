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

    const systemPrompt = `Você é um assistente especializado em formatação de documentos regulatórios brasileiros.

Sua tarefa é formatar o documento fornecido seguindo o template especificado, mantendo o formato em TEXTO PURO.

REGRAS IMPORTANTES:
- NÃO use HTML, markdown ou qualquer tipo de formatação especial
- Use apenas texto puro com quebras de linha e espaçamentos
- NÃO invente números ou informações - use apenas o que está no documento original
- Mantenha a formatação de valores monetários em pt-BR (ex: R$ 1.240.000,00)
- Organize o conteúdo seguindo a estrutura do template fornecido
- Para tabelas, use alinhamento de texto simples com espaços
- Mantenha títulos de seções em MAIÚSCULAS seguidos de quebra de linha dupla
- Separe seções diferentes com linhas em branco

FORMATO DE SAÍDA:
Retorne APENAS o documento formatado em texto puro.
Após o documento, em linhas separadas, forneça:
- SUGESTÕES: lista de melhorias aplicadas (uma por linha, iniciando com "-")
- ALERTAS: lista de pontos de atenção (uma por linha, iniciando com "⚠️")

TEMPLATE DE REFERÊNCIA:
${templateContent.substring(0, 4000)}`;

    const userPrompt = `DOCUMENTO ORIGINAL:
${documentText.substring(0, 10000)}

TEMPLATE A SEGUIR:
${templateContent}

Formate o documento acima seguindo o template, mantendo apenas texto puro sem HTML ou markdown.
Ao final, liste as sugestões e alertas em linhas separadas.`;

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
    const aiResponse = aiData.choices[0].message.content;
    
    // Separar o texto formatado das sugestões e alertas
    const lines = aiResponse.split('\n');
    const textoFormatadoLines: string[] = [];
    const sugestoes: string[] = [];
    const alertas: string[] = [];
    
    let currentSection = 'documento';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().startsWith('sugestõ') || trimmed.toLowerCase().startsWith('sugest')) {
        currentSection = 'sugestoes';
        continue;
      }
      if (trimmed.toLowerCase().startsWith('alerta')) {
        currentSection = 'alertas';
        continue;
      }
      
      if (trimmed.startsWith('-') && currentSection === 'sugestoes') {
        sugestoes.push(trimmed.substring(1).trim());
      } else if (trimmed.startsWith('⚠️') && currentSection === 'alertas') {
        alertas.push(trimmed);
      } else if (currentSection === 'documento') {
        textoFormatadoLines.push(line);
      }
    }
    
    const textoFormatado = textoFormatadoLines.join('\n').trim();
    
    // Garantir que temos pelo menos uma sugestão e alerta
    if (sugestoes.length === 0) {
      sugestoes.push('Documento formatado conforme template');
    }
    if (alertas.length === 0) {
      alertas.push('⚠️ Revise o documento antes do envio oficial');
    }

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
