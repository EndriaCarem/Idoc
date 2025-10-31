<div align="center">
  <img src="src/assets/logo-idoc.png" alt="iDoc Logo" width="200"/>
  
  # iDoc - Processador Inteligente de Documentos
  
  ### Transforme seus documentos com o poder da Inteligência Artificial
  
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
  
</div>

---

## 📋 Sobre o Projeto

**iDoc** é uma plataforma moderna e inteligente para processamento e formatação de documentos utilizando Inteligência Artificial. Com uma interface intuitiva e recursos poderosos, o iDoc permite que você processe, formate e organize seus documentos de forma eficiente e automatizada.

### ✨ Principais Funcionalidades

- 🤖 **Copiloto IA**: Assistente inteligente para processar e formatar documentos
- 📄 **Processamento de Documentos**: Upload e processamento automático de diversos formatos
- 🎨 **Templates Personalizáveis**: Biblioteca de templates para diferentes tipos de documentos
- 📊 **Dashboard Analítico**: Visualize estatísticas e métricas dos seus documentos
- 📜 **Histórico Completo**: Acompanhe todo o histórico de processamento
- 👤 **Autenticação Segura**: Sistema completo de login e gerenciamento de perfil
- 🌓 **Tema Escuro/Claro**: Interface adaptável às suas preferências
- 📱 **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.3** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset tipado de JavaScript
- **Vite** - Build tool moderna e rápida
- **TailwindCSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes de UI modernos e acessíveis
- **React Router** - Roteamento para aplicações React
- **React Query** - Gerenciamento de estado assíncrono

### Backend & Serviços
- **Lovable Cloud** - Plataforma backend completa
- **Edge Functions** - Funções serverless para lógica de negócio
- **Autenticação** - Sistema completo de auth
- **Banco de Dados** - PostgreSQL gerenciado
- **Storage** - Armazenamento de arquivos

### IA & Processamento
- **Gemini AI** - Processamento inteligente de documentos
- **Chat Copilot** - Assistente conversacional

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd <nome-do-projeto>
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

As variáveis de ambiente já estão pré-configuradas no arquivo `.env` (gerenciado automaticamente pelo Lovable Cloud).

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:8080
```

---

## 🏗️ Estrutura do Projeto

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes de interface (shadcn)
│   ├── AppSidebar.tsx  # Barra lateral de navegação
│   ├── CopilotPanel.tsx # Painel do copiloto IA
│   ├── DocumentInput.tsx # Input de documentos
│   └── ...
├── pages/              # Páginas da aplicação
│   ├── Auth.tsx        # Página de autenticação
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Historico.tsx   # Histórico de documentos
│   ├── Index.tsx       # Página de processamento
│   ├── Profile.tsx     # Perfil do usuário
│   └── Templates.tsx   # Gerenciamento de templates
├── services/           # Serviços e integrações
│   └── geminiService.ts # Integração com IA
├── types/              # Definições de tipos TypeScript
├── integrations/       # Integrações externas
│   └── supabase/       # Cliente e tipos do backend
└── main.tsx           # Ponto de entrada da aplicação

supabase/
└── functions/          # Edge Functions
    ├── chat-copilot/   # Função do chat com IA
    └── format-document/ # Função de formatação
```

---

## 🎯 Como Usar

### 1. Fazer Login
Acesse a página de autenticação e crie sua conta ou faça login.

### 2. Processar Documentos
- Navegue até a página "Processar"
- Faça upload do seu documento
- Selecione um template
- Clique em processar e aguarde a IA fazer a mágica!

### 3. Gerenciar Templates
- Acesse a página "Templates"
- Crie, edite ou exclua templates personalizados
- Configure as regras de formatação

### 4. Visualizar Histórico
- Acesse "Histórico" para ver todos os documentos processados
- Busque, filtre e organize seus documentos

### 5. Acompanhar Métricas
- No Dashboard, visualize estatísticas e gráficos
- Acompanhe o uso e a produtividade

---

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Lint do código
npm run lint
```

---

## 🌐 Deploy

### Deploy via Lovable

1. Acesse seu projeto no Lovable
2. Clique em **Publish** (canto superior direito)
3. Seu app estará disponível em `seuapp.lovable.app`

### Deploy em outras plataformas

O projeto pode ser deployado em qualquer serviço que suporte aplicações Vite:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

---

## 🔒 Segurança

- ✅ Autenticação robusta com email
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Proteção de rotas no frontend
- ✅ Validação de dados no backend
- ✅ Secrets gerenciados de forma segura

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Contato

Para dúvidas, sugestões ou suporte:

- 📧 Email: seu-email@example.com
- 🌐 Website: https://seu-site.com
- 💼 LinkedIn: [Seu Perfil](https://linkedin.com/in/seu-perfil)

---

<div align="center">
  
  **Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)**
  
  ⭐ Se este projeto foi útil, considere dar uma estrela!
  
</div>