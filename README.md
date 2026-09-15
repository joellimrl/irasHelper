# IRAS Helper

A private, browser-based Singapore personal income tax workspace. Start with a salary estimate, add relevant details, understand the breakdown, and compare scenarios.

## Run locally

Requires Python 3 to serve the files. No build step or runtime packages.

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

Open http://127.0.0.1:4175. Serve over HTTP; ES modules generally do not load through `file://`. The project can also be hosted unchanged on GitHub Pages or any static host.

## Features

- Monthly/annual gross salary, annual bonus, slider and salary presets.
- Quick and detailed views share one calculation; collapsing detail sections retains their values.
- YA 2026 (2025 income) and a clearly labelled YA 2027 planning projection (2026 income).
- Tax-resident citizen, PR and foreigner profiles; age and disability-related earned income relief.
- Full-rate employee CPF estimate, actual CPF override, or no CPF.
- Taxable benefits, net trade/freelance income, net rental income and other taxable income.
- Allowable employment expenses and qualifying donations, separated from personal reliefs.
- SRS, eligible CPF cash top-ups, allocated family/NSman/other reliefs, and unused Parenthood Tax Rebate.
- Income-to-tax reconciliation, per-bracket calculation, personal relief cap and explicit assumption notices.
- Salary scenarios, additional SRS contribution comparison, local save/restore/delete, and CSV export with inputs, assumptions and sources.
- Resident tax guide, filing checklist and official IRAS/CPF links.
- Responsive layout, keyboard focus, labels, live result announcements and reduced-motion support.

## Scope and calculation assumptions

This is an **estimate for Singapore tax residents**, not an IRAS return or eligibility determination. Business tax, GST, property tax, non-resident cases, tax credits, complex loss offsets and carry-forwards are not calculated.

Rules checked against official sources on **15 September 2026**:

| Rule | Treatment |
| --- | --- |
| Resident rates | IRAS bands effective from YA 2024 onwards, through the 24% band |
| Year selection | YA 2026 uses 2025 CPF rules; YA 2027 uses 2026 CPF rules and is a projection |
| General tax rebate | None assumed for YA 2026 or projected YA 2027; the YA 2025 rebate is not carried forward |
| Employee CPF | 12 equal monthly ordinary wages; full employee rates for the selected age band; OW ceiling $7,400 for 2025 / $8,000 for 2026; AW ceiling $102,000 less annual OW subject to CPF |
| CPF rounding | Estimated employee monthly contributions rounded down to dollars; bonus treated as one aggregate additional-wage amount |
| Low wages | Graduated employee contribution approximation for monthly wages $500–$750; low wages with bonuses prompt actual CPF entry |
| Actual CPF | Enter eligible annual **employee** CPF only; capped at salary plus bonus; foreigner profiles apply zero CPF |
| Earned income relief | Age as at 31 December, capped at taxable earned income after employment expenses; disability limits supported |
| Expenses | Employment expenses limited to employment income; trade and rental inputs are already net taxable amounts |
| Donations | 2.5× qualifying donations, outside the personal relief cap; unused deductions are not carried forward by this tool |
| SRS | $15,300 citizen/PR or $35,700 foreigner limit; status changes may require a different limit |
| CPF cash top-ups | Eligible amounts only; $8,000 self and $8,000 family combined; eligibility depends on recipient balances, relationship and matching-grant rules |
| Family/other reliefs | User-entered eligible allocation after individual/combined limits; eligibility and sharing are not automatically determined |
| Total personal relief | Limited to $80,000 per YA |
| Chargeable income | Floored to a whole dollar before applying brackets; tax displayed to cents |
| PTR | Applied after tax computation, limited to tax payable; unused balance included in export |

Automatic CPF assumes a constant age band throughout the income year. For a birthday crossing a CPF band, new PR status, irregular/part-year work, multiple employers or complex payroll, use the actual eligible employee CPF amount. Self-employed CPF/MediSave relief can be entered in other eligible reliefs after checking IRAS limits; employee CPF is not applied to trade income.

Salary comparisons retain all other inputs. An actual CPF override stays fixed while automatically estimated CPF changes with salary. “Salary after CPF & tax” subtracts total income tax from salary and bonus; it excludes other cash income, benefits, personal spending and voluntary contributions. It is not a complete cash-flow forecast. SRS comparisons show immediate estimated tax savings only, not investment returns, withdrawal tax or eligibility advice.

## Privacy

Calculations run locally without analytics, external fonts, APIs or accounts. Inputs are held in memory unless the user chooses **Save estimate**. Saving writes one versioned record to local storage; another save replaces it. Reloading starts a fresh estimate; saved inputs can be restored from Compare scenarios. Delete removes that record. Storage failures and malformed saved data do not prevent calculation. Exports are generated locally. Official links open only when selected.

## Verification

Node 20+:

```sh
npm test
```

This uses Node’s built-in test runner with no test dependencies. Cases cover official cumulative tax totals, CPF age/year ceilings, low wages, relief caps, donations, PTR and malformed values.

An optional real-browser journey is in `scripts/browser-check.mjs`. It requires an available Playwright package and Google Chrome, plus the local server:

```sh
node scripts/browser-check.mjs
```

`APP_URL` defaults to `http://127.0.0.1:4175`; `BROWSER_CHANNEL` defaults to `chrome`. When Playwright is outside this project, set `PLAYWRIGHT_PACKAGE` to its absolute `package.json` path. The script uses an isolated browser context and writes QA screenshots under `/tmp`.

## Structure

```text
index.html                   Accessible UI, calculator sections and tax guide
assets/css/styles.css        Responsive visual system and print styles
assets/js/tax-brackets.js     Published resident brackets
assets/js/tax-calc.js         Pure input normalization, CPF/relief/tax computation
assets/js/ui.js               UI state, rendering, scenarios, persistence and export
scripts/browser-check.mjs     Browser integration checks
tests/tax.test.js             Calculation regression tests
```

## Source maintenance

The app’s Tax guide links directly to [IRAS rates](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates), [IRAS reliefs](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs), and [CPF contribution rules](https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay), alongside specific sources for SRS, donations, cash top-ups and earned income relief.

When rules change, update the year-specific computation, source check date, user-facing assumptions and regression fixtures together. Do not roll prior-year rebates into later years or remove the projection label without verifying the relevant assessment year’s rules.
