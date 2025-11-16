import { RESIDENT_TAX_BRACKETS } from './tax-brackets.js';

/**
 * calculateProgressiveTax
 * Pure function computing total tax payable given income and predefined brackets.
 * @param {number} income Annual taxable income (SGD)
 * @param {import('./tax-brackets.js').TaxBracket[]=} brackets Optional custom brackets
 * @returns {number} Total tax payable (SGD)
 */
export function calculateProgressiveTax(income, brackets = RESIDENT_TAX_BRACKETS) {
  if (!Number.isFinite(income) || income <= 0) return 0;
  let tax = 0;
  for (const b of brackets) {
    const upper = b.limit ?? income; // if null, extends beyond
    const slice = Math.max(0, Math.min(income, upper) - b.prevLimit);
    if (slice > 0) tax += slice * b.rate;
    if (b.limit === null || income <= upper) break; // stop once income within bracket
  }
  return tax;
}

/**
 * computeBracketSlices
 * Returns array with tax computed per bracket slice for given income.
 * @param {number} income
 * @param {import('./tax-brackets.js').TaxBracket[]=} brackets
 * @returns {{band:string, rate:number, slice:number, tax:number}[]} breakdown
 */
export function computeBracketSlices(income, brackets = RESIDENT_TAX_BRACKETS) {
  const rows = [];
  if (!Number.isFinite(income) || income <= 0) {
    for (const b of brackets) {
      rows.push({ band: formatBand(b), rate: b.rate, slice: 0, tax: 0 });
    }
    return rows;
  }
  for (const b of brackets) {
    const upper = b.limit ?? income;
    const slice = Math.max(0, Math.min(income, upper) - b.prevLimit);
    const taxedSlice = slice * b.rate;
    rows.push({ band: formatBand(b), rate: b.rate, slice, tax: taxedSlice });
    if (b.limit === null || income <= upper) break;
  }
  return rows;
}

function formatBand(b) {
  if (b.limit === null) return `> ${numberFmt(b.prevLimit)}`;
  return `${numberFmt(b.prevLimit)} - ${numberFmt(b.limit)}`;
}

function numberFmt(n) {
  return n.toLocaleString('en-SG');
}
