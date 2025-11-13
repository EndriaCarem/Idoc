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
  templateContent?: string;
  documentId?: string;
  onUpdateDocument?: boolean;
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
      sugestoes = [], 
      alertas = [],
      templateContent,
      documentId
    }: RequestBody = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Construir contexto do sistema com informações do documento
    const systemPrompt = `Você é um COPILOTO TÉCNICO INTELIGENTE especializado em relatórios de incentivos fiscais brasileiros (Regime Automotivo, Lei de Informática, PPB, MOVER).

EXPERTISE:
- Formatação e padronização de documentos regulatórios
- Conformidade com requisitos de prestação de contas
- Análise técnica de projetos de P&D e inovação
- Conhecimento profundo da legislação brasileira de incentivos fiscais

CONTEXTO DO DOCUMENTO EM ANÁLISE:

📄 DOCUMENTO ORIGINAL (amostra):
${documentoOriginal?.substring(0, 1200) || 'Não fornecido'}
[...]

📝 DOCUMENTO FORMATADO (amostra):
${documentoFormatado?.substring(0, 1200) || 'Não fornecido'}
[...]

✅ FORMATAÇÕES APLICADAS (${sugestoes?.length || 0} itens):
${sugestoes?.length > 0 ? sugestoes.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'Nenhuma formatação aplicada ainda'}

⚠️ ALERTAS DE CONFORMIDADE IDENTIFICADOS (${alertas?.length || 0} itens):
${alertas?.length > 0 ? alertas.map((a, i) => `${i + 1}. ${a}`).join('\n') : 'Nenhum alerta identificado'}

COMO VOCÊ PODE AJUDAR:
1. **Identificar Informações Faltantes**: Quando o usuário fornece dados faltantes, reconheça e PERGUNTE se ele quer que você atualize o documento
2. **Atualizar Documento**: Se o usuário confirmar, retorne um JSON especial para atualizar o documento
3. **Melhorias de Texto**: Sugerir reformulações para clareza, precisão técnica e conformidade
4. **Análise de Conformidade**: Validar se trechos atendem aos requisitos regulatórios
5. **Correções Específicas**: Revisar seções, tabelas, nomenclaturas e referências normativas

FLUXO DE ATUALIZAÇÃO DO DOCUMENTO:
1. Usuário fornece informação faltante (ex: "O valor do investimento foi R$ 500.000")
2. Você pergunta: "Você gostaria que eu atualizasse essa informação no documento? Em qual seção devo inserir?"
3. Se usuário confirmar, retorne este JSON:

{
  "type": "update_document",
  "message": "Atualizando o documento...",
  "updates": {
    "secao": "Nome da Seção",
    "campo": "Nome do campo",
    "novoValor": "Valor a ser inserido",
    "documentoAtualizado": "HTML completo do documento atualizado"
  }
}

DIRETRIZES DE RESPOSTA:
- Seja OBJETIVO e TÉCNICO, sem prolixidade
- Priorize CONFORMIDADE REGULATÓRIA sobre preferências estilísticas
- Cite SEMPRE que possível as normativas aplicáveis (leis, portarias, instruções normativas)
- Use linguagem profissional adequada para analistas técnicos
- Forneça respostas ACIONÁVEIS com passos concretos
- Quando o usuário fornecer dados, SEMPRE pergunte se deve atualizar o documento

IMPORTANTE: Você tem o poder de atualizar o documento automaticamente quando o usuário fornecer informações e confirmar a atualização.`;

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

    // Verificar se é uma resposta de atualização de documento
    let responseData: any = { response: assistantResponse };
    
    // Tentar detectar se a resposta contém JSON de atualização
    try {
      if (assistantResponse.includes('"type": "update_document"')) {
        const jsonMatch = assistantResponse.match(/\{[\s\S]*"type":\s*"update_document"[\s\S]*\}/);
        if (jsonMatch) {
          const updateData = JSON.parse(jsonMatch[0]);
          responseData = {
            ...updateData,
            response: updateData.message || assistantResponse
          };
        }
      }
    } catch (e) {
      // Se não for JSON válido, continua com resposta normal
      console.log('Resposta não contém JSON de atualização');
    }

    return new Response(
      JSON.stringify(responseData),
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
