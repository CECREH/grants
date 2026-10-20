import {DEFAULTS,PAGE_SIZE,filterRecords,dateText} from './filters.mjs';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataset,state={...DEFAULTS},limit=PAGE_SIZE;
function link(source,primary=false){
  const u=new URL(source.url);
  if(u.protocol!=='https:'||u.username||u.password)return '';
  return `<a class="${primary?'official-link':'source-link'}" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${primary?'Official call & application route':esc(source.title)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
}
function card(r){
  const d=r.deadline;
  return `<article class="opportunity" id="${r.id}" data-id="${r.id}" aria-labelledby="title-${r.id}">
    <div class="card-main">
      <div class="program-cell"><div class="record-meta"><span class="public-topic">${esc(r.topic)}</span><span class="record-id">${r.id}</span></div><p class="sponsor">${esc(r.sponsor)}</p><h3 id="title-${r.id}">${esc(r.program)}</h3><p class="fit">${esc(r.summary)}</p></div>
      <div class="funding-cell"><h4>Funding & term <span class="field-date">· ${dateText(r.fundingCheckedDate||dataset.snapshotDate)}</span></h4><p>${esc(r.funding)}</p><h4 class="match-label">Match / cost share</h4><p class="match-text">${esc(r.match)}</p></div>
      <div class="date-cell"><h4>Submission route at last check</h4><div class="deadline-item"><span class="date-basis ${d.kind}">${esc(d.label)}</span><strong class="deadline-date">${d.rolling&&!d.date?'Rolling / ongoing':dateText(d.date)}</strong><span class="deadline-stage">${esc(d.stage)}</span>${d.time?`<span class="deadline-time">${esc(d.time)}</span>`:''}</div>${r.fullApplicationDate?`<p class="full-date">Full application: ${dateText(r.fullApplicationDate)}</p>`:''}</div>
    </div>
    ${r.condition?`<p class="call-note conditional-note"><strong>Conditional route.</strong> ${esc(r.condition)}</p>`:''}
    ${r.notes.map(note=>`<p class="call-note">${esc(note)}</p>`).join('')}
    <div class="card-bottom">${link(r.sources[0],true)}<span class="snapshot-status">Opening check: ${dateText(r.openingCheckedDate||dataset.verificationDate)}</span></div>
    <details class="details"><summary><span>Eligibility & sources</span><span aria-hidden="true" class="chevron">⌄</span></summary><div class="public-details"><h4>Eligibility and application route</h4><p>${esc(r.eligibility)}</p><h4>Official sources</h4><ul class="source-list">${r.sources.map(s=>`<li>${link(s)}<span>Reviewed ${dateText(s.checked)}</span></li>`).join('')}</ul><p class="sources-note">These are dated source checks. Confirm current terms on the sponsor’s website.</p></div></details>
  </article>`;
}
function render({append=false}={}){
  const records=filterRecords(dataset.records,state),visible=records.slice(0,limit);
  if(append)$('#results').insertAdjacentHTML('beforeend',visible.slice($('#results').children.length).map(card).join(''));
  else $('#results').innerHTML=visible.map(card).join('');
  $('#results').setAttribute('aria-busy','false');
  $('#result-count').textContent=`${records.length} ${records.length===1?'opportunity':'opportunities'}${records.length>visible.length?` · showing ${visible.length}`:''}`;
  $('#empty').hidden=records.length!==0;
  $('#more').hidden=visible.length>=records.length;
  $('#more').textContent=`Show ${Math.min(PAGE_SIZE,records.length-visible.length)} more opportunities`;
  $('#reset').hidden=Object.keys(DEFAULTS).every(k=>state[k]===DEFAULTS[k]);
  document.querySelectorAll('[data-timing]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.timing===state.timing)));
}
function reset(){state={...DEFAULTS};limit=PAGE_SIZE;$('#search').value='';$('#topic').value='all';$('#sort').value='sponsor';render();}
async function init(){
  try{
    const response=await fetch('./data/opportunities.json');
    if(!response.ok)throw new Error('Snapshot unavailable');
    dataset=await response.json();
    if(dataset.schemaVersion!=='public-1'||!Array.isArray(dataset.records)||dataset.verificationDate!=='2026-10-19')throw new Error('Unsupported snapshot');
    if(dataset.records.some(r=>!/^O\d+$/.test(r.id)||!r.sources?.length||r.sources.some(s=>{const u=new URL(s.url);return u.protocol!=='https:'||u.username||u.password;})))throw new Error('Invalid record');
    const counts={all:dataset.records.length,dated:dataset.records.filter(r=>r.deadline.date).length,rolling:dataset.records.filter(r=>r.deadline.rolling).length};
    $('#overview').textContent=`${counts.all} programs · open routes at the last check`;
    document.querySelectorAll('[data-count]').forEach(e=>e.textContent=counts[e.dataset.count]);
    [...new Set(dataset.records.map(r=>r.topic))].sort().forEach(t=>$('#topic').append(new Option(t,t)));
    document.querySelectorAll('[data-timing]').forEach(b=>b.addEventListener('click',()=>{state.timing=b.dataset.timing;limit=PAGE_SIZE;render();}));
    for(const [id,event] of [['search','input'],['topic','change'],['sort','change']])$('#'+id).addEventListener(event,e=>{state[id]=e.target.value;limit=PAGE_SIZE;render();});
    $('#reset').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);
    $('#more').addEventListener('click',()=>{const previous=$('#results').children.length;limit+=PAGE_SIZE;render({append:true});const next=$('#results').children[previous];if(next){next.setAttribute('tabindex','-1');next.focus({preventScroll:true});next.scrollIntoView({block:'start',behavior:'instant'});}});
    render();
  }catch(error){$('#error').hidden=false;$('#results').setAttribute('aria-busy','false');$('#result-count').textContent='Snapshot unavailable';document.querySelectorAll('input,select,button').forEach(e=>e.disabled=true);console.error(error);}
}
init();
