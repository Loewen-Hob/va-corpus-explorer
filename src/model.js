(function(root){
  'use strict';
  const STAGES=['DP','VM','VT','PR'], MODES=['G','S','P','I','U'];
  function matches(p,f,includeAction=true){
    const query=(f.q||'').trim().toLocaleLowerCase();
    const text=[p.key,p.system,p.title,p.authors,p.venue,p.year,p.doi,p.evidence].join(' ').toLocaleLowerCase();
    if(query && !text.includes(query))return false;
    if(f.venue && p.venue!==f.venue)return false;
    if(f.year && String(p.year)!==String(f.year))return false;
    if(!includeAction)return true;
    if(f.stage && f.mode)return p.codes[f.stage].includes(f.mode);
    if(f.stage && !p.codes[f.stage].length)return false;
    if(f.mode && !STAGES.some(s=>p.codes[s].includes(f.mode)))return false;
    return true;
  }
  function filterPapers(papers,f,includeAction=true){return papers.filter(p=>matches(p,f,includeAction));}
  function stats(papers){
    const cells={},stages={},modes={},venues={};let single=0,multi=0;
    for(const s of STAGES){stages[s]=0;cells[s]={};for(const m of MODES)cells[s][m]=(m==='U' && s!=='PR')?null:0;}
    for(const m of MODES)modes[m]=0;
    for(const p of papers){
      venues[p.venue]=(venues[p.venue]||0)+1;
      let n=0;
      for(const s of STAGES){if(p.codes[s].length){stages[s]++;n++;}for(const m of p.codes[s])if(cells[s][m]!==null)cells[s][m]++;}
      for(const m of MODES)if(STAGES.some(s=>p.codes[s].includes(m)))modes[m]++;
      if(n===1)single++;if(n>1)multi++;
    }
    return{total:papers.length,cells,stages,modes,venues,single,multi};
  }
  const api={STAGES,MODES,matches,filterPapers,stats};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else root.CorpusModel=api;
})(typeof window==='undefined'?{}:window);
