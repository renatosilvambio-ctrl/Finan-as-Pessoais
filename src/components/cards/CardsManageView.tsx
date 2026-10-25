import React, { useState } from 'react';
import { CreditCard, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CartaoCredito } from '../../types';
import { formatCurrency, parseCurrency } from '../../utils/currency';

export const CardsManageView: React.FC = () => {
  const { cartoes, parcelas, adicionarCartao, atualizarCartao, excluirCartao } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CartaoCredito | null>(null);

  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [diaFechamento, setDiaFechamento] = useState(24);
  const [diaVencimento, setDiaVencimento] = useState(5);
  const [limiteInput, setLimiteInput] = useState('');
  const [cor, setCor] = useState('#2D8A6A');
  const [ativo, setAtivo] = useState(true);

  const handleOpenAdd = () => {
    setEditingCard(null);
    setNome('');
    setApelido('');
    setDiaFechamento(24);
    setDiaVencimento(5);
    setLimiteInput('');
    setCor('#2D8A6A');
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CartaoCredito) => {
    setEditingCard(c);
    setNome(c.nome);
    setApelido(c.apelido);
    setDiaFechamento(c.dia_fechamento);
    setDiaVencimento(c.dia_vencimento);
    setLimiteInput(c.limite ? String(c.limite) : '');
    setCor(c.cor || '#2D8A6A');
    setAtivo(c.ativo);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }

    const limiteNum = parseCurrency(limiteInput);

    if (editingCard) {
      atualizarCartao(editingCard.id, {
        nome: nome.trim(),
        apelido: apelido.trim() || nome.trim(),
        dia_fechamento: diaFechamento,
        dia_vencimento: diaVencimento,
        limite: limiteNum > 0 ? limiteNum : undefined,
        cor,
        ativo,
      });
    } else {
      adicionarCartao({
        nome: nome.trim(),
        apelido: apelido.trim() || nome.trim(),
        dia_fechamento: diaFechamento,
        dia_vencimento: diaVencimento,
        limite: limiteNum > 0 ? limiteNum : undefined,
        cor,
        ativo,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (c: CartaoCredito) => {
    if (cartoes.length <= 1) {
      alert('É necessário manter pelo menos um cartão cadastrado.');
      return;
    }
    if (confirm(`Deseja remover o cartão "${c.nome}"?`)) {
      excluirCartao(c.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#123B67] dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#1677E8]" />
            Gerenciar Cartões de Crédito
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Cadastre múltiplos cartões com seus dias de fechamento e vencimento
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cartão
        </button>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cartoes.map((card) => {
          const parcelasCard = parcelas.filter((p) => p.cartao_id === card.id);
          const totalAtivo = parcelasCard
            .filter((p) => !p.paga)
            .reduce((sum, p) => sum + p.valor, 0);

          return (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-[#E2E8F0] dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: card.cor || '#1677E8' }}
              />

              <div className="flex items-center justify-between mb-3 mt-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: card.cor || '#1677E8' }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#123B67] dark:text-white">
                      {card.nome}
                    </h3>
                    <span className="text-[11px] text-[#64748B]">
                      Apelido: {card.apelido}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(card)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#1677E8] hover:bg-[#E8F2FF] dark:hover:bg-slate-800 flex items-center justify-center transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F4F7FB] dark:bg-slate-800/40 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <span className="text-[#64748B] block text-[10px]">Fechamento:</span>
                  <strong className="text-[#17212F] dark:text-slate-200">
                    Todo dia {card.dia_fechamento}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">Vencimento:</span>
                  <strong className="text-[#17212F] dark:text-slate-200">
                    Todo dia {card.dia_vencimento}
                  </strong>
                </div>
                {card.limite && (
                  <div className="col-span-2 pt-1 border-t border-[#E2E8F0] dark:border-slate-700 flex justify-between">
                    <span className="text-[#64748B] text-[10px]">Limite Total:</span>
                    <strong className="tabular-nums text-[#17212F] dark:text-slate-300">
                      {formatCurrency(card.limite)}
                    </strong>
                  </div>
                )}
              </div>

              <div className="mt-2.5 pt-2 flex items-center justify-between text-xs text-[#64748B]">
                <span>Faturas futuras a vencer:</span>
                <strong className="tabular-nums font-bold text-[#1677E8] dark:text-white">
                  {formatCurrency(totalAtivo)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-slate-800 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <h3 className="font-bold text-base text-[#123B67] dark:text-white">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                  Nome do Cartão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Ultravioleta, Itaú Click..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                  Apelido Curto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roxinho, Cartão Preto..."
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                    Dia Fechamento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={diaFechamento}
                    onChange={(e) => setDiaFechamento(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                  Limite de Crédito (R$) Opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15000"
                  value={limiteInput}
                  onChange={(e) => setLimiteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B67] dark:text-slate-300 mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <span className="text-xs font-mono text-[#64748B] dark:text-slate-400">{cor}</span>
                </div>
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
