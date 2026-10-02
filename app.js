const PHONE = '5585989181727';
const waLink = message => `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = waLink(link.dataset.wa);
  link.target = '_blank';
  link.rel = 'noopener';
});

const state = { objetivo: '', moto: '', inicio: '' };
const labels = {
  objetivo: document.querySelector('#resumoObjetivo'),
  moto: document.querySelector('#resumoMoto'),
  inicio: document.querySelector('#resumoInicio')
};
const sendButton = document.querySelector('#enviarPedido');
const steps = [...document.querySelectorAll('.step-block')];
const progress = [...document.querySelectorAll('.planner-progress button')];
const currentStepLabel = document.querySelector('#etapaAtual');
const requestTitle = document.querySelector('.request-preview h3');

function showStep(index) {
  steps.forEach((step, i) => step.classList.toggle('active', i === index));
  progress.forEach((item, i) => {
    item.classList.toggle('active', i === index);
    item.classList.toggle('completed', i < index || Boolean(Object.values(state)[i]));
  });
  currentStepLabel.textContent = `ETAPA 0${index + 1} / 03`;
}

function updateRequest() {
  Object.entries(state).forEach(([key, value]) => {
    if (value) labels[key].textContent = value.charAt(0).toUpperCase() + value.slice(1);
  });
  const complete = Object.values(state).every(Boolean);
  sendButton.classList.toggle('disabled', !complete);
  sendButton.setAttribute('aria-disabled', String(!complete));
  requestTitle.textContent = complete ? 'Sua mensagem está pronta para enviar.' : 'Sua mensagem está sendo montada.';
  if (complete) {
    sendButton.href = waLink(`Olá! Vim pelo site da Locafort. Quero alugar uma moto para ${state.objetivo}. Tenho interesse em ${state.moto} e pretendo começar ${state.inicio}. Pode me informar disponibilidade, valores, documentos e condições?`);
    sendButton.target = '_blank';
    sendButton.rel = 'noopener';
  }
}

document.querySelectorAll('.choice').forEach(button => {
  button.addEventListener('click', () => {
    const field = button.dataset.field;
    state[field] = button.dataset.value;
    document.querySelectorAll(`.choice[data-field="${field}"]`).forEach(item => item.classList.toggle('selected', item === button));
    updateRequest();
    const current = steps.findIndex(step => step.contains(button));
    if (current < steps.length - 1) setTimeout(() => showStep(current + 1), 220);
  });
});

progress.forEach((button, index) => {
  button.addEventListener('click', () => {
    const canOpen = index === 0 || (index === 1 && state.objetivo) || (index === 2 && state.objetivo && state.moto);
    if (canOpen) showStep(index);
  });
});
showStep(0);

document.querySelectorAll('.fleet-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.fleet-tabs button').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.bike-card').forEach(card => card.classList.toggle('hidden', button.dataset.filter !== 'todas' && card.dataset.category !== button.dataset.filter));
  });
});

document.querySelectorAll('.bike-ask').forEach(button => {
  button.addEventListener('click', () => window.open(waLink(`Olá! Vim pelo site da Locafort e quero consultar disponibilidade e condições para a ${button.dataset.moto}.`), '_blank', 'noopener'));
});

document.querySelectorAll('details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (detail.open) document.querySelectorAll('details').forEach(other => { if (other !== detail) other.open = false; });
  });
});

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
document.querySelector('#ano').textContent = new Date().getFullYear();
