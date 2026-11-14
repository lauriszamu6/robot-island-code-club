// Card top-up rules for the adult reward wallet (amounts in integer cents).
export const TOPUP_PRESETS_CENTS = [1000, 2500, 5000] as const;
export const TOPUP_MIN_CENTS = 500;
export const TOPUP_MAX_CENTS = 20000;
export function validTopupCents(c: number): boolean {
  return Number.isInteger(c) && c >= TOPUP_MIN_CENTS && c <= TOPUP_MAX_CENTS;
}
