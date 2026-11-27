export const BUDGET_WARNING_PREFIX = 'El menú supera tu presupuesto semanal';

export function toCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function budgetWarningText(excess: number): string {
  return `${BUDGET_WARNING_PREFIX} en aproximadamente ${excess.toFixed(2)}€`;
}
