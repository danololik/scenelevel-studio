'use strict';

// SceneLevel Studio v0.5 – lightweight, local-only, dependency-free carousel editor.
window.__SCENELEVEL_STUDIO_VERSION = '1.0.0';
const $ = id => document.getElementById(id);
const ORANGE = '#f97316';
const DEFAULT_LOGO = './assets/logo_name_white.svg';
const DEFAULT_CTA_LOGO = './assets/logo_name_colour.svg';
const TYPES = {
  birthday: { label: 'Narozeniny', fields: [ ['primary','Jméno'], ['secondary','Věk / druhý řádek'], ['detail','Známé filmy a seriály'] ], defaults: {primary:'Robert Patrick',secondary:'turns 68 today',detail:'Terminator 2 · The X-Files · Peacemaker'}, defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'} },
  news: { label:'Filmová novinka', fields:[['primary','Hlavní titulek'],['secondary','Doplňující titulek'],['detail','Další informace']],defaults:{primary:'Jack Sparrow could return',secondary:'',detail:''},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'}},
  newsinfo: {label:'Novinka – další informace',fields:[['primary','Text k novince'],['secondary','Doplňující řádek']],defaults:{primary:'Here you can add more details about the story, the cast, or the production. Each information slide has its own image and text.',secondary:'',detail:''},defaultsColor:{primary:'#eeeeee',secondary:'#b8b8b8',detail:'#b8b8b8'}},
  memorial: { label:'In Memoriam', fields:[['primary','Jméno'],['secondary','Roky života'],['detail','Doplňující text']],defaults:{primary:'Jméno herce',secondary:'1950 – 2026',detail:''},defaultsColor:{primary:'#ffffff',secondary:'#d2d2d2',detail:'#aaa'}},
  role: { label:'Nejznámější role', fields:[['primary','Jméno postavy'],['secondary','Film / seriál'],['detail','Doplňující text']],defaults:{primary:'Jméno postavy',secondary:'Název filmu nebo seriálu',detail:''},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#b8b8b8'}},
  closing: { label:'Rest in Peace', fields:[['primary','Hlavní text'],['secondary','Jméno'],['detail','Roky života']],defaults:{primary:'REST IN PEACE',secondary:'Jméno herce',detail:''},defaultsColor:{primary:'#ffffff',secondary:'#c8c8c8',detail:'#b0b0b0'}},
  cta: { label:'Závěrečný CTA', fields:[['primary','Slogan'],['secondary','Webová adresa'],['detail','Závěrečný text']],defaults:{primary:'TRACK MORE.\nDISCOVER MORE.',secondary:'SCENELEVEL.COM',detail:'Find out who you share a birthday with at:\nscenelevel.com'},defaultsColor:{primary:'#ffffff',secondary:ORANGE,detail:'#ffffff'} }
};
function makeSlide(type='birthday'){
  const t=TYPES[type];
  return {id:makeId(),type,values:{...t.defaults}, highlights:{},photoData:'',zoom:100,x:0,y:0,bg:'#000000'};
}
function makeId(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
function makeProject(template='birthday'){
  const slides=template==='news'?[makeSlide('news'),makeSlide('newsinfo'),makeSlide('cta')]:template==='memorial'?[makeSlide('memorial'),makeSlide('role'),makeSlide('closing')]:template==='blank'?[makeSlide('birthday')]:[makeSlide('birthday'),makeSlide('cta')];
  if(template==='news')slides[2].values.detail='Read the full story at:\nscenelevel.com';
  if(template==='blank')slides[0].values={primary:'',secondary:'',detail:''};
  const names={birthday:'Narozeninový carousel',news:'Filmová novinka',memorial:'In Memoriam',blank:'Nový projekt'};
  return {id:makeId(),version:1,title:names[template]||names.blank,format:'4:5',logoData:'',slides,active:0,createdAt:Date.now(),updatedAt:Date.now()};
}
// Existing v0.3 projects may have only a cover and a CTA. Bring them to the
// PSD's three-part structure without deleting or overwriting any user content.
function ensureNewsStructure(project) {
  if (!project?.slides?.length || project.slides[0]?.type !== 'news') return false;
  if (project.slides.some(slide => slide.type === 'newsinfo')) return false;
  const lastCta = project.slides.findLastIndex(slide => slide.type === 'cta');
  project.slides.splice(lastCta < 0 ? project.slides.length : lastCta, 0, makeSlide('newsinfo'));
  if (typeof project.active !== 'number' || project.active < 0) project.active = 0;
  else if (lastCta >= 0 && project.active >= lastCta) project.active += 1;
  return true;
}
let state=makeProject();
let projectList=[];
let openedProject=false;
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
async function waitForImages(slide){await Promise.all([slide.photoData,state.logoData||(slide.type==='cta'?DEFAULT_CTA_LOGO:DEFAULT_LOGO)].filter(Boolean).map(s=>getImage(s).promise));}
let rendering=false;
function queuePreview(){if(rendering)return;rendering=true;requestAnimationFrame(()=>{rendering=false;drawPreview();});}
function drawPreview(){const d=dims();if(canvas.width!==d.w||canvas.height!==d.h){canvas.width=d.w;canvas.height=d.h;}renderSlide(ctx,current(),d.w,d.h);}
function drawImageCover(c,image,x,y,w,h,slide){
  if(!image)return;
  // 100% = cover the image area; native source resolution never changes the zoom percentage.
  // Very small zoom (down to 1%) intentionally shows the background around the photo.
  const baseScale=Math.max(w/image.width,h/image.height);
  const scale=baseScale*Math.max(1,Math.min(500,Number(slide.zoom)||100))/100;
  const dw=image.width*scale,dh=image.height*scale;
  // X/Y are normalized to the picture frame, so small images can still be freely moved.
  const dx=x+(w-dw)/2+(Number(slide.x)||0)*w/200;
  const dy=y+(h-dh)/2+(Number(slide.y)||0)*h/200;
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
  if(slide.type==='newsinfo'){renderNewsInfo(c,slide,w,h,photoImg,bg);return;}
  const maxTextW=w-100;
  const layouts=['primary','secondary','detail'].map(field=>fitText(c,slide,field,maxTextW)).filter(Boolean);
  const gaps=layouts.map((_,i)=>i===0?0:i===1?18:32);
  const textBlockHeight=layouts.reduce((n,it,i)=>n+it.height+gaps[i],0);
  const logoHeight=56,logoGap=36;
  const footerMargin=h===1920?155:72;
  const totalHeight=textBlockHeight+logoHeight+logoGap;
  const start=Math.max(80,h-footerMargin-totalHeight);
  if(photoImg)drawImageCover(c,photoImg,0,0,w,h,slide);
  shade(c,bg,start-300,start+38,w,h);
  // A subtle gradient grounds the text without a visible rectangular cut-off.
  drawLogo(c,start,w,state.logoData);
  let y=start+logoHeight+logoGap;
  for(let i=0;i<layouts.length;i++){y+=gaps[i];drawRich(c,slide,layouts[i],y,w);y+=layouts[i].height;}
}
// News continuation: follows the second slide in the actual Photoshop PSD (photo / white logo / paragraph).
// The caption expands within its allocated bottom area and shrinks text to avoid overflow.
function renderNewsInfo(c,slide,w,h,photoImg,bg){
  // Text drives the black footer, not a fixed percentage of the slide.
  // Layout is bottom-anchored; longer copy pushes the logo and the fade higher.
  if(photoImg)drawImageCover(c,photoImg,0,0,w,h,slide);
  const tall=h/w>1.5;
  const bottomPadding=tall?135:80;
  const maxWidth=w-110;
  const fields=['primary','secondary'].filter(field=>String(slide.values[field]||'').trim());
  const gap=fields.length===2?22:0;
  const logoHeight=57;
  const logoToText=34;
  const minTop=tall?280:165;
  const available=Math.max(100,h-bottomPadding-minTop-logoHeight-logoToText-gap);
  let layouts=[];
  for(let fontSize=58;fontSize>=18;fontSize-=2){
    layouts=fields.map((field,i)=>{
      const size=i===1?Math.max(17,Math.round(fontSize*.82)):fontSize;
      const face='Oswald';
      const lines=getLines(c,slide.values[field],size,face,maxWidth);
      return {field,face,size,lines,lineHeight:size*1.21,height:lines.length*size*1.21};
    });
    const total=layouts.reduce((n,v)=>n+v.height,0);
    if(total<=available && layouts.every(v=>v.lines.every(line=>line.reduce((n,ch)=>n+ch.width,0)<=maxWidth+2)))break;
  }
  const textHeight=layouts.reduce((n,v)=>n+v.height,0)+gap;
  const logoTop=Math.max(minTop,h-bottomPadding-textHeight-logoToText-logoHeight);
  const fadeStart=Math.max(0,logoTop-(tall?325:260));
  const fadeEnd=Math.min(h,logoTop+logoHeight+15);
  const [r,g,b]=rgb(bg);
  const fade=c.createLinearGradient(0,fadeStart,0,Math.max(fadeStart+1,fadeEnd));
  fade.addColorStop(0,`rgba(${r},${g},${b},0)`);
  fade.addColorStop(.66,`rgba(${r},${g},${b},.89)`);
  fade.addColorStop(1,`rgba(${r},${g},${b},1)`);
  c.fillStyle=fade;c.fillRect(0,fadeStart,w,fadeEnd-fadeStart);
  c.fillStyle=bg;c.fillRect(0,fadeEnd,w,h-fadeEnd);
  drawLogo(c,logoTop,w,state.logoData);
  let top=logoTop+logoHeight+logoToText;
  for(let i=0;i<layouts.length;i++){
    if(i)top+=gap;
    drawRich(c,slide,layouts[i],top,w);
    top+=layouts[i].height;
  }
}
function drawCtaLogo(c,top,w,logo){
  const entry=getImage(logo||DEFAULT_CTA_LOGO);
  if(!entry?.loaded)return;
  const image=entry.image;
  const scale=Math.min(w*.49/image.width,(w*.145)/image.height);
  const dw=image.width*scale,dh=image.height*scale;
  c.drawImage(image,(w-dw)/2,top,dw,dh);
}
function defaultCtaColor(slide,field,index){
  const text=String(slide.values[field]||'');
  const color='#ffffff';
  if(field==='primary'){
    // In the original design, the word before MORE is orange on each line.
    const lines=text.split('\n');let offset=0;
    for(const line of lines){const m=line.match(/^(.*?)\s+MORE\b/i);
      if(m&&index>=offset&&index<offset+m[1].length)return ORANGE;
      offset+=line.length+1;
    }
    return color;
  }
  if(field==='secondary'){
    const match=/LEVEL/i.exec(text);return match&&index>=match.index&&index<match.index+match[0].length?ORANGE:color;
  }
  if(field==='detail'){
    const lower=text.toLowerCase();
    // The footer's domain is orange except for the .com suffix.
    let at=lower.indexOf('scenelevel.com');
    if(at!==-1&&index>=at&&index<at+'scenelevel'.length)return ORANGE;
    return color;
  }
  return color;
}
function drawCtaField(c,slide,field,top,maxHeight,maxW,w,baseSize,lineMult=1.17){
  const txt=String(slide.values[field]||'');if(!txt.trim())return;
  let size=baseSize,lines=[];
  do{
    lines=getLines(c,txt,size,'Anton',maxW);
    if(lines.length*size*lineMult<=maxHeight&&lines.every(line=>line.reduce((sum,ch)=>sum+ch.width,0)<=maxW+1))break;
    size-=2;
  }while(size>=27);
  cssFont(c,'Anton',size);c.textBaseline='alphabetic';
  const gap=size*lineMult;
  const yStart=top+(maxHeight-lines.length*gap)/2+size;
  for(const [lineIndex,line] of lines.entries()){
    let x=(w-line.reduce((sum,ch)=>sum+ch.width,0))/2;
    const y=yStart+lineIndex*gap;
    for(const ch of line){
      c.fillStyle=safeColor(slide.highlights?.[field]?.[ch.index]||defaultCtaColor(slide,field,ch.index));
      c.fillText(ch.ch,x,y);x+=ch.width;
    }
  }
}
function renderCTA(c,slide,w,h,photoImg,bg){
  // Source reference: SceneLevel's actual Instagram closing card.
  // The logo, two-tone slogan, two-tone URL and TWO-LINE footer are separate zones.
  const tall=h/w>1.5;
  const topPhoto=tall?Math.round(h*.36):Math.round(h*.40);
  const bottomPhoto=tall?Math.round(h*.89):Math.round(h*.91);
  if(photoImg){
    drawImageCover(c,photoImg,0,topPhoto,w,bottomPhoto-topPhoto,slide);
    const [r,g,b]=rgb(bg);
    const topLength=tall?210:170;
    const bottomLength=tall?260:195;
    const upper=c.createLinearGradient(0,topPhoto,0,topPhoto+topLength);
    upper.addColorStop(0,`rgba(${r},${g},${b},1)`);
    upper.addColorStop(.4,`rgba(${r},${g},${b},.72)`);
    upper.addColorStop(1,`rgba(${r},${g},${b},0)`);
    c.fillStyle=upper;c.fillRect(0,topPhoto,w,topLength+1);
    const lower=c.createLinearGradient(0,bottomPhoto-bottomLength,0,bottomPhoto);
    lower.addColorStop(0,`rgba(${r},${g},${b},0)`);
    lower.addColorStop(.62,`rgba(${r},${g},${b},.77)`);
    lower.addColorStop(1,`rgba(${r},${g},${b},1)`);
    c.fillStyle=lower;c.fillRect(0,bottomPhoto-bottomLength,w,bottomLength+1);
  }
  drawCtaLogo(c,tall?82:55,w,state.logoData);
  // Fixed, non-overlapping text areas reproduce the design of the PSD reference.
  drawCtaField(c,slide,'primary',tall?325:257,tall?235:180,w-95,w,tall?91:91,1.12);
  drawCtaField(c,slide,'secondary',tall?552:456,tall?105:102,w-85,w,91);
  // No footer text is placed across the middle of the image.
  drawCtaField(c,slide,'detail',tall?h-260:h-184,tall?170:142,w-95,w,tall?52:52,1.28);
}
async function initFonts(){try{await Promise.all([document.fonts.load('90px Anton'),document.fonts.load('60px Oswald')]);}catch{}queuePreview();}
function clampZoom(n){return Math.max(1,Math.min(500,Math.round(Number(n)||1)));}
function syncPhotoControls(){
  const slide=current();const z=clampZoom(slide.zoom);
  slide.zoom=z;
  $('photo-zoom').value=z;$('zoom-value').value=`${z} %`;$('zoom-value').textContent=`${z} %`;
  $('quick-zoom').value=z;$('quick-zoom-value').textContent=`${z} %`;
  const enabled=Boolean(slide.photoData);
  for(const id of ['quick-zoom','quick-minus','quick-plus','quick-reset'])$(id).disabled=!enabled;
}
function setZoom(value,persist=true){
  current().zoom=clampZoom(value);syncPhotoControls();queuePreview();
  if(persist)scheduleSave();
}
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
  syncPhotoControls();
  $('photo-x').value=slide.x;$('photo-y').value=slide.y;$('background').value=safeColor(slide.bg);
}
function deleteSlideAt(i){
  if(!window.confirm(`Opravdu chceš smazat snímek ${i+1} z ${state.slides.length}? Tuto akci nelze vrátit.`))return;
  if(state.slides.length<=1){toast('V projektu musí zůstat alespoň jeden snímek.');return;}
  state.slides.splice(i,1);
  if(i<state.active)state.active--;
  else if(i===state.active)state.active=Math.min(i,state.slides.length-1);
  syncUI();scheduleSave();toast('Snímek odstraněn.');
}
function renderSlides(){
  // Each card has precisely one action: select the slide. Never overlay a delete button.
  $('slide-strip').innerHTML=state.slides.map((slide,i)=>`<button type="button" class="slide-thumb ${i===state.active?'active':''}" data-i="${i}" aria-label="Vybrat snímek ${i+1} z ${state.slides.length}: ${esc(TYPES[slide.type]?.label||slide.type)}" aria-pressed="${i===state.active}"><span class="slide-number">${String(i+1).padStart(2,'0')} / ${String(state.slides.length).padStart(2,'0')}</span><span class="slide-thumbnail">${esc((slide.values.primary||'SLIDE').slice(0,32))}</span><span class="slide-caption">${esc(TYPES[slide.type]?.label||slide.type)}</span></button>`).join('');
  $('slide-strip').querySelectorAll('[data-i]').forEach(el=>el.addEventListener('click',()=>{
    const index=Number(el.dataset.i);
    if(!Number.isInteger(index)||index<0||index>=state.slides.length)return;
    state.active=index;syncUI();scheduleSave();
  }));
  $('move-left').disabled=state.active===0;
  $('move-right').disabled=state.active>=state.slides.length-1;
  $('delete-slide').disabled=state.slides.length<=1;
}

function syncUI(){
  $('project-title').value=state.title;$('format').value=state.format;
  rememberedSelection=null;renderFields();renderSlides();queuePreview();
  $('new-slide-type').value=state.slides[0]?.type==='news'?'newsinfo':state.slides[0]?.type==='memorial'?'role':'birthday';
  $('add-news-info').hidden=state.slides[0]?.type!=='news';
  $('add-news-info').textContent='＋ Přidat informační snímek';
  $('slide-structure-hint').hidden=state.slides[0]?.type!=='news';
}
function scheduleSave(){if(!ready||!openedProject)return;$('save-state').textContent='Ukládání…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveProject().catch(console.error);},450);}
function db(){return new Promise((resolve,reject)=>{
  if(!('indexedDB'in window))return reject(Error('IndexedDB unavailable'));
  const req=indexedDB.open('scenelevel-studio-v1',2);
  req.onupgradeneeded=()=>{const database=req.result;if(!database.objectStoreNames.contains('kv'))database.createObjectStore('kv');if(!database.objectStoreNames.contains('projects'))database.createObjectStore('projects',{keyPath:'id'});};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function transact(store,mode,fn){
  const database=await db();try{return await new Promise((resolve,reject)=>{
    const tx=database.transaction(store,mode);const req=fn(tx.objectStore(store));let result;
    if(req){req.onsuccess=()=>{result=req.result;};req.onerror=()=>reject(req.error);}
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{database.close();}
}
async function listProjects(){return await transact('projects','readonly',store=>store.getAll());}
async function saveProject(){if(!ready||!openedProject)return;
  const snapshot=structuredClone(state);snapshot.updatedAt=Date.now();
  try{await transact('projects','readwrite',store=>store.put(snapshot));
    if(state.id===snapshot.id){state.updatedAt=snapshot.updatedAt;$('save-state').textContent='Uloženo ✓';}
  }catch(e){$('save-state').textContent='Uložení selhalo';toast('Projekt se nepodařilo uložit. Stáhni si raději zálohu!');throw e;}
}
async function flushProject(){clearTimeout(saveTimer);if(openedProject)await saveProject();}
function labelForProject(p){const type=p.slides?.[0]?.type||'birthday';return TYPES[type]?.label||'Projekt';}
function friendlyDate(date){try{return new Date(date).toLocaleDateString('cs-CZ',{day:'numeric',month:'short',year:'numeric'});}catch{return 'bez data';}}
async function refreshDashboard(){
  try{projectList=(await listProjects()).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));}catch(e){console.error(e);projectList=[];toast('Úložiště projektů není dostupné. Doporučuji používat běžné okno prohlížeče.');}
  $('project-list').innerHTML=projectList.length?projectList.map(p=>`<div class="project-card"><div class="project-symbol">${p.slides?.[0]?.type==='news'?'🎬':p.slides?.[0]?.type==='memorial'?'🕊':'SL'}</div><div class="project-meta"><strong title="${esc(p.title)}">${esc(p.title)}</strong><span>${esc(labelForProject(p))} · ${p.slides?.length||1} snímků</span><span>Upraveno ${esc(friendlyDate(p.updatedAt||p.createdAt||Date.now()))}</span></div><div class="project-buttons"><button class="primary" data-open-project="${esc(p.id)}">Otevřít</button><button class="ghost secondary" data-copy-project="${esc(p.id)}" title="Vytvořit kopii">Kopie</button><button class="ghost project-delete" data-delete-project="${esc(p.id)}" title="Smazat projekt">Smazat</button></div></div>`).join(''):'<div class="empty-projects">Zatím žádné uložené projekty. Vyber nahoře šablonu a vytvoř první.</div>';
  $('project-list').querySelectorAll('[data-open-project]').forEach(b=>b.addEventListener('click',()=>openProjectById(b.dataset.openProject)));
  $('project-list').querySelectorAll('[data-copy-project]').forEach(b=>b.addEventListener('click',()=>duplicateProject(b.dataset.copyProject)));
  $('project-list').querySelectorAll('[data-delete-project]').forEach(b=>b.addEventListener('click',()=>removeProject(b.dataset.deleteProject)));
}
function setScreen(showEditor){
  openedProject=showEditor;
  $('editor').hidden=!showEditor;$('dashboard').hidden=showEditor;
  $('studio-mobile-navigation').hidden=!showEditor;
  $('go-home').hidden=!showEditor;$('project-download').hidden=!showEditor;
  $('save-state').textContent=showEditor?'Uloženo v zařízení ✓':'Projekty na tomto zařízení';
  if(showEditor)requestAnimationFrame(()=>{queuePreview();window.scrollTo(0,0);});
  else window.scrollTo(0,0);
}
async function openProjectById(id){
  try{
    const p=await transact('projects','readonly',store=>store.get(id));
    if(!validateProject(p))throw Error('Invalid project');
    const upgraded=ensureNewsStructure(p);
    if(upgraded){p.updatedAt=Date.now();await transact('projects','readwrite',store=>store.put(p));}
    state=p;state.active=Math.max(0,Math.min(state.active||0,state.slides.length-1));
    setScreen(true);syncUI();setMobileTab('slides');
    if(upgraded)toast('Starší novinka doplněna o informační snímek. Původní snímky zůstaly zachované.');
  }catch(e){console.error(e);toast('Projekt se nepodařilo otevřít.');}
}
async function createProject(template){try{const p=makeProject(template);ensureNewsStructure(p);await transact('projects','readwrite',store=>store.put(p));state=p;setScreen(true);syncUI();setMobileTab('slides');toast('Nový projekt vytvořen.');}catch(e){console.error(e);toast('Projekt nelze uložit. Zkontroluj volné místo v prohlížeči.');}}
async function goHome(){try{await flushProject();}catch(e){console.error(e);toast('Poslední změny nemusely být uloženy. Stáhni si zálohu projektu.');return;}setScreen(false);await refreshDashboard();}
async function removeProject(id){const p=projectList.find(item=>item.id===id);if(!p)return;if(!confirm(`Opravdu smazat projekt „${p.title}“? Smazání nelze vrátit.`))return;try{await transact('projects','readwrite',store=>store.delete(id));await refreshDashboard();toast('Projekt byl smazán.');}catch(e){console.error(e);toast('Projekt se nepodařilo smazat.');}}
async function duplicateProject(id){const old=projectList.find(item=>item.id===id);if(!old)return;try{const copy=structuredClone(old);copy.id=makeId();copy.title=old.title+' (kopie)';copy.createdAt=copy.updatedAt=Date.now();await transact('projects','readwrite',store=>store.put(copy));await refreshDashboard();toast('Kopie projektu připravena.');}catch(e){console.error(e);toast('Projekt nelze duplikovat.');}}
async function migratePreviousProject(){
  let all=await listProjects();if(all.length)return;
  const previous=await transact('kv','readonly',store=>store.get('project'));
  if(validateProject(previous)){
    const p={...previous,id:makeId(),title:previous.title||'Projekt z v0.2',createdAt:Date.now(),updatedAt:Date.now()};
    for(const slide of p.slides){if(slide.type==='cta'&&slide.values?.detail==='Find out more at scenelevel.com')slide.values.detail='Find out who you share a birthday with at:\nscenelevel.com';}
    await transact('projects','readwrite',store=>store.put(p));
    toast('Předchozí rozpracovaný projekt jsme zachovali v seznamu projektů.');
  }
}
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
  }catch(e){console.warn('Clipboard read unavailable',e);toast('Safari nepovolilo přímé vložení. Na iPhonu otevři Fotka → podrž prst v poli Vložit, nebo obrázek ulož do Fotek.');}
}
function resetPhotoPosition(){
  const slide=current();slide.zoom=100;slide.x=0;slide.y=0;
  syncPhotoControls();$('photo-x').value=0;$('photo-y').value=0;
  queuePreview();scheduleSave();
}
function addSlideOfType(type){
  if(!TYPES[type]){toast('Tato šablona není dostupná. Obnov stránku a zkontroluj verzi Studia.');return;}
  const slide=makeSlide(type);
  const lastCta=state.slides.findLastIndex(s=>s.type==='cta');
  // News continuation always goes just before the final CTA, never behind it.
  let index;
  if(type==='newsinfo' && state.slides[0]?.type==='news')index=lastCta>=0?lastCta:state.slides.length;
  else if(lastCta>=state.active && lastCta>=0 && type!=='cta')index=lastCta;
  else index=state.active+1;
  state.slides.splice(index,0,slide);
  state.active=index;
  syncUI();scheduleSave();
  toast(type==='newsinfo'?'Přidán informační snímek před závěrečný CTA.':'Nový snímek byl přidán.');
}
function setMobileTab(tab){
  const valid=['slides','text','photo','more'];if(!valid.includes(tab))tab='text';
  $('editor').dataset.mobileTab=tab;
  document.querySelectorAll('[data-mobile-tab]').forEach(button=>{
    if(!button.closest('.mobile-tabs'))return;
    const active=button.dataset.mobileTab===tab;
    button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  const sidebar=document.querySelector('#editor .sidebar');sidebar.scrollTop=0;
  const workspace=document.querySelector('#editor .workspace');workspace.scrollTop=0;
  // Do not scrollIntoView here: on iOS it can scroll the entire editor and hide the navigation.
  // The slide grid is available in its own scrollable content area.
}
function bind(){
  $('go-home').addEventListener('click',goHome);
  document.querySelectorAll('.mobile-tabs [data-mobile-tab]').forEach(button=>button.addEventListener('click',()=>setMobileTab(button.dataset.mobileTab)));
  $('mobile-export-all').addEventListener('click',()=>exportAll());
  $('mobile-download-project').addEventListener('click',()=>$('project-download').click());
  $('mobile-import-project').addEventListener('click',()=>$('project-import').click());
  $('dashboard').querySelectorAll('[data-create]').forEach(button=>button.addEventListener('click',()=>createProject(button.dataset.create)));
  $('project-title').addEventListener('input',e=>{state.title=e.target.value;scheduleSave();});
  $('format').addEventListener('change',e=>{state.format=e.target.value;queuePreview();scheduleSave();});
  $('slide-type').addEventListener('change',e=>{const old=current(),t=e.target.value;state.slides[state.active]={...makeSlide(t),id:old.id,photoData:old.photoData,zoom:old.zoom,x:old.x,y:old.y,bg:old.bg};syncUI();scheduleSave();});
  for(const [id,key] of [['photo-x','x'],['photo-y','y'],['background','bg']])$(id).addEventListener('input',e=>{
    current()[key]=key==='bg'?e.target.value:Number(e.target.value);queuePreview();scheduleSave();
  });
  $('photo-zoom').addEventListener('input',e=>setZoom(e.target.value));
  $('quick-zoom').addEventListener('input',e=>setZoom(e.target.value));
  $('quick-minus').addEventListener('click',()=>setZoom(current().zoom<=20?current().zoom-2:current().zoom-10));
  $('quick-plus').addEventListener('click',()=>setZoom(current().zoom<20?current().zoom+2:current().zoom+10));
  $('quick-reset').addEventListener('click',resetPhotoPosition);
  $('photo-upload').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await setPhoto(file);e.target.value='';});
  $('logo-upload').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{state.logoData=await readDataURL(file);queuePreview();scheduleSave();toast('Logo bylo přiřazeno všem snímkům.');}catch{toast('Logo se nepodařilo načíst.');}e.target.value='';});
  $('remove-image').addEventListener('click',()=>{current().photoData='';syncPhotoControls();queuePreview();scheduleSave();});
  $('reset-image').addEventListener('click',resetPhotoPosition);
  $('paste-image').addEventListener('click',pasteViaButton);
  const nativePaste=$('native-paste-target');
  if(nativePaste){
    nativePaste.addEventListener('paste',async e=>{
      e.stopPropagation();
      // The document-wide paste listener below handles image data from Safari's
      // native Paste menu. Don't insert external HTML into our editor.
      const file=Array.from(e.clipboardData?.items||[]).find(item=>item.type.startsWith('image/'))?.getAsFile();
      if(file){e.preventDefault();nativePaste.textContent='';await setPhoto(file);return;}
      e.preventDefault();nativePaste.textContent='';
      toast('Schránka obsahuje odkaz nebo text místo obrázku. Zkus Kopírovat obrázek, případně Uložit do Fotek.');
    });
    nativePaste.addEventListener('input',()=>{nativePaste.textContent='';});
  }
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
  $('add-slide').addEventListener('click',()=>addSlideOfType($('new-slide-type').value));
  $('add-news-info').addEventListener('click',()=>addSlideOfType('newsinfo'));
  $('duplicate-slide').addEventListener('click',()=>{const copy=structuredClone(current());copy.id=makeId();state.slides.splice(state.active+1,0,copy);state.active++;syncUI();scheduleSave();});
  $('delete-slide').addEventListener('click',()=>deleteSlideAt(state.active));
  for(const [id,dx]of [['move-left',-1],['move-right',1]])$(id).addEventListener('click',()=>{const to=state.active+dx;if(to<0||to>=state.slides.length)return;[state.slides[state.active],state.slides[to]]=[state.slides[to],state.slides[state.active]];state.active=to;syncUI();scheduleSave();});
  $('export-one').addEventListener('click',()=>exportOne());
  $('export-all').addEventListener('click',()=>exportAll());
  $('project-download').addEventListener('click',()=>{downloadBlob(new Blob([JSON.stringify(state)],{type:'application/json'}),`${slug(state.title)||'scenelevel'}-projekt.json`);});
  $('project-import').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const item=JSON.parse(await file.text());if(!validateProject(item))throw Error('Invalid project');const imported=structuredClone(item);ensureNewsStructure(imported);imported.id=makeId();imported.createdAt=imported.updatedAt=Date.now();await flushProject();await transact('projects','readwrite',store=>store.put(imported));state=imported;setScreen(true);syncUI();toast('Projekt importován jako nový, ostatní projekty zůstaly zachované.');}catch{toast('Neplatný soubor projektu.');}e.target.value='';});
  // Direct manipulation: single-finger / mouse drag moves, two-finger pinch zooms.
  const pointers=new Map();let gesture=null;
  function beginGesture(){
    const points=[...pointers.values()];
    if(!points.length){gesture=null;return;}
    const center=points.reduce((p,q)=>({x:p.x+q.x/points.length,y:p.y+q.y/points.length}),{x:0,y:0});
    const dist=points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0;
    gesture={center,dist,startZoom:current().zoom,startX:current().x,startY:current().y};
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!current().photoData)return;
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    try{canvas.setPointerCapture(e.pointerId);}catch{}
    beginGesture();canvas.style.cursor='grabbing';
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const points=[...pointers.values()];const rect=canvas.getBoundingClientRect();
    const center=points.reduce((p,q)=>({x:p.x+q.x/points.length,y:p.y+q.y/points.length}),{x:0,y:0});
    if(points.length>=2&&gesture.dist>0){
      const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
      current().zoom=clampZoom(gesture.startZoom*(distance/gesture.dist));
      syncPhotoControls();
    }
    current().x=Math.max(-200,Math.min(200,gesture.startX+(center.x-gesture.center.x)/rect.width*200));
    current().y=Math.max(-200,Math.min(200,gesture.startY+(center.y-gesture.center.y)/rect.height*200));
    $('photo-x').value=Math.max(-100,Math.min(100,current().x));$('photo-y').value=Math.max(-100,Math.min(100,current().y));
    queuePreview();
  });
  function release(e){
    if(!pointers.has(e.pointerId))return;
    pointers.delete(e.pointerId);beginGesture();
    if(!pointers.size){canvas.style.cursor='grab';scheduleSave();}
  }
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))release(e);});
  canvas.addEventListener('wheel',e=>{
    if(!current().photoData)return;
    e.preventDefault();const factor=Math.exp(-e.deltaY*.003);
    setZoom(current().zoom*factor);
  },{passive:false});
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
async function exportAll(){const b=$('export-all');b.disabled=true;try{await flushProject();const files=[];for(let i=0;i<state.slides.length;i++){$('save-state').textContent=`Exportuji ${i+1}/${state.slides.length}…`;const png=await makePng(state.slides[i]);files.push({name:outputName(state.slides[i],i),data:new Uint8Array(await png.arrayBuffer())});}const zip=writeZip(files);downloadBlob(zip,`${slug(state.title)||'scenelevel'}-carousel.zip`);toast(`Hotovo: ${files.length} PNG snímků v ZIP archivu.`);}catch(e){console.error(e);toast('Export carouselu se nezdařil. Zkus exportovat snímky po jednom.');}finally{b.disabled=false;$('save-state').textContent='Uloženo v zařízení ✓';}}
(async function boot(){bind();try{await migratePreviousProject();}catch(e){console.warn('Storage migration failed',e);toast('Některé starší projekty se nepodařilo načíst; původní data jsme nesmazali.');}ready=true;setScreen(false);await refreshDashboard();initFonts();if('serviceWorker'in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js?v=0.8.0',{updateViaCache:'none'}).catch(()=>{});} })();
