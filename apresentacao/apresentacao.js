const KEY='locafort-apresentacao-v4';
const state={started:false,scene:0,modelId:'',intent:'',notes:false};
let catalog,models=[],touch,idleTimer;
const scenes=[...document.querySelectorAll('.scene')];
const $=selector=>document.querySelector(selector);
const money=(value,cents=false)=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:cents?2:0,maximumFractionDigits:cents?2:0});
const path=value=>/^https:\/\//i.test(value)?value:`../${String(value).replace(/^\/+/, '')}`;
const selected=()=>models.find(model=>model.id===state.modelId)||models[0];
const price=model=>model.precoTipo==='sob-consulta'?'Valor sob consulta':`A partir de ${money(model.precoSemanal)} por semana`;
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function load(){try{Object.assign(state,JSON.parse(sessionStorage.getItem(KEY))||{})}catch(_){}}
async function getCatalog(){for(const url of ['../api/catalogo','../catalogo-padrao.json']){try{const response=await fetch(url);if(response.ok)return response.json()}catch(_){}}throw Error('Catálogo indisponível')}
function renderSetup(){
  const box=$('#setupCatalog');box.textContent='';
  models.forEach(model=>{const button=document.createElement('button');button.type='button';button.className='setup-card';button.classList.toggle('selected',model.id===state.modelId);button.setAttribute('aria-pressed',model.id===state.modelId);button.innerHTML=`<img src="${path(model.imagem)}" alt="${model.nome}"><span><small>${[model.cilindrada,model.uso].filter(Boolean).join(' · ')}</small><strong>${model.nome}</strong><em>${price(model)}</em><i>${model.id===state.modelId?'Selecionada ✓':'Toque para escolher'}</i></span>`;button.onclick=()=>{state.modelId=model.id;renderSetup();save()};box.append(button)});
  document.querySelectorAll('[data-intent]').forEach(button=>{const active=button.dataset.intent===state.intent;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',active)});
  $('#setupStart').disabled=!(state.modelId&&state.intent);
}
function renderValues(){
  const conditions=catalog.condicoes;
  $('#valueStrip').innerHTML=[['ALUGUEL',`A partir de ${money(conditions.semanalAPartirDe)}`,'Por semana.'],['CAUÇÃO',money(conditions.caucao),'Pode parcelar em até 12x na maquininha.'],['1ª COBRANÇA','2ª semana','O aluguel semanal começa depois da primeira semana.'],['CONTRATO INICIAL',`${conditions.mesesContratoInicial} meses`,'Período mínimo de aluguel.']].map(([label,value,detail])=>`<article><small>${label}</small><strong>${value}</strong><p>${detail}</p></article>`).join('');
  $('#depositBase').textContent=money(conditions.caucao);
  const purchase=state.intent==='Contrato com intenção de compra';
  $('#futureNote').textContent=purchase?`Depois dos ${conditions.mesesContratoInicial} meses, pode optar pelo contrato com intenção de compra: ${money(conditions.intencaoCompraSemanal)} por semana durante ${conditions.intencaoCompraMeses} meses.`:`Depois dos ${conditions.mesesContratoInicial} meses iniciais, pode renovar o aluguel por mais ${conditions.mesesContratoInicial} meses.`;
  updateSimulator();
}
function updateSimulator(){
  if(!catalog)return;
  const base=Number(catalog.condicoes.caucao),count=Math.min(12,Math.max(1,Number($('#installments').value)||1)),raw=$('#machineRate').value.trim(),parsed=Number(raw.replace(',','.')),rate=raw===''||!Number.isFinite(parsed)||parsed<0?0:parsed,total=base*(1+rate/100),perInstallment=total/count;
  $('#installmentsOutput').textContent=`${count}x`;$('#totalWithRate').textContent=money(total,true);$('#installmentValue').textContent=`${count}x de ${money(perInstallment,true)}`;
  if(raw===''){ $('#rateNotice').textContent='Confirme a taxa atual da maquininha.';$('#rateFormula').textContent=`${money(base)} ÷ ${count} = ${money(base/count,true)}` }
  else if(rate===0){ $('#rateNotice').textContent='Sem taxa informada.';$('#rateFormula').textContent=`${money(base)} ÷ ${count} = ${money(base/count,true)}` }
  else{ $('#rateNotice').textContent=`Taxa total aplicada: ${rate.toLocaleString('pt-BR')}%.`;$('#rateFormula').textContent=`${money(base)} + ${rate.toLocaleString('pt-BR')}% = ${money(total,true)}; ÷ ${count} = ${money(perInstallment,true)}` }
}
function personalize(){
  const model=selected(),form=catalog.formulario,source=path(model.imagem),purchase=state.intent==='Contrato com intenção de compra',processSource=path(catalog.site.imagemProcesso||model.imagem);
  [['#heroImage',source],['#useImage',source],['#careImage',source],['#closeImage',source],['#processImage',processSource]].forEach(([selector,src])=>{$(selector).src=src});
  $('#heroImage').alt=model.nome;$('#useImage').alt=model.nome;$('#careImage').alt=model.nome;$('#closeImage').alt=model.nome;$('#heroModel').textContent=model.nome;$('#heroUse').textContent=model.uso||model.categoria||'SUA ROTINA';$('#catalogUse').textContent=`Indicação do catálogo: ${model.uso||model.texto||'consulte a equipe'}.`;
  $('#rentalCare').textContent=form.manutencaoAluguel;$('#purchaseCareNote').hidden=!purchase;$('#purchaseCareNote').textContent=purchase?`Quando essa modalidade começar, ${form.manutencaoCompra.toLowerCase()}`:'';
  renderValues();$('#closeModel').textContent=model.nome;$('#closeIntent').textContent=state.intent;
  const message=`Olá! Vi a apresentação da Locafort.\n\nMoto: ${model.nome}\nInteresse: ${state.intent}\nValor mostrado: ${price(model)}\n\nGostaria de saber o próximo passo.`;
  $('#closeWhatsapp').href=`https://wa.me/${catalog.site.whatsapp}?text=${encodeURIComponent(message)}`;
}
function note(){const panel=$('#sellerNote');panel.hidden=!state.notes;if(state.notes)panel.querySelector('p').textContent=scenes[state.scene].dataset.note||''}
function activeControls(){const story=$('#story');story.classList.remove('controls-idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>story.classList.add('controls-idle'),2800)}
function go(index){state.scene=Math.max(0,Math.min(scenes.length-1,index));scenes.forEach((scene,i)=>{scene.classList.toggle('active',i===state.scene);scene.setAttribute('aria-hidden',i!==state.scene)});$('#sceneCount').textContent=`${String(state.scene+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')}`;$('#previousScene').disabled=state.scene===0;$('#nextScene').disabled=state.scene===scenes.length-1;$('#utilityMenu').open=false;note();save();activeControls()}
function begin(){state.started=true;state.scene=0;personalize();$('#setup').hidden=true;$('#story').hidden=false;go(0);save()}
function setup(){state.started=false;$('#story').hidden=true;$('#setup').hidden=false;renderSetup();save()}
function reset(){Object.assign(state,{started:false,scene:0,modelId:'',intent:'',notes:false});try{sessionStorage.removeItem(KEY)}catch(_){}setup()}
document.querySelectorAll('[data-intent]').forEach(button=>button.onclick=()=>{state.intent=button.dataset.intent;renderSetup();save()});$('#setupStart').onclick=begin;$('#previousScene').onclick=()=>go(state.scene-1);$('#nextScene').onclick=()=>go(state.scene+1);$('#changeProfileButton').onclick=setup;$('#resetButton').onclick=reset;$('#brandReset').onclick=event=>{event.preventDefault();go(0)};$('#notesButton').onclick=()=>{state.notes=!state.notes;note();save();$('#utilityMenu').open=false};$('#installments').addEventListener('input',updateSimulator);$('#machineRate').addEventListener('input',updateSimulator);
document.addEventListener('keydown',event=>{if(!state.started||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(event.key==='ArrowLeft')go(state.scene-1);if(event.key==='ArrowRight')go(state.scene+1)});document.addEventListener('pointermove',activeControls);document.addEventListener('touchstart',event=>{activeControls();if(state.started){const point=event.changedTouches[0];touch={x:point.clientX,y:point.clientY}}},{passive:true});document.addEventListener('touchend',event=>{if(!touch||!state.started)return;const point=event.changedTouches[0],dx=point.clientX-touch.x,dy=point.clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)go(state.scene+(dx<0?1:-1))},{passive:true});$('#story').addEventListener('click',event=>{if(event.target.closest('button,a,summary,details,input,label,output'))return;if(event.clientX<innerWidth/2)go(state.scene-1);else go(state.scene+1)});
const fullscreen=$('#fullscreenButton');if(document.documentElement.requestFullscreen){fullscreen.hidden=false;fullscreen.onclick=async()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
(async()=>{load();try{catalog=await getCatalog();models=catalog.produtos.filter(product=>product.ativo&&product.disponivel).sort((a,b)=>a.ordem-b.ordem);if(!models.some(model=>model.id===state.modelId))state.modelId='';renderSetup();if(state.started&&state.modelId&&state.intent)begin();else setup()}catch(_){$('#setupStatus').textContent='Não foi possível carregar o catálogo.'}})();
