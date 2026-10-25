import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Responsavel } from '../../types';
import { formatCurrency } from '../../utils/currency';

export const PeopleView: React.FC = () => {
  const {
    responsaveis,
    parcelas,
    adicionarResponsavel,
    atualizarResponsavel,
    excluirResponsavel,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Responsavel | null>(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativo, setAtivo] = useState(true);

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setNome('');
    setTelefone('');
    setObservacoes('');
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Responsavel) => {
    setEditingPerson(p);
    setNome(p.nome);
    setTelefone(p.telefone || '');
    setObservacoes(p.observacoes || '');
    setAtivo(p.ativo);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o nome do responsável.');
      return;
    }

    if (editingPerson) {
      atualizarResponsavel(editingPerson.id, {
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        ativo,
      });
    } else {
      adicionarResponsavel({
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        ativo,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (p: Responsavel) => {
    if (p.is_owner) {
      alert('Não é possível remover o titular da conta principal.');
      return;
    }
    if (confirm(`Deseja remover o responsável "${p.nome}"?`)) {
      excluirResponsavel(p.id);
    }
  };

  const handleOpenWhatsApp = (telefone?: string) => {
    if (!telefone) return;
    let clean = telefone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = '55' + clean;
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#123B67] dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1677E8]" />
            Cadastro de Responsáveis
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Pessoas vinculadas a compras e despesas compartilhadas
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Pessoa
        </button>
      </div>

      {/* People Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {responsaveis.map((p) => {
          const parcelasPessoa = parcelas.filter((item) => item.responsavel_id === p.id);
          const totalHistorico = parcelasPessoa.reduce((sum, item) => sum + item.valor, 0);
          const totalPendente = parcelasPessoa
            .filter((item) => !item.paga)
            .reduce((sum, item) => sum + item.valor, 0);

          return (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#E8F2FF] text-[#1677E8] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {p.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#123B67] dark:text-white">
                        {p.nome}
                      </span>
                      {p.is_owner && (
                        <span className="text-[10px] font-semibold text-[#1677E8] bg-[#E8F2FF] dark:bg-blue-950 px-1.5 py-0.2 rounded">
                          Titular
                        </span>
                      )}
                    </div>
                    {p.telefone ? (
                      <span className="text-xs text-[#64748B] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.telefone}
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B]">Sem telefone cadastrado</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {p.telefone && (
                    <button
                      onClick={() => handleOpenWhatsApp(p.telefone)}
                      className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                      title="Conversar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#1677E8] hover:bg-[#E8F2FF] dark:hover:bg-slate-800 flex items-center justify-center transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!p.is_owner && (
                    <button
                      onClick={() => handleDelete(p)}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {p.observacoes && (
                <p className="text-xs text-[#64748B] dark:text-slate-400 bg-[#F4F7FB] dark:bg-slate-800/40 p-2 rounded-lg border border-[#E2E8F0] dark:border-slate-800">
                  {p.observacoes}
                </p>
              )}

              {/* Financial metrics for this person */}
              <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#64748B] block">Total Histórico:</span>
                  <strong className="text-[#17212F] dark:text-slate-300 tabular-nums">
                    {formatCurrency(totalHistorico)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#64748B] block">Saldo Pendente Geral:</span>
                  <strong className="text-amber-600 tabular-nums">
                    {formatCurrency(totalPendente)}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <h3 className="font-bold text-base text-[#123B67] dark:text-white">
                {editingPerson ? 'Editar Pessoa' : 'Nova Pessoa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ricardo, Renato, Mãe..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Telefone / WhatsApp (DDD + Número)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 11988887777"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paga sempre dia 10, irmão..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-[#1677E8] rounded focus:ring-[#1677E8]"
                />
                <label htmlFor="ativo" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Responsável ativo para novos lançamentos
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1677E8] hover:bg-[#1265c7] text-white rounded-lg shadow-sm transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
