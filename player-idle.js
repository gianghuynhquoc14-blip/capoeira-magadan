(() => {
 'use strict';
 const canvas=document.querySelector('#journey-player');if(!canvas)return;
 const context=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const sources=canvas.dataset.sources.split(','),images=sources.map(()=>new Image());
 const allowed=new Set((canvas.dataset.allowedChapters||'directions,music').split(','));
 const cycle=3200,poses=16,idleDelay=1100;
 // Generated sheets have uneven transparent gutters; sample their actual cells.
 const cells=[
  {x:[0,326,628,941,1254],y:[0,323,635,947,1254]},
  {x:[0,313,632,940,1254],y:[0,315,627,943,1254]},
  {x:[0,332,647,940,1254],y:[0,316,627,940,1254]},
  {x:[0,313,627,958,1254],y:[0,339,638,960,1254]}
 ];
 let ready=false,loading=false,failed=false,loaded=0,idle=false,idleTimer=0,frame=0,lastTime=0,elapsed=0,lastGuard=0,position=null;
 const blocked=()=>document.hidden||reduced.matches||document.body.classList.contains('flat-mode')||document.documentElement.classList.contains('profile-open')||!allowed.has(document.body.dataset.chapter);
 function hide(){
  idle=false;clearTimeout(idleTimer);idleTimer=0;
  if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
  canvas.classList.remove('player-visible');canvas.hidden=true;
 }
 function drawCell(character,pose,alpha){
  const image=images[character],grid=cells[character],col=pose%4,row=Math.floor(pose/4);
  const sx=grid.x[col],sy=grid.y[row],w=grid.x[col+1]-sx,h=grid.y[row+1]-sy;
  const size=character>1?260:300,x=(320-size)/2,y=310-size;
  context.save();context.globalAlpha=alpha;
  context.drawImage(image,sx,sy,w,h,x,y,size,size);
  context.restore();
 }
 function paint(){
  const sequence=elapsed/cycle,character=Math.floor(sequence)%images.length;
  const progress=(sequence%1)*poses,pose=Math.floor(progress),phase=progress-pose;
  const blend=phase*phase*(3-2*phase);
  context.clearRect(0,0,320,320);drawCell(character,pose,1-blend);
  drawCell(pose===15?(character+1)%images.length:character,(pose+1)%16,blend);
 }
 function obstacles(){
  const scenes=[...document.querySelectorAll('.scene')].filter(scene=>getComputedStyle(scene).visibility==='visible');
  const musicArt=document.body.dataset.chapter==='music'?[document.querySelector('.instruments'),...document.querySelectorAll('.mobile-instruments .plate-half')]:[];
  return [...scenes.flatMap(scene=>[scene.querySelector('.scene-content'),...scene.querySelectorAll('.family-side')]),document.querySelector('.site-header'),document.querySelector('.journey-nav'),document.querySelector('.journey-footer'),...musicArt].filter(Boolean).map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height);
 }
 function clear(x,y,size,rects){return x>=16&&x+size<=innerWidth-16&&y>=100&&y+size<innerHeight-90&&!rects.some(r=>x<r.right+32&&x+size>r.left-32&&y<r.bottom+32&&y+size>r.top-32);}
 function choosePosition(){
  const rects=obstacles(),mobile=innerWidth<=600,size=mobile?64:96;
  const candidates=mobile?[[innerWidth/2-size/2,innerHeight-220],[16,innerHeight-230],[innerWidth-size-16,innerHeight-230]]:[[28,innerHeight*.37],[innerWidth-size-68,innerHeight*.37],[28,innerHeight-size-110],[innerWidth-size-68,innerHeight-size-110]];
  const point=candidates.find(([x,y])=>clear(x,y,size,rects));if(!point)return false;
  position={x:point[0],y:point[1],size};
  canvas.style.left=position.x+'px';canvas.style.top=position.y+'px';canvas.style.bottom='auto';canvas.style.width=size+'px';return true;
 }
 function tick(time){
  frame=0;if(!idle||blocked()){hide();return;}
  if(time-lastGuard>180){lastGuard=time;if(!clear(position.x,position.y,position.size,obstacles())){schedule();return;}}
  if(lastTime)elapsed+=Math.min(time-lastTime,80);lastTime=time;
  paint();frame=requestAnimationFrame(tick);
 }
 function reveal(){
  idleTimer=0;if(blocked()||!choosePosition())return;
  if(!ready){load();return;}
  idle=true;canvas.hidden=false;paint();
  frame=requestAnimationFrame(time=>{frame=0;if(!idle||blocked()){hide();return;}canvas.classList.add('player-visible');lastTime=time;lastGuard=time;frame=requestAnimationFrame(tick);});
 }
 function load(){
  if(loading||failed)return;loading=true;
  images.forEach((image,index)=>{image.onload=()=>{if(++loaded===images.length){ready=true;schedule();}};image.onerror=()=>{failed=true;ready=false;hide();};image.src=sources[index];});
 }
 function schedule(){hide();if(blocked()||failed)return;idleTimer=setTimeout(reveal,idleDelay);}
 window.addEventListener('scroll',schedule,{passive:true});document.addEventListener('scroll',schedule,{capture:true,passive:true});
 window.addEventListener('wheel',schedule,{passive:true});window.addEventListener('touchstart',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class','data-chapter']});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 if(document.fonts)document.fonts.ready.then(schedule);else schedule();
})();
