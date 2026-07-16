
// config/checkoutConfig.ts
// config/checkoutConfig.ts
// config/checkoutConfig.ts

export const US_TAX_CONFIG = {
  // 🏢 Your business home state
  registeredState: "LA", 
  
  // 📊 Louisiana's state base sales tax rate (5%)
  taxRate: 0.05, 
};

export const SHIPPING_CONFIG = {
  // 🚚 Free shipping threshold (Set to $50.00 and above!)
  freeShippingThreshold: 50.00, 
  
  // 📦 Standard shipping rate for continental US orders under $50
  standardRate: 5.99, 
  
  // 🏔️ Special rate for non-continental US destinations (AK, HI, PR)
  nonContinentalRate: 14.99, 
};