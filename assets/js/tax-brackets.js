// Singapore Resident Individual Income Tax Brackets
// Source reference: https://www.iras.gov.sg/ (verify latest rates manually)
// Retrieval date (developer to update when verifying): 2025-11-16
// Each bracket: limit (upper inclusive boundary except last), prevLimit (previous upper), rate (decimal)

/** @typedef {{limit:number|null, prevLimit:number, rate:number}} TaxBracket */

/** @type {TaxBracket[]} */
export const RESIDENT_TAX_BRACKETS = [
  { limit: 20000, prevLimit: 0, rate: 0.00 },
  { limit: 30000, prevLimit: 20000, rate: 0.02 },
  { limit: 40000, prevLimit: 30000, rate: 0.035 },
  { limit: 80000, prevLimit: 40000, rate: 0.07 },
  { limit: 120000, prevLimit: 80000, rate: 0.115 },
  { limit: 160000, prevLimit: 120000, rate: 0.15 },
  { limit: 200000, prevLimit: 160000, rate: 0.18 },
  { limit: 240000, prevLimit: 200000, rate: 0.19 },
  { limit: 280000, prevLimit: 240000, rate: 0.195 },
  { limit: 320000, prevLimit: 280000, rate: 0.20 },
  // Extended high-income bands (per user request):
  // First $320,000 cumulative tax: 44,550
  // Next $180,000 at 22% (to $500,000) tax on portion: 39,600 (cumulative 84,150)
  { limit: 500000, prevLimit: 320000, rate: 0.22 },
  // Next $500,000 at 23% (to $1,000,000) tax on portion: 115,000 (cumulative 199,150)
  { limit: 1000000, prevLimit: 500000, rate: 0.23 },
  // In excess of $1,000,000 at 24%
  { limit: null, prevLimit: 1000000, rate: 0.24 } // Open-ended
];
