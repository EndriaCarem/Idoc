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
    const { documentoFormatado, templateContent, templateName } = await req.json();
    
    if (!documentoFormatado || !templateContent) {
      return new Response(
        JSON.stringify({ error: 'Documento e template são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um AUDITOR TÉCNICO especializado em relatórios regulatórios brasileiros.

Sua tarefa: COMPARAR o documento formatado com o template oficial e identificar GAPS (informações faltantes ou incompletas).

=== TEMPLATE OFICIAL ===
${templateContent}

=== REGRAS DE ANÁLISE ===

1. Compare SEÇÃO POR SEÇÃO do documento vs template
2. Identifique campos obrigatórios que estão FALTANDO
3. Identifique campos que estão marcados como [PENDENTE]
4. Verifique se tabelas obrigatórias estão presentes e completas
5. Liste APENAS gaps que podem ser preenchidos com informações do usuário

⚠️ NÃO liste:
- Formatações ou melhorias estilísticas
- Validações técnicas já realizadas
- Sugestões de redação

✅ LISTE APENAS:
- Informações factuais faltantes (nomes, datas, valores, etc)
- Campos obrigatórios vazios
- Tabelas incompletas que precisam de dados

🎯 FORMATO DE SAÍDA:

Retorne um objeto JSON com esta estrutura EXATA:

{
  "gaps": [
    {
      "secao": "Nome da Seção",
      "campo": "Nome do campo faltante",
      "descricao": "O que precisa ser informado",
      "exemplo": "Exemplo de preenchimento",
      "obrigatorio": true
    }
  ],
  "totalGaps": 5,
  "percentualCompleto": 75
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown ou texto adicional.`;

    const userPrompt = `=== DOCUMENTO FORMATADO ATUAL ===

${documentoFormatado}

=== SUA TAREFA ===

Analise o documento acima comparando com o template e retorne o JSON com os gaps identificados.`;

    console.log('Analisando gaps do documento...');

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
    let analysisResult = aiData.choices[0].message.content;

    // Limpar markdown se presente
    analysisResult = analysisResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse do JSON
    let gapsData;
    try {
      gapsData = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('Resposta recebida:', analysisResult);
      throw new Error('Formato de resposta inválido da IA');
    }

    console.log('Análise concluída:', gapsData.totalGaps, 'gaps encontrados');

    return new Response(
      JSON.stringify(gapsData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao analisar gaps:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
