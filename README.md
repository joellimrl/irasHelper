<div align="center">
  <h1>Singapore Progressive Income Tax Estimator</h1>
  <p><em>Lightweight, accessible, client‑side tool to estimate resident individual income tax (SGD).</em></p>
</div>

## Overview
This project provides an interactive income slider and numeric input to instantly estimate Singapore resident individual income tax payable using published progressive tax brackets. It is built with zero runtime dependencies (HTML, CSS, vanilla JS) and designed for deployment on GitHub Pages.

## Features
| Feature | Description |
|---------|-------------|
| Income Slider & Number Input | Dual input methods kept in sync for convenience & precision |
| Progressive Tax Calculation | Pure function implements bracketed rates | 
| Effective Tax Rate | Displays percentage of income paid as tax |
| Bracket Breakdown Table | Shows taxed slice and tax per bracket dynamically | 
| Accessibility | Keyboard operable, aria-live updates, high contrast, screen-reader helpers | 
| Dark Mode | Respects user `prefers-color-scheme` | 
| Zero Dependencies | All logic is client-side with immutable bracket data |

## Disclaimers
This tool provides **illustrative estimates only**. Always verify against the official [IRAS website](https://www.iras.gov.sg/). Bracket rates should be manually confirmed periodically. Retrieval date noted in `assets/js/tax-brackets.js`.

## Project Structure
```
project-root/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── tax-brackets.js
│       ├── tax-calc.js
│       └── ui.js
├── docs/
│   ├── transcript.md
│   └── feature/
│       └── progressive-tax-calculator.md
└── README.md
```

## Getting Started
1. Open `index.html` locally in a modern browser (no build step required).
2. Adjust the slider or type income into the number field.
3. View real-time tax payable, effective tax rate, and bracket breakdown.

## Calculation Logic
Implemented in `assets/js/tax-calc.js`:
```javascript
const tax = calculateProgressiveTax(income); // Pure, deterministic
```
Breakdown rows generated with `computeBracketSlices(income)` for transparency.

## Accessibility
* All interactive elements have associated `<label>`s.
* Results announced via `aria-live` region.
* High contrast colors & focus outlines.
* `noscript` message warns when JavaScript disabled.

## Performance
Bracket iteration is O(n) with n ≈ 11, negligible (<1ms typical). No external network calls.

## Maintenance
To update brackets:
1. Edit `RESIDENT_TAX_BRACKETS` in `tax-brackets.js`.
2. Adjust any textual ranges in `index.html` static fallback table.
3. Update retrieval date comment and optionally note change in commit message.

## Future Enhancements (Ideas)
* Add deductions / relief inputs
* Graph effective rate vs. income
* CSV export of breakdown

## Contributing
Open an issue or submit a PR. Follow semantic commit prefixes (`feat:`, `fix:`, `docs:`). Keep logic pure and UI concerns separated.

## License
MIT (or specify preferred license).

## Acknowledgements
Rates sourced from IRAS (link above). Built with guidance from internal AI rules emphasizing accessibility & performance.
