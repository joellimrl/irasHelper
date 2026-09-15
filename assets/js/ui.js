import { DEFAULT_INPUT, normalizeInput, estimateTax, computeBracketSlices } from './tax-calc.js';
import { RESIDENT_TAX_BRACKETS } from './tax-brackets.js';

const $ = id => document.getElementById(id);
const cash = (n,decimals=0) => `S$${n.toLocaleString('en-SG',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}`;
const percent = n => `${(n*100).toFixed(2)}%`;
const form = $('tax-form');
const STORAGE_KEY = 'iras-helper:estimate:v2';
let state = {...DEFAULT_INPUT};
let result;
let allBrackets = false;
let toastTimer;
let announcementTimer;
let saved = null;

const fields = {
  'income-fields': [['benefits','Taxable benefits / share awards'],['trade','Net taxable trade / freelance income'],['rental','Your net taxable rental income'],['otherIncome','Other taxable income']],
  'deduction-fields': [['expenses','Allowable employment expenses'],['donations','Qualifying donations (before 2.5×)']],
  'retirement-fields': [['srs','Eligible SRS contributions'],['topupSelf','Eligible CPF cash top-ups: self'],['topupFamily','Eligible CPF cash top-ups: family']],
  'relief-fields': [['spouseRelief','Eligible spouse relief'],['childRelief','Your eligible child reliefs'],['parentRelief','Your parent / caregiver reliefs'],['nsRelief','Your eligible NSman reliefs'],['otherReliefs','Other eligible personal reliefs']],
  'rebate-fields': [['ptr','Unused Parenthood Tax Rebate']]
};
for (const [container,definitions] of Object.entries(fields)) {
  for (const [name,label] of definitions) {
    const wrapper=document.createElement('label');
    wrapper.textContent=`${label} (S$, annual)`;
    const input=document.createElement('input');
    Object.assign(input,{id:name,name,type:'number',min:'0',max:'100000000',step:'any',value:'0',inputMode:'decimal'});
    wrapper.append(input); $(container).append(wrapper);
  }
}

const sources = [
  ['Resident tax rates & residency','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates'],
  ['Earned income relief','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/earned-income-relief'],
  ['All reliefs & the $80,000 cap','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs'],
  ['CPF wage ceilings','https://www.cpf.gov.sg/service/article/what-is-the-ordinary-wage-ow-ceiling-mbr'],
  ['CPF contribution rates','https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay'],
  ['2025 CPF contribution tables','https://www.cpf.gov.sg/content/dam/web/employer/employer-obligations/documents/CPF_contribution_rates_from_1_Jan_2025.pdf'],
  ['SRS contributions & limits','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/special-tax-schemes/srs-contributions'],
  ['CPF cash top-up eligibility','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/central-provident-fund-(cpf)-cash-top-up-relief'],
  ['Qualifying donations','https://www.iras.gov.sg/taxes/other-taxes/charities/donations-tax-deductions'],
  ['Parenthood Tax Rebate','https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-rebates/parenthood-tax-rebate-(ptr)']
];
for(const [label,url] of sources){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;const arrow=document.createElement('span');arrow.textContent='↗';a.append(arrow);$('source-links').append(a);}

