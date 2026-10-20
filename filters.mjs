export const DEFAULTS = Object.freeze({timing:'all',search:'',topic:'all',sort:'sponsor'});
export const PAGE_SIZE = 12;
export function filterRecords(records,state) {
  const terms=state.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter(r=>
    (state.timing==='all'||(state.timing==='dated'?Boolean(r.deadline.date):r.deadline.rolling===true))
    &&(state.topic==='all'||r.topic===state.topic)
    &&terms.every(term=>[r.id,r.sponsor,r.program,r.summary,r.topic].join(' ').toLocaleLowerCase().includes(term))
  ).sort((a,b)=>state.sort==='date'
    ?(a.deadline.date||'9999').localeCompare(b.deadline.date||'9999')||a.sponsor.localeCompare(b.sponsor)||a.id.localeCompare(b.id)
    :a.sponsor.localeCompare(b.sponsor)||a.program.localeCompare(b.program)||a.id.localeCompare(b.id));
}
export function dateText(value) {
  if(!value)return 'Not established';
  const [year,month,day]=value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));
}
