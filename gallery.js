(() => {
 'use strict';
 const gallery=document.querySelector('#club-gallery'),viewer=document.querySelector('#gallery-viewer');
 const grid=gallery.querySelector('.gallery-grid'),photos=window.CLUB_GALLERY||[];
 const image=viewer.querySelector('img'),caption=viewer.querySelector('figcaption'),counter=viewer.querySelector('.gallery-counter');
 let built=false,index=0;
 function lock(){document.documentElement.classList.toggle('profile-open',gallery.open||viewer.open);}
 function showPhoto(next){
  index=(next+photos.length)%photos.length;const photo=photos[index];
  image.src=photo.full;image.alt=photo.alt;caption.textContent=photo.alt+(photo.credit?' · '+photo.credit:'');
  counter.textContent=(index+1)+' / '+photos.length;
 }
 function build(){
  if(built)return;built=true;
  photos.forEach((photo,i)=>{
   const button=document.createElement('button');button.type='button';button.className='gallery-thumbnail';
   button.setAttribute('aria-label','Открыть фото '+(i+1)+': '+photo.alt);
   const thumbnail=document.createElement('img');thumbnail.src=photo.thumb;thumbnail.alt=photo.alt;thumbnail.loading='lazy';thumbnail.decoding='async';
   button.append(thumbnail);button.addEventListener('click',()=>{showPhoto(i);viewer.showModal();lock();});grid.append(button);
  });
 }
 document.querySelectorAll('[data-open-gallery]').forEach(button=>button.addEventListener('click',()=>{build();gallery.showModal();lock();}));
 [gallery,viewer].forEach(dialog=>{dialog.querySelector('[data-gallery-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',lock);});
 viewer.querySelector('[data-gallery-prev]').addEventListener('click',()=>showPhoto(index-1));
 viewer.querySelector('[data-gallery-next]').addEventListener('click',()=>showPhoto(index+1));
 viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();showPhoto(index+(event.key==='ArrowLeft'?-1:1));}});
})();
