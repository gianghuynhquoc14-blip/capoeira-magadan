(() => {
'use strict';
try{history.scrollRestoration='manual';}catch{}
const content=window.CLUB_CONTENT;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const scenes=$$('.scene');
const track=$('#scroll-track');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const instruments=$('.instruments'),mobileInstruments=$('.mobile-instruments');
const landscape=$('#magadan-landscape'),historyScene=$('#history');
const coastLayers=$$('[data-depth]',landscape),historyIndex=scenes.indexOf(historyScene);
const heroCoast=$('#hero-coast'),welcomeScene=$('#welcome'),heroCoastLayers=$$('[data-depth]',heroCoast);
const heroForeground=$('#hero-foreground'),musicAtmosphere=$('.music-atmosphere'),musicMotes=$$('.music-mote');
const musicIndex=scenes.findIndex(scene=>scene.id==='music');
const edgeAtmospheres=['coaches','schedule'].map(id=>{const element=$('#'+id+'-atmosphere');return{element,scene:$('#'+id),index:scenes.findIndex(s=>s.id===id),parts:$$('[data-shift]',element)};});
const clubMap=$('#club-map');function loadClubMap(){if(!clubMap.getAttribute('src'))clubMap.src=clubMap.dataset.src;}
$$('[data-coach-profile]').forEach(button=>button.addEventListener('click',()=>{
 const profile=$('#'+button.dataset.coachProfile);profile.showModal();
 document.documentElement.classList.add('profile-open');
}));
$$('.coach-profile').forEach(profile=>{
 $('[data-close-profile]',profile).addEventListener('click',()=>profile.close());
 profile.addEventListener('close',()=>document.documentElement.classList.remove('profile-open'));
});
const chapterLinks=$$('.journey-nav a'),chapterCurrent=$('#chapter-current'),scrollHint=$('#scroll-hint');
const styleCache=new WeakMap();
let paintedChapter=-1,paintedFlat=null,lastLandscape=null;
function setStyle(el,key,value){let saved=styleCache.get(el);if(!saved){saved={};styleCache.set(el,saved);}if(saved[key]===value)return;saved[key]=value;el.style[key]=value;}
let flat=false,current=0,span=innerHeight*1.65,lastHeight=innerHeight,raf=0,px=0,py=0;
let day='Понедельник',priceDirection='Капоэйра';
const sceneColors={welcome:'#124463',directions:'#e2f1f8',history:'#86bad1',coaches:'#f5fafc',music:'#d4e8dc',schedule:'#d6ebf5',prices:'#fff5ce',contact:'#124463'};
const palette=scenes.map(s=>sceneColors[s.id]||sceneColors.welcome);
$('#chapter-total').textContent=String(scenes.length).padStart(2,'0');
const directions={
 'Капоэйра':{title:'Игра, в которой встречаются движение и ритм.',text:'Капоэйра соединяет движения, взаимодействие с партнёром и музыку. Есть группы для детей, подростков и взрослых.',age:'От 4 лет · группы по возрасту'},
 'Музыка':{title:'Познакомься с голосом капоэйры.',text:'Отдельные занятия музыкой проходят по субботам. Беримбау, атабаке и пандейру помогают услышать ритм игры.',age:'10+ · суббота, 12:00–13:00'},
 'Акробатика':{title:'Открой новые возможности движения.',text:'Акробатика — отдельное направление субботних занятий. Можно посещать самостоятельно или вместе с капоэйрой.',age:'7+ · суббота, 13:00–14:00'},
 'Батукада':{title:'Почувствуй ритм вместе с другими.',text:'Батукада — самостоятельное направление. Занятия проходят по субботам. Для учеников капоэйры предусмотрены условия подключения к основному абонементу.',age:'Суббота · 15:00–17:00'}
};
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function tabGroup(selector,onSelect){const group=$(selector);const tabs=$$('[role=tab]',group);function select(btn){tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===btn));t.tabIndex=t===btn?0:-1;});const panel=$('#'+btn.getAttribute('aria-controls'));panel.setAttribute('aria-labelledby',btn.id);onSelect(btn);requestRender();}tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(t));t.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight')j=(i+1)%tabs.length;if(e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length;if(e.key==='Home')j=0;if(e.key==='End')j=tabs.length-1;if(j!==undefined){e.preventDefault();select(tabs[j]);tabs[j].focus();}});});return select;}
const chooseDirection=tabGroup('.direction-tabs',btn=>{const d=directions[btn.dataset.direction];const p=$('#direction-panel');p.replaceChildren(node('h3',d.title),node('p',d.text),node('span',d.age,'age-line'));});
function renderSchedule(){const coach=$('#coach-filter').value;const rows=content.schedule.filter(r=>r.day===day&&(coach==='all'||r.coach===coach)).sort((a,b)=>a.time.localeCompare(b.time));$('#schedule-day').textContent=day;const list=$('#schedule-list');list.replaceChildren();rows.forEach(r=>{const row=node('div',undefined,'schedule-row');row.setAttribute('aria-label',`${r.description}, ${r.direction}, ${r.coach}, ${r.age}`);const match=r.description.match(/^(\d{2}:\d{2}[–-]\d{2}:\d{2})\.?\s*(.*)$/);row.append(node('span',match?match[1]:r.time.slice(0,5),'schedule-time'));const activity=node('span',r.direction);if(match&&match[2]&&match[2].trim().toLowerCase()!==r.direction.toLowerCase())activity.append(node('span',match[2],'schedule-sub'));row.style.setProperty('--row-order',list.children.length);row.append(activity,node('span',r.coach||'Спецкласс','trainer'),node('span',r.age,'age'));list.append(row);});$('.schedule-empty').hidden=rows.length>0;}
const chooseDay=tabGroup('.day-tabs',btn=>{day=btn.dataset.day;renderSchedule();});
$('#coach-filter').addEventListener('change',renderSchedule);
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
function renderPrices(){const localDate=new Intl.DateTimeFormat('sv-SE',{timeZone:content.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const after=localDate>=content.cutoff;let rows=content.tariffs.filter(r=>r.direction===priceDirection);if(priceDirection==='Капоэйра')rows=rows.filter(r=>r.id==='CAP-SINGLE'||r.id.endsWith(after?'-NOV':'-START'));const list=$('#price-list');list.replaceChildren();rows.forEach(r=>{const item=node('article',undefined,'price-item');item.append(node('h3',r.lessons===1?'Разовое занятие':`${r.lessons} занятий`),node('p',money(r.price),'price-amount'));list.append(item);});list.style.gridTemplateColumns=`repeat(${rows.length},1fr)`;$('#price-condition').textContent=priceDirection==='Капоэйра'?(after?'Для присоединившихся с 1 ноября 2026 года. Если присоединились раньше, стартовая цена сохраняется на учебный год.':'Для присоединившихся до 1 ноября 2026 года. Стартовая цена сохраняется на учебный год.'):(priceDirection==='Батукада'?'Самостоятельное направление. Условия подключения к капоэйре — ниже.':'Можно заниматься отдельно. Для владельцев абонемента по капоэйре есть специальные цены.');$('#future-price').hidden=priceDirection!=='Капоэйра'||after;}
const choosePrice=tabGroup('.price-tabs',btn=>{priceDirection=btn.dataset.price;renderPrices();});
content.faq.forEach(r=>{const p=node('p');p.append(node('strong',r.question),document.createElement('br'),document.createTextNode(r.answer));$('#bonus-content').append(p);});
$$('details').forEach(el=>el.addEventListener('toggle',requestRender));
function indexForHash(hash){return scenes.findIndex(s=>'#'+s.id===hash);}
function navigate(index,{focus=false,replace=false,instant=false}={}){if(index<0)return;if(flat){scenes[index].scrollIntoView({behavior:reduced.matches||instant?'instant':'smooth'});}else{window.scrollTo({top:index*span,behavior:reduced.matches||instant?'instant':'smooth'});}if(replace)history.replaceState(null,'','#'+scenes[index].id);else if(location.hash!=='#'+scenes[index].id)history.pushState(null,'','#'+scenes[index].id);if(focus){const h=$('h1,h2',scenes[index]);h.tabIndex=-1;setTimeout(()=>h.focus({preventScroll:true}),reduced.matches?0:550);}requestRender();}
$$('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{const index=indexForHash(link.hash);if(index<0)return;e.preventDefault();if(link.dataset.coachNav){$('#coach-filter').value=link.dataset.coachNav;chooseDay($('[data-day="'+(link.dataset.coachNav==='Юрий'?'Вторник':'Понедельник')+'"]'));}if(link.dataset.priceNav)choosePrice($('[data-price="'+link.dataset.priceNav+'"]'));navigate(index,{focus:e.detail===0});}));
window.addEventListener('popstate',()=>navigate(indexForHash(location.hash),{replace:true}));
function setCurrent(index){current=index;if(scenes[index].id==='contact')loadClubMap();if(paintedChapter===index&&paintedFlat===flat)return;paintedChapter=index;paintedFlat=flat;scenes.forEach((scene,i)=>{scene.classList.toggle('active',i===index);if(!flat){scene.inert=i!==index;scene.setAttribute('aria-hidden',String(i!==index));}else{scene.inert=false;scene.removeAttribute('aria-hidden');}});chapterLinks.forEach((a,i)=>{a.classList.toggle('active',i===index);if(i===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});document.body.dataset.chapter=scenes[index].id;if(!flat){document.documentElement.style.setProperty('--blue',palette[index]);document.body.style.backgroundColor=palette[index];}chapterCurrent.textContent=String(index+1).padStart(2,'0');scrollHint.innerHTML=index===0?'Прокрути, чтобы войти в круг <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"></path></svg>':index===scenes.length-1?'Ты в круге. Давай знакомиться.':'Листай дальше <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"></path></svg>';}
function resetLandscape(){lastLandscape=null;}
function shorelineOffset(layer){return -Math.max(layer.clientHeight,layer.clientWidth/2)*(34/887);}
function registerFlatHeadlands(){heroCoastLayers.forEach(layer=>{if(layer.dataset.side!==undefined)setStyle(layer,'transform',`translate3d(0,${shorelineOffset(layer).toFixed(2)}px,0)`);});}
function renderLandscape(progress,weight){
 setStyle(landscape,'visibility',weight>.005?'visible':'hidden');setStyle(landscape,'opacity',weight);
 coastLayers.forEach(layer=>setStyle(layer,'willChange',weight>.005?'transform':'auto'));
 if(weight<=.005)return;
 const local=Math.max(-.65,Math.min(.65,progress-historyIndex));
 const signature=[local,px,py,innerWidth,innerHeight].join('|');
 if(lastLandscape===signature)return;lastLandscape=signature;
 coastLayers.forEach(layer=>{
  const depth=Number(layer.dataset.depth),x=px*depth*70;
  const y=(local*.42+py*.055)*depth*innerHeight;
  setStyle(layer,'transform',`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`);
 });
}
function renderHeroCoast(progress,weight){
 setStyle(heroCoast,'visibility',weight>.005?'visible':'hidden');setStyle(heroCoast,'opacity',weight);
 const local=Math.max(0,Math.min(1,progress)),travel=Math.min(1,local/.72);
 heroCoastLayers.forEach(layer=>{
  setStyle(layer,'willChange',weight>.005?'transform':'auto');if(weight<=.005)return;
  const isHeadland=layer.dataset.side!==undefined;
  const x=isHeadland?Number(layer.dataset.side)*local*innerWidth*.055:0;
  // Vertical registration stays fixed: only the two land masses spread sideways.
  setStyle(layer,'transform',`translate3d(${x.toFixed(2)}px,${(isHeadland?shorelineOffset(layer):0).toFixed(2)}px,0)`);
 });
 // A long scroll-driven dissolve avoids a visible cut at the chapter boundary.
 const dissolve=Math.max(0,Math.min(1,(progress-.30)/.78));
 const dissolveEase=dissolve*dissolve*(3-2*dissolve),foregroundOpacity=1-dissolveEase;
 setStyle(heroForeground,'visibility',foregroundOpacity>.001?'visible':'hidden');
 setStyle(heroForeground,'opacity',foregroundOpacity);
 setStyle(heroForeground,'filter',dissolve>0?`blur(${(dissolve*(innerWidth<=600?8:12)).toFixed(2)}px)`:'none');
 setStyle(heroForeground,'willChange',foregroundOpacity>.001?(dissolve>0?'transform, opacity, filter':'transform'):'auto');
 setStyle(heroForeground,'transform',`translate3d(0,${(travel*innerHeight*.085).toFixed(2)}px,0) scale(${(1+travel*.12).toFixed(4)})`);
}
function renderMusicAtmosphere(progress,weight){
 setStyle(musicAtmosphere,'visibility',weight>.005?'visible':'hidden');
 // Decorative instrument copies only; never animate on an idle frame.
 const local=Math.max(-1,Math.min(1,progress-musicIndex));
 musicMotes.forEach((mote,i)=>{
  const side=i%2?-1:1,z=1.6+(i%3)*.65+local*1.1;
  const scale=1.7/Math.max(.75,z),x=side*innerWidth*(.38+local*.04),y=innerHeight*(.18+(i%3)*.24);
  setStyle(mote,'opacity',weight*.38);
  setStyle(mote,'transform',`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(3)}) rotate(${(side*local*12).toFixed(2)}deg)`);
  setStyle(mote,'filter',`blur(${Math.max(0,(z-1.5)*1.3).toFixed(2)}px)`);
 });
}
function sceneWeight(index,base,eased){return(base===index?1-eased:0)+(base+1===index?eased:0);}
function smoothRange(value,start,end){const t=Math.max(0,Math.min(1,(value-start)/(end-start)));return t*t*(3-2*t);}
function renderEdgeAtmospheres(progress,base,eased){
 edgeAtmospheres.forEach(({element,index,parts})=>{
  const weight=sceneWeight(index,base,eased);
  setStyle(element,'visibility',weight>.005?'visible':'hidden');setStyle(element,'opacity',weight);
  const local=Math.max(-.75,Math.min(.75,progress-index));
  parts.forEach(part=>{
   setStyle(part,'willChange',weight>.005?'transform':'auto');
   if(weight>.005)setStyle(part,'transform',`translate3d(0,${(local*innerHeight*Number(part.dataset.shift)).toFixed(2)}px,0)`);
  });
 });
}
function render(){raf=0;if(flat){let idx=0;scenes.forEach((s,i)=>{if(s.getBoundingClientRect().top<=innerHeight*.45)idx=i;});setCurrent(idx);return;}
const progress=Math.max(0,Math.min(scenes.length-1,scrollY/span));const base=Math.floor(progress),phase=progress-base;const t=Math.max(0,Math.min(1,(phase-.48)/.52));const eased=t*t*(3-2*t);const active=Math.min(scenes.length-1,base+(eased>.5?1:0));setCurrent(active);
const direction=base%2? -1:1, width=innerWidth, gap=1900;
scenes.forEach((scene,i)=>{
 let opacity=0,x=0,z=-gap,angle=0;
 // Finish fading the outgoing text before revealing the next text plane.
 // Background parallax still blends continuously through the whole journey.
 if(i===base){z=eased*gap;x=-direction*eased*width*.68;angle=direction*eased*8;opacity=1-smoothRange(eased,.06,.42);}
 else if(i===base+1){z=-(1-eased)*gap;x=direction*(1-eased)*width*.68;angle=-direction*(1-eased)*10;opacity=smoothRange(eased,.48,.94);}
 const visible=opacity>.001;
 setStyle(scene,'visibility',visible?'visible':'hidden');
 setStyle(scene,'willChange',visible?'transform':'auto');
 setStyle(scene,'opacity',opacity);
 if(visible){
  setStyle(scene,'transform',`translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`);
 }
});
const musicWeight=(scenes[base].id==='music'?1-eased:0)+(scenes[base+1]?.id==='music'?eased:0);
setStyle(instruments,'opacity',musicWeight*.75);
setStyle(mobileInstruments,'opacity',musicWeight*.72);
renderMusicAtmosphere(progress,musicWeight);
renderEdgeAtmospheres(progress,base,eased);
const coastWeight=base===historyIndex-1?eased:base===historyIndex?1-eased:0;
renderLandscape(progress,coastWeight);
renderHeroCoast(progress,base===0?1-eased:0);}
function requestRender(){if(!raf)raf=requestAnimationFrame(render);}
function applyMode(next,{restore=true}={}){
 const index=current;flat=next;paintedChapter=-1;
 document.body.classList.toggle('flat-mode',flat);document.body.classList.toggle('depth-mode',!flat);
 if(flat){
  loadClubMap();setStyle(musicAtmosphere,'visibility','hidden');
  edgeAtmospheres.forEach(({element,scene,parts})=>{scene.prepend(element);setStyle(element,'visibility','visible');setStyle(element,'opacity',1);parts.forEach(part=>{setStyle(part,'transform','none');setStyle(part,'willChange','auto');});});
  welcomeScene.prepend(heroCoast,heroForeground);
  setStyle(heroCoast,'visibility','visible');setStyle(heroCoast,'opacity',1);
  setStyle(heroForeground,'visibility','visible');setStyle(heroForeground,'transform','none');
  setStyle(heroForeground,'opacity',1);setStyle(heroForeground,'filter','none');
  setStyle(heroForeground,'willChange','auto');
  heroCoastLayers.forEach(layer=>{setStyle(layer,'transform','none');setStyle(layer,'willChange','auto');});
  registerFlatHeadlands();
  historyScene.prepend(landscape);setStyle(landscape,'visibility','visible');setStyle(landscape,'opacity',1);
  coastLayers.forEach(layer=>{setStyle(layer,'transform','none');setStyle(layer,'willChange','auto');});
 }else{
  $('.world').prepend(heroCoast,heroForeground,landscape);
  edgeAtmospheres.forEach(({element})=>{$('.world').append(element);setStyle(element,'visibility','hidden');setStyle(element,'opacity',0);});
  setStyle(heroCoast,'visibility','hidden');setStyle(heroCoast,'opacity',0);
  setStyle(heroForeground,'visibility','hidden');
  setStyle(landscape,'visibility','hidden');setStyle(landscape,'opacity',0);
 }
 span=Math.max(innerHeight*1.65,900);track.style.height=flat?'0px':`${span*(scenes.length-1)+innerHeight}px`;
 scenes.forEach(s=>{styleCache.delete(s);s.style.willChange='';s.style.transform='';s.style.opacity='';s.style.visibility='';s.inert=false;s.removeAttribute('aria-hidden');});
 $('#motion-toggle').setAttribute('aria-pressed',String(flat));$('#motion-toggle span').textContent=flat?'Включить глубину':'Без анимации';
 document.documentElement.style.setProperty('--blue',flat?'#e2f1f8':sceneColors.welcome);document.body.style.backgroundColor='';resetLandscape();
 if(restore){if(flat)window.scrollTo({top:scenes[index].offsetTop,behavior:'instant'});else window.scrollTo({top:index*span,behavior:'instant'});}
 requestRender();
}
$('#motion-toggle').addEventListener('click',()=>{applyMode(!flat);try{localStorage.setItem('capoeira-motion',flat?'flat':'depth');}catch{}});
window.addEventListener('scroll',requestRender,{passive:true});
window.addEventListener('resize',()=>{
 const restore=Math.abs(innerHeight-lastHeight)>150||innerWidth>600,index=current;
 if(restore){
  lastHeight=innerHeight;span=Math.max(innerHeight*1.65,900);
 }
 track.style.height=flat?'0px':`${span*(scenes.length-1)+innerHeight}px`;
 if(flat)registerFlatHeadlands();
 if(!flat&&(restore||index===scenes.length-1))window.scrollTo({top:index*span,behavior:'instant'});
 resetLandscape();requestRender();
},{passive:true});
reduced.addEventListener('change',e=>{if(e.matches)applyMode(true);});
renderSchedule();renderPrices();let stored;try{stored=localStorage.getItem('capoeira-motion');}catch{}applyMode(reduced.matches||stored==='flat',{restore:false});const initial=Math.max(0,indexForHash(location.hash));current=initial;setTimeout(()=>navigate(initial,{replace:true,instant:true}),80);
window.capoeiraJourney={navigate:(id)=>navigate(scenes.findIndex(s=>s.id===id)),get state(){return{flat,current,span};}};
})();
