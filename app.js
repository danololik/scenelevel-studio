'use strict';

// SceneLevel Studio – lightweight, local-only, dependency-free carousel editor.
const $ = id => document.getElementById(id);
const ORANGE = '#f97316';
const DEFAULT_LOGO = './assets/logo_name_white.svg';
const TYPES = {
  birthday: { label: 'Narozeniny', fields: [ ['primary','Jméno'], ['secondary','Věk / druhý řádek'], ['detail','Známé filmy a seriály'] ], defaults: {primary:'Robert Patrick',secondary:'turns 68 today',detail:'Terminator 2 · The X-Files · Peacemaker'}, defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'} },
  news: { label:'Filmová novinka', fields:[['primary','Hlavní titulek'],['secondary','Doplňující titulek'],['detail','Další informace']],defaults:{primary:'Jack Sparrow could return',secondary:'',detail:''},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'}},
  memorial: { label:'In Memoriam', fields:[['primary','Jméno'],['secondary','Roky života'],['detail','Doplňující text']],defaults:{primary:'Jméno herce',secondary:'1950 – 2026',detail:''},defaultsColor:{primary:'#ffffff',secondary:'#d2d2d2',detail:'#aaa'}},
  role: { label:'Nejznámější role', fields:[['primary','Jméno postavy'],['secondary','Film / seriál'],['detail','Doplňující text']],defaults:{primary:'Jméno postavy',secondary:'Název filmu nebo seriálu',detail:''},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'}},
  closing: { label:'Rest in Peace', fields:[['primary','Hlavní text'],['secondary','Jméno'],['detail','Roky života']],defaults:{primary:'REST IN PEACE',secondary:'Jméno herce',detail:''},defaultsColor:{primary:'#ffffff',secondary:'#c8c8c8',detail:'#b0b0b0'}},
  cta: { label:'Závěrečný CTA', fields:[['primary','Slogan'],['secondary','Webová adresa'],['detail','Závěrečný text']],defaults:{primary:'TRACK MORE.\nDISCOVER MORE.',secondary:'SCENELEVEL.COM',detail:'Find out more at scenelevel.com'},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#ffffff'} }
};
function makeSlide(type='birthday'){
  const t=TYPES[type];
  return {id:makeId(),type,values:{...t.defaults}, highlights:{},photoData:'',zoom:100,x:0,y:0,bg:'#000000'};
}
function makeId(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function makeProject(){return {version:1,title:'Nový SceneLevel carousel',format:'4:5',logoData:'',slides:[makeSlide('birthday'),makeSlide('cta')],active:0};}
let state=makeProject();
let ready=false;
let saveTimer=null;
let toastTimer=null;
let rememberedSelection=null;
const imgCache=new Map();
const canvas=$('post-canvas');
const ctx=canvas.getContext('2d', {alpha:false});
const dims=()=>({w:1080,h:state.format==='9:16'?1920:1350});
const current=()=>state.slides[state.active];
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4300);}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeColor(c){return /^#[a-f\d]{6}$/i.test(c||'')?c:'#ffffff';}
function getImage(src){
  if(!src) return null;
  let entry=imgCache.get(src);
  if(entry) return entry;
  const image=new Image();
  entry={image,loaded:false,error:false,promise:null};
  entry.promise=new Promise(resolve=>{
    image.onload=()=>{entry.loaded=true;queuePreview();resolve(image);};
    image.onerror=()=>{entry.error=true;resolve(null);};
  });
  image.src=src;imgCache.set(src,entry);
  if(imgCache.size>32){for(const key of imgCache.keys()){if(key!==src){imgCache.delete(key);break;}}}
  return entry;
}
async function waitForImages(slide){await Promise.all([slide.photoData,state.logoData||DEFAULT_LOGO].filter(Boolean).map(s=>getImage(s).promise));}
let rendering=false;
function queuePreview(){if(rendering)return;rendering=true;requestAnimationFrame(()=>{rendering=false;drawPreview();});}
function drawPreview(){const d=dims();if(canvas.width!==d.w||canvas.height!==d.h){canvas.width=d.w;canvas.height=d.h;}renderSlide(ctx,current(),d.w,d.h);}
function drawImageCover(c,image,x,y,w,h,slide){
  if(!image)return;
  const baseScale=Math.max(w/image.width,h/image.height);
  const scale=baseScale*(slide.zoom||100)/100;
  const dw=image.width*scale,dh=image.height*scale;
  // Below 100 % allow the entire image to show with the selected background around it.
  // Panning works both when the photo is larger and when it is smaller than the frame.
  const panX=Math.abs(dw-w)/2,panY=Math.abs(dh-h)/2;
  const dx=x+(w-dw)/2+panX*(slide.x||0)/100;
  const dy=y+(h-dh)/2+panY*(slide.y||0)/100;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(image,dx,dy,dw,dh);c.restore();
}
function shade(c,bg,from,to,w,h){const grad=c.createLinearGradient(0,Math.max(0,from),0,Math.max(from+1,to));grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,bg);c.fillStyle=grad;c.fillRect(0,Math.max(0,from),w,h-Math.max(0,from));}
function rgb(c){const v=safeColor(c).slice(1);return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)];}
function drawLogo(c,cy,w,logo){
  const entry=getImage(logo||DEFAULT_LOGO);
  if(entry?.loaded){const im=entry.image;const maxW=w*0.23,maxH=57,scale=Math.min(maxW/im.width,maxH/im.height);c.drawImage(im,(w-im.width*scale)/2,cy,im.width*scale,im.height*scale);return;}
  // Image is loading; draw nothing instead of a fake mark that could appear in exports.
  // Exports explicitly wait for the bundled SVG. 
}
function fieldFont(type,field){
  if(field==='primary')return {font: type==='news'?98:type==='cta'?82:90,face:'Anton',line:1.16};
  if(field==='secondary')return {font:type==='cta'?64:61,face:type==='cta'?'Anton':'Oswald',line:1.24};
  return {font:type==='cta'?43:48,face:'Oswald',line:1.3};
}
function cssFont(c,face,size){c.font=`${Math.round(size)}px "${face}", Impact, sans-serif`;}
function splitParagraphWithIndexes(c,text,startIndex,maxWidth){
  // Token-based wrapping preserves individual character indexes for per-letter coloring.
  const out=[];let line=[];let width=0;let lastSpace=-1;
  const flush=()=>{while(line.length&&line[line.length-1].ch===' ')line.pop();out.push(line);line=[];width=0;lastSpace=-1;};
  for(let i=0;i<text.length;i++){
    const ch=text[i],cw=c.measureText(ch).width;
    if(!line.length&&ch===' ')continue;
    line.push({ch,index:i+startIndex,width:cw});width+=cw;
    if(ch===' ')lastSpace=line.length-1;
    if(width>maxWidth&&line.length>1){
      if(lastSpace>0){const next=line.splice(lastSpace+1);line.splice(-1,1);flush();line=next;while(line.length&&line[0].ch===' ')line.shift();}
      else {const over=line.pop();flush();line=[over];}
      width=line.reduce((n,v)=>n+v.width,0);
      lastSpace=line.findLastIndex(v=>v.ch===' ');
    }
  }
  flush();return out;
}
function getLines(c,text,fontSize,face,maxWidth){
  cssFont(c,face,fontSize);const paragraphs=String(text??'').split('\n');const out=[];let offset=0;
  for(const para of paragraphs){if(!para){out.push([]);}else out.push(...splitParagraphWithIndexes(c,para,offset,maxWidth));offset+=para.length+1;}
  return out;
}
function fitText(c,slide,field,w,base){
  const text=slide.values[field]||'';const cfg=fieldFont(slide.type,field);
  if(!text.trim())return null;
  let size=base??cfg.font;let lines=getLines(c,text,size,cfg.face,w);
  const maxLines=field==='primary'?5:field==='secondary'?4:3;
  while((lines.length>maxLines||lines.some(line=>line.reduce((n,v)=>n+v.width,0)>w+2))&&size>29){size-=2;lines=getLines(c,text,size,cfg.face,w);}
  return {field,text,lines,face:cfg.face,size,lineHeight:size*cfg.line,height:lines.length*size*cfg.line};
}
function drawRich(c,slide,layout,top,w){
  c.textBaseline='alphabetic';cssFont(c,layout.face,layout.size);
  const baseColor=safeColor(TYPES[slide.type]?.defaultsColor[layout.field]||'#fff');
  const accent=slide.highlights?.[layout.field]||{};
  let y=top+layout.size;
  for(const line of layout.lines){
    const lineW=line.reduce((n,it)=>n+it.width,0);let x=(w-lineW)/2;
    for(const item of line){const col=accent[item.index]||baseColor;c.fillStyle=safeColor(col);c.fillText(item.ch,x,y);x+=item.width;}
    y+=layout.lineHeight;
  }
}
function renderSlide(c,slide,w,h){
  const bg=safeColor(slide.bg||'#000000');c.clearRect(0,0,w,h);c.fillStyle=bg;c.fillRect(0,0,w,h);
  const photo=getImage(slide.photoData);const photoImg=photo?.loaded?photo.image:null;
  const isCta=slide.type==='cta';
  if(isCta){renderCTA(c,slide,w,h,photoImg,bg);return;}
  const maxTextW=w-100;
  const layouts=['primary','secondary','detail'].map(field=>fitText(c,slide,field,maxTextW)).filter(Boolean);
  const gaps=layouts.map((_,i)=>i===0?0:i===1?18:32);
  const textBlockHeight=layouts.reduce((n,it,i)=>n+it.height+gaps[i],0);
  const logoHeight=56,logoGap=36;
  const footerMargin=h===1920?250:105;
  const totalHeight=textBlockHeight+logoHeight+logoGap;
  const start=Math.max(h===1920?650:525,h-footerMargin-totalHeight);
  if(photoImg)drawImageCover(c,photoImg,0,0,w,h,slide);
  shade(c,bg,start-300,start+38,w,h);
  // A subtle gradient grounds the text without a visible rectangular cut-off.
  drawLogo(c,start,w,state.logoData);
  let y=start+logoHeight+logoGap;
  for(let i=0;i<layouts.length;i++){y+=gaps[i];drawRich(c,slide,layouts[i],y,w);y+=layouts[i].height;}
}
function renderCTA(c,slide,w,h,photoImg,bg){
  if(photoImg){
    // The photo blends into the same dark background at BOTH edges, like the PSD.
    // Transitions are tied to the photo region, not to the surrounding text.
    const photoTop=Math.round(h*0.29);
    const photoBottom=Math.round(h*0.95);
    const photoHeight=photoBottom-photoTop;
    drawImageCover(c,photoImg,0,photoTop,w,photoHeight,slide);
    const [r,g,b]=rgb(bg);
    const upper=Math.round(photoHeight*0.40);
    const lower=Math.round(photoHeight*0.34);
    const topFade=c.createLinearGradient(0,photoTop,0,photoTop+upper);
    topFade.addColorStop(0,`rgba(${r},${g},${b},1)`);
    topFade.addColorStop(1,`rgba(${r},${g},${b},0)`);
    c.fillStyle=topFade;c.fillRect(0,photoTop,w,upper+1);
    const bottomFade=c.createLinearGradient(0,photoBottom-lower,0,photoBottom);
    bottomFade.addColorStop(0,`rgba(${r},${g},${b},0)`);
    bottomFade.addColorStop(1,`rgba(${r},${g},${b},1)`);
    c.fillStyle=bottomFade;c.fillRect(0,photoBottom-lower,w,lower+1);
  }
  drawLogo(c,h===1920?140:70,w,state.logoData);
  const maxW=w-100;
  const top=h===1920?350:250;
  const one=fitText(c,slide,'primary',maxW,82),two=fitText(c,slide,'secondary',maxW,64),three=fitText(c,slide,'detail',maxW,43);
  if(one)drawRich(c,slide,one,top,w);
  if(two)drawRich(c,slide,two,top+(one?.height||0)+55,w);
  if(three)drawRich(c,slide,three,h-(h===1920?285:165)-three.height,w);
}
async function initFonts(){try{await Promise.all([document.fonts.load('90px Anton'),document.fonts.load('60px Oswald')]);}catch{}queuePreview();}
function renderFields(){
  const slide=current(),def=TYPES[slide.type];
  $('slide-type').value=slide.type;$('slide-badge').textContent=`${String(state.active+1).padStart(2,'0')} / ${String(state.slides.length).padStart(2,'0')}`;
  $('workspace-title').textContent=def.label;
  $('text-fields').innerHTML=def.fields.map(([key,label])=>`<div class="field-row"><label for="field-${key}">${esc(label)}</label><textarea id="field-${key}" data-field="${key}" rows="${key==='primary'?2:1}" spellcheck="false">${esc(slide.values[key]??'')}</textarea></div>`).join('');
  for(const text of $('text-fields').querySelectorAll('textarea')){
    const field=text.dataset.field;
    const record=()=>{rememberedSelection={field,start:text.selectionStart,end:text.selectionEnd};};
    ['select','keyup','mouseup','touchend','focus'].forEach(evt=>text.addEventListener(evt,record));
    text.addEventListener('input',()=>{slide.values[field]=text.value;slide.highlights[field]={};record();queuePreview();scheduleSave();});
  }
  $('photo-zoom').value=slide.zoom;$('zoom-value').value=`${slide.zoom} %`;$('zoom-value').textContent=`${slide.zoom} %`;
  $('photo-x').value=slide.x;$('photo-y').value=slide.y;$('background').value=safeColor(slide.bg);
}
function deleteSlideAt(i){
  if(state.slides.length<=1){toast('V projektu musí zůstat alespoň jeden snímek.');return;}
  state.slides.splice(i,1);
  if(i<state.active)state.active--;
  else if(i===state.active)state.active=Math.min(i,state.slides.length-1);
  syncUI();scheduleSave();toast('Snímek odstraněn.');
}
function renderSlides(){
  $('slide-strip').innerHTML=state.slides.map((slide,i)=>`<div class="slide-item"><button type="button" class="slide-thumb ${i===state.active?'active':''}" data-i="${i}" aria-label="Otevřít snímek ${i+1}"><span class="slide-number">${String(i+1).padStart(2,'0')}</span><span class="slide-thumbnail">${esc((slide.values.primary||'SLIDE').slice(0,32))}</span><span class="slide-caption">${esc(TYPES[slide.type]?.label||slide.type)}</span></button><button type="button" class="slide-remove" data-remove="${i}" aria-label="Smazat snímek ${i+1}" title="Smazat snímek" ${state.slides.length<=1?'disabled':''}>×</button></div>`).join('');
  $('slide-strip').querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{state.active=Number(el.dataset.i);syncUI();scheduleSave();});
  $('slide-strip').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>deleteSlideAt(Number(el.dataset.remove)));
  $('move-left').disabled=state.active===0;$('move-right').disabled=state.active>=state.slides.length-1;$('delete-slide').disabled=state.slides.length<=1;
}
function syncUI(){ $('project-title').value=state.title;$('format').value=state.format;rememberedSelection=null;renderFields();renderSlides();queuePreview(); }
function scheduleSave(){if(!ready)return;$('save-state').textContent='Ukládání…';clearTimeout(saveTimer);saveTimer=setTimeout(saveProject,500);}
function db(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));const r=indexedDB.open('scenelevel-studio-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function loadProject(){const database=await db();try{return await new Promise((resolve,reject)=>{const transaction=database.transaction('kv','readonly');const req=transaction.objectStore('kv').get('project');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}finally{database.close();}}
async function saveProject(){if(!ready)return;let database;try{database=await db();await new Promise((resolve,reject)=>{const tx=database.transaction('kv','readwrite');tx.objectStore('kv').put(state,'project');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});$('save-state').textContent='Uloženo v zařízení ✓';}catch(e){$('save-state').textContent='Uložení selhalo';toast('Koncept se nepodařilo uložit. Stáhni si raději zálohu projektu.');console.error(e);}finally{database?.close();}}
async function setPhoto(file){
  if(!file?.type?.startsWith('image/')){toast('Ve schránce není podporovaný obrázek.');return;}
  const destination=current();
  try{
    const data=await encodeImage(file);
    destination.photoData=data;
    destination.zoom=100;destination.x=0;destination.y=0;
    renderFields();queuePreview();scheduleSave();
    toast('Fotografie vložena. Nyní ji můžeš přiblížit, oddálit nebo posunout.');
  }catch(err){console.error(err);toast('Fotografii nelze vložit. Zkus ji stáhnout jako JPG nebo PNG.');}
}
async function pasteViaButton(){
  if(!navigator.clipboard?.read){toast('Prohlížeč nepodporuje přímé čtení obrázků. Na počítači použij Ctrl+V / Cmd+V, na telefonu vyber fotografii.');return;}
  try{
    const items=await navigator.clipboard.read();
    for(const item of items){
      const type=item.types.find(t=>t.startsWith('image/'));
      if(type){const blob=await item.getType(type);await setPhoto(new File([blob],'vlozeny-obrazek',{type}));return;}
    }
    toast('Ve schránce není přímo obrázek. Zkopíruj obrázek (ne jeho odkaz) nebo ho vyber ze zařízení.');
  }catch(e){console.warn('Clipboard read unavailable',e);toast('Prohlížeč nepovolil přístup ke schránce. Na počítači zkus Ctrl+V / Cmd+V.');}
}
function bind(){
  $('project-title').addEventListener('input',e=>{state.title=e.target.value;scheduleSave();});
  $('format').addEventListener('change',e=>{state.format=e.target.value;queuePreview();scheduleSave();});
  $('slide-type').addEventListener('change',e=>{const old=current(),t=e.target.value;state.slides[state.active]={...makeSlide(t),id:old.id,photoData:old.photoData,zoom:old.zoom,x:old.x,y:old.y,bg:old.bg};syncUI();scheduleSave();});
  for(const [id,key] of [['photo-zoom','zoom'],['photo-x','x'],['photo-y','y'],['background','bg']])$(id).addEventListener('input',e=>{current()[key]=key==='bg'?e.target.value:Number(e.target.value);if(key==='zoom')$('zoom-value').textContent=e.target.value+' %';queuePreview();scheduleSave();});
  $('photo-upload').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await setPhoto(file);e.target.value='';});
  $('logo-upload').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{state.logoData=await readDataURL(file);queuePreview();scheduleSave();toast('Logo bylo přiřazeno všem snímkům.');}catch{toast('Logo se nepodařilo načíst.');}e.target.value='';});
  $('remove-image').addEventListener('click',()=>{current().photoData='';queuePreview();scheduleSave();});
  $('reset-image').addEventListener('click',()=>{const slide=current();slide.zoom=100;slide.x=0;slide.y=0;renderFields();queuePreview();scheduleSave();});
  $('paste-image').addEventListener('click',pasteViaButton);
  document.addEventListener('paste',async e=>{
    const file=Array.from(e.clipboardData?.items||[]).find(item=>item.type.startsWith('image/'))?.getAsFile();
    if(!file)return; // Regular text paste must continue to work normally.
    e.preventDefault();await setPhoto(file);
  });
  // Drag a saved image from a file manager directly onto the preview.
  canvas.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.items||[]).some(item=>item.kind==='file'))e.preventDefault();});
  canvas.addEventListener('drop',async e=>{const file=Array.from(e.dataTransfer?.files||[]).find(file=>file.type.startsWith('image/'));if(!file)return;e.preventDefault();await setPhoto(file);});
  $('highlight-apply').addEventListener('click',()=>markSelection($('highlight-color').value));
  $('highlight-clear').addEventListener('click',()=>markSelection(null));
  $('add-slide').addEventListener('click',()=>{const slide=makeSlide($('new-slide-type').value);const endIndex=state.slides.length-1;const insertBeforeLast=state.slides[endIndex]?.type==='cta'&&endIndex>=state.active;const index=insertBeforeLast?endIndex:state.active+1;state.slides.splice(index,0,slide);state.active=index;syncUI();scheduleSave();});
  $('duplicate-slide').addEventListener('click',()=>{const copy=structuredClone(current());copy.id=makeId();state.slides.splice(state.active+1,0,copy);state.active++;syncUI();scheduleSave();});
  $('delete-slide').addEventListener('click',()=>deleteSlideAt(state.active));
  for(const [id,dx]of [['move-left',-1],['move-right',1]])$(id).addEventListener('click',()=>{const to=state.active+dx;if(to<0||to>=state.slides.length)return;[state.slides[state.active],state.slides[to]]=[state.slides[to],state.slides[state.active]];state.active=to;syncUI();scheduleSave();});
  $('export-one').addEventListener('click',()=>exportOne());
  $('export-all').addEventListener('click',()=>exportAll());
  $('project-download').addEventListener('click',()=>{downloadBlob(new Blob([JSON.stringify(state)],{type:'application/json'}),`${slug(state.title)||'scenelevel'}-projekt.json`);});
  $('project-import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const item=JSON.parse(await file.text());if(!validateProject(item))throw Error('Invalid project');state=item;state.active=Math.min(Math.max(0,state.active||0),state.slides.length-1);syncUI();scheduleSave();toast('Projekt obnoven ze zálohy.');}catch{toast('Neplatný soubor projektu.');}e.target.value='';});
  let gesture=null;
  canvas.addEventListener('pointerdown',e=>{if(!current().photoData)return;gesture={x:e.clientX,y:e.clientY,ox:current().x,oy:current().y};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
  canvas.addEventListener('pointermove',e=>{if(!gesture)return;const rect=canvas.getBoundingClientRect();current().x=Math.max(-100,Math.min(100,gesture.ox+(e.clientX-gesture.x)/rect.width*200));current().y=Math.max(-100,Math.min(100,gesture.oy+(e.clientY-gesture.y)/rect.height*220));$('photo-x').value=current().x;$('photo-y').value=current().y;queuePreview();});
  function release(){if(gesture){gesture=null;canvas.style.cursor='grab';scheduleSave();}}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
}
function markSelection(color){
  const s=rememberedSelection;const text=s?$('field-'+s.field):null;
  if(!s||!text||s.end<=s.start){$('highlight-feedback').textContent='Nejdřív označ slovo nebo jednotlivá písmena v textovém poli.';return;}
  const slide=current();const range=slide.highlights[s.field]||{};
  for(let i=s.start;i<s.end;i++){if(color)range[i]=safeColor(color);else delete range[i];}
  slide.highlights[s.field]=range;queuePreview();scheduleSave();$('highlight-feedback').textContent=`Upraveno ${s.end-s.start} znaků.`;
}
function readDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});}
function encodeImage(file){return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file);const im=new Image();
  im.onload=()=>{try{const max=2600,ratio=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*ratio));c.height=Math.max(1,Math.round(im.height*ratio));const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.94));}catch(err){reject(err);}finally{URL.revokeObjectURL(url);}};
  im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Unsupported image'));};im.src=url;
});}
function validateProject(p){return p&&p.version===1&&['4:5','9:16'].includes(p.format)&&Array.isArray(p.slides)&&p.slides.length>=1&&p.slides.length<1000&&p.slides.every(s=>TYPES[s.type]&&typeof s.values==='object'&&typeof s.photoData==='string');}
function slug(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45);}
function outputName(slide,i){return `scenelevel-${String(i+1).padStart(2,'0')}-${slide.type}.png`;}
function canvasBlob(c){return new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'));}
async function makePng(slide){await waitForImages(slide);await document.fonts.ready;const {w,h}=dims();const c=document.createElement('canvas');c.width=w;c.height=h;renderSlide(c.getContext('2d',{alpha:false}),slide,w,h);return canvasBlob(c);}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
async function exportOne(){const b=$('export-one');b.disabled=true;b.textContent='Exportuji…';try{const blob=await makePng(current());const name=outputName(current(),state.active);const file=new File([blob],name,{type:'image/png'});if(/iPhone|iPad|iPod/.test(navigator.userAgent)&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'SceneLevel Studio'});}catch(e){if(e.name!=='AbortError')downloadBlob(blob,name);}}else downloadBlob(blob,name);toast('PNG je připravené v rozlišení '+dims().w+' × '+dims().h+'.');}catch(e){console.error(e);toast('PNG export se nezdařil.');}finally{b.disabled=false;b.textContent='Uložit PNG';}}
function crc32(data){let crc=-1;for(let i=0;i<data.length;i++){crc^=data[i];for(let b=0;b<8;b++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;}return(crc^(-1))>>>0;}
function writeZip(files){
  // ZIP STORE, no external JS library / network required. Files are already compressed PNG.
  const local=[],central=[];let offset=0;
  const enc=new TextEncoder();
  const put=(buf,offset,v,bytes)=>{const view=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);if(bytes===2)view.setUint16(offset,v,true);else view.setUint32(offset,v,true);};
  for(const f of files){const name=enc.encode(f.name),bytes=f.data,crc=crc32(bytes);
    const lh=new Uint8Array(30+name.length);put(lh,0,0x04034b50,4);put(lh,4,20,2);put(lh,14,crc,4);put(lh,18,bytes.length,4);put(lh,22,bytes.length,4);put(lh,26,name.length,2);lh.set(name,30);
    local.push(lh,bytes);
    const ch=new Uint8Array(46+name.length);put(ch,0,0x02014b50,4);put(ch,4,20,2);put(ch,6,20,2);put(ch,16,crc,4);put(ch,20,bytes.length,4);put(ch,24,bytes.length,4);put(ch,28,name.length,2);put(ch,42,offset,4);ch.set(name,46);central.push(ch);
    offset+=lh.length+bytes.length;
  }
  const cenSize=central.reduce((n,x)=>n+x.length,0);const end=new Uint8Array(22);put(end,0,0x06054b50,4);put(end,8,files.length,2);put(end,10,files.length,2);put(end,12,cenSize,4);put(end,16,offset,4);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
async function exportAll(){const b=$('export-all');b.disabled=true;try{const files=[];for(let i=0;i<state.slides.length;i++){$('save-state').textContent=`Exportuji ${i+1}/${state.slides.length}…`;const png=await makePng(state.slides[i]);files.push({name:outputName(state.slides[i],i),data:new Uint8Array(await png.arrayBuffer())});}const zip=writeZip(files);downloadBlob(zip,`${slug(state.title)||'scenelevel'}-carousel.zip`);toast(`Hotovo: ${files.length} PNG snímků v ZIP archivu.`);}catch(e){console.error(e);toast('Export carouselu se nezdařil. Zkus exportovat snímky po jednom.');}finally{b.disabled=false;$('save-state').textContent='Uloženo v zařízení ✓';}}
(async function boot(){bind();try{const existing=await loadProject();if(validateProject(existing))state=existing;}catch(e){console.warn('Local storage unavailable',e);$('save-state').textContent='Ukládání není dostupné';}ready=true;syncUI();initFonts();if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});} })();
