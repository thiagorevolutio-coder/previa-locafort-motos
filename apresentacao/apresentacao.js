const KEY='locafort-apresentacao-v31';
const state={scene:0,modelId:'',route:''};
const allScenes=[...document.querySelectorAll('.scene')];
let scenes=[],catalog,showcase=[],touch,navLocked=false;
const $=selector=>document.querySelector(selector);

const money=(value,cents=false)=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:cents?2:0,maximumFractionDigits:cents?2:0});
const asset=value=>/^https?:\/\//i.test(value)||String(value).startsWith('/api/')?value:`../${String(value).replace(/^\/+/, '')}`;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
const load=()=>{try{Object.assign(state,JSON.parse(sessionStorage.getItem(KEY))||{})}catch(_){}};

async function loadCatalog(){
  try{const response=await fetch('../api/catalogo?source=kv',{headers:{Accept:'application/json'}});if(response.ok)return response.json()}catch(_){}
  if(['localhost','127.0.0.1',''].includes(location.hostname)||location.protocol==='file:'){const response=await fetch('../catalogo-padrao.json',{headers:{Accept:'application/json'}});if(response.ok)return response.json()}
  throw Error('Catálogo indisponível');
}

function buildShowcase(){
  showcase=(Array.isArray(catalog.produtos)?catalog.produtos:[])
    .filter(product=>product&&product.ativo===true&&product.disponivel===true)
    .sort((a,b)=>(Number(a.ordem)||0)-(Number(b.ordem)||0))
    .map(product=>({id:String(product.id),name:String(product.nome),image:asset(product.imagem),weekly:product.precoTipo==='sob-consulta'?null:Number(product.precoSemanal),weeklyType:product.precoTipo,label:[product.cilindrada,product.uso].filter(Boolean).join(' · ')||String(product.categoria)}));
  if(showcase.length&&!showcase.some(model=>model.id===state.modelId))state.modelId=showcase[0].id;
}

const currentModel=()=>showcase.find(model=>model.id===state.modelId)||showcase[0];
const weeklyText=model=>model.weeklyType==='sob-consulta'||model.weekly===null?'Valor sob consulta':`A partir de ${money(model.weekly)}`;

function buildScenes(){
  scenes=allScenes.filter(scene=>{
    if(scene.dataset.stage)return true;
    if(!state.route)return false;
    return scene.dataset.path==='shared'||scene.dataset.path===state.route;
  });
  allScenes.forEach(scene=>{if(!scenes.includes(scene)){scene.classList.remove('active');scene.setAttribute('aria-hidden','true')}});
  state.scene=Math.max(0,Math.min(scenes.length-1,state.scene));
}

function renderCatalog(){
  const container=$('#catalogShowcase');container.textContent='';
  showcase.forEach(model=>{
    const button=document.createElement('button');button.type='button';button.className='catalog-card';button.classList.toggle('selected',model.id===state.modelId);button.setAttribute('aria-pressed',model.id===state.modelId);
    const image=document.createElement('img');image.src=model.image;image.alt=model.name;image.classList.toggle('cutout-image',/\.(?:png|webp)(?:$|\?)/i.test(model.image));
    const copy=document.createElement('span');copy.className='catalog-card-copy';
    const label=document.createElement('small');label.textContent=model.label;
    const name=document.createElement('strong');name.textContent=model.name;
    const price=document.createElement('em');price.textContent=model.weeklyType==='sob-consulta'||model.weekly===null?weeklyText(model):`${weeklyText(model)} por semana`;
    const hint=document.createElement('i');hint.textContent='Toque para selecionar';
    copy.append(label,name,price,hint);button.append(image,copy);
    button.onclick=()=>{state.modelId=model.id;renderCatalog();personalize();save()};container.append(button);
  });
  requestAnimationFrame(updateCatalogHint);
}

function updateCatalogHint(){
  const container=$('#catalogShowcase'),hint=$('.scene-hint');
  if(!container||!hint)return;
  hint.textContent=container.scrollWidth>container.clientWidth+1?'Deslize, selecione a moto e avance.':'Selecione a moto e avance.';
}

