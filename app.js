const PHONE = '5585989181727';
const STORAGE_KEY = 'locafort-consulta-v3';
const waLink = message => `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
const ROOT_PREFIX = document.body.dataset.rootPrefix || '';
let catalog = null;
const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const productPrice = product => product.precoTipo === 'sob-consulta' ? 'Valor sob consulta' : `A partir de ${money(product.precoSemanal)} por semana`;
const catalogReady = (async () => {
  for (const url of [`${ROOT_PREFIX}api/catalogo`, `${ROOT_PREFIX}catalogo-padrao.json`]) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(String(response.status));
      catalog = await response.json();
      renderCatalog();
      return catalog;
    } catch (_) {}
  }
  throw new Error('Não foi possível carregar o catálogo.');
})();

function imagePath(path) { return /^https:\/\//i.test(path) ? path : `${ROOT_PREFIX}${path.replace(/^\/+/, '')}`; }
function renderCatalog() {
  const conditions = catalog.condicoes;
  const cards = document.querySelector('#conditionsCards');
  if (cards) cards.innerHTML = `<article><b aria-hidden="true">R$</b><span><small>ALUGUEL</small><strong>${money(conditions.semanalAPartirDe)}</strong><em>por semana, a partir de</em></span></article><article><b aria-hidden="true">🔒</b><span><small>CAUÇÃO</small><strong>${money(conditions.caucao)}</strong></span></article><article><b aria-hidden="true">2ª</b><span><small>COMEÇA A PAGAR</small><strong>Na segunda semana</strong></span></article><article><b aria-hidden="true">📅</b><span><small>CONTRATO INICIAL</small><strong>${conditions.mesesContratoInicial} meses</strong></span></article>`;
  const products = catalog.produtos.filter(product => product.ativo).sort((a, b) => a.ordem - b.ordem);
  const choices = document.querySelector('#catalogModelOptions');
  if (choices) {
    choices.textContent = '';
    products.forEach(product => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.productId = product.id; button.disabled = !product.disponivel;
      const img = document.createElement('img'); img.src = imagePath(product.imagem); img.alt = product.nome;
      const copy = document.createElement('span'); const name = document.createElement('strong'); name.textContent = product.nome;
      const price = document.createElement('small'); price.textContent = product.disponivel ? productPrice(product) : 'Indisponível no momento';
      copy.append(name, price); const arrow = document.createElement('b'); arrow.textContent = product.disponivel ? '→' : '—';
      button.append(img, copy, arrow); choices.append(button);
    });
  }
  const fleet = document.querySelector('#catalogFleet');
  if (fleet) {
    fleet.textContent = '';
    products.forEach(product => {
      const card = document.createElement('article'); card.className = 'bike-card visible'; card.dataset.category = product.categoria;
      const image = document.createElement('div'); image.className = 'bike-image';
      const img = document.createElement('img'); img.src = imagePath(product.imagem); img.alt = `${product.nome} da Locafort`; img.loading = 'lazy';
      const category = document.createElement('span'); category.textContent = product.categoria.toUpperCase(); image.append(img, category);
      const info = document.createElement('div'); info.className = 'bike-info';
      const text = document.createElement('div'); const description = document.createElement('p'); description.textContent = product.texto;
      const title = document.createElement('h3'); title.textContent = product.nome; const price = document.createElement('small'); price.textContent = product.disponivel ? productPrice(product) : 'Indisponível no momento'; text.append(description, title, price);
      const button = document.createElement('button'); button.className = 'bike-ask'; button.dataset.productId = product.id; button.disabled = !product.disponivel; button.setAttribute('aria-label', `${product.disponivel ? 'Consultar' : 'Indisponível'} ${product.nome}`); button.textContent = product.disponivel ? '↗' : '—';
      info.append(text, button); card.append(image, info); fleet.append(card);
    });
  }
  const faqPricing = document.querySelector('#faqPricing');
  if (faqPricing) faqPricing.textContent = `O aluguel começa em ${money(conditions.semanalAPartirDe)} por semana, a caução é de ${money(conditions.caucao)} e os pagamentos semanais começam ${conditions.pagamentoSemanalInicio}. O contrato inicial tem duração mínima de ${conditions.mesesContratoInicial} meses.`;
  const faqIntent = document.querySelector('#faqIntent');
  if (faqIntent) faqIntent.textContent = `Todos começam com contrato mínimo de aluguel de ${conditions.mesesContratoInicial} meses. Depois, é possível renovar o aluguel por mais ${conditions.mesesContratoInicial} meses ou optar pelo contrato com intenção de compra, de ${money(conditions.intencaoCompraSemanal)} por semana durante ${conditions.intencaoCompraMeses} meses.`;
}

const steps = [
  { id: 'city', kicker: 'Primeiro requisito', title: 'Você mora em Fortaleza?', help: 'A locação atende somente quem mora em Fortaleza.', options: [['Fortaleza', 'Sim', '✓', 'Moro em Fortaleza'], ['Outra cidade', 'Não', '–', 'Moro em outra cidade']], reject: value => value !== 'Fortaleza' ? ['Atendimento apenas em Fortaleza', 'A Locafort ainda não consegue seguir com locações para moradores de outras cidades, mesmo que sejam vizinhas.'] : null },
  { id: 'age', kicker: 'Segundo requisito', title: 'Tem 25 anos ou mais?', help: 'É preciso ter pelo menos 25 anos.', options: [['25 anos ou mais', 'Sim', '✓', 'Tenho 25 anos ou mais'], ['Menos de 25 anos', 'Ainda não', '–', 'Tenho menos de 25 anos']], reject: value => value !== '25 anos ou mais' ? ['É preciso ter 25 anos ou mais', 'Este é um requisito atual para iniciar a análise de locação.'] : null },
  { id: 'cnh', kicker: 'Terceiro requisito', title: 'Sua CNH já é definitiva?', help: 'É a carteira recebida depois da provisória.', options: [['Definitiva', 'Sim, é definitiva', '🪪'], ['Provisória', 'É provisória', 'P'], ['Não tenho', 'Ainda não tenho', '–'], ['Dúvida', 'Não sei', '?']], explain: value => value === 'Dúvida' ? 'Veja sua CNH: se aparecer “Permissão”, ela ainda é provisória. Escolha uma resposta para continuar.' : '', reject: value => ['Provisória', 'Não tenho'].includes(value) ? ['É necessária CNH definitiva', 'A CNH provisória não é aceita para esta locação. Você poderá tentar novamente quando tiver a carteira definitiva.'] : null },
  { id: 'incomeProof', kicker: 'Quarto requisito', title: 'Você tem comprovantes de renda?', help: 'Não há renda mínima. Você só precisa conseguir comprovar.', options: [['Sim', 'Sim, tenho', '✓'], ['Não', 'Ainda não', '–']], reject: value => value === 'Não' ? ['Organize seus comprovantes de renda', 'Para continuar a análise, separe o comprovante mais recente ou contracheque se tiver emprego formal; comprovante MEI e relatório de renda se for MEI; ou relatórios e comprovantes dos últimos 3 meses se trabalhar com aplicativos, de forma informal ou como autônomo. Quando estiver com eles, faça uma nova consulta.'] : null },
  { id: 'incomeSource', kicker: 'Sobre sua renda', title: 'De onde vem sua renda?', help: 'No final, mostramos qual comprovante você precisa separar.', options: [['Emprego formal', 'Emprego formal', '💼'], ['MEI', 'MEI', 'M'], ['Aplicativos', 'Aplicativos', '📱'], ['Informal/autônomo', 'Informal ou autônomo', '🔧']] },
  { id: 'purpose', kicker: 'Sobre a moto', title: 'Vai usar a moto para quê?', options: [['Aplicativos', 'Trabalhar com apps', '📱'], ['Uso particular', 'Uso particular', '🛣️']] },
  { id: 'name', kicker: 'Seus dados', title: 'Qual é seu nome completo?', input: { type: 'text', label: 'Nome completo', autocomplete: 'name', hint: 'Exemplo: Maria da Silva', validate: value => value.trim().split(/\s+/).length >= 2 || 'Digite seu nome e sobrenome.' } },
  { id: 'income', kicker: 'Sua renda', title: 'Quanto você ganha por mês?', input: { type: 'text', inputmode: 'numeric', label: 'Renda mensal', placeholder: 'R$ 2.500', hint: 'Pode ser um valor aproximado. Não há renda mínima.', validate: value => Number(value.replace(/\D/g, '')) > 0 || 'Digite um valor aproximado.' } },
  { id: 'email', kicker: 'Seu contato', title: 'Qual é seu melhor e-mail?', input: { type: 'email', label: 'E-mail', autocomplete: 'email', placeholder: 'voce@exemplo.com', hint: 'Usaremos para organizar a análise.', validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Confira se o e-mail está completo.' } },
  { id: 'phone', kicker: 'Seu contato', title: 'Qual é seu celular com DDD?', input: { type: 'tel', inputmode: 'numeric', label: 'Celular com DDD', autocomplete: 'tel', placeholder: '(85) 99999-9999', hint: 'Digite seu próprio número.', validate: value => value.replace(/\D/g, '').length >= 10 || 'Digite o DDD e o número completo.' } },
  { id: 'addressDocs', kicker: 'Seus documentos', title: 'Tem 3 comprovantes do seu endereço?', help: 'Precisam ser do mesmo tipo, como 3 contas da Enel.', options: [['Meu nome', 'Sim, no meu nome', '🏠'], ['Outro nome', 'Sim, em outro nome', '👥'], ['Ainda não', 'Ainda não tenho', '–']], reject: value => value === 'Ainda não' ? ['Organize seus comprovantes de endereço', 'Para continuar a análise, separe três comprovantes do endereço atual do mesmo tipo. Quando estiver com eles, faça uma nova consulta.'] : null },
  { id: 'relationship', kicker: 'Comprovante em outro nome', title: 'Qual é o grau de parentesco com essa pessoa?', condition: answers => answers.addressDocs === 'Outro nome', options: [['Pai ou mãe', 'Pai ou mãe', '👪'], ['Cônjuge', 'Cônjuge', '♥'], ['Irmão ou irmã', 'Irmão ou irmã', '👥'], ['Outro parentesco', 'Outro parentesco', '+']] },
  { id: 'gov', kicker: 'Acesso pessoal', title: 'Você entra na sua conta Gov.br?', help: 'Nunca envie sua senha ou código para ninguém.', options: [['Sim', 'Sim, consigo entrar', '🔐'], ['Não', 'Ainda não consigo', '–']], reject: value => value === 'Não' ? ['Recupere seu acesso ao Gov.br', 'Para continuar a análise, você precisa acessar sua própria conta. Quando recuperar o acesso, faça uma nova consulta. Nunca compartilhe senha ou código com ninguém.'] : null },
  { id: 'start', kicker: 'Previsão', title: 'Quando pretende começar?', options: [['O quanto antes', 'O quanto antes', '⚡'], ['Nesta semana', 'Nesta semana', '📅'], ['Mais adiante', 'Mais adiante', '🕒']] },
  { id: 'source', kicker: 'Última pergunta', title: 'Como conheceu a Locafort?', options: [['Instagram', 'Instagram', '◎'], ['Indicação', 'Indicação', '👥'], ['Google', 'Google', 'G'], ['Outro', 'Outro lugar', '+']] }
];

const simulator = document.querySelector('#simular-locacao');
const dialog = simulator.querySelector('.simulator-dialog');
const intro = document.querySelector('#simulatorIntro');
const payment = document.querySelector('#simulatorPayment');
const modelPanel = document.querySelector('#simulatorModel');
const intentPanel = document.querySelector('#simulatorIntent');
const intentInfoPanel = document.querySelector('#simulatorIntentInfo');
const question = document.querySelector('#simulatorQuestion');
const result = document.querySelector('#simulatorResult');
const content = simulator.querySelector('.simulator-content');
const progressBar = document.querySelector('#simulatorProgressBar');
const progressLabel = document.querySelector('#simulatorStepLabel');
const backButton = document.querySelector('#simulatorBack');
const restartButton = document.querySelector('#simulatorRestart');
const optionsBox = document.querySelector('#questionOptions');
const questionForm = document.querySelector('#questionForm');
const questionInput = document.querySelector('#questionInput');
const speechButton = document.querySelector('#questionListen');
const paymentSpeechButton = document.querySelector('#paymentListen');
const intentSpeechButton = document.querySelector('#intentListen');
const sendButton = document.querySelector('#enviarPedido');
const speechSupported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance === 'function';
let data = { answers: {}, index: -1, status: 'intro' };
let triggerBeforeOpen = null;
simulator.inert = true;

function save() { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {} }
function load() { try { const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY)); if (stored && stored.answers && Number.isInteger(stored.index)) data = stored; } catch (_) { sessionStorage.removeItem(STORAGE_KEY); } }
function activeSteps() { return steps.filter(step => !step.condition || step.condition(data.answers)); }
function currentStep() { return activeSteps()[data.index]; }
function showPanel(panel) { [intro, payment, modelPanel, intentPanel, intentInfoPanel, question, result].forEach(item => item.classList.toggle('active', item === panel)); content.scrollTo({ top: 0, behavior: 'smooth' }); }
function setProgress() {
  const list = activeSteps();
  const current = Math.max(0, data.index);
  const percent = data.status === 'approved' ? 100 : ['intro', 'payment', 'model', 'intent', 'intentInfo'].includes(data.status) ? 0 : Math.round(((current + 1) / list.length) * 100);
  progressBar.style.setProperty('--progress', `${percent}%`);
  progressLabel.textContent = data.status === 'intro' ? 'Antes de começar' : data.status === 'payment' ? 'Condições da locação' : data.status === 'model' ? 'Escolha da moto' : data.status === 'intent' ? 'Seu plano' : data.status === 'intentInfo' ? 'Como funciona depois' : data.status === 'approved' ? 'Consulta concluída' : data.status === 'stopped' ? 'Consulta concluída' : current < 4 ? `Passo ${current + 1} de 4` : 'Só mais algumas informações';
}
function render() {
  stopSpeech();
  setProgress();
  backButton.hidden = data.status === 'intro';
  restartButton.hidden = data.status === 'intro';
  sendButton.hidden = true;
  if (data.status === 'intro') {
    speechButton.hidden = true;
    paymentSpeechButton.hidden = true;
    intentSpeechButton.hidden = true;
    showPanel(intro);
    document.querySelector('#simulatorStart').textContent = Object.keys(data.answers).length ? 'Continuar de onde parei →' : 'Começar agora →';
    focusSoon('#simulatorStart');
    return;
  }
  if (data.status === 'payment') {
    showPanel(payment);
    speechButton.hidden = true;
    paymentSpeechButton.hidden = !speechSupported;
    intentSpeechButton.hidden = true;
    focusSoon('#paymentContinue');
    return;
  }
  if (data.status === 'model') {
    showPanel(modelPanel);
    speechButton.hidden = paymentSpeechButton.hidden = intentSpeechButton.hidden = true;
    focusSoon('.model-options button');
    return;
  }
  if (data.status === 'intent') {
    showPanel(intentPanel);
    speechButton.hidden = paymentSpeechButton.hidden = intentSpeechButton.hidden = true;
    focusSoon('.intent-options button');
    return;
  }
  if (data.status === 'intentInfo') {
    showPanel(intentInfoPanel);
    speechButton.hidden = paymentSpeechButton.hidden = true;
    intentSpeechButton.hidden = !speechSupported;
    renderIntentInfo();
    focusSoon('#intentContinue');
    return;
  }
  if (data.status === 'stopped' || data.status === 'approved') return renderResult();
  const step = currentStep();
  if (!step) return approve();
  showPanel(question);
  document.querySelector('#questionKicker').textContent = step.kicker;
  document.querySelector('#questionTitle').textContent = step.title;
  speechButton.hidden = !speechSupported;
  const help = document.querySelector('#questionHelp');
  const details = document.querySelector('#questionDetails');
  help.textContent = step.help || '';
  details.hidden = !step.help;
  details.open = false;
  optionsBox.innerHTML = '';
  optionsBox.hidden = !step.options;
  questionForm.hidden = !step.input;
  if (step.options) {
    step.options.forEach(([value, label, icon, detail]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = value;
      button.classList.toggle('selected', data.answers[step.id] === value);
      button.innerHTML = `<b class="option-icon" aria-hidden="true">${icon}</b><span>${label}</span>${detail ? `<small>${detail}</small>` : ''}`;
      button.addEventListener('click', () => answerOption(step, value, button));
      optionsBox.appendChild(button);
    });
    optionsBox.setAttribute('aria-label', step.title);
    focusSoon('.simulator-options button');
  } else {
    const input = step.input;
    document.querySelector('#questionLabel').textContent = input.label;
    document.querySelector('#questionHint').textContent = input.hint || '';
    questionInput.type = input.type || 'text';
    questionInput.inputMode = input.inputmode || '';
    questionInput.autocomplete = input.autocomplete || 'off';
    questionInput.placeholder = input.placeholder || '';
    questionInput.value = data.answers[step.id] || '';
    document.querySelector('#questionError').hidden = true;
    focusSoon('#questionInput');
  }
}
function answerOption(step, value, button) {
  const explanation = step.explain?.(value);
  if (explanation) { const help = document.querySelector('#questionHelp'); const details = document.querySelector('#questionDetails'); help.textContent = explanation; details.hidden = false; details.open = true; return; }
  button.classList.add('choosing');
  button.disabled = true;
  setTimeout(() => {
    data.answers[step.id] = value;
    const rejection = step.reject?.(value);
    if (rejection) return stop(rejection[0], rejection[1]);
    advance();
  }, 120);
}
function advance() { const list = activeSteps(); if (data.index >= list.length - 1) return approve(); data.index += 1; data.status = 'questions'; save(); render(); }
function stop(title, message) { data.status = 'stopped'; data.result = { title, message }; save(); render(); }
function incomeDocument() { return { 'Emprego formal': 'comprovante mais recente ou contracheque', MEI: 'comprovante MEI e relatório de renda', Aplicativos: 'relatórios de ganhos dos últimos 3 meses', 'Informal/autônomo': 'relatórios ou comprovantes dos últimos 3 meses' }[data.answers.incomeSource]; }
function approve() { data.status = 'approved'; save(); render(); }
function renderResult() {
  speechButton.hidden = true;
  paymentSpeechButton.hidden = true;
  intentSpeechButton.hidden = true;
  showPanel(result);
  const kicker = document.querySelector('#resultKicker');
  const title = document.querySelector('#resultTitle');
  const body = document.querySelector('#resultBody');
  result.classList.toggle('neutral-result', data.status === 'stopped');
  if (data.status === 'stopped') {
    kicker.textContent = 'Obrigado por responder'; title.textContent = data.result.title;
    body.innerHTML = `<p class="result-message">${data.result.message.split('.')[0]}.</p><details class="simple-details result-details"><summary>Entenda melhor</summary><div><p>${data.result.message}</p><p>Você pode fazer uma nova consulta quando essa condição mudar.</p></div></details>`;
    focusSoon('#resultRestart'); return;
  }
  kicker.textContent = 'Condições iniciais atendidas'; title.textContent = 'Sua consulta está pronta para análise.';
  body.innerHTML = `<p class="result-message">Agora, envie seu resumo pelo WhatsApp.</p><details class="simple-details result-details"><summary>Ver documentos</summary><div><ul class="document-list"><li>CNH digital</li><li>3 comprovantes do endereço atual do mesmo tipo</li><li>${incomeDocument()}</li><li>Acesso à sua conta Gov.br</li></ul><p>Nunca envie senha ou código.</p></div></details><details class="simple-details result-details"><summary>Entenda a análise</summary><p>Esta consulta não garante aprovação. O responsável confere os documentos e dá a decisão final.</p></details>`;
  const a = data.answers;
  const relationship = a.relationship ? ` (${a.relationship})` : '';
  const message = ['Olá! Concluí a consulta de locação no site da Locafort.', '', `Nome: ${a.name}`, 'Cidade: Fortaleza', `Idade: ${a.age}`, 'CNH: definitiva', `E-mail: ${a.email}`, `Telefone: ${a.phone}`, `Moto escolhida: ${a.model}`, `Valor informado: ${a.modelPrice}`, `Intenção declarada: ${a.intent}`, `Explicação recebida: ${intentExplanation()}`, `Finalidade: ${a.purpose}`, `Fonte de renda: ${a.incomeSource}`, `Renda mensal declarada: R$ ${a.income.replace(/\D/g, '')}`, `Comprovantes de renda: sim — ${incomeDocument()}`, `Comprovantes de endereço: ${a.addressDocs}${relationship}`, `Previsão de início: ${a.start}`, `Como conheceu: ${a.source}`, '', 'Documentos orientados: CNH digital; 3 comprovantes do endereço atual do mesmo tipo; comprovantes de renda conforme a categoria; acesso à própria conta Gov.br.', 'Entendi que a consulta não garante aprovação final e que não devo enviar senha ou código do Gov.br.'].join('\n');
  sendButton.href = waLink(message); sendButton.target = '_blank'; sendButton.rel = 'noopener'; sendButton.hidden = false;
  focusSoon('#enviarPedido');
}
function intentExplanation() {
  const c = catalog.condicoes;
  const common = `Todos começam com um contrato mínimo de aluguel de ${c.mesesContratoInicial} meses. Depois desse período, você pode renovar o aluguel por mais ${c.mesesContratoInicial} meses ou optar pelo contrato com intenção de compra, de ${money(c.intencaoCompraSemanal)} por semana durante ${c.intencaoCompraMeses} meses.`;
  return data.answers.intent === 'Contrato com intenção de compra' ? `${common} O contrato com intenção de compra só pode começar depois dos ${c.mesesContratoInicial} meses iniciais.` : `${common} Se mudar de ideia, o contrato com intenção de compra também estará disponível depois do período inicial.`;
}
function renderIntentInfo() {
  const c = catalog.condicoes;
  document.querySelector('#intentInfoTitle').textContent = data.answers.intent === 'Contrato com intenção de compra' ? `Primeiro, são ${c.mesesContratoInicial} meses de aluguel` : 'Você pode continuar alugando';
  const purchase = data.answers.intent === 'Contrato com intenção de compra';
  document.querySelector('#intentInfoBody').innerHTML = `<div class="intent-main-card"><b aria-hidden="true">${purchase ? '★' : '↻'}</b><span><small>DEPOIS DOS ${c.mesesContratoInicial} MESES</small><strong>${purchase ? `${money(c.intencaoCompraSemanal)} por semana` : `Renove por mais ${c.mesesContratoInicial} meses`}</strong>${purchase ? `<em>durante ${c.intencaoCompraMeses} meses</em>` : ''}</span></div><details class="simple-details"><summary>Entenda melhor</summary><p>${purchase ? `O contrato com intenção de compra só pode começar depois dos ${c.mesesContratoInicial} meses iniciais. Você também pode renovar o aluguel.` : `Depois dos ${c.mesesContratoInicial} meses, você pode renovar o aluguel ou escolher o contrato com intenção de compra: ${money(c.intencaoCompraSemanal)} por semana durante ${c.intencaoCompraMeses} meses.`}</p></details>`;
}
questionForm.addEventListener('submit', event => {
  event.preventDefault(); const step = currentStep(); const value = questionInput.value.trim(); const valid = step.input.validate(value); const error = document.querySelector('#questionError');
  if (valid !== true) { error.textContent = valid; error.hidden = false; questionInput.setAttribute('aria-invalid', 'true'); questionInput.focus(); return; }
  questionInput.removeAttribute('aria-invalid'); data.answers[step.id] = value; advance();
});
questionInput.addEventListener('input', () => {
  const step = currentStep();
  const digits = questionInput.value.replace(/\D/g, '');
  if (step?.id === 'income') questionInput.value = digits ? `R$ ${Number(digits).toLocaleString('pt-BR')}` : '';
  if (step?.id === 'phone') {
    const value = digits.slice(0, 11);
    questionInput.value = value.length <= 2 ? value : value.length <= 6 ? `(${value.slice(0, 2)}) ${value.slice(2)}` : value.length <= 10 ? `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}` : `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  }
  document.querySelector('#questionError').hidden = true;
  questionInput.removeAttribute('aria-invalid');
});
function stopSpeech() { if (speechSupported) window.speechSynthesis.cancel(); speechButton.classList.remove('speaking'); speechButton.textContent = '🔊 Ouvir pergunta'; paymentSpeechButton.classList.remove('speaking'); paymentSpeechButton.textContent = '🔊 Ouvir explicação'; intentSpeechButton.classList.remove('speaking'); intentSpeechButton.textContent = '🔊 Ouvir explicação'; }
function speakText(button, text) {
  if (!speechSupported) return;
  if (button.classList.contains('speaking')) { stopSpeech(); return; }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR'; utterance.rate = .92;
  utterance.onstart = () => { button.classList.add('speaking'); button.textContent = '■ Parar leitura'; };
  utterance.onend = utterance.onerror = () => stopSpeech();
  window.speechSynthesis.speak(utterance);
}
speechButton.addEventListener('click', () => {
  const step = currentStep();
  const help = document.querySelector('#questionHelp');
  const text = `${step.title}. ${document.querySelector('#questionDetails').hidden ? '' : help.textContent}`.trim();
  speakText(speechButton, text);
});
paymentSpeechButton.addEventListener('click', () => { const c = catalog.condicoes; speakText(paymentSpeechButton, `Condições da locação. Aluguel a partir de ${money(c.semanalAPartirDe)} por semana. Caução de ${money(c.caucao)}. Pagamentos semanais ${c.pagamentoSemanalInicio}. Contrato inicial mínimo de ${c.mesesContratoInicial} meses.`); });
intentSpeechButton.addEventListener('click', () => speakText(intentSpeechButton, intentExplanation()));
function goBack() { if (data.status === 'stopped' || data.status === 'approved') data.status = 'questions'; else if (data.status === 'payment') data.status = 'intro'; else if (data.status === 'model') data.status = 'payment'; else if (data.status === 'intent') data.status = 'model'; else if (data.status === 'intentInfo') data.status = 'intent'; else if (data.index > 0) data.index -= 1; else { data.status = 'intentInfo'; data.index = -1; } save(); render(); }
function restart() { data = { answers: {}, index: -1, status: 'intro' }; try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {} render(); }
function focusSoon(selector) { setTimeout(() => simulator.querySelector(selector)?.focus({ preventScroll: true }), 80); }
async function openSimulator(openTrigger = null) { triggerBeforeOpen = openTrigger || document.activeElement; try { await catalogReady; } catch (_) { alert('Não foi possível carregar as condições. Recarregue a página para tentar novamente.'); return; } simulator.inert = false; simulator.classList.add('open'); simulator.setAttribute('aria-hidden', 'false'); document.body.classList.add('simulator-open'); load(); render(); setTimeout(() => simulator.querySelector('.simulator-close').focus(), 30); }
function closeSimulator() { stopSpeech(); if (document.body.hasAttribute('data-auto-open-simulator')) { window.location.href = '../index.html'; return; } simulator.classList.remove('open'); simulator.setAttribute('aria-hidden', 'true'); simulator.inert = true; document.body.classList.remove('simulator-open'); if (window.location.hash === '#simular-locacao') history.replaceState(null, '', `${window.location.pathname}${window.location.search}`); triggerBeforeOpen?.focus?.(); }
function bindOpenTrigger(trigger) { trigger.addEventListener('click', event => { event.preventDefault(); if (window.location.hash !== '#simular-locacao') history.pushState(null, '', '#simular-locacao'); openSimulator(trigger); }); }
document.querySelectorAll('[data-open-simulator], .bike-ask').forEach(bindOpenTrigger);
simulator.querySelectorAll('[data-close-simulator]').forEach(button => button.addEventListener('click', closeSimulator));
document.querySelector('#simulatorStart').addEventListener('click', () => { data.status = 'payment'; save(); render(); });
document.querySelector('#paymentContinue').addEventListener('click', () => { data.status = 'model'; save(); render(); });
document.querySelector('#catalogModelOptions').addEventListener('click', event => { const button = event.target.closest('button[data-product-id]'); if (!button || button.disabled) return; const product = catalog.produtos.find(item => item.id === button.dataset.productId); data.answers.modelId = product.id; data.answers.model = product.nome; data.answers.modelPrice = productPrice(product); data.status = 'intent'; save(); render(); });
document.querySelector('#catalogFleet')?.addEventListener('click', event => { const button = event.target.closest('button[data-product-id]'); if (!button || button.disabled) return; const product = catalog.produtos.find(item => item.id === button.dataset.productId); data.answers.modelId = product.id; data.answers.model = product.nome; data.answers.modelPrice = productPrice(product); if (window.location.hash !== '#simular-locacao') history.pushState(null, '', '#simular-locacao'); openSimulator(button); });
document.querySelectorAll('.intent-options button').forEach(button => button.addEventListener('click', () => { data.answers.intent = button.dataset.intent; data.status = 'intentInfo'; save(); render(); }));
document.querySelector('#intentContinue').addEventListener('click', () => { if (data.index < 0) data.index = 0; data.status = 'questions'; save(); render(); });
backButton.addEventListener('click', goBack); restartButton.addEventListener('click', restart); document.querySelector('#resultRestart').addEventListener('click', restart);
document.addEventListener('keydown', event => {
  if (!simulator.classList.contains('open')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeSimulator(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not([hidden]), a[href]:not([hidden]), input:not([hidden])')].filter(element => !element.disabled && element.offsetParent !== null);
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
function alignHashTarget(behavior = 'auto') {
  if (!window.location.hash) return;
  if (window.location.hash === '#simular-locacao') { openSimulator(); return; }
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); if (!target) return;
  const revealParent = target.closest('.reveal'); if (revealParent) revealParent.classList.add('visible', 'hash-target-ready');
  requestAnimationFrame(() => { const offset = window.matchMedia('(max-width: 620px)').matches ? 18 : 26; window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset), behavior }); if (revealParent) setTimeout(() => revealParent.classList.remove('hash-target-ready'), 120); });
}
window.addEventListener('load', () => { const ready = document.fonts?.ready || Promise.resolve(); ready.then(() => setTimeout(() => document.body.hasAttribute('data-auto-open-simulator') ? openSimulator() : alignHashTarget('auto'), 180)); });
window.addEventListener('hashchange', () => setTimeout(() => alignHashTarget('smooth'), 80));
document.querySelectorAll('.fleet-tabs button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.fleet-tabs button').forEach(item => item.classList.toggle('active', item === button)); document.querySelectorAll('.bike-card').forEach(card => card.classList.toggle('hidden', button.dataset.filter !== 'todas' && card.dataset.category !== button.dataset.filter)); document.querySelector('.fleet-grid').scrollTo({ left: 0, behavior: 'smooth' }); }));
document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => { if (detail.open) document.querySelectorAll('details').forEach(other => { if (other !== detail) other.open = false; }); }));
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
const year = document.querySelector('#ano');
if (year) year.textContent = new Date().getFullYear();
