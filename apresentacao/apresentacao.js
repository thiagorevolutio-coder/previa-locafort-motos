const KEY='locafort-apresentacao-v29';
const state={scene:0,modelId:''};
const scenes=[...document.querySelectorAll('.scene')];
const $=selector=>document.querySelector(selector);
let catalog,showcase=[],touch;

const money=(value,cents=false)=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:cents?2:0,maximumFractionDigits:cents?2:0});
const asset=value=>/^https:\/\//i.test(value)||String(value).startsWith('/api/')?value:`../${String(value).replace(/^\/+/, '')}`;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
const load=()=>{try{Object.assign(state,JSON.parse(sessionStorage.getItem(KEY))||{})}catch(_){}};
async function loadCatalog(){
  try{const response=await fetch('../api/catalogo?source=kv',{headers:{Accept:'application/json'}});if(response.ok)return response.json()}catch(_){}
  if(['localhost','127.0.0.1',''].includes(location.hostname)||location.protocol==='file:'){const response=await fetch('../catalogo-padrao.json',{headers:{Accept:'application/json'}});if(response.ok)return response.json()}
  throw Error('Catálogo indisponível')
}

function buildShowcase(){
  showcase=(Array.isArray(catalog.produtos)?catalog.produtos:[])
    .filter(product=>product&&product.ativo===true&&product.disponivel===true)
    .sort((a,b)=>(Number(a.ordem)||0)-(Number(b.ordem)||0))
    .map(product=>({id:String(product.id),name:String(product.nome),image:asset(product.imagem),imageNote:'',weekly:product.precoTipo==='sob-consulta'?null:Number(product.precoSemanal),weeklyType:product.precoTipo,label:[product.cilindrada,product.uso].filter(Boolean).join(' · ')||String(product.categoria),description:String(product.texto||'')}));
  if(showcase.length&&!showcase.some(model=>model.id===state.modelId))state.modelId=showcase[0].id;
}
const currentModel=()=>showcase.find(model=>model.id===state.modelId)||showcase[0];
const weeklyText=model=>model.weeklyType==='sob-consulta'||model.weekly===null?'Valor sob consulta':`A partir de ${money(model.weekly)}`;

function renderCatalog(){
  const container=$('#catalogShowcase');container.textContent='';
  showcase.forEach(model=>{
    const button=document.createElement('button');button.type='button';button.className='catalog-card';button.classList.toggle('selected',model.id===state.modelId);button.setAttribute('aria-pressed',model.id===state.modelId);
    const cardPrice=model.weeklyType==='sob-consulta'||model.weekly===null?weeklyText(model):`${weeklyText(model)} por semana`;
    const image=document.createElement('img');image.src=model.image;image.alt=model.name;image.classList.toggle('cutout-image',/\.(?:png|webp)(?:$|\?)/i.test(model.image));
    const copy=document.createElement('span');copy.className='catalog-card-copy';
    const label=document.createElement('small');label.textContent=model.label;const name=document.createElement('strong');name.textContent=model.name;const price=document.createElement('em');price.textContent=cardPrice;const hint=document.createElement('i');hint.textContent='Toque para destacar';copy.append(label,name,price,hint);button.append(image,copy);
    button.onclick=()=>{state.modelId=model.id;renderCatalog();personalize();save()};container.append(button);
  });
  requestAnimationFrame(updateCatalogHint);
}

function updateCatalogHint(){
  const container=$('#catalogShowcase'),hint=$('.scene-hint');
  if(!container||!hint)return;
  hint.hidden=container.scrollWidth<=container.clientWidth+1;
}

