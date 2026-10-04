(() => {
'use strict';
const content=window.CLUB_CONTENT;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const scenes=$$('.scene');
const track=$('#scroll-track');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const canvas=$('#depth-canvas');
const ctx=canvas.getContext('2d');
const instruments=$('.instruments'),mobileInstruments=$('.mobile-instruments');
const clubMark=$('.brand img');
const chapterLinks=$$('.journey-nav a'),chapterCurrent=$('#chapter-current'),scrollHint=$('#scroll-hint');
const styleCache=new WeakMap();
let paintedChapter=-1,paintedFlat=null,lastDepth=null;
function setStyle(el,key,value){let saved=styleCache.get(el);if(!saved){saved={};styleCache.set(el,saved);}if(saved[key]===value)return;saved[key]=value;el.style[key]=value;}
let flat=false,current=0,span=innerHeight*1.65,lastHeight=innerHeight,raf=0,px=0,py=0;
let day='Понедельник',priceDirection='Капоэйра';
const sceneColors={welcome:'#e4f3fa',directions:'#f3f9fc',history:'#e1f0f7',coaches:'#f3f9fc',music:'#e1f2eb',schedule:'#eaf5fa',prices:'#fff6d7',contact:'#e2f0f8'};
const palette=scenes.map(s=>sceneColors[s.id]||sceneColors.welcome);
$('#chapter-total').textContent=String(scenes.length).padStart(2,'0');
const directions={
 'Капоэйра':{title:'Игра, в которой встречаются движение и ритм.',text:'Капоэйра соединяет движения, взаимодействие с партнёром и музыку. Есть группы для детей, подростков и взрослых.',age:'От 4 лет · группы по возрасту'},
 'Музыка':{title:'Познакомься с голосом капоэйры.',text:'Отдельные занятия музыкой проходят по субботам. Беримбау, атабаке и пандейру помогают услышать ритм игры.',age:'10+ · суббота, 12:00–13:00'},
 'Акробатика':{title:'Открой новые возможности движения.',text:'Акробатика — отдельное направление субботних занятий. Можно посещать самостоятельно или вместе с капоэйрой.',age:'7+ · суббота, 13:00–14:00'},
 'Батукада':{title:'Почувствуй ритм вместе с другими.',text:'Батукада — самостоятельное направление. В расписании есть субботняя группа «Старт». Для учеников капоэйры предусмотрены условия подключения к основному абонементу.',age:'Группа «Старт» · суббота, 15:00–17:00'}
};
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function tabGroup(selector,onSelect){const group=$(selector);const tabs=$$('[role=tab]',group);function select(btn){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===btn));t.tabIndex=t===btn?0:-1;});const panel=$('#'+btn.getAttribute('aria-controls'));panel.setAttribute('aria-labelledby',btn.id);onSelect(btn);requestRender();}tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(t));t.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight')j=(i+1)%tabs.length;if(e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length;if(e.key==='Home')j=0;if(e.key==='End')j=tabs.length-1;if(j!==undefined){e.preventDefault();select(tabs[j]);tabs[j].focus();}});});return select;}
const chooseDirection=tabGroup('.direction-tabs',btn=>{const d=directions[btn.dataset.direction];const p=$('#direction-panel');p.replaceChildren(node('h3',d.title),node('p',d.text),node('span',d.age,'age-line'));});
function renderSchedule(){const coach=$('#coach-filter').value;const rows=content.schedule.filter(r=>r.day===day&&(coach==='all'||r.coach===coach)).sort((a,b)=>a.time.localeCompare(b.time));$('#schedule-day').textContent=day;const list=$('#schedule-list');list.replaceChildren();rows.forEach(r=>{const row=node('div',undefined,'schedule-row');row.setAttribute('aria-label',`${r.description}, ${r.direction}, ${r.coach}, ${r.age}`);const match=r.description.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2})\.?\s*(.*)$/);row.append(node('span',match?match[1]:r.time.slice(0,5),'schedule-time'));const activity=node('span',r.direction);if(match&&match[2])activity.append(node('span',match[2],'schedule-sub'));row.style.setProperty('--row-order',list.children.length);row.append(activity,node('span',r.coach||'Спецкласс','trainer'),node('span',r.age,'age'));list.append(row);});$('.schedule-empty').hidden=rows.length>0;}
const chooseDay=tabGroup('.day-tabs',btn=>{day=btn.dataset.day;renderSchedule();});
$('#coach-filter').addEventListener('change',renderSchedule);
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
function renderPrices(){const localDate=new Intl.DateTimeFormat('sv-SE',{timeZone:content.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const after=localDate>=content.cutoff;let rows=content.tariffs.filter(r=>r.direction===priceDirection);if(priceDirection==='Капоэйра')rows=rows.filter(r=>r.id==='CAP-SINGLE'||r.id.endsWith(after?'-NOV':'-START'));const list=$('#price-list');list.replaceChildren();rows.forEach(r=>{const item=node('article',undefined,'price-item');item.append(node('h3',r.lessons===1?'Разовое занятие':`${r.lessons} занятий`),node('p',money(r.price),'price-amount'));list.append(item);});list.style.gridTemplateColumns=`repeat(${rows.length},1fr)`;$('#price-condition').textContent=priceDirection==='Капоэйра'?(after?'Для присоединившихся с 1 ноября 2026 года. Если присоединились раньше, стартовая цена сохраняется на учебный год.':'Для присоединившихся до 1 ноября 2026 года. Стартовая цена сохраняется на учебный год.'):(priceDirection==='Батукада'?'Самостоятельное направление. Условия подключения к капоэйре — ниже.':'Можно заниматься отдельно. Для владельцев абонемента по капоэйре есть специальные цены.');$('#future-price').hidden=priceDirection!=='Капоэйра'||after;}
const choosePrice=tabGroup('.price-tabs',btn=>{priceDirection=btn.dataset.price;renderPrices();});
content.faq.forEach(r=>{const p=node('p');p.append(node('strong',r.question),document.createElement('br'),document.createTextNode(r.answer));$('#bonus-content').append(p);});
$$('details').forEach(el=>el.addEventListener('toggle',requestRender));
function indexForHash(hash){return scenes.findIndex(s=>'#'+s.id===hash);}
function navigate(index,{focus=false,replace=false}={}){if(index<0)return;if(flat){scenes[index].scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}else{window.scrollTo({top:index*span,behavior:reduced.matches?'instant':'smooth'});}if(replace)history.replaceState(null,'','#'+scenes[index].id);else if(location.hash!=='#'+scenes[index].id)history.pushState(null,'','#'+scenes[index].id);if(focus){const h=$('h1,h2',scenes[index]);h.tabIndex=-1;setTimeout(()=>h.focus({preventScroll:true}),reduced.matches?0:550);}requestRender();}
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const index=indexForHash(link.hash);if(index<0)return;e.preventDefault();if(link.dataset.coachNav){$('#coach-filter').value=link.dataset.coachNav;chooseDay($('[data-day="'+(link.dataset.coachNav==='Юрий'?'Вторник':'Понедельник')+'"]'));}if(link.dataset.priceNav)choosePrice($('[data-price="'+link.dataset.priceNav+'"]'));navigate(index,{focus:e.detail===0});}));
window.addEventListener('popstate',()=>navigate(indexForHash(location.hash),{replace:true}));
function setCurrent(index){current=index;if(paintedChapter===index&&paintedFlat===flat)return;paintedChapter=index;paintedFlat=flat;scenes.forEach((scene,i)=>{scene.classList.toggle('active',i===index);if(!flat){scene.inert=i!==index;scene.setAttribute('aria-hidden',String(i!==index));}else{scene.inert=false;scene.removeAttribute('aria-hidden');}});chapterLinks.forEach((a,i)=>{a.classList.toggle('active',i===index);if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});document.body.dataset.chapter=scenes[index].id;if(!flat){document.documentElement.style.setProperty('--blue',palette[index]);document.body.style.backgroundColor=palette[index];}chapterCurrent.textContent=String(index+1).padStart(2,'0');scrollHint.innerHTML=index===0?'Прокрути, чтобы войти в круг <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"></path></svg>':index===scenes.length-1?'Ты в круге. Давай знакомиться.':'Листай дальше <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"></path></svg>';}
function sizeCanvas(){lastDepth=null;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
// Objects share one camera distance. The canvas stays idle without user input.
const floatingObjects=Array.from({length:16},(_,i)=>({
 side:i%2?1:-1, x:4.8+(i%3)*1.8, y:((i*7)%11-5)*.52,
 z:1.2+i*.79, angle:i*2.399, kind:i%4
}));
for(const image of [instruments,clubMark])image.addEventListener('load',()=>{lastDepth=null;requestRender();});
function drawDepth(progress){
 if(!ctx)return;
 const w=innerWidth,h=innerHeight;
 if(lastDepth&&lastDepth.progress===progress&&lastDepth.px===px&&lastDepth.py===py&&lastDepth.w===w&&lastDepth.h===h)return;
 lastDepth={progress,px,py,w,h};ctx.clearRect(0,0,w,h);
 const focal=Math.min(w*.86,h*1.05),atlasReady=instruments.complete&&instruments.naturalWidth>0;
 const sprites=[[0,0,.23,1],[.65,.57,.20,.43],[.74,.02,.24,.94]];
 for(const object of floatingObjects){
  const z=.9+((object.z-progress*3.1)%12.8+12.8)%12.8;
  const scale=4.4/z, x=w*.5+(object.side*object.x-px*.28)*focal/z;
  const y=h*.5+(object.y-py*.2)*focal/z;
  const size=Math.min(88,28*scale),angle=object.angle+progress*.46;
  if(x < -size*2||x>w+size*2||y < -size*2||y>h+size*2)continue;
  // Protect the reading area even when a distant object projects near the center.
  if(Math.abs(x-w*.5)<Math.min(w*.31,440)+size*.6&&y>h*.13&&y<h*.81)continue;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(angle)*.3);
  ctx.scale(.84+.16*Math.cos(angle),1);
  ctx.globalAlpha=Math.min(.54,.18+scale*.14)*Math.min(1,(13.7-z)*.7);
  if(object.kind<3&&atlasReady){
   const [sx,sy,sw,sh]=sprites[object.kind];
   const cropW=instruments.naturalWidth*sw,cropH=instruments.naturalHeight*sh;
   const height=size*1.45,width=height*cropW/cropH;
   ctx.drawImage(instruments,sx*instruments.naturalWidth,sy*instruments.naturalHeight,cropW,cropH,-width/2,-height/2,width,height);
  }else if(clubMark.complete&&clubMark.naturalWidth>0){
   ctx.drawImage(clubMark,-size*.35,-size*.35,size*.7,size*.7);
  }
  ctx.restore();
 }
}
function render(){raf=0;if(flat){let idx=0;scenes.forEach((s,i)=>{if(s.getBoundingClientRect().top<=innerHeight*.45)idx=i;});setCurrent(idx);return;}
const progress=Math.max(0,Math.min(scenes.length-1,scrollY/span));const base=Math.floor(progress),phase=progress-base;const t=Math.max(0,Math.min(1,(phase-.48)/.52));const eased=t*t*(3-2*t);const active=Math.min(scenes.length-1,base+(eased>.5?1:0));setCurrent(active);
const direction=base%2? -1:1, width=innerWidth, gap=1900;
scenes.forEach((scene,i)=>{
 let visible=false,x=0,z=-gap,angle=0;
 if(i===base){z=eased*gap;x=-direction*eased*width*.68;angle=direction*eased*8;visible=eased<.57;}
 else if(i===base+1){z=-(1-eased)*gap;x=direction*(1-eased)*width*.68;angle=-direction*(1-eased)*10;visible=eased>.08;}
 setStyle(scene,'visibility',visible?'visible':'hidden');
 setStyle(scene,'willChange',visible?'transform':'auto');
 if(visible){setStyle(scene,'opacity',1);setStyle(scene,'transform',`translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`);}
});
const musicWeight=(scenes[base].id==='music'?1-eased:0)+(scenes[base+1]?.id==='music'?eased:0);
setStyle(instruments,'opacity',musicWeight*.75);
setStyle(mobileInstruments,'opacity',musicWeight*.72);
drawDepth(progress);}
function requestRender(){if(!raf)raf=requestAnimationFrame(render);}
function applyMode(next,{restore=true}={}){const index=current;flat=next;paintedChapter=-1;document.body.classList.toggle('flat-mode',flat);document.body.classList.toggle('depth-mode',!flat);span=Math.max(innerHeight*1.65,900);track.style.height=flat?'0px':`${span*(scenes.length-1)+innerHeight}px`;scenes.forEach(s=>{styleCache.delete(s);s.style.willChange='';s.style.transform='';s.style.opacity='';s.style.visibility='';s.inert=false;s.removeAttribute('aria-hidden');});$('#motion-toggle').setAttribute('aria-pressed',String(flat));$('#motion-toggle span').textContent=flat?'Включить глубину':'Без анимации';document.documentElement.style.setProperty('--blue',sceneColors.welcome);document.body.style.backgroundColor='';sizeCanvas();if(restore){if(flat)window.scrollTo({top:scenes[index].offsetTop,behavior:'instant'});else window.scrollTo({top:index*span,behavior:'instant'});}requestRender();}
$('#motion-toggle').addEventListener('click',()=>{applyMode(!flat);try{localStorage.setItem('capoeira-motion',flat?'flat':'depth');}catch{}});
window.addEventListener('scroll',requestRender,{passive:true});window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||flat)return;px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;requestRender();},{passive:true});
window.addEventListener('resize',()=>{if(Math.abs(innerHeight-lastHeight)>150||innerWidth>600){const i=current;lastHeight=innerHeight;span=Math.max(innerHeight*1.65,900);track.style.height=flat?'0px':`${span*(scenes.length-1)+innerHeight}px`;if(!flat)window.scrollTo({top:i*span,behavior:'instant'});}sizeCanvas();requestRender();},{passive:true});
reduced.addEventListener('change',e=>{if(e.matches)applyMode(true);});
renderSchedule();renderPrices();let stored;try{stored=localStorage.getItem('capoeira-motion');}catch{}applyMode(reduced.matches||stored==='flat',{restore:false});const initial=indexForHash(location.hash);if(initial>0){current=initial;setTimeout(()=>navigate(initial,{replace:true}),80);}else requestRender();
window.capoeiraJourney={navigate:(id)=>navigate(scenes.findIndex(s=>s.id===id)),get state(){return{flat,current,span};}};
})();
