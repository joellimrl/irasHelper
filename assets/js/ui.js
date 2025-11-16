import { RESIDENT_TAX_BRACKETS } from './tax-brackets.js';
import { calculateProgressiveTax, computeBracketSlices } from './tax-calc.js';

const cfg = { MAX_INCOME: 2_000_000, STEP: 1000, LOCALE: 'en-SG', CURRENCY: 'SGD' }; // Updated max to 2M per new bands

// DOM references
const incomeRange = document.getElementById('incomeRange');
const incomeNumber = document.getElementById('incomeNumber');
const taxValueEl = document.getElementById('taxValue');
const effRateEl = document.getElementById('effectiveRate');
const breakdownBody = document.getElementById('bracketBreakdownBody');
const alertEl = document.getElementById('inputAlert');

function clampIncome(val) {
  if (!Number.isFinite(val)) return 0;
  return Math.min(Math.max(0, val), cfg.MAX_INCOME);
}

function formatCurrency(n) {
  return n.toLocaleString(cfg.LOCALE, { style: 'currency', currency: cfg.CURRENCY, maximumFractionDigits: 2 });
}

function formatPercent(n) {
  return (n * 100).toFixed(2) + '%';
}

function renderBreakdown(income) {
  const rows = computeBracketSlices(income, RESIDENT_TAX_BRACKETS);
  breakdownBody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    const sliceDisplay = r.slice === 0 ? '—' : r.slice.toLocaleString('en-SG');
    const taxDisplay = r.slice === 0 ? '—' : formatCurrency(r.tax);
    tr.innerHTML = `<td>${r.band}</td><td>${(r.rate*100).toFixed(1)}%</td><td>${sliceDisplay}</td><td>${taxDisplay}</td>`;
    breakdownBody.appendChild(tr);
  }
}

function update(incomingValue, fromControl) {
  let num = clampIncome(Number(incomingValue));
  const clamped = num !== Number(incomingValue);
  incomeRange.value = String(num);
  incomeNumber.value = String(num);

  const tax = calculateProgressiveTax(num, RESIDENT_TAX_BRACKETS);
  const effective = num > 0 ? tax / num : 0;
  taxValueEl.textContent = formatCurrency(tax);
  effRateEl.textContent = formatPercent(effective);
  renderBreakdown(num);

  if (clamped) {
    alertEl.textContent = 'Value adjusted to allowed range.';
  } else if (fromControl === 'number' && !Number.isFinite(Number(incomingValue))) {
    alertEl.textContent = 'Invalid number; reset to 0.';
  } else {
    alertEl.textContent = '';
  }
}

incomeRange.addEventListener('input', (e) => update(e.target.value, 'range'));
// Change event only fires on blur; use input for real-time updates while typing
incomeNumber.addEventListener('input', (e) => update(e.target.value, 'number'));

// Initial render
update(incomeRange.value, 'init');
