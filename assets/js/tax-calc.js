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
  return Math.round((tax + Number.EPSILON) * 100) / 100;
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

export const DEFAULT_INPUT = Object.freeze({
  salary: 5000, period: 'monthly', bonus: 0, year: 2026, age: 30,
  citizenship: 'citizen', cpfMode: 'auto', cpfActual: 0, disability: false,
  benefits: 0, trade: 0, rental: 0, otherIncome: 0, expenses: 0, donations: 0,
  srs: 0, topupSelf: 0, topupFamily: 0, spouseRelief: 0, childRelief: 0,
  parentRelief: 0, nsRelief: 0, otherReliefs: 0, ptr: 0
});
const money = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(Number(value), 100000000)) : 0;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

/** Whitelist persisted/user input; unknown years never silently select tax rules. */
export function normalizeInput(input = {}) {
  const result = { ...DEFAULT_INPUT };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'number' && Object.hasOwn(input,key)) result[key] = money(input[key]);
  }
  result.year = [2026,2027].includes(Number(input.year)) ? Number(input.year) : 2026;
  result.age = Math.max(18, Math.min(100, Math.floor(result.age)));
  result.period = input.period === 'annual' ? 'annual' : 'monthly';
  result.citizenship = ['citizen','pr','foreigner'].includes(input.citizenship) ? input.citizenship : 'citizen';
  result.cpfMode = ['auto','manual','none'].includes(input.cpfMode) ? input.cpfMode : 'auto';
  result.disability = input.disability === true;
  return result;
}

/** Estimate for Singapore tax residents. CPF assumes constant monthly pay and age band.
 * Complex payroll, new PRs and midyear age changes should use actual CPF relief.
 * Advanced relief amounts are the user's eligible allocated claim, not eligibility decisions.
 */
export function estimateTax(input = {}) {
  const s = normalizeInput(input);
  const warnings = [];
  const annualSalary = s.period === 'annual' ? s.salary : s.salary * 12;
  const monthlySalary = annualSalary / 12;
  const employment = annualSalary + s.bonus + s.benefits;
  const grossIncome = employment + s.trade + s.rental + s.otherIncome;
  const expenses = Math.min(employment, s.expenses);
  const assessableIncome = Math.max(0,grossIncome - expenses);
  const owCeiling = s.year === 2026 ? 7400 : 8000;
  const rate = s.age <= 55 ? .2 : s.age <= 60 ? (s.year === 2026 ? .17 : .18) : s.age <= 65 ? (s.year === 2026 ? .115 : .125) : s.age <= 70 ? .075 : .05;
  const ordinaryWages = Math.min(monthlySalary,owCeiling);
  const bonusWages = Math.min(s.bonus, Math.max(0,102000 - ordinaryWages * 12));
  const monthlyCpf = monthlySalary <= 500 ? 0 : monthlySalary <= 750 ? (monthlySalary - 500) * rate * 3 : ordinaryWages * rate;
  let cpf = Math.floor(monthlyCpf + 1e-8) * 12 + Math.floor(bonusWages * rate + 1e-8);
  if (s.cpfMode === 'manual') cpf = Math.min(s.cpfActual,annualSalary + s.bonus);
  if (s.cpfMode === 'none' || s.citizenship === 'foreigner') cpf = 0;
  const earnedLimit = s.age < 55 ? (s.disability ? 4000 : 1000) : s.age < 60 ? (s.disability ? 10000 : 6000) : (s.disability ? 12000 : 8000);
  const earnedRelief = Math.min(earnedLimit, Math.max(0,employment - expenses + s.trade));
  const srsLimit = s.citizenship === 'foreigner' ? 35700 : 15300;
  const srsRelief = Math.min(s.srs,srsLimit);
  const topupRelief = Math.min(s.topupSelf,8000) + Math.min(s.topupFamily,8000);
  const reliefItems = [
    ['Employee CPF',cpf],['Earned income relief',earnedRelief],['SRS relief',srsRelief],
    ['CPF cash top-up relief',topupRelief],['Spouse relief',s.spouseRelief],
    ['Child reliefs',s.childRelief],['Parent / caregiver reliefs',s.parentRelief],
    ['NSman reliefs',s.nsRelief],['Other eligible reliefs',s.otherReliefs]
  ];
  const totalReliefs = reliefItems.reduce((sum,[,value])=>sum+value,0);
  const reliefs = Math.min(80000,totalReliefs);
  const donationDeduction = s.donations * 2.5;
  const chargeableIncome = Math.floor(Math.max(0,assessableIncome - donationDeduction - reliefs));
  const grossTax = calculateProgressiveTax(chargeableIncome);
  const ptrUsed = Math.min(s.ptr,grossTax);
  const tax = round(grossTax - ptrUsed);
  if (totalReliefs > 80000) warnings.push('Your eligible reliefs exceed the $80,000 annual cap. Only $80,000 is deducted.');
  if (s.srs > srsLimit) warnings.push(`SRS relief is capped at $${srsLimit.toLocaleString('en-SG')}. Changes of citizenship status can affect this limit.`);
  if (s.topupSelf > 8000 || s.topupFamily > 8000) warnings.push('CPF cash top-up relief is capped at $8,000 for yourself and $8,000 for family combined, subject to eligibility.');
  if (s.expenses > employment) warnings.push('Employment expenses are limited to employment income here. Loss offsets require a separate IRAS computation.');
  if (s.cpfMode === 'manual' && s.cpfActual > annualSalary + s.bonus) warnings.push('Employee CPF relief has been limited to salary and bonus. Check your actual eligible amount.');
  if (monthlySalary <= 750 && s.bonus > 0 && s.cpfMode === 'auto' && s.citizenship !== 'foreigner') warnings.push('Low wages with bonuses can change monthly CPF thresholds. Enter actual annual employee CPF for a more accurate result.');
  if (s.year === 2027) warnings.push('YA 2027 is a projection using currently published rates. Future rebates or rule changes are not assumed.');
  const marginalRate = RESIDENT_TAX_BRACKETS.find(b => b.limit === null || chargeableIncome < b.limit)?.rate ?? .24;
  return { input:s, annualSalary, employment, grossIncome:round(grossIncome), expenses,
    assessableIncome, cpf:round(cpf), earnedRelief, srsLimit, srsRelief, topupRelief,
    reliefItems, totalReliefs, reliefs, reliefHeadroom:Math.max(0,80000-totalReliefs),
    donationDeduction, chargeableIncome, grossTax, ptrUsed, ptrRemaining:round(s.ptr-ptrUsed),
    tax, monthlyTax:tax/12, effectiveRate:grossIncome ? tax/grossIncome : 0, marginalRate,
    salaryAfterCpfAndTax:(annualSalary+s.bonus-cpf-tax)/12,
    brackets:computeBracketSlices(chargeableIncome), warnings };
}
