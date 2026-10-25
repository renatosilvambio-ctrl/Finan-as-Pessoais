import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Key for storing custom Supabase credentials in browser localStorage
const STORAGE_CUSTOM_SUPABASE_KEY = 'meu_controle_financeiro_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Retrieve configured or environment credentials
export function getSavedSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_SUPABASE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações personalizadas do Supabase:', err);
  }

  // Check environment variables with both VITE_ and NEXT_PUBLIC_ prefixes
  const envUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://fvuqvmgdkiwrppmdkulv.supabase.co';

  const envKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_uLFR4mnv769IbJvBmQif5A_2H0SoMuJ';

  if (
    envUrl &&
    envKey &&
    envUrl !== 'https://your-project.supabase.co' &&
    envKey !== 'your-anon-key-here'
  ) {
    return { url: envUrl, anonKey: envKey };
  }

  return {
    url: 'https://fvuqvmgdkiwrppmdkulv.supabase.co',
    anonKey: 'sb_publishable_uLFR4mnv769IbJvBmQif5A_2H0SoMuJ',
  };
}

export function saveCustomSupabaseConfig(config: SupabaseConfig | null): void {
  if (!config) {
    localStorage.removeItem(STORAGE_CUSTOM_SUPABASE_KEY);
    clientInstance = null;
    return;
  }
  localStorage.setItem(STORAGE_CUSTOM_SUPABASE_KEY, JSON.stringify(config));
  clientInstance = null; // Reset instance so it picks up the new config
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.warn('Não foi possível inicializar o cliente Supabase:', e);
      return null;
    }
  }

  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  return !!getSupabaseClient();
}

/**
 * Tests connection to the Supabase instance
 */
export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const client = config 
      ? createClient(config.url, config.anonKey)
      : getSupabaseClient();

    if (!client) {
      return { success: false, message: 'URL ou Anon Key do Supabase não configurados.' };
    }

    // Ping auth service
    const { error } = await client.auth.getSession();
    if (error) {
      return { success: false, message: `Erro ao conectar: ${error.message}` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Falha na conexão: ${err.message || 'Verifique as credenciais.'}` };
  }
}

/**
 * Script SQL para o Supabase SQL Editor / Migrations
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA COMPLETO — MEU CONTROLE FINANCEIRO
-- Cole este script no SQL Editor do seu projeto Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabela de Responsáveis
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

-- 2. Tabela de Cartões de Crédito
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

-- 3. Tabela de Despesas do Cartão
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
  primeiro_mes TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_despesas_user_id ON public.despesas_cartao(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_cartao_id ON public.despesas_cartao(cartao_id);
CREATE INDEX IF NOT EXISTS idx_despesas_responsavel_id ON public.despesas_cartao(responsavel_id);

-- 4. Tabela de Parcelas do Cartão
CREATE TABLE IF NOT EXISTS public.parcelas_cartao (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  despesa_id TEXT REFERENCES public.despesas_cartao(id) ON DELETE CASCADE,
  cartao_id TEXT REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  numero_parcela INT NOT NULL CHECK (numero_parcela >= 1),
  total_parcelas INT NOT NULL CHECK (total_parcelas >= 1),
  mes_fatura TEXT NOT NULL,
  mes_original TEXT,
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

-- 5. Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  pagador_nome TEXT NOT NULL,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  data_prevista DATE NOT NULL,
  mes_competencia TEXT NOT NULL,
  recorrencia TEXT DEFAULT 'nenhuma',
  dia_fixo INT,
  divida_id TEXT,
  total_parcelas INT,
  numero_parcela INT,
  status TEXT DEFAULT 'a_receber',
  valor_recebido NUMERIC(12, 2) DEFAULT 0,
  data_recebimento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_id ON public.contas_receber(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_mes_comp ON public.contas_receber(mes_competencia);

-- 6. Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  data_vencimento DATE NOT NULL,
  mes_competencia TEXT NOT NULL,
  recorrencia TEXT DEFAULT 'nenhuma',
  total_parcelas INT,
  numero_parcela INT,
  status TEXT DEFAULT 'pendente',
  valor_pago NUMERIC(12, 2) DEFAULT 0,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_id ON public.contas_pagar(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_mes_comp ON public.contas_pagar(mes_competencia);

-- 7. Tabela de Quitação de Fatura por Responsável
CREATE TABLE IF NOT EXISTS public.pagamentos_fatura_responsavel (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id TEXT REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id TEXT REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  mes_fatura TEXT NOT NULL,
  valor_devido NUMERIC(12, 2) NOT NULL,
  valor_pago NUMERIC(12, 2) DEFAULT 0,
  pago_totalmente BOOLEAN DEFAULT false,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_fatura_user_id ON public.pagamentos_fatura_responsavel(user_id);

-- 8. Tabela de Configurações do Usuário
CREATE TABLE IF NOT EXISTS public.configuracoes_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chave_pix TEXT,
  dono_nome TEXT DEFAULT 'Renato',
  tema_escuro BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_fatura_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Usuário gerencia seus próprios responsáveis" ON public.responsaveis;
CREATE POLICY "Usuário gerencia seus próprios responsáveis" ON public.responsaveis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia seus próprios cartões" ON public.cartoes;
CREATE POLICY "Usuário gerencia seus próprios cartões" ON public.cartoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia suas próprias despesas do cartão" ON public.despesas_cartao;
CREATE POLICY "Usuário gerencia suas próprias despesas do cartão" ON public.despesas_cartao FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia suas próprias parcelas do cartão" ON public.parcelas_cartao;
CREATE POLICY "Usuário gerencia suas próprias parcelas do cartão" ON public.parcelas_cartao FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia suas próprias contas a receber" ON public.contas_receber;
CREATE POLICY "Usuário gerencia suas próprias contas a receber" ON public.contas_receber FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia suas próprias contas a pagar" ON public.contas_pagar;
CREATE POLICY "Usuário gerencia suas próprias contas a pagar" ON public.contas_pagar FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia seus próprios pagamentos de fatura" ON public.pagamentos_fatura_responsavel;
CREATE POLICY "Usuário gerencia seus próprios pagamentos de fatura" ON public.pagamentos_fatura_responsavel FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário gerencia suas próprias configurações" ON public.configuracoes_usuario;
CREATE POLICY "Usuário gerencia suas próprias configurações" ON public.configuracoes_usuario FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime
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
      NULL;
  END;
END $$;
`;
