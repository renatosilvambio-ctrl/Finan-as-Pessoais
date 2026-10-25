# Migrations e Banco de Dados Supabase — Meu Controle Financeiro

Este diretório contém a estrutura de migrações SQL do Supabase PostgreSQL para o sistema **Meu Controle Financeiro**.

## Arquivo de Migração
- `migrations/20261024000000_init_meu_controle_financeiro.sql`:
  - Criação das 8 tabelas do sistema (`responsaveis`, `cartoes`, `despesas_cartao`, `parcelas_cartao`, `contas_receber`, `contas_pagar`, `pagamentos_fatura_responsavel`, `configuracoes_usuario`).
  - Índices otimizados por `user_id`, competência e cartões.
  - Row Level Security (RLS) habilitado com políticas granulares isoladas por usuário (`auth.uid() = user_id`).
  - Triggers automáticos de `updated_at`.
  - Publicação das tabelas no Supabase Realtime para sincronização automática entre múltiplos dispositivos.

---

## Como Aplicar as Migrações

### Opção 1: Via Supabase Dashboard (Mais Fácil)
1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2. No menu lateral, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `migrations/20261024000000_init_meu_controle_financeiro.sql`, copie todo o conteúdo e cole no editor.
5. Clique em **Run** (Executar).

### Opção 2: Via Supabase CLI
Se você utiliza o CLI do Supabase no seu computador:
```bash
# Vincular ao seu projeto Supabase (ID do projeto obtido no painel)
npx supabase link --project-ref seu-project-ref

# Aplicar todas as migrações locais para o banco remoto
npx supabase db push
```

---

## Variáveis de Ambiente no Frontend
No seu arquivo `.env` (ou nas configurações da Vercel):
```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
```
*Atenção: Nunca utilize a chave `service_role` no frontend! Apenas a chave `anon` pública.*