function notify(message){$('status').textContent=message;$('status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('status').classList.remove('visible'),4000);}
function syncInputs(){
  for(const [key,value] of Object.entries(state)){
    const input=$(key); if(!input)continue;
    if(input.type==='checkbox')input.checked=value;else input.value=String(value);
    input.removeAttribute('aria-invalid');
  }
  document.querySelectorAll('[data-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.period===state.period)));
  $('salary-unit').textContent=state.period==='annual'?'/ year':'/ month';
  $('salary-range').max=state.period==='annual'?'240000':'20000';
  $('salary-range').step=state.period==='annual'?'1200':'100';
  $('range-mid').textContent=state.period==='annual'?'$120,000':'$10,000';
  $('range-max').textContent=state.period==='annual'?'$240,000+':'$20,000+';
}
function ledger(container,rows){
  $(container).replaceChildren();
  for(const [label,value,kind=''] of rows){
    const row=document.createElement('div');row.className=`ledger-row ${kind}`;
    const dt=document.createElement('dt');dt.textContent=label;
    const dd=document.createElement('dd');dd.textContent=(kind==='deduction'?'− ':'')+cash(value,2);
    row.append(dt,dd);$(container).append(row);
  }
}
function metadata(id,n){$(id).textContent=n>0?`${cash(n)} added`:'Optional';$(id).classList.toggle('added',n>0);}
function render(){
  result=estimateTax(state);
  renderValidation();
  $('annual-income').textContent=cash(result.annualSalary+state.bonus);
  const [whole,cents]=cash(result.tax,2).split('.');
  $('tax-value').replaceChildren(document.createTextNode(whole));
  const fraction=document.createElement('span');fraction.textContent=`.${cents}`;$('tax-value').append(fraction);
  $('monthly-tax').textContent=cash(result.monthlyTax,2);
  $('effective-rate').textContent=percent(result.effectiveRate);
  $('marginal-rate').textContent=`${(result.marginalRate*100).toFixed(1).replace('.0','')}%`;
  $('estimate-badge').textContent=`YA ${state.year}`;
  $('projection-label').textContent=state.year===2027?'· planning projection':'';
  $('salary-range').value=String(Math.min(state.salary,Number($('salary-range').max)));
  const cpfDesc=state.citizenship==='foreigner'||state.cpfMode==='none'?'no employee CPF':state.cpfMode==='manual'?'actual employee CPF':'estimated full-rate employee CPF';
  $('quick-assumptions').textContent=`Tax resident, age ${state.age}; ${cpfDesc} and ${cash(result.earnedRelief)} earned income relief. Income year ${state.year-1}.`;
  $('cpf-actual-wrap').hidden=state.cpfMode!=='manual'||state.citizenship==='foreigner';
  $('cpfMode').disabled=state.citizenship==='foreigner';
  $('cpf-note').textContent=state.citizenship==='foreigner'?'Foreigners do not contribute employee CPF. Tax-resident foreigners can qualify for personal reliefs.':'Automatic CPF assumes 12 months at the same salary and CPF age band, with bonuses subject to the annual ceiling. Use actual CPF for age-band changes, irregular pay, multiple employers or first/second-year PR rates.';
  $('profile-meta').textContent=state.citizenship==='foreigner'?'No CPF':state.cpfMode==='manual'?'Actual CPF':state.cpfMode==='none'?'No CPF':'Estimated';
  metadata('income-meta',state.benefits+state.trade+state.rental+state.otherIncome);
  metadata('deductions-meta',state.expenses+state.donations);
  metadata('retirement-meta',state.srs+state.topupSelf+state.topupFamily);
  metadata('reliefs-meta',state.spouseRelief+state.childRelief+state.parentRelief+state.nsRelief+state.otherReliefs);
  metadata('rebate-meta',state.ptr);
  const extras=Object.values(fields).flat().filter(([key])=>state[key]>0).length;
  $('detail-status').textContent=extras?`${extras} additional ${extras===1?'detail':'details'} included in your estimate`:'A useful starting point, in seconds';
  const total=Math.max(1,result.grossIncome);
  $('net-bar').style.width=`${Math.max(0,(result.grossIncome-result.cpf-result.tax)/total)*100}%`;
  $('cpf-bar').style.width=`${result.cpf/total*100}%`;
  $('tax-bar').style.width=`${result.tax/total*100}%`;
  ledger('computation-lines',[
    ['Total income',result.grossIncome],['Allowable expenses',result.expenses,'deduction'],['Donation deduction',result.donationDeduction,'deduction'],['Personal reliefs',result.reliefs,'deduction'],['Chargeable income',result.chargeableIncome,'total'],['Tax before rebates',result.grossTax],['PTR applied',result.ptrUsed,'deduction'],['Estimated tax',result.tax,'total']
  ]);
  const warningMessages=[...result.warnings];
  if(state.citizenship==='pr'&&state.cpfMode==='auto')warningMessages.push('Full-rate CPF is assumed for PRs. For first/second-year PR status, enter your actual eligible annual employee CPF.');
  if(state.spouseRelief+state.childRelief+state.parentRelief+state.nsRelief+state.otherReliefs>0)warningMessages.push('Custom relief amounts are included as entered. Confirm individual eligibility, limits and family allocations before relying on the estimate.');
  $('warnings').replaceChildren(...warningMessages.map(message=>{const p=document.createElement('p');p.textContent=message;return p;}));
  renderBrackets();
  ledger('relief-lines',result.reliefItems.filter(([,value])=>value>0));
  if(!result.totalReliefs)$('relief-lines').textContent='No personal reliefs applied.';
  $('relief-meter-fill').style.width=`${result.reliefs/80000*100}%`;
  $('relief-cap-text').textContent=`${cash(result.reliefs)} of $80,000 cap · ${cash(result.reliefHeadroom)} remaining`;
  $('bracket-explainer').textContent=`Your effective rate is ${percent(result.effectiveRate)} of total income. Your next dollar of chargeable income falls in the ${(result.marginalRate*100).toFixed(1).replace('.0','')}% band.`;
  renderComparisons();
  clearTimeout(announcementTimer);announcementTimer=setTimeout(()=>$('live-result').textContent=`Estimated annual tax ${cash(result.tax,2)}. Monthly set-aside ${cash(result.monthlyTax,2)}.`,700);
}
function renderValidation(){
  const invalid=form.querySelector('[aria-invalid="true"]');
  $('validation-errors').hidden=!invalid;
  $('validation-errors').textContent=invalid?'Correct the highlighted input. This estimate uses the last valid value for that field.':'';
}
function renderBrackets(){
  let rows=computeBracketSlices(result.chargeableIncome);
  if(allBrackets)rows=RESIDENT_TAX_BRACKETS.map((b,index)=>rows[index]||{band:b.limit?`${b.prevLimit.toLocaleString('en-SG')} - ${b.limit.toLocaleString('en-SG')}`:`> ${b.prevLimit.toLocaleString('en-SG')}`,rate:b.rate,slice:0,tax:0});
  $('bracket-rows').replaceChildren(...rows.map(row=>{
    const tr=document.createElement('tr');if(row.slice>0&&row.rate===result.brackets.at(-1)?.rate)tr.className='current-band';
    for(const value of [row.band,`${(row.rate*100).toFixed(1).replace('.0','')}%`,cash(row.slice),cash(row.tax,2)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}return tr;
  }));
  $('all-brackets').textContent=allBrackets?'Show applicable tax bands':'Show all tax bands';
  $('all-brackets').setAttribute('aria-expanded',String(allBrackets));
}
function srsScenario(){
  const requested=Math.max(0,Number($('srs-extra').value)||0);
  const extra=Math.min(requested,Math.max(0,result.srsLimit-state.srs));
  return {extra, projected:estimateTax({...state,srs:state.srs+extra})};
}
function renderComparisons(){
  $('salary-comparison').replaceChildren();
  for(const factor of [.8,1,1.2]){
    const annual=factor===1?result.annualSalary:Math.round(result.annualSalary*factor*100)/100;
    const scenario=factor===1?result:estimateTax({...state,salary:annual,period:'annual'});
    const card=document.createElement('article');card.className=`scenario ${factor===1?'current':''}`;
    const label=document.createElement('p');label.textContent=factor===1?'Your current salary':factor<1?'20% lower salary':'20% higher salary';
    const amount=document.createElement('strong');amount.textContent=`${cash(annual/12,2)} / mo`;
    const list=document.createElement('dl');
    for(const [title,value] of [['Annual tax',cash(scenario.tax,2)],['Salary after CPF & tax / mo',cash(scenario.salaryAfterCpfAndTax,2)]]){
      const row=document.createElement('div');row.className='ledger-row';const dt=document.createElement('dt');dt.textContent=title;const dd=document.createElement('dd');dd.textContent=value;row.append(dt,dd);list.append(row);
    }
    card.append(label,amount,list);
    const button=document.createElement('button');button.className='button';button.textContent=factor===1?'Current estimate':'Use this salary';button.disabled=factor===1;
    button.addEventListener('click',()=>{state.salary=state.period==='annual'?annual:annual/12;syncInputs();render();location.hash='estimate';notify('Salary scenario applied.');});card.append(button);$('salary-comparison').append(card);
  }
  $('srs-limit-label').textContent=`Annual SRS limit: ${cash(result.srsLimit)}`;
  const {extra,projected}=srsScenario();
  const stats=[['Additional contribution',cash(extra)],['Estimated annual tax',cash(projected.tax,2)],['Estimated tax saving',cash(Math.max(0,result.tax-projected.tax),2)]];
  $('srs-comparison').replaceChildren(...stats.map(([label,value])=>{const div=document.createElement('div');const span=document.createElement('span');span.textContent=label;const strong=document.createElement('strong');strong.textContent=value;div.append(span,strong);return div;}));
  $('apply-srs').disabled=extra<=0;
  $('saved-comparison').replaceChildren();
  if(saved){
    const previous=estimateTax(saved.input);const list=document.createElement('dl');list.id='saved-ledger';$('saved-comparison').append(list);
    ledger('saved-ledger',[[`Saved estimate · YA ${previous.input.year}`,previous.tax],['Current estimate',result.tax]]);
    const p=document.createElement('p');p.className='field-note';p.textContent=`Saved ${new Date(saved.savedAt).toLocaleString('en-SG')}. Figures are recalculated with this version’s rules. ${previous.input.year!==state.year?'These estimates use different assessment years.':''}`;$('saved-comparison').append(p);
  }else{const p=document.createElement('p');p.className='field-note';p.textContent='Save an estimate, then adjust your inputs to see the difference here. Saving uses this browser’s local storage.';$('saved-comparison').append(p);}
  $('load-saved').hidden=!saved;$('delete-saved').hidden=!saved;
}
function setDetailMode(detailed){
  document.querySelectorAll('.detail-section').forEach(section=>section.open=detailed);
  $('quick-mode').setAttribute('aria-pressed',String(!detailed));$('detail-mode').setAttribute('aria-pressed',String(detailed));
  $('expand-all').textContent=detailed?'Collapse all':'Expand all';
}
function readField(event){
  const input=event.target;
  if(!Object.hasOwn(DEFAULT_INPUT,input.name))return;
  if(input.type==='number'&&!input.validity.valid){input.setAttribute('aria-invalid','true');renderValidation();$('live-result').textContent='Enter a valid non-negative amount within the field limit. The previous estimate is retained.';return;}
  input.removeAttribute('aria-invalid');
  const value=input.type==='checkbox'?input.checked:input.type==='number'||input.name==='year'?Number(input.value):input.value;
  state=normalizeInput({...state,[input.name]:value});render();
}
form.addEventListener('input',readField);
// The year selector belongs to the form, but sits outside its DOM subtree.
$('year').addEventListener('change',readField);
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('focusout',event=>{if(event.target.getAttribute('aria-invalid')==='true'){notify('Invalid value was not applied. Enter a non-negative amount within the field limit.');}});
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
  const period=button.dataset.period;if(period===state.period)return;
  state.salary=period==='annual'?state.salary*12:state.salary/12;state.period=period;syncInputs();render();
}));
document.querySelectorAll('[data-salary]').forEach(button=>button.addEventListener('click',()=>{state.salary=Number(button.dataset.salary)*(state.period==='annual'?12:1);syncInputs();render();}));
$('salary-range').addEventListener('input',event=>{state.salary=Number(event.target.value);$('salary').value=state.salary;$('salary').removeAttribute('aria-invalid');render();});
$('quick-mode').addEventListener('click',()=>setDetailMode(false));$('detail-mode').addEventListener('click',()=>setDetailMode(true));
$('expand-all').addEventListener('click',()=>setDetailMode(Boolean(document.querySelector('.detail-section:not([open])'))));
$('edit-profile').addEventListener('click',()=>{$('profile-section').open=true;$('profile-section').scrollIntoView({block:'center'});$('age').focus({preventScroll:true});});
$('all-brackets').addEventListener('click',()=>{allBrackets=!allBrackets;renderBrackets();});
$('srs-extra').addEventListener('input',renderComparisons);
$('apply-srs').addEventListener('click',()=>{state.srs+=srsScenario().extra;syncInputs();render();location.hash='estimate';$('retirement-section').open=true;notify('SRS contribution applied.');});
$('reset').addEventListener('click',()=>{state={...DEFAULT_INPUT};syncInputs();setDetailMode(false);render();notify('Estimate reset. Your saved estimate is still available.');});
try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY));if(raw?.version===2&&raw.input&&typeof raw.input==='object'&&Number.isFinite(Date.parse(raw.savedAt)))saved={version:2,input:normalizeInput(raw.input),savedAt:raw.savedAt};}catch{/* A blocked or invalid saved record must not prevent calculation. */}
$('save').addEventListener('click',()=>{
  if(form.querySelector('[aria-invalid="true"]')){notify('Correct the highlighted inputs before saving.');return;}
  const record={version:2,input:state,savedAt:new Date().toISOString()};
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(record));saved=JSON.parse(JSON.stringify(record));renderComparisons();notify('Estimate saved in this browser. Restore it from Compare scenarios.');}catch{notify('Browser storage is unavailable. Export your breakdown instead.');}
});
$('load-saved').addEventListener('click',()=>{if(!saved)return;state=normalizeInput(saved.input);syncInputs();render();location.hash='estimate';notify('Saved estimate restored.');});
$('delete-saved').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);saved=null;renderComparisons();notify('Saved estimate deleted.');}catch{notify('Browser storage is unavailable. The saved estimate could not be deleted.');}});
$('export').addEventListener('click',()=>{
  if(form.querySelector('[aria-invalid="true"]')){notify('Correct the highlighted inputs before exporting.');return;}
  const rows=[['IRAS Helper estimate','SGD'],['Year of assessment',state.year],['Income year',state.year-1],['Rules checked','2026-09-15'],['Scope','Singapore tax resident estimate; not an IRAS assessment'],['CPF assumptions',$('quick-assumptions').textContent],[],['Input','Value'],...Object.entries(state),[],['Calculation','Amount'],['Total income',result.grossIncome],['Allowable employment expenses',result.expenses],['Donation deduction',result.donationDeduction],['Personal reliefs before overall cap',result.totalReliefs],['Personal reliefs allowed',result.reliefs],['Chargeable income',result.chargeableIncome],['Tax before rebates',result.grossTax],['PTR used',result.ptrUsed],['PTR remaining',result.ptrRemaining],['Estimated annual tax',result.tax],['Monthly set-aside',result.monthlyTax.toFixed(2)],[],['Relief','Amount'],...result.reliefItems,[],['Band','Rate','Taxed portion','Tax'],...result.brackets.map(row=>[row.band,percent(row.rate),row.slice,row.tax.toFixed(2)]),[],['Warnings'],...Array.from($('warnings').children,p=>[p.textContent]),[],['Source','URL'],...sources];
  const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`iras-helper-ya-${state.year}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Breakdown exported with inputs, assumptions and sources.');
});
function route(){
  const key=location.hash.slice(1);const page=['compare','guide'].includes(key)?key:'estimate';
  document.querySelectorAll('.page').forEach(section=>section.hidden=section.id!==`page-${page}`);
  document.querySelectorAll('[data-page]').forEach(a=>{const active=a.dataset.page===page;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(key!=='breakdown')window.scrollTo(0,0);
  else requestAnimationFrame(()=>$('breakdown').scrollIntoView());
}
window.addEventListener('hashchange',route);
syncInputs();render();route();
