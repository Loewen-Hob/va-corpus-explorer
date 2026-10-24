"""Build a dependency-free, offline-capable survey companion from the supplied data.

Usage: python build.py
The source CSVs and references.bib are canonical. Never hand-edit generated index.html.
"""
from pathlib import Path
from collections import Counter
import csv,hashlib,json,re

ROOT=Path(__file__).resolve().parent
DATA=ROOT/'data'
STAGES=('DP','VM','VT','PR')
MODES=('G','S','P','I','U')
VERSION='1.0.0'
SNAPSHOT='2026-10-22'

def read_csv(name):
    with (DATA/name).open(encoding='utf-8-sig',newline='') as f:
        return list(csv.DictReader(f))

def parse_bib(text):
    result={}
    starts=list(re.finditer(r'@(\w+)\s*\{\s*([^,]+),',text))
    for i,m in enumerate(starts):
        pos=m.end();fields={}
        while pos<len(text):
            pos+=len(re.match(r'[\s,]*',text[pos:])[0])
            if text[pos]=='}':break
            fm=re.match(r'([\w-]+)\s*=\s*',text[pos:])
            if not fm:raise ValueError(text[pos:pos+80])
            field=fm[1].lower();pos+=fm.end()
            if text[pos]=='{':
                depth=1;pos+=1;start=pos
                while depth:
                    if text[pos]=='\\':pos+=2;continue
                    if text[pos]=='{':depth+=1
                    elif text[pos]=='}':depth-=1
                    pos+=1
                value=text[start:pos-1]
            elif text[pos]=='"':
                pos+=1;start=pos
                while text[pos]!='"' or text[pos-1]=='\\':pos+=1
                value=text[start:pos];pos+=1
            else:
                start=pos
                while text[pos] not in ',}\n':pos+=1
                value=text[start:pos].strip()
            fields[field]=value
        key=m[2].strip()
        assert key not in result,key
        result[key]={'type':m[1].lower(),'fields':fields,'bibtex':text[m.start():starts[i+1].start() if i+1<len(starts) else len(text)].strip()+'\n'}
    return result

def plain(text):
    # Display BibTeX text without case-protection braces and common TeX escapes.
    for a,b in [(r'\&','&'),(r'\_','_'),(r'\%','%'),('---','—'),('--','–')]:text=text.replace(a,b)
    for a,b in [(r"\'e",'é'),(r"\'a",'á'),(r'\"o','ö'),(r'\"u','ü'),(r'\"a','ä'),(r'\c{c}','ç')]:text=text.replace(a,b)
    return re.sub(r'[{}]','',text).strip()

def author_display(value):
    names=[]
    for name in re.split(r'\s+and\s+',value):
        parts=name.split(',',1)
        names.append(plain((parts[1].strip()+' '+parts[0].strip()) if len(parts)>1 else name))
    return ', '.join(names)

CODEBOOK={
 'stages':[
  dict(code='DP',name='Data processing',definition='Acquiring, extracting, cleaning, restructuring, or computing data before visual encoding. Selecting a subset within an existing view alone does not qualify.'),
  dict(code='VM',name='Visual mapping',definition='Creating or revising mappings from data to marks, channels, or chart structures. Inspecting or annotating a chart alone does not qualify.'),
  dict(code='VT',name='View transformation',definition='Changing the focus, subset, granularity, arrangement, or navigational state of a view for exploration. Producing a new encoding is visual mapping instead.'),
  dict(code='PR',name='Presentation',definition='Externalizing an interpretation through explanatory text, annotations, summaries, or reports. Merely displaying or exporting a chart, or authoring a question about one, does not qualify.')],
 'modes':[
  dict(code='G',name='Guiding',definition='Providing a goal, prompt, example, constraint, or selected input context for the model’s next output. The user does not directly edit a model-produced artifact in this action.'),
  dict(code='S',name='Selecting or rating',definition='Choosing, accepting, rejecting, or evaluating a model-produced candidate or suggestion. Selecting source data or navigating a view is insufficient.'),
  dict(code='P',name='Post-editing',definition='Directly changing a model-produced artifact, with the edit remaining local or final rather than becoming input for model continuation. Asking the model to make the change is guiding.'),
  dict(code='I',name='Interactive editing',definition='Directly revising a model-produced draft or identified part, after which the system feeds that revision to the model and the model continues or regenerates from it. A new question or retry without editing the draft is insufficient.'),
  dict(code='U',name='User-led presentation authoring',definition='Retaining authorship of an analytic explanation, report, dashboard text, data story, or text–visual account while the model suggests or continues material. An automatically drafted report without user-led composition is excluded. U applies only to PR.')],
 'rules':[
  'The crosswalk records documented active intervention targeting an LLM-related artifact, rather than all capabilities reported by a system.',
  'An action is assigned only to the stage it directly targets; an automatic downstream result does not inherit the action’s mode.',
  'A paper contributes at most once to a stage–mode cell. Distinct documented actions may place a paper in multiple cells.',
  'Stage and mode totals count distinct papers. They are not sums of the corresponding cells.',
  'U outside PR is structurally inapplicable (NA), rather than an observed zero.',
  'An empty crosswalk field means no matching action is recorded. It does not prove a capability is absent from the implementation.',
  'Evidence strings are supplied coding summaries, not verbatim quotations. Section/page locators are not supplied in the source CSV.',
  'The explorer uses consensus labels; independent coder labels are not available here and agreement coefficients are not recalculated.'
 ]}

