import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  Download,
  Upload,
  RefreshCw,
  Key,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Globe,
  FileCode,
  CheckCircle2,
  AlertCircle,
  CloudCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { exportBackupJSON, importBackupJSON } from '../../services/storage';
import {
  SUPABASE_SQL_SCHEMA,
  isSupabaseConfigured,
  getSavedSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection,
} from '../../services/supabase';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const SettingsView: React.FC = () => {
  const {
    configuracoes,
    atualizarConfiguracoes,
    resetarDados,
    restaurarBackup,
    syncStatus,
    lastSyncTime,
    sincronizarComNuvem,
  } = useFinance();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [chavePix, setChavePix] = useState(configuracoes.chavePix || '');
  const [donoNome, setDonoNome] = useState(configuracoes.donoNome || 'Renato');
  const [copiouSQL, setCopiouSQL] = useState(false);
  const [salvouConfig, setSalvouConfig] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Supabase connection configuration state
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);

  useEffect(() => {
    const config = getSavedSupabaseConfig();
    if (config) {
      setCustomUrl(config.url);
      setCustomKey(config.anonKey);
    }
  }, []);

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    atualizarConfiguracoes({
      chavePix: chavePix.trim(),
      donoNome: donoNome.trim(),
    });
    setSalvouConfig(true);
    setTimeout(() => setSalvouConfig(false), 2000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      saveCustomSupabaseConfig(null);
      setTestResult({ success: true, message: 'Configurações de nuvem removidas. Modo local ativo.' });
    } else {
      saveCustomSupabaseConfig({
        url: customUrl.trim(),
        anonKey: customKey.trim(),
      });
      setTestResult({ success: true, message: 'Credenciais salvas com sucesso!' });
    }
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const result = await testSupabaseConnection(
      customUrl && customKey ? { url: customUrl.trim(), anonKey: customKey.trim() } : undefined
    );
    setTestResult(result);
    setTestingConnection(false);
  };

  const handleManualSync = async () => {
    setSyncingCloud(true);
    await sincronizarComNuvem();
    setSyncingCloud(false);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiouSQL(true);
    setTimeout(() => setCopiouSQL(false), 2500);
  };

  const handleDownloadMigration = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '20261024000000_init_meu_controle_financeiro.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-controle-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        restaurarBackup(parsed);
        alert('Backup importado com sucesso!');
      } catch {
        alert('Arquivo de backup inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja restaurar os dados de exemplo do sistema?')) {
      resetarDados();
      alert('Dados restaurados com sucesso!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dados Pessoais & PIX */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-sm text-[#123B67] dark:text-white flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-[#1677E8]" />
          Informações de Cobrança & PIX
        </h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
          A chave PIX cadastrada é incluída automaticamente nos relatórios compartilhados pelo WhatsApp.
        </p>

        <form onSubmit={handleSaveConfigs} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Chave PIX Padrão
            </label>
            <input
              type="text"
              placeholder="Ex: renatosilvambio@gmail.com, CPF ou telefone"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
              Nome do Titular da Conta
            </label>
            <input
              type="text"
              placeholder="Ex: Renato"
              value={donoNome}
              onChange={(e) => setDonoNome(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
            />
          </div>

          <div className="pt-1 flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
            >
              {salvouConfig ? 'Salvo com Sucesso!' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Supabase PostgreSQL Backend & Migrations Integration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#123B67] dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#1677E8]" />
              Backend Supabase PostgreSQL & Migrations
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Banco relacional com Row Level Security (RLS) e sincronização em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                isSupabaseConfigured()
                  ? 'bg-[#E8F8F0] text-[#16A765] border border-[#BBEBD0]'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured() ? 'bg-[#16A765]' : 'bg-slate-400'}`} />
              {isSupabaseConfigured() ? 'Supabase Conectado (Uso Pessoal)' : 'Modo Offline (Local)'}
            </span>
          </div>
        </div>

        {/* Personal Sync Bar */}
        <div className="p-3.5 bg-[#F4F7FB] dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[#64748B] block text-[11px] font-semibold">Status de Armazenamento:</span>
            <strong className="text-[#123B67] dark:text-white text-sm flex items-center gap-1.5 mt-0.5">
              <CloudCheck className="w-4 h-4 text-[#16A765]" />
              Uso Pessoal Exclusivo — Sincronização Direta
            </strong>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Sem necessidade de login ou senha. Seus lançamentos sincronizam em tempo real entre todos os seus dispositivos.
            </p>
            {lastSyncTime && (
              <span className="text-[10px] text-[#16A765] font-semibold block mt-1">
                Última sincronização com Supabase: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={syncingCloud}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
              {syncingCloud ? 'Sincronizando...' : 'Sincronizar Agora'}
            </button>
          </div>
        </div>

        {/* Supabase Migration Files and SQL Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#123B67] dark:text-white">
              <FileCode className="w-4 h-4 text-[#1677E8]" />
              <span>Arquivo de Migração PostgreSQL (RLS + Tabelas)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySQL}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#E2E8F0] text-[#1677E8] hover:bg-[#E8F2FF] font-bold text-xs transition cursor-pointer"
              >
                {copiouSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-[#1677E8]" />}
                {copiouSQL ? 'Copiado!' : 'Copiar SQL'}
              </button>

              <button
                onClick={handleDownloadMigration}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1677E8] hover:bg-[#1265c7] text-white font-bold text-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar .sql
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
            A migração completa está salva no repositório em <code>supabase/migrations/20261024000000_init_meu_controle_financeiro.sql</code>. Ela cria as 8 tabelas relacionais com triggers, índices e políticas de Row Level Security (RLS).
          </p>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-300 dark:border-slate-700 font-mono text-xs font-semibold text-[#123B67] dark:text-blue-200 overflow-x-auto max-h-36 shadow-inner">
            <code>
              {SUPABASE_SQL_SCHEMA.split('\n').slice(0, 15).join('\n')}
              {'\n-- ... [8 tabelas relacionais + Índices + RLS + Triggers + Realtime]'}
            </code>
          </div>
        </div>

        {/* Credentials Form (Optional dynamic override) */}
        <form onSubmit={handleSaveSupabaseConfig} className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[#123B67] dark:text-white">
            <Globe className="w-4 h-4 text-[#1677E8]" />
            <span>Configuração de Conexão Supabase</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#123B67] dark:text-slate-200 mb-1.5">
                Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold font-mono text-[#17212F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#1677E8] focus:ring-2 focus:ring-[#1677E8]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#1677E8] p-1 rounded-md transition cursor-pointer"
                  title={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                testResult.success
                  ? 'bg-[#E8F8F0] border-[#BBEBD0] text-[#16A765]'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:bg-[#E8F2FF] text-[#123B67] dark:text-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-[#1677E8]' : ''}`} />
              {testingConnection ? 'Testando...' : 'Testar Conexão'}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Salvar Credenciais
            </button>
          </div>
        </form>
      </div>

      {/* PWA Mobile App Installation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-sm text-[#123B67] dark:text-white flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4 text-[#1677E8]" />
          Instalar Aplicativo no Celular (PWA)
        </h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mb-3">
          Utilize o app em tela cheia como um aplicativo nativo no seu iPhone ou Android.
        </p>

        {isInstalled ? (
          <div className="p-3 bg-[#E8F8F0] dark:bg-emerald-950/40 rounded-xl text-xs text-[#16A765] dark:text-emerald-300 flex items-center gap-2 font-medium border border-[#BBEBD0]">
            <ShieldCheck className="w-4 h-4 text-[#16A765]" />
            Aplicativo já está instalado no seu dispositivo!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isInstallable && (
              <button
                onClick={install}
                className="px-4 py-2.5 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
              >
                Instalar no Android / Computador
              </button>
            )}

            <button
              onClick={() => setShowIOSModal(true)}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-[#123B67] dark:text-slate-300 hover:bg-[#E8F2FF] dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Como Instalar no iPhone (iOS Safari)
            </button>
          </div>
        )}
      </div>

      {/* Backup, Import and Reset */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-[#123B67] dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-[#1677E8]" />
          Backup e Restauração de Dados
        </h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400">
          Exporte seus dados em arquivo JSON para manter cópia de segurança ou migrar para outro aparelho.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B67] hover:bg-[#0e2f52] text-white text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Backup JSON
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 hover:bg-[#E8F2FF] dark:hover:bg-slate-800 text-[#123B67] dark:text-slate-300 text-xs font-bold transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Restaurar de Arquivo JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Dados de Exemplo
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-5 border border-[#E2E8F0] dark:border-slate-800">
            <h3 className="font-bold text-base text-[#123B67] dark:text-white mb-2">
              Como Instalar no iPhone / iPad
            </h3>
            <ol className="text-xs text-[#64748B] dark:text-slate-300 space-y-2 list-decimal list-inside mb-4">
              <li>Abra este site no navegador <strong>Safari</strong>.</li>
              <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima na barra inferior).</li>
              <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1677E8] hover:bg-[#1265c7] text-white font-bold text-xs"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
