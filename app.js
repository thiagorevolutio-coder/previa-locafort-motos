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
const requestPreview = document.querySelector('.request-preview');
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
  requestPreview.classList.toggle('ready', complete);
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
    if (current === steps.length - 1 && Object.values(state).every(Boolean) && window.matchMedia('(max-width: 620px)').matches) {
      setTimeout(() => sendButton.scrollIntoView({ behavior: 'smooth', block: 'center' }), 360);
    }
  });
});

progress.forEach((button, index) => {
  button.addEventListener('click', () => {
    const canOpen = index === 0 || (index === 1 && state.objetivo) || (index === 2 && state.objetivo && state.moto);
    if (canOpen) showStep(index);
  });
});
showStep(0);

function alignHashTarget(behavior = 'auto') {
  if (!window.location.hash) return;
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (!target) return;
  const revealParent = target.closest('.reveal');
  if (revealParent) revealParent.classList.add('visible', 'hash-target-ready');
  requestAnimationFrame(() => {
    const offset = window.matchMedia('(max-width: 620px)').matches ? 18 : 26;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior });
    if (revealParent) setTimeout(() => revealParent.classList.remove('hash-target-ready'), 120);
  });
}

window.addEventListener('load', () => {
  const ready = document.fonts?.ready || Promise.resolve();
  ready.then(() => setTimeout(() => alignHashTarget('auto'), 180));
});
window.addEventListener('hashchange', () => setTimeout(() => alignHashTarget('smooth'), 80));

document.querySelectorAll('.fleet-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.fleet-tabs button').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.bike-card').forEach(card => card.classList.toggle('hidden', button.dataset.filter !== 'todas' && card.dataset.category !== button.dataset.filter));
    document.querySelector('.fleet-grid').scrollTo({ left: 0, behavior: 'smooth' });
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