def main():
    corpus=read_csv('corpus.csv');crosswalk=read_csv('stage_mode_crosswalk.csv');excluded=read_csv('excluded_candidates.csv')
    bib=parse_bib((DATA/'references.bib').read_text(encoding='utf-8-sig'))
    bykey={r['key']:r for r in crosswalk}
    assert len(corpus)==len(crosswalk)==len(bykey)==46
    assert len({r['key'] for r in corpus})==46
    assert set(bykey)=={r['key'] for r in corpus}
    assert len(excluded)==len({r['key'] for r in excluded})==9
    assert not set(bykey)&{r['key'] for r in excluded}
    assert len(bib)==61
    assert Counter(r['venue'] for r in corpus)=={'TVCG':17,'EuroVis':7,'CHI':12,'UIST':1,'IUI':1,'PacificVis':8}
    def record(r,included):
        f=bib[r['key']]['fields'];doi=f['doi']
        assert doi.lower()==r['doi'].lower(),r['key']
        assert f['year']==r['publication_year'],r['key']
        codes={s:[m for m in bykey[r['key']][s].split(';') if m] for s in STAGES} if included else None
        if included:
            for s,ms in codes.items():
                assert len(set(ms))==len(ms) and set(ms)<=set(MODES),(r['key'],s)
                assert s=='PR' or 'U' not in ms
            assert any(codes.values())
        return dict(key=r['key'],system=r['system'],title=plain(f['title']),venue=r['venue'],year=int(f['year']),doi=doi,publication=plain(f.get('journal',f.get('booktitle',''))),authors=author_display(f['author']),source=r['source_url'],codes=codes,evidence=bykey[r['key']]['evidence'] if included else '',bibtex=bib[r['key']]['bibtex'])
    papers=[record(r,True) for r in corpus];excluded_records=[record(r,False) for r in excluded]
    cells={s:{m:None if m=='U' and s!='PR' else sum(m in p['codes'][s] for p in papers) for m in MODES} for s in STAGES}
    stage_counts={s:sum(bool(p['codes'][s]) for p in papers) for s in STAGES}
    mode_counts={m:sum(any(m in p['codes'][s] for s in STAGES) for p in papers) for m in MODES}
    single=sum(sum(bool(p['codes'][s]) for s in STAGES)==1 for p in papers)
    assert stage_counts=={'DP':15,'VM':20,'VT':20,'PR':16}
    assert mode_counts=={'G':46,'S':21,'P':24,'I':11,'U':4}
    assert single==26
    stats=dict(total=46,cells=cells,stages=stage_counts,modes=mode_counts,single=single,multi=46-single,venues=dict(Counter(p['venue'] for p in papers)))
    codebook_md='# Corpus coding definitions\n\n'
    for title,key in [('VA stages','stages'),('Interaction modes','modes')]:
        codebook_md+='## '+title+'\n\n'+''.join('- **'+x['code']+' — '+x['name']+':** '+x['definition']+'\n' for x in CODEBOOK[key])+'\n'
    codebook_md+='## Counting and interpretation\n\n'+''.join('- '+x+'\n' for x in CODEBOOK['rules'])
    codebook_md+='\nStage framework: Luo et al., https://arxiv.org/abs/2604.15813. Interaction modes adapted from Cheng et al. (2022), https://aclanthology.org/2022.naacl-main.33/.\n'
    (DATA/'CODEBOOK.md').write_text(codebook_md,encoding='utf-8')
    export_data=dict(version=VERSION,snapshot_date=SNAPSHOT,title='User Intervention in Human–LLM Collaborative Visual Analytics: A Survey',papers=papers,excluded=excluded_records,codebook=CODEBOOK,statistics=stats)
    (DATA/'explorer.json').write_text(json.dumps(export_data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    manifest=dict(version=VERSION,snapshot_date=SNAPSHOT,included_records=46,excluded_records=9,source_of_counts='stage_mode_crosswalk.csv',files={name:hashlib.sha256((DATA/name).read_bytes()).hexdigest() for name in ['corpus.csv','stage_mode_crosswalk.csv','excluded_candidates.csv','references.bib','CODEBOOK.md','explorer.json']})
    (DATA/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    assets={name:(DATA/name).read_text(encoding='utf-8-sig') for name in ['corpus.csv','stage_mode_crosswalk.csv','excluded_candidates.csv','references.bib','CODEBOOK.md','explorer.json','manifest.json']}
    payload={**export_data,'files':assets}
    template=(ROOT/'src/template.html').read_text(encoding='utf-8')
    app=(ROOT/'src/model.js').read_text(encoding='utf-8')+'\n'+(ROOT/'src/app.js').read_text(encoding='utf-8')
    styles=(ROOT/'src/secondary.css').read_text(encoding='utf-8')+'\n'+(ROOT/'src/style.css').read_text(encoding='utf-8-sig')
    html=template.replace('__STYLE__',styles).replace('__APP__',app).replace('__DATA_JSON__',json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
    assert all(token not in html for token in ['__STYLE__','__APP__','__DATA_JSON__'])
    (ROOT/'index.html').write_text(html,encoding='utf-8')
    print(json.dumps(dict(papers=46,excluded=9,stage_counts=stage_counts,mode_counts=mode_counts,single_stage=single,multi_stage=46-single,cells=cells,index_bytes=(ROOT/'index.html').stat().st_size),indent=2))

if __name__=='__main__':main()