function personalize(){
  const model=currentModel(),conditions=catalog.condicoes,weekly=weeklyText(model),deposit=money(conditions.caucao);
  [['#modelHeroImage',model.image],['#reviewedImage',model.image],['#tankImage',model.image],['#equipmentImage',model.image],['#closingImage',model.image]].forEach(([selector,source])=>{const image=$(selector);image.src=source;image.alt=model.name;image.classList.toggle('cutout-image',/\.(?:png|webp)(?:$|\?)/i.test(source))});
  $('#modelHeroName').textContent=model.name;$('#modelHeroNote').textContent=model.imageNote;$('#weeklyHero').textContent=weekly;$('#weeklyModel').textContent=model.name;
  $('#depositHero').textContent=deposit;$('#equipmentNote').textContent=model.imageNote;$('#closingModel').textContent=model.name;
  const message=`Olá! Vi a apresentação da Locafort.\n\nMoto de interesse: ${model.name}\nValor mostrado: ${weekly} por semana\nInício: 6 meses de locação\n\nQuero fazer a análise inicial.`;
  $('#whatsappLink').href=`https://wa.me/${catalog.site.whatsapp}?text=${encodeURIComponent(message)}`;
  updateSimulator();
}

function updateSimulator(){
  if(!catalog)return;
  const base=Number(catalog.condicoes.caucao),count=Math.max(1,Math.min(12,Number($('#installments').value)||1)),raw=$('#machineRate').value.trim(),parsed=Number(raw.replace(',','.')),rate=raw===''||!Number.isFinite(parsed)||parsed<0?0:parsed,total=base*(1+rate/100);
  $('#installmentsOutput').textContent=`${count}x`;$('#totalWithRate').textContent=money(total,true);$('#installmentValue').textContent=`${count}x de ${money(total/count,true)}`;
  $('#rateNotice').textContent=raw===''?'Confirme a taxa atual da maquininha.':rate===0?'Sem taxa informada.':`Taxa total aplicada: ${rate.toLocaleString('pt-BR')}%.`;
}

function go(index){
  if(!showcase.length)return;
  state.scene=Math.max(0,Math.min(scenes.length-1,index));
  scenes.forEach((scene,i)=>{scene.classList.toggle('active',i===state.scene);scene.setAttribute('aria-hidden',i!==state.scene)});
  $('#sceneCount').textContent=`${String(state.scene+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;
  $('#previousScene').disabled=state.scene===0;$('#nextScene').disabled=state.scene===scenes.length-1;
  if(state.scene!==4)$('#simulator').open=false;
  save();
}

$('#previousScene').onclick=()=>go(state.scene-1);$('#nextScene').onclick=()=>go(state.scene+1);$('#homeButton').onclick=()=>go(0);
$('#installments').addEventListener('input',updateSimulator);$('#machineRate').addEventListener('input',updateSimulator);
document.addEventListener('keydown',event=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(event.key==='ArrowLeft')go(state.scene-1);if(event.key==='ArrowRight'||event.key===' ')go(state.scene+1)});
const interactive='a,button,input,select,textarea,label,summary,details,.catalog-showcase';
document.addEventListener('click',event=>{if(event.defaultPrevented||event.target.closest(interactive)||!showcase.length)return;go(state.scene+1)});
document.addEventListener('touchstart',event=>{if(event.target.closest(interactive)){touch=null;return}const point=event.changedTouches[0];touch={x:point.clientX,y:point.clientY}},{passive:true});
document.addEventListener('touchend',event=>{if(!touch)return;const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)go(state.scene+(dx<0?1:-1))},{passive:true});
const fullscreen=$('#fullscreenButton');if(document.documentElement.requestFullscreen){fullscreen.hidden=false;fullscreen.onclick=async()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
window.addEventListener('resize',updateCatalogHint,{passive:true});

function showEmptyCatalog(){
  showcase=[];state.scene=0;state.modelId='';
  document.body.classList.add('catalog-empty-state');$('#catalogEmpty').hidden=false;$('#catalogShowcase').hidden=true;$('.scene-hint').hidden=true;
  $('#previousScene').disabled=true;$('#nextScene').disabled=true;$('#deckStatus').textContent='Catálogo sem motos disponíveis.';$('#sceneCount').textContent='CATÁLOGO';
}

(async()=>{load();try{catalog=await loadCatalog();buildShowcase();if(!showcase.length)throw Error('Catálogo vazio');renderCatalog();personalize();go(state.scene)}catch(_){showEmptyCatalog()}})();
