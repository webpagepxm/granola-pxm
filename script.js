'use strict';
/* CONFIGURACIÓN: agrega el número real cuando la productora lo comparta.
   Formato internacional sin + ni espacios. Ej. 52 + 10 dígitos (México). */
const SITE_CONFIG = { whatsappNumber:'', priceMXN:null, discountCode:'GRANOLA15', promoPercentage:15 };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let quantity = 1;
let discountUnlocked = false;
let orderKind = 'personal';
let previousFocus = null;
const promoOverlay = $('#promo-overlay');
const orderOverlay = $('#order-overlay');
const qtyInput = $('#qty-value');
const hasWhatsapp = () => /^\d{10,15}$/.test(SITE_CONFIG.whatsappNumber.trim());

$('#year').textContent = new Date().getFullYear();
if (Number.isFinite(SITE_CONFIG.priceMXN) && SITE_CONFIG.priceMXN > 0) {
  $('#product-price').textContent = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(SITE_CONFIG.priceMXN);
}

// El menu móvil abre con <details> de forma nativa incluso sin JavaScript.
// JS solo añade cierre al elegir sección; no es necesario para navegar.
const mobileMenu = document.querySelector('#mobile-menu');
if (mobileMenu) {
  mobileMenu.querySelectorAll('a, button').forEach(item=>item.addEventListener('click',()=>{ mobileMenu.open=false; }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')mobileMenu.open=false;});
  document.addEventListener('click',event=>{if(mobileMenu.open && !mobileMenu.contains(event.target))mobileMenu.open=false;});
}

// Contador accesible; el número puede editarse también de forma manual.
function setQuantity(next){
  const parsed=Number.parseInt(next,10);
  quantity=Number.isFinite(parsed) ? Math.max(1,Math.min(99,parsed)) : 1;
  qtyInput.value=String(quantity);
  $('#qty-minus').disabled=quantity<=1;
  $('#qty-plus').disabled=quantity>=99;
  qtyInput.setAttribute('aria-valuenow',String(quantity));
}
$('#qty-minus').addEventListener('click',()=>setQuantity(quantity-1));
$('#qty-plus').addEventListener('click',()=>setQuantity(quantity+1));
qtyInput.addEventListener('input',()=>{if(qtyInput.value!=='')setQuantity(qtyInput.value);});
qtyInput.addEventListener('change',()=>setQuantity(qtyInput.value));
setQuantity(1);

function closeLayer(layer,restore=true){
  if(!layer || layer.hidden)return;
  layer.hidden=true;
  if(promoOverlay.hidden && orderOverlay.hidden)document.body.classList.remove('modal-open');
  if(restore && previousFocus && typeof previousFocus.focus==='function')previousFocus.focus({preventScroll:true});
}
function openLayer(layer){
  previousFocus=document.activeElement;
  closeLayer(promoOverlay,false);closeLayer(orderOverlay,false);
  layer.hidden=false;
  document.body.classList.add('modal-open');
  (layer.querySelector('[role="dialog"]')||layer).focus({preventScroll:true});
}
function openPromo(){
  $('#promo-form-step').hidden=discountUnlocked;
  $('#promo-success-step').hidden=!discountUnlocked;
  openLayer(promoOverlay);
}
function closePromo(){closeLayer(promoOverlay);}
$('#promo-close').addEventListener('click',closePromo);
$$('[data-open-promo]').forEach(el=>el.addEventListener('click',openPromo));
$('#order-close').addEventListener('click',()=>closeLayer(orderOverlay));
[promoOverlay,orderOverlay].forEach(layer=>layer.addEventListener('click',e=>{if(e.target===layer){if(layer===promoOverlay)closePromo();else closeLayer(layer);}}));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!orderOverlay.hidden)closeLayer(orderOverlay);else if(!promoOverlay.hidden)closePromo();}
  if(e.key!=='Tab')return;
  const layer=!orderOverlay.hidden?orderOverlay:!promoOverlay.hidden?promoOverlay:null;
  if(!layer)return;
  const focusable=[...layer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(el=>el.getClientRects().length>0 && el.offsetParent!==null);
  if(!focusable.length)return;
  if(e.shiftKey && document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus();}
  else if(!e.shiftKey && document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus();}
});

$('#promo-claim').addEventListener('click',()=>{
  discountUnlocked=true;
  $('#promo-form-step').hidden=true;
  $('#promo-success-step').hidden=false;
  $('#discount-code').textContent=SITE_CONFIG.discountCode;
  $('#promo-order').focus();
});
$('#copy-discount').addEventListener('click',async()=>{
  const ok=await copyText(SITE_CONFIG.discountCode);
  $('#copy-discount').textContent=ok?'CÓDIGO COPIADO':'CÓDIGO: '+SITE_CONFIG.discountCode;
});
$('#promo-order').addEventListener('click',()=>openOrder('personal'));

