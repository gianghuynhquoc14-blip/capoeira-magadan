(() => {
'use strict';
const root=document.querySelector('#callback'),form=document.querySelector('#callback-form');
const status=document.querySelector('#callback-status'),submit=form.querySelector('button[type=submit]');
const endpoint=window.CLUB_CONTACT?.endpoint;
if(!endpoint)return; // Registration through the bot remains available while this module is disconnected.
try{if(new URL(endpoint).protocol!=='https:')return;}catch{return;}
root.hidden=false;
root.addEventListener('toggle',()=>window.dispatchEvent(new Event('resize')));
let pending=false,delivered=false,requestId=null,previousBody='';
form.addEventListener('input',()=>{if(!pending){status.textContent='';form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(pending||delivered)return;
 const name=form.elements.name.value.trim(),contact=form.elements.contact.value.trim(),comment=form.elements.comment.value.trim();
 const field=!name?form.elements.name:!contact?form.elements.contact:null;
 if(field){field.setAttribute('aria-invalid','true');status.textContent=field.name==='name'?'Укажи, как к тебе обращаться.':'Оставь телефон или Telegram для ответа.';field.focus();return;}
 if(contact.length<5){form.elements.contact.setAttribute('aria-invalid','true');status.textContent='Проверь контакт: телефон с кодом или имя в Telegram.';form.elements.contact.focus();return;}
 const bodyKey=JSON.stringify({name,contact,comment});if(bodyKey!==previousBody||!requestId){requestId=crypto.randomUUID();previousBody=bodyKey;}
 const payload=new URLSearchParams({name,contact,comment,website:form.elements.website.value,requestId,source:'capoeira-magadan-site'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 pending=true;submit.disabled=true;submit.textContent='Отправляем…';status.textContent='';form.setAttribute('aria-busy','true');
 try{
  const response=await fetch(endpoint,{method:'POST',body:payload,credentials:'omit',signal:controller.signal});
  const result=await response.json();
  if(!response.ok||result.ok!==true||result.delivery!=='telegram')throw new Error('Delivery was not confirmed');
  delivered=true;status.textContent='Заявка передана тренерам. Ответим по указанному контакту.';submit.textContent='Заявка отправлена';form.querySelectorAll('input,textarea').forEach(el=>el.readOnly=true);
 }catch(error){
  status.textContent=error.name==='AbortError'?'Подтверждение не пришло вовремя. Уточни отправку у тренера в Telegram.':'Не удалось подтвердить отправку. Попробуй ещё раз или напиши тренеру в Telegram.';
  submit.disabled=false;submit.textContent='Отправить заявку';
 }finally{clearTimeout(timer);pending=false;form.removeAttribute('aria-busy');}
});
})();
