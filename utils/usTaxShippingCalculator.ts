import { US_TAX_CONFIG, SHIPPING_CONFIG } from "@/config/checkoutConfig";

/**
 * Calculates US Sales Tax.
 * Tax is ONLY charged (at 5%) if the shipping state is Louisiana ("LA").
 */
export const calculateUSTax = (subtotal: number, shippingState: string): number => {
  const normalizedState = shippingState.trim().toUpperCase();
  const registeredState = US_TAX_CONFIG.registeredState.toUpperCase();

  if (normalizedState === registeredState) {
    return Number((subtotal * US_TAX_CONFIG.taxRate).toFixed(2));
  }

  return 0.00;
};

/**
 * Calculates Shipping Cost based on the order subtotal and destination.
 * Note: Non-continental destinations (AK, HI, PR) bypass the free shipping threshold.
 */
export const calculateUSShipping = (subtotal: number, shippingState: string): number => {
  const normalizedState = shippingState.trim().toUpperCase();

  // 1. ALWAYS charge premium shipping for AK, HI, PR (bypasses free shipping checks)
  if (["AK", "HI", "PR"].includes(normalizedState)) {
    return SHIPPING_CONFIG.nonContinentalRate;
  }

  // 2. Otherwise, check for Free Shipping threshold ($50.00+) for continental states
  if (subtotal >= SHIPPING_CONFIG.freeShippingThreshold) {
    return 0.00;
  }

  // 3. Return standard continental flat-rate shipping ($5.99)
  return SHIPPING_CONFIG.standardRate;
};