function orderMessage(){
  const name=$('#order-name').value.trim();
  const zone=$('#order-zone').value.trim();
  const notes=$('#order-notes').value.trim();
  let lines;
  if(orderKind==='cafe'){
    lines=['¡Hola! Tengo una cafetería / negocio en Puerto Escondido y me interesa la granola artesanal para mi menú. Me gustaría cotizar precios, disponibilidad y condiciones para cafeterías.'];
    const business=$('#order-business').value.trim();
    const estimate=$('#order-estimate').value;
    if(business)lines.push('Negocio: '+business);
    if(estimate)lines.push('Cantidad estimada: '+estimate);
  }else{
    lines=['¡Hola! Quisiera pedir '+quantity+' bolsa'+(quantity===1?'':'s')+' de granola artesanal de 250 g. ¿Me confirmas precio, disponibilidad y entrega?'];
    if(discountUnlocked)lines.push('Código de primer pedido: '+SITE_CONFIG.discountCode+' (15% de descuento, sujeto a confirmación).');
  }
  if(name)lines.push('Mi nombre: '+name);
  if(zone)lines.push('Zona de entrega: '+zone);
  if(notes)lines.push('Notas: '+notes);
  return lines.join('\n\n');
}
function openOrder(kind){
  orderKind=kind;
  $('#order-cafe-fields').hidden=(kind!=='cafe');
  $('#order-name').value='';$('#order-zone').value='';$('#order-notes').value='';
  $('#order-business').value='';$('#order-estimate').value='';
  $('#order-message-panel').hidden=true;
  $('#order-feedback').textContent='';
  $('#order-heading').innerHTML=kind==='cafe'?'TU CAFÉ +<br><em>NUESTRA GRANOLA.</em>':'HABLEMOS<br>DE <em>GRANOLA.</em>';
  $('#order-intro').textContent=kind==='cafe'
     ? 'Cuéntanos un poco sobre tu cafetería. Preparamos una consulta sencilla para cotizar granola al mayoreo.'
     : 'Tienes '+quantity+' bolsa'+(quantity===1?'':'s')+' seleccionada'+(quantity===1?'':'s')+'. Agrega los datos que quieras compartir.';
  $('#order-summary').textContent=kind==='cafe'
    ? 'Cotización para cafetería · Puerto Escondido'
    : quantity+' bolsa'+(quantity===1?'':'s')+' de granola artesanal · 250 g c/u'+(discountUnlocked?' · '+SITE_CONFIG.discountCode+' aplicado':'');
  $('#send-order').textContent=hasWhatsapp()?'ABRIR WHATSAPP':'PREPARAR MI MENSAJE';
  $('#order-fine-print').textContent=hasWhatsapp()
     ? 'Se abrirá el chat de la productora con tu pedido redactado. Tú decides cuándo enviarlo.'
     : 'Todavía falta el WhatsApp de la productora. Puedes preparar, compartir o copiar tu pedido sin dejar datos en esta página.';
  openLayer(orderOverlay);
}
$$('[data-order-kind]').forEach(el=>el.addEventListener('click',()=>openOrder(el.dataset.orderKind)));
$('#send-order').addEventListener('click',()=>{
  const msg=orderMessage();
  const preview=$('#order-message-text');preview.value=msg;
  $('#order-message-panel').hidden=false;
  if(hasWhatsapp()){
    $('#order-feedback').textContent='Abriendo el chat de la productora…';
    // Navegación directa desde el tap: evita bloqueos de ventanas emergentes en iOS.
    window.location.href='https://wa.me/'+SITE_CONFIG.whatsappNumber.trim()+'?text='+encodeURIComponent(msg);
  }else{
    $('#order-feedback').textContent='Tu mensaje está listo. Compártelo o cópialo cuando tengas el contacto de la productora.';
    preview.focus({preventScroll:true});
  }
});
async function copyText(value){
  try{if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(value);return true;}}catch(_){/* fallback */}
  const el=document.createElement('textarea');el.value=value;el.style.cssText='position:fixed;left:-9999px;top:0';
  document.body.append(el);el.select();
  let ok=false;try{ok=document.execCommand('copy');}catch(_){}
  el.remove();return ok;
}
$('#copy-order').addEventListener('click',async()=>{
  const text=orderMessage();
  $('#order-message-text').value=text;
  const ok=await copyText(text);
  $('#order-feedback').textContent=ok?'Mensaje copiado. Pégalo en WhatsApp cuando tengas el contacto.':'Selecciona y copia el mensaje del cuadro superior.';
  if(!ok)$('#order-message-text').select();
});
$('#share-order').addEventListener('click',async()=>{
  const msg=orderMessage();
  if(navigator.share){
    try{await navigator.share({text:msg});$('#order-feedback').textContent='Elige dónde compartir tu mensaje.';return;}
    catch(err){if(err && err.name==='AbortError')return;}
  }
  const ok=await copyText(msg);
  $('#order-feedback').textContent=ok?'Mensaje copiado. Pégalo en WhatsApp o donde prefieras.':'Selecciona y copia el texto del cuadro.';
});

// La promoción aparece en cada apertura completa, sin cookies, almacenamiento ni email.
// DOMContentLoaded no espera las fotografías, por eso funciona incluso con conexión lenta.
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>window.setTimeout(openPromo,320),{once:true});
}else{
  window.setTimeout(openPromo,320);
}
