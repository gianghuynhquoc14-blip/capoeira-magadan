(() => {
 'use strict';
 const canvas=document.querySelector('#journey-player');
 if(!canvas)return;
 const context=canvas.getContext('2d'),image=new Image();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,lastTime=0,elapsed=0,ready=false;
 const columns=8,rows=4,cycle=5200;
 function paused(){return document.hidden||reduced.matches||canvas.classList.contains('player-no-space')||document.body.classList.contains('flat-mode')||document.documentElement.classList.contains('profile-open');}
 function drawCell(row,column,alpha=1,rotation=0,lift=0){
  const cellWidth=image.naturalWidth/columns,cellHeight=image.naturalHeight/rows;
  // The generated kick extends into the tucked pose's outer margin.
  // Crop only that empty margin when displaying the tucked frame.
  const inset=column===6?cellWidth*.12:0;
  context.save();context.globalAlpha=alpha;
  context.translate(160,160-lift);context.rotate(rotation);
  context.drawImage(image,column*cellWidth+inset,row*cellHeight,cellWidth-inset,cellHeight,-150+inset/cellWidth*300,-150,300-inset/cellWidth*300,300);
  context.restore();
 }
 function paint(){
  if(!ready)return;
  context.clearRect(0,0,320,320);
  if(paused()){drawCell(0,0);return;}
  const sequence=elapsed/cycle,row=Math.floor(sequence)%rows,phase=sequence%1;
  // The motion sheet supplies the body poses; the tucked frame follows a jump arc.
  const timings=[0,.14,.24,.34,.44,.55,.68,.85,1];
  let pose=0;while(pose<7&&phase>=timings[pose+1])pose++;
  let rotation=0,lift=0;
  if(pose===6){const t=(phase-timings[6])/(timings[7]-timings[6]);rotation=-Math.PI*2*t;lift=Math.sin(t*Math.PI)*44;}
  const change=phase>.94?(phase-.94)/.06:0;
  // Brief pose blends soften changes without a long double-limb ghost.
  const poseProgress=(phase-timings[pose])/(timings[pose+1]-timings[pose]);
  const poseBlend=pose!==6&&pose!==7?Math.max(0,(poseProgress-.82)/.18):0;
  drawCell(row,pose,(1-change)*(1-poseBlend),rotation,lift);
  if(poseBlend>0)drawCell(row,pose+1,(1-change)*poseBlend);
  if(change>0)drawCell((row+1)%rows,0,change);
 }
 function place(){
  const mobile=innerWidth<=600;
  const content=document.querySelector('.scene.active .scene-content');
  const obstacles=[content,document.querySelector('.site-header'),document.querySelector('.journey-nav'),document.querySelector('.journey-footer'),...document.querySelectorAll('.scene.active .family-side')].filter(Boolean).map(e=>e.getBoundingClientRect());
  let point,size;
  for(const candidateSize of (mobile?[64,48,40]:[104,80])){
   const candidates=mobile?[[innerWidth/2-candidateSize/2,innerHeight-205],[innerWidth/2-candidateSize/2,innerHeight-180],[10,innerHeight-205],[innerWidth-candidateSize-10,innerHeight-205]]:[[20,innerHeight*.39],[innerWidth-candidateSize-20,innerHeight*.39],[20,innerHeight-candidateSize-62],[innerWidth-candidateSize-20,innerHeight-candidateSize-62]];
   point=candidates.find(([x,y])=>y>70&&y+candidateSize<innerHeight-35&&!obstacles.some(r=>x<r.right+5&&x+candidateSize>r.left-5&&y<r.bottom+5&&y+candidateSize>r.top-5));
   if(point){size=candidateSize;break;}
  }
  canvas.classList.toggle('player-no-space',!point);
  if(point){canvas.style.left=point[0]+'px';canvas.style.top=point[1]+'px';canvas.style.bottom='auto';canvas.style.width=size+'px';}
 }
 function tick(time){
  frame=0;if(paused()){lastTime=0;paint();return;}
  if(lastTime)elapsed+=Math.min(time-lastTime,80);
  lastTime=time;paint();frame=requestAnimationFrame(tick);
 }
 function sync(){
  if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
  if(!ready)return;
  canvas.hidden=false;place();paint();
  if(!paused())frame=requestAnimationFrame(tick);
 }
 image.onload=()=>{ready=true;sync();};
 image.onerror=()=>{canvas.hidden=true;};
 image.src=canvas.dataset.src;
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',sync);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class','data-chapter']});
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',sync,{passive:true});
})();
