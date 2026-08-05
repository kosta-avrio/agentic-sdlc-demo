/**
 * Promo code validation and application for fare purchases.
 */

export interface PromoCode {
  code: string;
  /** Percentage discount, 0-100. */
  discountPercent: number;
  /** Last day the code is valid, inclusive (YYYY-MM-DD). */
  expiresOn: string;
  /** Codes marked singleUse may be redeemed once per rider. */
  singleUse: boolean;
}

const registry = new Map<string, PromoCode>();
const redemptions = new Map<string, Set<string>>(); // code -> rider ids

export function registerPromo(promo: PromoCode): void {
  registry.set(promo.code, promo);
}

export function clearPromos(): void {
  registry.clear();
  redemptions.clear();
}

export function findPromo(code: string): PromoCode | undefined {
  return registry.get(code);
}

/**
 * Validates a promo code for a rider on a given date.
 * Returns the promo if valid, otherwise undefined.
 */
export function validatePromo(
  code: string,
  riderId: string,
  onDate: Date = new Date(),
): PromoCode | undefined {
  const promo = findPromo(code);
  if (!promo) return undefined;

  const expiry = new Date(promo.expiresOn);
  if (onDate >= expiry) return undefined;

  if (promo.singleUse && redemptions.get(promo.code)?.has(riderId)) {
    return undefined;
  }
  return promo;
}

/**
 * Applies a promo code to a fare amount, recording the redemption.
 * Returns the discounted fare, or the original fare if the code is invalid.
 */
export function applyPromo(
  fare: number,
  code: string,
  riderId: string,
  onDate: Date = new Date(),
): number {
  const promo = validatePromo(code, riderId, onDate);
  if (!promo) return fare;

  const discounted = fare * (1 - promo.discountPercent / 100);

  if (promo.singleUse) {
    if (!redemptions.has(promo.code)) {
      redemptions.set(promo.code, new Set());
    }
  }

  return Math.round(discounted * 100) / 100;
}
