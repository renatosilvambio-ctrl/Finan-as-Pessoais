import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import {
  Responsavel,
  CartaoCredito,
  DespesaCartao,
  ParcelaCartao,
  ContaReceber,
  ContaPagar,
  PagamentoFaturaResponsavel,
  ResumoMes,
  TabNavegacao,
  SubTabMais,
} from '../types';
import {
  loadStoredData,
  saveStoredData,
  generateInitialSeedData,
  StorageData,
} from '../services/storage';
import {
  fetchUserCloudData,
  syncAllDataToCloud,
  cloudUpsertResponsavel,
  cloudDeleteResponsavel,
  cloudUpsertCartao,
  cloudDeleteCartao,
  cloudUpsertDespesaComParcelas,
  cloudDeleteDespesa,
  cloudUpdateParcela,
  cloudUpsertContaReceber,
  cloudDeleteContaReceber,
  cloudUpsertContaPagar,
  cloudDeleteContaPagar,
  cloudUpsertPagamentoFatura,
  cloudUpsertConfiguracoes,
  setupRealtimeSubscription,
} from '../services/supabaseApi';
import { splitInstallments, toCents, fromCents } from '../utils/currency';
import { addMonths } from '../utils/dateUtils';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface FinanceContextType {
  mesSelecionado: string;
  setMesSelecionado: (mes: string) => void;
  activeTab: TabNavegacao;
  setActiveTab: (tab: TabNavegacao) => void;
  activeSubTabMais: SubTabMais;
  setActiveSubTabMais: (tab: SubTabMais) => void;

  responsaveis: Responsavel[];
  cartoes: CartaoCredito[];
  despesas: DespesaCartao[];
  parcelas: ParcelaCartao[];
  contasReceber: ContaReceber[];
  contasPagar: ContaPagar[];
  pagamentosFatura: PagamentoFaturaResponsavel[];
  configuracoes: StorageData['configuracoes'];

  // Sync state
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  sincronizarComNuvem: () => Promise<boolean>;

  // Card Operations
  adicionarDespesaCartao: (dados: Omit<DespesaCartao, 'id' | 'created_at'>) => void;
  editarDespesaCartao: (id: string, dados: Partial<DespesaCartao>) => void;
  excluirDespesaCartao: (id: string) => void;
  anteciparParcela: (parcelaId: string, paraMes: string) => void;
  togglePagarParcela: (parcelaId: string) => void;
  quitarFaturaResponsavel: (responsavelId: string, cartaoId: string, mes: string, totalPago?: number) => void;

  // Receivables Operations
  adicionarContaReceber: (dados: Omit<ContaReceber, 'id' | 'created_at'>, gerarParcelasMultiplas?: boolean) => void;
  atualizarContaReceber: (id: string, dados: Partial<ContaReceber>) => void;
  excluirContaReceber: (id: string) => void;

  // Payables Operations
  adicionarContaPagar: (dados: Omit<ContaPagar, 'id' | 'created_at'>) => void;
  atualizarContaPagar: (id: string, dados: Partial<ContaPagar>) => void;
  excluirContaPagar: (id: string) => void;

  // Responsible People Operations
  adicionarResponsavel: (dados: Omit<Responsavel, 'id' | 'created_at'>) => void;
  atualizarResponsavel: (id: string, dados: Partial<Responsavel>) => void;
  excluirResponsavel: (id: string) => void;

  // Credit Cards Operations
  adicionarCartao: (dados: Omit<CartaoCredito, 'id' | 'created_at'>) => void;
  atualizarCartao: (id: string, dados: Partial<CartaoCredito>) => void;
  excluirCartao: (id: string) => void;

  // System & Settings
  atualizarConfiguracoes: (novasConfigs: Partial<StorageData['configuracoes']>) => void;
  resetarDados: () => void;
  restaurarBackup: (dados: StorageData) => void;

  // Computed data
  resumoMes: ResumoMes;
  previsao12Meses: (ResumoMes & { saldo_acumulado: number })[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use November 2026 as initial default anchor (aligned with prompt specification)
  const [mesSelecionado, setMesSelecionado] = useState<string>('2026-11');
  const [activeTab, setActiveTab] = useState<TabNavegacao>('inicio');
  const [activeSubTabMais, setActiveSubTabMais] = useState<SubTabMais>('previsao');

  // Core Data States
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [despesas, setDespesas] = useState<DespesaCartao[]>([]);
  const [parcelas, setParcelas] = useState<ParcelaCartao[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [pagamentosFatura, setPagamentosFatura] = useState<PagamentoFaturaResponsavel[]>([]);
  const [configuracoes, setConfiguracoes] = useState<StorageData['configuracoes']>({
    chavePix: 'renatosilvambio@gmail.com',
    temaEscuro: false,
    donoNome: 'Renato',
  });

  // Cloud Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load from local storage initially
  useEffect(() => {
    const data = loadStoredData();
    setResponsaveis(data.responsaveis);
    setCartoes(data.cartoes);
    setDespesas(data.despesas);
    setParcelas(data.parcelas);
    setContasReceber(data.contasReceber);
    setContasPagar(data.contasPagar);
    setPagamentosFatura(data.pagamentosFatura || []);
    if (data.configuracoes) {
      setConfiguracoes(data.configuracoes);
      if (data.configuracoes.temaEscuro) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Save changes to localStorage whenever state changes
  const persistState = useCallback(
    (newData: Partial<StorageData>) => {
      const fullData: StorageData = {
        responsaveis: newData.responsaveis ?? responsaveis,
        cartoes: newData.cartoes ?? cartoes,
        despesas: newData.despesas ?? despesas,
        parcelas: newData.parcelas ?? parcelas,
        contasReceber: newData.contasReceber ?? contasReceber,
        contasPagar: newData.contasPagar ?? contasPagar,
        pagamentosFatura: newData.pagamentosFatura ?? pagamentosFatura,
        configuracoes: newData.configuracoes ?? configuracoes,
      };
      saveStoredData(fullData);
    },
    [responsaveis, cartoes, despesas, parcelas, contasReceber, contasPagar, pagamentosFatura, configuracoes]
  );

  // Synchronization with Supabase
  const sincronizarComNuvem = useCallback(async (): Promise<boolean> => {
    setSyncStatus('syncing');
    try {
      const cloudResult = await fetchUserCloudData();
      if (cloudResult.hasData && cloudResult.data) {
        // Cloud has existing data, update client
        setResponsaveis(cloudResult.data.responsaveis);
        setCartoes(cloudResult.data.cartoes);
        setDespesas(cloudResult.data.despesas);
        setParcelas(cloudResult.data.parcelas);
        setContasReceber(cloudResult.data.contasReceber);
        setContasPagar(cloudResult.data.contasPagar);
        setPagamentosFatura(cloudResult.data.pagamentosFatura || []);
        if (cloudResult.data.configuracoes) {
          setConfiguracoes(cloudResult.data.configuracoes);
        }
        saveStoredData(cloudResult.data);
      } else {
        // No records on Supabase yet: push current local state to cloud
        const localData = loadStoredData();
        await syncAllDataToCloud(localData);
      }

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      return true;
    } catch (err) {
      console.error('Falha ao sincronizar com Supabase:', err);
      setSyncStatus('error');
      return false;
    }
  }, []);

  // Sync automatically on mount and set up Realtime subscription
  useEffect(() => {
    sincronizarComNuvem();

    const unsubscribe = setupRealtimeSubscription(() => {
      fetchUserCloudData().then((res) => {
        if (res.hasData && res.data) {
          setResponsaveis(res.data.responsaveis);
          setCartoes(res.data.cartoes);
          setDespesas(res.data.despesas);
          setParcelas(res.data.parcelas);
          setContasReceber(res.data.contasReceber);
          setContasPagar(res.data.contasPagar);
          setPagamentosFatura(res.data.pagamentosFatura || []);
          saveStoredData(res.data);
          setLastSyncTime(new Date());
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sincronizarComNuvem]);

  // -------------------------------------------------------------
  // CARTÃO DE CRÉDITO & PARCELAMENTO
  // -------------------------------------------------------------
  const adicionarDespesaCartao = (dados: Omit<DespesaCartao, 'id' | 'created_at'>) => {
    const newDespesaId = `desp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDespesa: DespesaCartao = {
      ...dados,
      id: newDespesaId,
      created_at: new Date().toISOString(),
    };

    // Calculate exact cent-adjusted installments
    const valores = splitInstallments(dados.valor_total, dados.total_parcelas);
    const novasParcelas: ParcelaCartao[] = valores.map((valor, idx) => ({
      id: `parc-${newDespesaId}-${idx + 1}`,
      despesa_id: newDespesaId,
      cartao_id: dados.cartao_id,
      responsavel_id: dados.responsavel_id,
      numero_parcela: idx + 1,
      total_parcelas: dados.total_parcelas,
      mes_fatura: addMonths(dados.primeiro_mes, idx),
      valor,
      paga: false,
      created_at: new Date().toISOString(),
    }));

    const updatedDespesas = [newDespesa, ...despesas];
    const updatedParcelas = [...parcelas, ...novasParcelas];

    setDespesas(updatedDespesas);
    setParcelas(updatedParcelas);
    persistState({ despesas: updatedDespesas, parcelas: updatedParcelas });

    // Sync to Supabase in background
    cloudUpsertDespesaComParcelas(newDespesa, novasParcelas).catch((err) => {
      console.error('Erro ao sincronizar despesa no Supabase:', err);
    });
  };

  const editarDespesaCartao = (id: string, dados: Partial<DespesaCartao>) => {
    let updatedTarget: DespesaCartao | null = null;
    const updatedDespesas = despesas.map((d) => {
      if (d.id === id) {
        updatedTarget = { ...d, ...dados };
        return updatedTarget;
      }
      return d;
    });

    const affectedParcelas: ParcelaCartao[] = [];
    const updatedParcelas = parcelas.map((p) => {
      if (p.despesa_id !== id) return p;
      const mod = {
        ...p,
        responsavel_id: dados.responsavel_id ?? p.responsavel_id,
        cartao_id: dados.cartao_id ?? p.cartao_id,
      };
      affectedParcelas.push(mod);
      return mod;
    });

    setDespesas(updatedDespesas);
    setParcelas(updatedParcelas);
    persistState({ despesas: updatedDespesas, parcelas: updatedParcelas });

    if (updatedTarget) {
      cloudUpsertDespesaComParcelas(updatedTarget, affectedParcelas).catch((err) => {
        console.error('Erro ao editar despesa no Supabase:', err);
      });
    }
  };

  const excluirDespesaCartao = (id: string) => {
    const updatedDespesas = despesas.filter((d) => d.id !== id);
    const updatedParcelas = parcelas.filter((p) => p.despesa_id !== id);

    setDespesas(updatedDespesas);
    setParcelas(updatedParcelas);
    persistState({ despesas: updatedDespesas, parcelas: updatedParcelas });

    cloudDeleteDespesa(id).catch((err) => console.error('Erro ao excluir no Supabase:', err));
  };

  const anteciparParcela = (parcelaId: string, paraMes: string) => {
    let targetParcela: ParcelaCartao | null = null;
    const updatedParcelas = parcelas.map((p) => {
      if (p.id !== parcelaId) return p;
      targetParcela = {
        ...p,
        mes_original: p.mes_original || p.mes_fatura,
        mes_fatura: paraMes,
        antecipada: true,
      };
      return targetParcela;
    });
    setParcelas(updatedParcelas);
    persistState({ parcelas: updatedParcelas });

    if (targetParcela) {
      cloudUpdateParcela(targetParcela).catch((err) => console.error('Erro ao antecipar parcela:', err));
    }
  };

  const togglePagarParcela = (parcelaId: string) => {
    let targetParcela: ParcelaCartao | null = null;
    const updatedParcelas = parcelas.map((p) => {
      if (p.id !== parcelaId) return p;
      const novoPaga = !p.paga;
      targetParcela = {
        ...p,
        paga: novoPaga,
        data_pagamento: novoPaga ? new Date().toISOString().split('T')[0] : undefined,
      };
      return targetParcela;
    });
    setParcelas(updatedParcelas);
    persistState({ parcelas: updatedParcelas });

    if (targetParcela) {
      cloudUpdateParcela(targetParcela).catch((err) => console.error('Erro ao atualizar parcela:', err));
    }
  };

  const quitarFaturaResponsavel = (
    responsavelId: string,
    cartaoId: string,
    mes: string,
    totalPago?: number
  ) => {
    const parcelasModificadas: ParcelaCartao[] = [];
    const updatedParcelas = parcelas.map((p) => {
      if (p.responsavel_id === responsavelId && p.cartao_id === cartaoId && p.mes_fatura === mes) {
        const item = {
          ...p,
          paga: true,
          data_pagamento: new Date().toISOString().split('T')[0],
        };
        parcelasModificadas.push(item);
        return item;
      }
      return p;
    });

    const valorDevido = parcelas
      .filter((p) => p.responsavel_id === responsavelId && p.cartao_id === cartaoId && p.mes_fatura === mes)
      .reduce((sum, p) => sum + p.valor, 0);

    const novoPagamento: PagamentoFaturaResponsavel = {
      id: `pagfat-${responsavelId}-${cartaoId}-${mes}`,
      cartao_id: cartaoId,
      responsavel_id: responsavelId,
      mes_fatura: mes,
      valor_devido: valorDevido,
      valor_pago: totalPago ?? valorDevido,
      pago_totalmente: true,
      data_pagamento: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const existingFiltered = pagamentosFatura.filter(
      (pf) => !(pf.responsavel_id === responsavelId && pf.cartao_id === cartaoId && pf.mes_fatura === mes)
    );
    const updatedPagamentos = [...existingFiltered, novoPagamento];

    setParcelas(updatedParcelas);
    setPagamentosFatura(updatedPagamentos);
    persistState({ parcelas: updatedParcelas, pagamentosFatura: updatedPagamentos });

    parcelasModificadas.forEach((p) => cloudUpdateParcela(p).catch(() => {}));
    cloudUpsertPagamentoFatura(novoPagamento).catch(() => {});
  };

  // -------------------------------------------------------------
  // CONTAS A RECEBER
  // -------------------------------------------------------------
  const adicionarContaReceber = (
    dados: Omit<ContaReceber, 'id' | 'created_at'>,
    gerarParcelasMultiplas = false
  ) => {
    const timestamp = Date.now();
    const novasContas: ContaReceber[] = [];

    if (gerarParcelasMultiplas && dados.total_parcelas && dados.total_parcelas > 1) {
      const dividaId = `div-${timestamp}`;
      const valores = splitInstallments(dados.valor, dados.total_parcelas);
      valores.forEach((val, idx) => {
        const mesCompetencia = addMonths(dados.mes_competencia, idx);
        novasContas.push({
          ...dados,
          id: `rec-${timestamp}-${idx + 1}`,
          valor: val,
          valor_recebido: 0,
          status: 'a_receber',
          divida_id: dividaId,
          numero_parcela: idx + 1,
          total_parcelas: dados.total_parcelas,
          mes_competencia: mesCompetencia,
          data_prevista: `${mesCompetencia}-${dados.data_prevista.split('-')[2] || '10'}`,
          created_at: new Date().toISOString(),
        });
      });
    } else {
      novasContas.push({
        ...dados,
        id: `rec-${timestamp}`,
        created_at: new Date().toISOString(),
      });
    }

    const updated = [...novasContas, ...contasReceber];
    setContasReceber(updated);
    persistState({ contasReceber: updated });

    novasContas.forEach((conta) => cloudUpsertContaReceber(conta).catch(() => {}));
  };

  const atualizarContaReceber = (id: string, dados: Partial<ContaReceber>) => {
    let target: ContaReceber | null = null;
    const updated = contasReceber.map((c) => {
      if (c.id === id) {
        target = { ...c, ...dados };
        return target;
      }
      return c;
    });
    setContasReceber(updated);
    persistState({ contasReceber: updated });

    if (target) {
      cloudUpsertContaReceber(target).catch(() => {});
    }
  };

  const excluirContaReceber = (id: string) => {
    const updated = contasReceber.filter((c) => c.id !== id);
    setContasReceber(updated);
    persistState({ contasReceber: updated });

    cloudDeleteContaReceber(id).catch(() => {});
  };

  // -------------------------------------------------------------
  // CONTAS A PAGAR
  // -------------------------------------------------------------
  const adicionarContaPagar = (dados: Omit<ContaPagar, 'id' | 'created_at'>) => {
    const nova: ContaPagar = {
      ...dados,
      id: `pag-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [nova, ...contasPagar];
    setContasPagar(updated);
    persistState({ contasPagar: updated });

    cloudUpsertContaPagar(nova).catch(() => {});
  };

  const atualizarContaPagar = (id: string, dados: Partial<ContaPagar>) => {
    let target: ContaPagar | null = null;
    const updated = contasPagar.map((c) => {
      if (c.id === id) {
        target = { ...c, ...dados };
        return target;
      }
      return c;
    });
    setContasPagar(updated);
    persistState({ contasPagar: updated });

    if (target) {
      cloudUpsertContaPagar(target).catch(() => {});
    }
  };

  const excluirContaPagar = (id: string) => {
    const updated = contasPagar.filter((c) => c.id !== id);
    setContasPagar(updated);
    persistState({ contasPagar: updated });

    cloudDeleteContaPagar(id).catch(() => {});
  };

  // -------------------------------------------------------------
  // RESPONSÁVEIS
  // -------------------------------------------------------------
  const adicionarResponsavel = (dados: Omit<Responsavel, 'id' | 'created_at'>) => {
    const nova: Responsavel = {
      ...dados,
      id: `resp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...responsaveis, nova];
    setResponsaveis(updated);
    persistState({ responsaveis: updated });

    cloudUpsertResponsavel(nova).catch(() => {});
  };

  const atualizarResponsavel = (id: string, dados: Partial<Responsavel>) => {
    let target: Responsavel | null = null;
    const updated = responsaveis.map((r) => {
      if (r.id === id) {
        target = { ...r, ...dados };
        return target;
      }
      return r;
    });
    setResponsaveis(updated);
    persistState({ responsaveis: updated });

    if (target) {
      cloudUpsertResponsavel(target).catch(() => {});
    }
  };

  const excluirResponsavel = (id: string) => {
    const updated = responsaveis.filter((r) => r.id !== id);
    setResponsaveis(updated);
    persistState({ responsaveis: updated });

    cloudDeleteResponsavel(id).catch(() => {});
  };

  // -------------------------------------------------------------
  // CARTÕES
  // -------------------------------------------------------------
  const adicionarCartao = (dados: Omit<CartaoCredito, 'id' | 'created_at'>) => {
    const novo: CartaoCredito = {
      ...dados,
      id: `card-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...cartoes, novo];
    setCartoes(updated);
    persistState({ cartoes: updated });

    cloudUpsertCartao(novo).catch(() => {});
  };

  const atualizarCartao = (id: string, dados: Partial<CartaoCredito>) => {
    let target: CartaoCredito | null = null;
    const updated = cartoes.map((c) => {
      if (c.id === id) {
        target = { ...c, ...dados };
        return target;
      }
      return c;
    });
    setCartoes(updated);
    persistState({ cartoes: updated });

    if (target) {
      cloudUpsertCartao(target).catch(() => {});
    }
  };

  const excluirCartao = (id: string) => {
    const updated = cartoes.filter((c) => c.id !== id);
    setCartoes(updated);
    persistState({ cartoes: updated });

    cloudDeleteCartao(id).catch(() => {});
  };

  // -------------------------------------------------------------
  // CONFIGURAÇÕES E RESTAURAÇÃO
  // -------------------------------------------------------------
  const atualizarConfiguracoes = (novasConfigs: Partial<StorageData['configuracoes']>) => {
    const merged = { ...configuracoes, ...novasConfigs };
    setConfiguracoes(merged);
    if (merged.temaEscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    persistState({ configuracoes: merged });

    cloudUpsertConfiguracoes(merged).catch(() => {});
  };

  const resetarDados = () => {
    const seed = generateInitialSeedData();
    setResponsaveis(seed.responsaveis);
    setCartoes(seed.cartoes);
    setDespesas(seed.despesas);
    setParcelas(seed.parcelas);
    setContasReceber(seed.contasReceber);
    setContasPagar(seed.contasPagar);
    setPagamentosFatura(seed.pagamentosFatura);
    setConfiguracoes(seed.configuracoes);
    saveStoredData(seed);

    syncAllDataToCloud(seed).catch(() => {});
  };

  const restaurarBackup = (dados: StorageData) => {
    setResponsaveis(dados.responsaveis || []);
    setCartoes(dados.cartoes || []);
    setDespesas(dados.despesas || []);
    setParcelas(dados.parcelas || []);
    setContasReceber(dados.contasReceber || []);
    setContasPagar(dados.contasPagar || []);
    setPagamentosFatura(dados.pagamentosFatura || []);
    if (dados.configuracoes) setConfiguracoes(dados.configuracoes);
    saveStoredData(dados);

    syncAllDataToCloud(dados).catch(() => {});
  };

  // -------------------------------------------------------------
  // CÁLCULO DE RESUMO MENSAL (DASHBOARD & REGRAS FINANCEIRAS)
  // -------------------------------------------------------------
  const ownerResponsavel = useMemo(() => {
    return responsaveis.find((r) => r.is_owner) || responsaveis[0];
  }, [responsaveis]);

  const calcularResumoParaMes = useCallback(
    (mes: string): ResumoMes => {
      // 1. Parcelas do cartão para este mês
      const parcelasDoMes = parcelas.filter((p) => p.mes_fatura === mes);
      const total_fatura_cartao = parcelasDoMes.reduce((acc, p) => acc + p.valor, 0);

      const parcelasMinhas = parcelasDoMes.filter((p) => p.responsavel_id === ownerResponsavel?.id);
      const total_minha_parte_cartao = parcelasMinhas.reduce((acc, p) => acc + p.valor, 0);

      const parcelasTerceiros = parcelasDoMes.filter((p) => p.responsavel_id !== ownerResponsavel?.id);
      const total_terceiros_cartao = parcelasTerceiros.reduce((acc, p) => acc + p.valor, 0);
      const total_terceiros_pago = parcelasTerceiros
        .filter((p) => p.paga)
        .reduce((acc, p) => acc + p.valor, 0);
      const total_terceiros_pendente = total_terceiros_cartao - total_terceiros_pago;

      // 2. Contas a Receber para este mês
      const receberDoMes = contasReceber.filter((c) => c.mes_competencia === mes && c.status !== 'cancelado');
      const total_a_receber = receberDoMes.reduce((acc, c) => acc + c.valor, 0);
      const total_recebido = receberDoMes.reduce((acc, c) => acc + (c.valor_recebido || 0), 0);
      const total_receber_pendente = total_a_receber - total_recebido;

      // 3. Contas a Pagar para este mês
      const pagarDoMes = contasPagar.filter((c) => c.mes_competencia === mes && c.status !== 'cancelado');
      const total_contas_pagar = pagarDoMes.reduce((acc, c) => acc + c.valor, 0);
      const total_contas_pagas = pagarDoMes.reduce((acc, c) => acc + (c.valor_pago || 0), 0);
      const total_contas_pendentes = pagarDoMes
        .filter((c) => c.status === 'pendente')
        .reduce((acc, c) => acc + c.valor, 0);
      const total_contas_atrasadas = pagarDoMes
        .filter((c) => c.status === 'atrasado')
        .reduce((acc, c) => acc + c.valor, 0);

      // 4. Saldo Previsto:
      // Saldo previsto = Recebimentos previstos - (Contas a Pagar + Minha Parte do Cartão)
      const despesasPessoaisPrevistas = total_minha_parte_cartao + total_contas_pagar;
      const saldo_previsto = total_a_receber - despesasPessoaisPrevistas;

      // Saldo Realizado: Dinheiro já recebido - (Contas já pagas + Minhas faturas pagas)
      const contasPessoaisPagas =
        total_contas_pagas + parcelasMinhas.filter((p) => p.paga).reduce((a, b) => a + b.valor, 0);
      const saldo_realizado = total_recebido - contasPessoaisPagas;

      return {
        mes,
        total_fatura_cartao: fromCents(toCents(total_fatura_cartao)),
        total_minha_parte_cartao: fromCents(toCents(total_minha_parte_cartao)),
        total_terceiros_cartao: fromCents(toCents(total_terceiros_cartao)),
        total_terceiros_pago: fromCents(toCents(total_terceiros_pago)),
        total_terceiros_pendente: fromCents(toCents(total_terceiros_pendente)),
        total_a_receber: fromCents(toCents(total_a_receber)),
        total_recebido: fromCents(toCents(total_recebido)),
        total_receber_pendente: fromCents(toCents(total_receber_pendente)),
        total_contas_pagar: fromCents(toCents(total_contas_pagar)),
        total_contas_pagas: fromCents(toCents(total_contas_pagas)),
        total_contas_pendentes: fromCents(toCents(total_contas_pendentes)),
        total_contas_atrasadas: fromCents(toCents(total_contas_atrasadas)),
        saldo_previsto: fromCents(toCents(saldo_previsto)),
        saldo_realizado: fromCents(toCents(saldo_realizado)),
      };
    },
    [parcelas, contasReceber, contasPagar, ownerResponsavel]
  );

  const resumoMes = useMemo(() => {
    return calcularResumoParaMes(mesSelecionado);
  }, [mesSelecionado, calcularResumoParaMes]);

  // -------------------------------------------------------------
  // PREVISÃO FINANCEIRA PARA OS PRÓXIMOS 12 MESES
  // -------------------------------------------------------------
  const previsao12Meses = useMemo(() => {
    const list: (ResumoMes & { saldo_acumulado: number })[] = [];
    let acumulado = 0;

    for (let i = 0; i < 12; i++) {
      const mes = addMonths(mesSelecionado, i);
      const res = calcularResumoParaMes(mes);
      acumulado += res.saldo_previsto;
      list.push({
        ...res,
        saldo_acumulado: fromCents(toCents(acumulado)),
      });
    }

    return list;
  }, [mesSelecionado, calcularResumoParaMes]);

  return (
    <FinanceContext.Provider
      value={{
        mesSelecionado,
        setMesSelecionado,
        activeTab,
        setActiveTab,
        activeSubTabMais,
        setActiveSubTabMais,

        responsaveis,
        cartoes,
        despesas,
        parcelas,
        contasReceber,
        contasPagar,
        pagamentosFatura,
        configuracoes,

        syncStatus,
        lastSyncTime,
        sincronizarComNuvem,

        adicionarDespesaCartao,
        editarDespesaCartao,
        excluirDespesaCartao,
        anteciparParcela,
        togglePagarParcela,
        quitarFaturaResponsavel,

        adicionarContaReceber,
        atualizarContaReceber,
        excluirContaReceber,

        adicionarContaPagar,
        atualizarContaPagar,
        excluirContaPagar,

        adicionarResponsavel,
        atualizarResponsavel,
        excluirResponsavel,

        adicionarCartao,
        atualizarCartao,
        excluirCartao,

        atualizarConfiguracoes,
        resetarDados,
        restaurarBackup,

        resumoMes,
        previsao12Meses,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
