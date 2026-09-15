import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../assets/js/tax-calc.js';

test('resident tax matches published cumulative bracket totals', () => {
  for (const [income, tax] of [[0,0],[20000,0],[30000,200],[40000,550],[80000,3350],[120000,7950],[160000,13950],[200000,21150],[240000,28750],[280000,36550],[320000,44550],[500000,84150],[1000000,199150],[2000000,439150]]) {
    assert.equal(engine.calculateProgressiveTax(income), tax);
  }
});
const estimate = (input = {}) => {
  assert.equal(typeof engine.estimateTax, 'function', 'salary-to-tax estimation must be implemented');
  return engine.estimateTax(input);
};
test('monthly salary subtracts employee CPF and earned income relief', () => {
  const r = estimate({ salary: 5000 });
  assert.equal(r.grossIncome, 60000);
  assert.equal(r.cpf, 12000);
  assert.equal(r.chargeableIncome, 47000);
  assert.equal(r.tax, 1040);
});
test('annual and monthly salary give the same estimate', () => {
  assert.equal(estimate({salary:60000, period:'annual'}).tax, 1040);
});
test('CPF uses income-year OW ceiling and caps bonus at remaining AW ceiling', () => {
  assert.equal(estimate({salary:10000, year:2026}).cpf,17760);
  assert.equal(estimate({salary:10000, year:2027}).cpf,19200);
  assert.equal(estimate({salary:10000, bonus:50000, year:2026}).cpf,20400);
});
test('CPF senior rates change by income year', () => {
  assert.equal(estimate({salary:5000,age:58,year:2026}).cpf,10200);
  assert.equal(estimate({salary:5000,age:58,year:2027}).cpf,10800);
});
test('low monthly wages use graduated employee contributions', () => {
  assert.equal(estimate({salary:500}).cpf,0);
  assert.equal(estimate({salary:600}).cpf,720);
});
test('resident foreigners receive earned income relief without CPF', () => {
  const r=estimate({salary:5000,citizenship:'foreigner'});
  assert.equal(r.cpf,0); assert.equal(r.tax,1880);
});
test('actual CPF override supports irregular employment and graduated PR rates', () => {
  assert.equal(estimate({salary:5000,cpfMode:'manual',cpfActual:3000}).chargeableIncome,56000);
});
test('earned relief age thresholds differ from CPF age bands', () => {
  assert.equal(estimate({salary:5000,age:55}).earnedRelief,6000);
  assert.equal(estimate({salary:5000,age:60,disability:true}).earnedRelief,12000);
  assert.equal(estimate({salary:50}).earnedRelief,600);
});
test('donations remain outside the 80000 relief cap', () => {
  const r=estimate({salary:200000,period:'annual',otherReliefs:100000,donations:1000});
  assert.equal(r.reliefs,80000); assert.equal(r.donationDeduction,2500);
  assert.equal(r.chargeableIncome,117500); assert.ok(r.warnings.length);
});
test('SRS and CPF top-ups have separate statutory limits', () => {
  const r=estimate({salary:20000,srs:50000,topupSelf:9000,topupFamily:9000});
  assert.equal(r.srsRelief,15300); assert.equal(r.topupRelief,16000);
  assert.equal(estimate({salary:20000,citizenship:'foreigner',srs:50000}).srsRelief,35700);
});
test('net trade and rental income are included, expenses cannot offset other sources', () => {
  const r=estimate({salary:1000,trade:50000,rental:12000,expenses:50000,cpfMode:'none'});
  assert.equal(r.assessableIncome,62000); assert.equal(r.earnedRelief,1000);
});
test('PTR reduces tax after reliefs and never below zero', () => {
  const r=estimate({salary:5000,ptr:2000});
  assert.equal(r.tax,0); assert.equal(r.ptrUsed,1040); assert.equal(r.ptrRemaining,960);
});
test('YA 2026 and projected YA 2027 do not inherit YA 2025 rebate', () => {
  assert.equal(estimate({salary:5000,year:2026}).tax,1040);
  assert.equal(estimate({salary:5000,year:2027}).tax,1040);
});
test('negative, nonfinite and malformed inputs cannot produce NaN or negative tax', () => {
  const r=estimate({salary:-5,bonus:Infinity,srs:NaN,trade:'bad'});
  assert.equal(r.tax,0); assert.equal(r.grossIncome,0);
});
