-- ====================================================================
-- MIGRAÇÃO INICIAL — MEU CONTROLE FINANCEIRO
-- Versão: 20261024000000
-- Descrição: Criação das tabelas relacionais, índices de performance,
--            Row Level Security (RLS), políticas de acesso por usuário
--            e publicação no Supabase Realtime.
-- ====================================================================

-- 0. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função auxiliar para atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 1. Tabela: responsaveis (Pessoas e titulares de despesas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.responsaveis (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responsaveis_user_id ON public.responsaveis(user_id);

-- --------------------------------------------------------------------
-- 2. Tabela: cartoes (Cartões de Crédito Compartilhados)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cartoes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  apelido TEXT,
  dia_fechamento INT NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
  dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  limite NUMERIC(12, 2),
  cor TEXT DEFAULT '#1677E8',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON public.cartoes(user_id);

-- --------------------------------------------------------------------
-- 3. Tabela: despesas_cartao (Compras avulsas ou parceladas no cartão)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.despesas_cartao (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id TEXT REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor_total NUMERIC(12, 2) NOT NULL CHECK (valor_total > 0),
  total_parcelas INT NOT NULL DEFAULT 1 CHECK (total_parcelas >= 1),
  data_compra DATE NOT NULL,
  primeiro_mes TEXT NOT NULL, -- Formato YYYY-MM
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas_cartao(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_cartao_id ON public.despesas_cartao(cartao_id);
CREATE INDEX IF NOT EXISTS idx_despesas_responsavel_id ON public.despesas_cartao(responsavel_id);

-- --------------------------------------------------------------------
-- 4. Tabela: parcelas_cartao (Detalhamento mensal de cada fatura)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcelas_cartao (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  despesa_id TEXT REFERENCES public.despesas_cartao(id) ON DELETE CASCADE,
  cartao_id TEXT REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  numero_parcela INT NOT NULL CHECK (numero_parcela >= 1),
  total_parcelas INT NOT NULL CHECK (total_parcelas >= 1),
  mes_fatura TEXT NOT NULL, -- Formato YYYY-MM
  mes_original TEXT,       -- Utilizado em caso de antecipação
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  paga BOOLEAN DEFAULT false,
  data_pagamento DATE,
  antecipada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parcelas_user_id ON public.parcelas_cartao(user_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_mes_fatura ON public.parcelas_cartao(mes_fatura);
CREATE INDEX IF NOT EXISTS idx_parcelas_despesa_id ON public.parcelas_cartao(despesa_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_cartao_id ON public.parcelas_cartao(cartao_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_responsavel_id ON public.parcelas_cartao(responsavel_id);

-- --------------------------------------------------------------------
-- 5. Tabela: contas_receber (Salários, 5º dia útil, vales e terceiros)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  pagador_nome TEXT NOT NULL,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  data_prevista DATE NOT NULL,
  mes_competencia TEXT NOT NULL, -- Formato YYYY-MM
  recorrencia TEXT DEFAULT 'nenhuma',
  dia_fixo INT,
  divida_id TEXT,
  total_parcelas INT,
  numero_parcela INT,
  status TEXT DEFAULT 'a_receber', -- a_receber, recebido, parcial, atrasado, cancelado
  valor_recebido NUMERIC(12, 2) DEFAULT 0,
  data_recebimento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_receber_user_id ON public.contas_receber(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_mes_comp ON public.contas_receber(mes_competencia);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON public.contas_receber(status);

-- --------------------------------------------------------------------
-- 6. Tabela: contas_pagar (Contas fixas e recorrentes fora do cartão)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  data_vencimento DATE NOT NULL,
  mes_competencia TEXT NOT NULL, -- Formato YYYY-MM
  recorrencia TEXT DEFAULT 'nenhuma', -- nenhuma, mensal
  total_parcelas INT,
  numero_parcela INT,
  status TEXT DEFAULT 'pendente', -- pendente, pago, parcial, atrasado, cancelado
  valor_pago NUMERIC(12, 2) DEFAULT 0,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_id ON public.contas_pagar(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_mes_comp ON public.contas_pagar(mes_competencia);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);

-- --------------------------------------------------------------------
-- 7. Tabela: pagamentos_fatura_responsavel (Reembolsos de faturas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagamentos_fatura_responsavel (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id TEXT REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  mes_fatura TEXT NOT NULL, -- Formato YYYY-MM
  valor_devido NUMERIC(12, 2) NOT NULL,
  valor_pago NUMERIC(12, 2) DEFAULT 0,
  pago_totalmente BOOLEAN DEFAULT false,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura_user_id ON public.pagamentos_fatura_responsavel(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura_mes ON public.pagamentos_fatura_responsavel(mes_fatura);

-- --------------------------------------------------------------------
-- 8. Tabela: configuracoes_usuario (PIX, titular, preferências)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracoes_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chave_pix TEXT,
  dono_nome TEXT DEFAULT 'Renato',
  tema_escuro BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 9. Triggers automáticos de updated_at
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_responsaveis_updated_at') THEN
    CREATE TRIGGER trg_responsaveis_updated_at BEFORE UPDATE ON public.responsaveis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_cartoes_updated_at BEFORE UPDATE ON public.cartoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_despesas_updated_at BEFORE UPDATE ON public.despesas_cartao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_parcelas_updated_at BEFORE UPDATE ON public.parcelas_cartao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_pagamentos_fatura_updated_at BEFORE UPDATE ON public.pagamentos_fatura_responsavel FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER trg_configuracoes_usuario_updated_at BEFORE UPDATE ON public.configuracoes_usuario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 10. Habilitação de Row Level Security (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_fatura_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 11. Políticas de RLS (Somente o próprio usuário acessa seus dados)
-- --------------------------------------------------------------------
-- responsaveis
DROP POLICY IF EXISTS "Usuário gerencia seus próprios responsáveis" ON public.responsaveis;
CREATE POLICY "Usuário gerencia seus próprios responsáveis"
  ON public.responsaveis FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- cartoes
DROP POLICY IF EXISTS "Usuário gerencia seus próprios cartões" ON public.cartoes;
CREATE POLICY "Usuário gerencia seus próprios cartões"
  ON public.cartoes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- despesas_cartao
DROP POLICY IF EXISTS "Usuário gerencia suas próprias despesas do cartão" ON public.despesas_cartao;
CREATE POLICY "Usuário gerencia suas próprias despesas do cartão"
  ON public.despesas_cartao FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- parcelas_cartao
DROP POLICY IF EXISTS "Usuário gerencia suas próprias parcelas do cartão" ON public.parcelas_cartao;
CREATE POLICY "Usuário gerencia suas próprias parcelas do cartão"
  ON public.parcelas_cartao FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- contas_receber
DROP POLICY IF EXISTS "Usuário gerencia suas próprias contas a receber" ON public.contas_receber;
CREATE POLICY "Usuário gerencia suas próprias contas a receber"
  ON public.contas_receber FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- contas_pagar
DROP POLICY IF EXISTS "Usuário gerencia suas próprias contas a pagar" ON public.contas_pagar;
CREATE POLICY "Usuário gerencia suas próprias contas a pagar"
  ON public.contas_pagar FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- pagamentos_fatura_responsavel
DROP POLICY IF EXISTS "Usuário gerencia seus próprios pagamentos de fatura" ON public.pagamentos_fatura_responsavel;
CREATE POLICY "Usuário gerencia seus próprios pagamentos de fatura"
  ON public.pagamentos_fatura_responsavel FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- configuracoes_usuario
DROP POLICY IF EXISTS "Usuário gerencia suas próprias configurações" ON public.configuracoes_usuario;
CREATE POLICY "Usuário gerencia suas próprias configurações"
  ON public.configuracoes_usuario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 12. Supabase Realtime (Permitir sincronização instantânea via WebSocket)
-- --------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.responsaveis,
      public.cartoes,
      public.despesas_cartao,
      public.parcelas_cartao,
      public.contas_receber,
      public.contas_pagar,
      public.pagamentos_fatura_responsavel,
      public.configuracoes_usuario;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Tabelas já adicionadas à publicação
  END;
END $$;
