/**
 * Currency utilities with exact cent precision (avoids floating-point errors).
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrency(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  // Strip non-digits and separators
  const clean = input
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Splits a total monetary amount across N installments with cent precision.
 * Guarantees that the sum of all installments strictly equals the total,
 * with any residual cents adjusted onto the final installment.
 */
export function splitInstallments(totalAmount: number, count: number): number[] {
  if (count <= 1) {
    return [Math.round(totalAmount * 100) / 100];
  }

  const totalCents = toCents(totalAmount);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - (baseCents * count);

  const installments: number[] = [];
  for (let i = 0; i < count; i++) {
    // Add residual cents to the last installment
    if (i === count - 1) {
      installments.push(fromCents(baseCents + remainderCents));
    } else {
      installments.push(fromCents(baseCents));
    }
  }

  return installments;
}
