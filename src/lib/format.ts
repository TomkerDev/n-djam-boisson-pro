import { CASH_DENOMINATIONS } from "@/lib/constants";

const fcfaFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

/** Formate un montant en devise : 66000 -> "66 000 FCFA". */
export function formatFcfa(amount: number): string {
  return `${fcfaFormatter.format(amount)} FCFA`;
}

/** Formate un montant sans la devise : 66000 -> "66 000". */
export function formatNumber(amount: number): string {
  return fcfaFormatter.format(amount);
}

/** Calcule le rendu de la monnaie en espèces pour un montant reçu. */
export function computeCashChange(
  received: number,
  expected: number,
): { change: number; breakdown: { denomination: number; count: number }[] } {
  const change = Math.max(received - expected, 0);
  const breakdown: { denomination: number; count: number }[] = [];

  let rest = change;
  for (const denomination of CASH_DENOMINATIONS) {
    const count = Math.floor(rest / denomination);
    if (count > 0) {
      breakdown.push({ denomination, count });
      rest -= count * denomination;
    }
  }

  return { change, breakdown };
}