function personalize(){
  const model=currentModel(),weekly=weeklyText(model);
  ['#modelHeroImage','#reviewedImage','#tankImage','#equipmentImage','#closingImage'].forEach(selector=>{const image=$(selector);image.src=model.image;image.alt=model.name;image.classList.toggle('cutout-image',/\.(?:png|webp)(?:$|\?)/i.test(model.image))});
  $('#modelHeroName').textContent=model.name;
  $('#weeklyHero').textContent=weekly;
  $('#weeklyModel').textContent=model.name;
  $('#closingModel').textContent=model.name;
  $('#modelPathNote').textContent=state.route==='purchase'?'Este roteiro explica somente a intenção de compra.':'Este roteiro explica somente a locação.';
  const routeText=state.route==='purchase'?'Intenção de compra':'Locação';
  const message=`Olá! Vi a apresentação da Locafort.\n\nMoto de interesse: ${model.name}\nCaminho: ${routeText}\nValor mostrado: ${weekly} por semana\n\nQuero fazer a análise inicial.`;
  $('#whatsappLink').href=`https://wa.me/${catalog.site.whatsapp}?text=${encodeURIComponent(message)}`;
}

function updateHeader(){
  const labels={rental:'LOCAÇÃO',purchase:'INTENÇÃO DE COMPRA'};
  const current=scenes[state.scene];
  $('#routeLabel').textContent=current?.dataset.stage?'APRESENTAÇÃO':(state.route?labels[state.route]:'APRESENTAÇÃO');
}

function go(index){
  if(!showcase.length)return;
  state.scene=Math.max(0,Math.min(scenes.length-1,index));
  const current=scenes[state.scene];
  allScenes.forEach(scene=>{const active=scene===current;scene.classList.toggle('active',active);scene.setAttribute('aria-hidden',String(!active))});
  $('#sceneCount').textContent=`${String(state.scene+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;
  $('#previousScene').disabled=state.scene===0;
  $('#nextScene').disabled=state.scene===scenes.length-1||(current.dataset.stage==='route'&&!state.route);
  updateHeader();save();
}

function chooseRoute(route){
  state.route=route;
  state.scene=2;
  buildScenes();personalize();go(2);
}

function step(delta){
  if(navLocked)return;
  navLocked=true;
  go(state.scene+delta);
  window.setTimeout(()=>{navLocked=false},450);
}

document.querySelectorAll('[data-route-choice]').forEach(button=>button.addEventListener('click',()=>chooseRoute(button.dataset.routeChoice)));
$('#previousScene').onclick=event=>{event.stopPropagation();step(-1)};
$('#nextScene').onclick=event=>{event.stopPropagation();step(1)};
$('#homeButton').onclick=()=>{state.scene=0;go(0)};
document.addEventListener('keydown',event=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(event.key==='ArrowLeft')step(-1);if(event.key==='ArrowRight'||event.key===' ')step(1)});
const interactive='a,button,input,select,textarea,label,summary,details,.catalog-showcase';
document.addEventListener('touchstart',event=>{if(event.target.closest(interactive)){touch=null;return}const point=event.changedTouches[0];touch={x:point.clientX,y:point.clientY}},{passive:true});
document.addEventListener('touchend',event=>{if(!touch)return;const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1)},{passive:true});
const fullscreen=$('#fullscreenButton');if(document.documentElement.requestFullscreen){fullscreen.hidden=false;fullscreen.onclick=async()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
window.addEventListener('resize',updateCatalogHint,{passive:true});

function showEmptyCatalog(){
  showcase=[];state.scene=0;state.modelId='';
  document.body.classList.add('catalog-empty-state');$('#catalogEmpty').hidden=false;$('#catalogShowcase').hidden=true;$('.scene-hint').hidden=true;
  $('#previousScene').disabled=true;$('#nextScene').disabled=true;$('#deckStatus').textContent='Catálogo sem motos disponíveis.';$('#sceneCount').textContent='CATÁLOGO';
}

(async()=>{load();if(!['rental','purchase'].includes(state.route))state.route='';try{catalog=await loadCatalog();buildShowcase();if(!showcase.length)throw Error('Catálogo vazio');buildScenes();renderCatalog();personalize();go(state.scene)}catch(_){showEmptyCatalog()}})();
