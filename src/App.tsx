import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { CreditCardView } from './components/card/CreditCardView';
import { ReceivablesView } from './components/receivables/ReceivablesView';
import { PayablesView } from './components/payables/PayablesView';
import { MoreHubView } from './components/more/MoreHubView';
import { QuickActionModal } from './components/modals/QuickActionModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { ReceivableModal } from './components/modals/ReceivableModal';
import { PayableModal } from './components/modals/PayableModal';
import { SettleShareModal } from './components/modals/SettleShareModal';

const MainLayout: React.FC = () => {
  const { activeTab, responsaveis, cartoes } = useFinance();

  // Quick Action Modal states
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const handleSelectQuickAction = (action: 'despesa' | 'receber' | 'pagar' | 'quitar') => {
    if (action === 'despesa') setIsExpenseModalOpen(true);
    if (action === 'receber') setIsReceivableModalOpen(true);
    if (action === 'pagar') setIsPayableModalOpen(true);
    if (action === 'quitar') setIsSettleModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-[#17212F]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'inicio' && <DashboardView />}
        {activeTab === 'cartao' && <CreditCardView />}
        {activeTab === 'receber' && <ReceivablesView />}
        {activeTab === 'contas' && <PayablesView />}
        {activeTab === 'mais' && <MoreHubView />}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNavigation onOpenQuickAction={() => setIsQuickActionOpen(true)} />

      {/* Quick Action FAB Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleSelectQuickAction}
      />

      {/* Sub-modals triggered from FAB */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <ReceivableModal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
      />

      <PayableModal
        isOpen={isPayableModalOpen}
        onClose={() => setIsPayableModalOpen(false)}
      />

      {isSettleModalOpen && (
        <SettleShareModal
          isOpen={true}
          onClose={() => setIsSettleModalOpen(false)}
          responsavelId={responsaveis.find((r) => !r.is_owner)?.id || responsaveis[0]?.id || ''}
          cartaoId={cartoes[0]?.id || ''}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
