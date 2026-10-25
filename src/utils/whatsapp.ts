import { formatCurrency } from './currency';
import { formatMonthYear } from './dateUtils';
import { ParcelaCartao, DespesaCartao } from '../types';

export interface ReportItem {
  descricao: string;
  parcelaAtual: number;
  totalParcelas: number;
  valor: number;
  paga: boolean;
}

/**
 * Builds clean WhatsApp formatted markdown text for a person's invoice.
 */
export function buildWhatsAppReportText(params: {
  nomeResponsavel: string;
  mesFatura: string;
  nomeCartao?: string;
  itens: ReportItem[];
  subtotal: number;
  totalPago: number;
  totalPendente: number;
  chavePix?: string;
}): string {
  const {
    nomeResponsavel,
    mesFatura,
    nomeCartao,
    itens,
    subtotal,
    totalPago,
    totalPendente,
    chavePix,
  } = params;

  const mesFormatado = formatMonthYear(mesFatura).toUpperCase();

  const lines: string[] = [
    `🧾 *FATURA — ${mesFormatado}*`,
    `👤 *Responsável:* ${nomeResponsavel}`,
  ];

  if (nomeCartao) {
    lines.push(`💳 *Cartão:* ${nomeCartao}`);
  }

  lines.push('');
  lines.push('📋 *Detalhamento das compras:*');

  if (itens.length === 0) {
    lines.push('_Nenhum lançamento no período._');
  } else {
    itens.forEach((it) => {
      const statusIcon = it.paga ? '✅' : '⏳';
      const parcelaText = it.totalParcelas > 1 ? ` (${it.parcelaAtual}/${it.totalParcelas})` : '';
      lines.push(`${statusIcon} *${it.descricao}*${parcelaText}: ${formatCurrency(it.valor)}`);
    });
  }

  lines.push('');
  lines.push(`💰 *SUBTOTAL:* ${formatCurrency(subtotal)}`);
  
  if (totalPago > 0) {
    lines.push(`✅ *Valor Pago:* ${formatCurrency(totalPago)}`);
    lines.push(`⏳ *Saldo a Pagar:* ${formatCurrency(totalPendente)}`);
  } else {
    lines.push(`⏳ *Total a Pagar:* ${formatCurrency(totalPendente)}`);
  }

  if (chavePix && totalPendente > 0) {
    lines.push('');
    lines.push(`🔑 *Chave PIX para pagamento:*`);
    lines.push(`\`${chavePix}\``);
  }

  lines.push('');
  lines.push('_Enviado via Meu Controle Financeiro_');

  return lines.join('\n');
}

/**
 * Opens native share or WhatsApp Web / App with pre-filled message.
 */
export async function shareViaWhatsApp(
  text: string,
  telefone?: string
): Promise<{ method: 'share' | 'whatsapp' | 'copied' }> {
  // Format phone number (remove non-digits, ensure country code 55 if Brazilian standard 10 or 11 digits)
  let cleanPhone = (telefone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = '55' + cleanPhone;
  }

  // Construct wa.me URL
  const encodedText = encodeURIComponent(text);
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
    : `https://wa.me/?text=${encodedText}`;

  // Try native Web Share API first if supported and user hasn't specified direct phone
  if (!cleanPhone && typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'Fatura do Cartão',
        text: text,
      });
      return { method: 'share' };
    } catch (e: unknown) {
      // User cancelled share or browser fallback, fall through to URL
      if (e instanceof Error && e.name === 'AbortError') {
        return { method: 'share' };
      }
    }
  }

  // Fallback to wa.me link
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { method: 'whatsapp' };
}
