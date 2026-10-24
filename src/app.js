(()=>{
  'use strict';
  const DATA=JSON.parse(document.getElementById('dataset').textContent);
  const {STAGES,MODES,filterPapers,stats}=window.CorpusModel;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labelVenue=v=>v==='EuroVis'?'EuroVis / CGF':v;
  const fullMode=m=>DATA.codebook.modes.find(x=>x.code===m).name;
  const fullStage=s=>DATA.codebook.stages.find(x=>x.code===s).name;
  const venues=['TVCG','EuroVis','CHI','UIST','IUI','PacificVis'];
  const allowedViews=['corpus','crosswalk','codebook','downloads'];
  let state={view:'corpus',q:'',venue:'',year:'',stage:'',mode:'',paper:'s01'};
  let displayed=[],currentBib='',toastTimer;
  function validate(){
    if(!allowedViews.includes(state.view))state.view='corpus';
    if(!venues.includes(state.venue))state.venue='';
    if(!DATA.papers.some(p=>String(p.year)===state.year))state.year='';
    if(!STAGES.includes(state.stage))state.stage='';
    if(!MODES.includes(state.mode))state.mode='';
    if(state.stage && state.stage!=='PR' && state.mode==='U')state.mode='';
    if(!DATA.papers.some(p=>p.key===state.paper))state.paper='s01';
  }
  function readHash(){
    const params=new URLSearchParams(location.hash.slice(1));
    state={view:params.get('view')||'corpus',q:params.get('q')||'',venue:params.get('venue')||'',year:params.get('year')||'',stage:params.get('stage')||'',mode:params.get('mode')||'',paper:params.get('paper')||'s01'};
    validate();
  }
  function saveHash(){
    const p=new URLSearchParams();p.set('view',state.view);
    for(const k of ['q','venue','year','stage','mode'])if(state[k])p.set(k,state[k]);
    if(state.paper && state.view==='corpus')p.set('paper',state.paper);
    const hash='#'+p.toString();
    if(location.hash!==hash)try{history.replaceState(null,'',hash);}catch(_){location.hash=hash;}
  }
  function notify(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
  function download(name,text,type='text/plain;charset=utf-8'){
    const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function csvText(records){
    const fields=['key','system','title','venue','year','doi',...STAGES,'evidence'];
    const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    return '\ufeff'+fields.map(quote).join(',')+'\r\n'+records.map(p=>fields.map(k=>quote(STAGES.includes(k)?p.codes[k].join(';'):p[k])).join(',')).join('\r\n')+'\r\n';
  }
  function setPair(stage,mode){state.view='corpus';state.stage=stage;state.mode=mode;render();$('corpus-heading').scrollIntoView({block:'start',behavior:'auto'});}
  function reset(){Object.assign(state,{q:'',venue:'',year:'',stage:'',mode:''});render();}
  function renderFilters(){
    for(const [k,id] of [['q','query'],['venue','venue'],['year','year'],['stage','stage'],['mode','mode']])if($(id).value!==state[k])$(id).value=state[k];
    const crosswalk=state.view==='crosswalk';
    $('filter-section').hidden=!['corpus','crosswalk'].includes(state.view);
    $('filter-section').classList.toggle('crosswalk-filters',crosswalk);
    document.querySelectorAll('.action-filter').forEach(x=>x.hidden=crosswalk);
    $('mode').querySelector('option[value="U"]').disabled=!!state.stage && state.stage!=='PR';
    $('active-filters').innerHTML=['q','venue','year','stage','mode'].filter(k=>state[k]).map(k=>{
      const label=k==='q'?'Search: '+state[k]:k==='stage'?state[k]+': '+fullStage(state[k]):k==='mode'?state[k]+': '+fullMode(state[k]):k==='venue'?labelVenue(state[k]):state[k];
      return `<button type="button" class="filter-chip" data-remove="${k}" aria-label="Remove ${esc(label)} filter">${esc(label)}<span aria-hidden="true">×</span></button>`;
    }).join('');
  }
  function renderCorpus(){
    displayed=filterPapers(DATA.papers,state);
    if(displayed.length && !displayed.some(p=>p.key===state.paper))state.paper=displayed[0].key;
    $('result-count').innerHTML=`Showing <strong>${displayed.length}</strong> of <strong>46</strong> included papers`;
    $('paper-rows').innerHTML=displayed.map(p=>`<button type="button" class="paper-card ${p.key===state.paper?'selected':''}" data-paper="${p.key}" aria-label="View evidence for ${esc(p.system)}" ${p.key===state.paper?'aria-current="true"':''}><span class="card-top"><span class="record-id">${esc(p.key.toUpperCase())}</span><span class="card-venue">${esc(labelVenue(p.venue))} <span>· ${p.year}</span></span><span class="card-arrow" aria-hidden="true">↗</span></span><strong class="card-system">${esc(p.system)}</strong><span class="card-title">${esc(p.title)}</span><span class="card-codes">${STAGES.map(s=>`<span class="stage-chip ${p.codes[s].length?'has-code':''}" title="${esc(fullStage(s))}"><b>${s}</b><span>${p.codes[s].length?p.codes[s].join(' · '):'—'}</span></span>`).join('')}</span></button>`).join('');
    $('empty-state').hidden=displayed.length>0;
    $('export-filtered').disabled=displayed.length===0;
    const p=displayed.find(x=>x.key===state.paper);
    $('paper-detail').innerHTML=p?`<div class="detail-kicker"><span>EVIDENCE RECORD / ${esc(p.key.toUpperCase())}</span><span>${esc(p.venue)} · ${p.year}</span></div><h3>${esc(p.system)}</h3><p class="detail-title">${esc(p.title)}</p><p class="detail-authors">${esc(p.authors)}</p><p class="detail-venue">${esc(p.publication)}</p><div class="detail-links"><a class="button" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">Publication ↗</a>${p.source?' <a class="button secondary" href="'+esc(p.source)+'" target="_blank" rel="noopener noreferrer">Reading source ↗</a>':''}<button class="button secondary" type="button" data-bib="${p.key}">BibTeX</button></div><p class="detail-subheading">Documented user action</p><p class="evidence">${esc(p.evidence)}</p><p class="detail-subheading">Stage–mode coding</p><div class="detail-codes">${STAGES.map(s=>`<div class="detail-code-row"><span class="code-stage">${s} · ${esc(fullStage(s))}</span><span>${p.codes[s].length?p.codes[s].map(m=>`<button type="button" data-stage="${s}" data-mode="${m}" aria-label="Find papers coded ${esc(fullStage(s))}, ${esc(fullMode(m))}">${m} · ${esc(fullMode(m))}</button>`).join(''):'<span class="none">No matched action</span>'}</span></div>`).join('')}</div><p class="evidence-disclosure">Coding summary from the consensus crosswalk; not a verbatim quotation.</p><div class="copy-link"><button type="button" class="button secondary" id="copy-paper-link">Copy paper link ↗</button><span>Persistent record: ${esc(p.key)}</span></div>`:'<div class="detail-kicker">EVIDENCE RECORD</div><h3>No paper selected.</h3><p class="detail-title">Clear a filter to browse the corpus.</p>';
  }
  function renderCrosswalk(){
    const base=filterPapers(DATA.papers,state,false),counts=stats(base);
    $('heatmap-context').textContent=`${base.length} / 46 papers in scope`;
    const max=Math.max(1,...STAGES.flatMap(s=>MODES.map(m=>counts.cells[s][m]||0)));
    $('heatmap').innerHTML=`<table class="heatmap-table"><caption class="sr-only">Distinct papers by VA stage and intervention mode. Select a cell to list its evidence records. U is inapplicable outside presentation.</caption><thead><tr><th scope="col">VA stage</th>${MODES.map(m=>`<th scope="col">${m}<small>${esc(fullMode(m))}</small></th>`).join('')}<th scope="col">Stage<small>distinct</small></th></tr></thead><tbody>${STAGES.map(s=>`<tr><th scope="row">${s}<small>${esc(fullStage(s))}</small></th>${MODES.map(m=>{const n=counts.cells[s][m];if(n===null)return '<td><span class="heatmap-na" aria-label="Not applicable: user-led presentation authoring is defined only for PR">NA</span></td>';const intensity=.07+.82*n/max;return `<td><button type="button" class="heatmap-button ${intensity>.54?'strong':''}" data-heat-stage="${s}" data-heat-mode="${m}" style="--intensity:${intensity.toFixed(3)}" aria-label="${esc(fullStage(s))}, ${esc(fullMode(m))}: ${n} ${n===1?'paper':'papers'}. Show matching records." aria-pressed="${state.stage===s && state.mode===m}" ${n===0?'disabled':''}>${n}</button></td>`;}).join('')}<td class="heatmap-total">${counts.stages[s]}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Mode · distinct</th>${MODES.map(m=>`<td>${counts.modes[m]}</td>`).join('')}<td></td></tr></tfoot></table>`;
    $('stage-bars').innerHTML=STAGES.map(s=>`<div class="bar-row"><div class="bar-label"><span>${s} · ${esc(fullStage(s))}</span><strong>${counts.stages[s]}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${base.length?100*counts.stages[s]/base.length:0}%"></div></div></div>`).join('');
    $('pattern-stats').innerHTML=`<div><strong>${counts.single}</strong><span>one stage</span></div><div><strong>${counts.multi}</strong><span>multiple stages</span></div><div><strong>${counts.modes.I}</strong><span>interactive editing</span></div>`;
    $('venue-bars').innerHTML=venues.map(v=>`<button type="button" class="venue-bar" data-venue="${v}" aria-label="Show ${esc(labelVenue(v))} papers"><span class="bar-label"><span>${esc(labelVenue(v))}</span><strong>${counts.venues[v]||0}</strong></span><span class="bar-track" style="display:block"><span class="bar-fill" style="display:block;width:${base.length?100*(counts.venues[v]||0)/base.length:0}%"></span></span></button>`).join('');
  }
  function render(){
    validate();
    for(const view of allowedViews)$(view+'-view').hidden=view!==state.view;
    document.querySelectorAll('#nav button').forEach(b=>{if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelector('.workspace').classList.toggle('no-filters',!['corpus','crosswalk'].includes(state.view));
    renderFilters();renderCorpus();renderCrosswalk();saveHash();
    document.title=state.view==='corpus' && state.paper?`${DATA.papers.find(x=>x.key===state.paper)?.system||'Corpus'} · Corpus & Coding Explorer`:'Corpus & Coding Explorer · Human–LLM Visual Analytics';
  }
  for(const v of venues)$('venue').insertAdjacentHTML('beforeend',`<option value="${v}">${esc(labelVenue(v))}</option>`);
  [...new Set(DATA.papers.map(p=>p.year))].sort().reverse().forEach(y=>$('year').insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`));
  for(const s of DATA.codebook.stages)$('stage').insertAdjacentHTML('beforeend',`<option value="${s.code}">${s.code} · ${esc(s.name)}</option>`);
  for(const m of DATA.codebook.modes)$('mode').insertAdjacentHTML('beforeend',`<option value="${m.code}">${m.code} · ${esc(m.name)}</option>`);
  for(const kind of ['stages','modes'])$(kind==='stages'?'stage-definitions':'mode-definitions').innerHTML=DATA.codebook[kind].map(x=>`<article class="definition"><span class="definition-code">${x.code}</span><div><h4>${esc(x.name)}</h4><p>${esc(x.definition)}</p></div></article>`).join('');
  const resources=[['corpus.csv','Corpus metadata','46 included papers, formal publication metadata, DOI and reading-source links.'],['stage_mode_crosswalk.csv','Action-level crosswalk','Consensus stage–mode codes and an evidence summary for every included paper.'],['explorer.json','Explorer dataset','All displayed records, codebook definitions, and computed corpus statistics.'],['references.bib','Verified bibliography','61 entries, including background literature and excluded candidates.'],['excluded_candidates.csv','Screening exclusions','9 candidates excluded from the final intervention corpus.'],['CODEBOOK.md','Codebook & counting rules','Operational definitions, source attribution, and interpretation boundaries.'],['manifest.json','Source manifest','Dataset version and SHA-256 hashes of the source files.']];
  $('download-list').innerHTML=resources.map(([name,title,desc])=>`<div class="download-row"><span class="download-name">${esc(title)}</span><span class="download-desc">${esc(desc)}</span><button type="button" class="button secondary" data-download="${name}" aria-label="Download ${esc(name)}">${name.endsWith('.csv')?'CSV':name.endsWith('.json')?'JSON':name.endsWith('.bib')?'BIB':'MD'} ↓</button></div>`).join('');
  $('excluded-rows').innerHTML=DATA.excluded.map(p=>`<tr><td><strong>${esc(p.system)}</strong><small>${esc(p.title)} · ${esc(p.key)}</small></td><td>${esc(labelVenue(p.venue))}</td><td>${p.year}</td><td><a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener noreferrer">DOI ↗</a></td></tr>`).join('');
  $('nav').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b){state.view=b.dataset.view;render();}});
  for(const [id,key] of [['query','q'],['venue','venue'],['year','year'],['stage','stage'],['mode','mode']])$(id).addEventListener(id==='query'?'input':'change',()=>{state[key]=$(id).value;render();});
  $('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
  $('active-filters').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){state[b.dataset.remove]='';render();}});
  $('paper-rows').addEventListener('click',e=>{const b=e.target.closest('[data-paper]');if(b){state.paper=b.dataset.paper;render();if(matchMedia('(max-width:900px)').matches)$('paper-detail').scrollIntoView({block:'start'});}});
  $('paper-detail').addEventListener('click',async e=>{
    const pair=e.target.closest('[data-stage]');if(pair){setPair(pair.dataset.stage,pair.dataset.mode);return;}
    const bib=e.target.closest('[data-bib]');if(bib){const p=DATA.papers.find(x=>x.key===bib.dataset.bib);currentBib=p.bibtex;$('bib-heading').textContent=p.system+' · BibTeX';$('bib-content').textContent=p.bibtex;$('bib-dialog').showModal();return;}
    if(e.target.closest('#copy-paper-link')){
      const params=new URLSearchParams({view:'corpus',paper:state.paper});const link=location.href.split('#')[0]+'#'+params;
      try{await navigator.clipboard.writeText(link);notify('Paper link copied.');}catch(_){notify('Copy the current URL to share this paper and its filters.');}
    }
  });
  $('heatmap').addEventListener('click',e=>{const b=e.target.closest('[data-heat-stage]');if(b)setPair(b.dataset.heatStage,b.dataset.heatMode);});
  $('venue-bars').addEventListener('click',e=>{const b=e.target.closest('[data-venue]');if(b){state.venue=b.dataset.venue;state.stage='';state.mode='';state.view='corpus';render();}});
  $('export-filtered').addEventListener('click',()=>download(`corpus-filtered-${displayed.length}-papers.csv`,csvText(displayed),'text/csv;charset=utf-8'));
  $('download-list').addEventListener('click',e=>{const b=e.target.closest('[data-download]');if(b){const name=b.dataset.download;download(name,DATA.files[name],name.endsWith('.json')?'application/json;charset=utf-8':name.endsWith('.csv')?'text/csv;charset=utf-8':'text/plain;charset=utf-8');}});
  $('close-bib').addEventListener('click',()=>$('bib-dialog').close());
  $('download-one-bib').addEventListener('click',()=>download(state.paper+'.bib',currentBib));
  window.addEventListener('hashchange',()=>{readHash();render();});
  readHash();render();
})();
