import React from 'react';
import {
  TrendingUp,
  FileText,
  Users,
  CreditCard,
  Settings,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SubTabMais } from '../../types';
import { ForecastView } from '../forecast/ForecastView';
import { ReportsView } from '../reports/ReportsView';
import { PeopleView } from '../people/PeopleView';
import { CardsManageView } from '../cards/CardsManageView';
import { SettingsView } from '../settings/SettingsView';

export const MoreHubView: React.FC = () => {
  const { activeSubTabMais, setActiveSubTabMais } = useFinance();

  const subTabs: { id: SubTabMais; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'previsao', label: 'Previsão 12M', icon: TrendingUp },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'responsaveis', label: 'Pessoas', icon: Users },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
    { id: 'configuracoes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Sub-tab segment selector */}
      <div className="flex items-center gap-1 p-1 bg-[#E8F2FF]/70 dark:bg-slate-800 rounded-2xl overflow-x-auto no-scrollbar border border-[#E2E8F0] dark:border-slate-700">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTabMais === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTabMais(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-[#1677E8] shadow-xs'
                  : 'text-[#64748B] hover:text-[#123B67] dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render active subview */}
      <div>
        {activeSubTabMais === 'previsao' && <ForecastView />}
        {activeSubTabMais === 'relatorios' && <ReportsView />}
        {activeSubTabMais === 'responsaveis' && <PeopleView />}
        {activeSubTabMais === 'cartoes' && <CardsManageView />}
        {activeSubTabMais === 'configuracoes' && <SettingsView />}
      </div>
    </div>
  );
};
