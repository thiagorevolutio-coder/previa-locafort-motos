let BIO_PHONE = '5585989181727';
function updateBioLinks() { document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = `https://wa.me/${BIO_PHONE}?text=${encodeURIComponent(link.dataset.wa)}`;
  link.target = '_blank';
  link.rel = 'noopener';
}); }
updateBioLinks();

const videoCard = document.querySelector('.video-feature');
const videoMain = document.querySelector('#videoMain');
const videoBlur = document.querySelector('#videoBlur');
const videoPlay = document.querySelector('#videoPlay');
const videoStatus = document.querySelector('#videoStatus');
let completedPlays = 0;

(async () => {
  let config;
  for (const url of ['api/catalogo', 'catalogo-padrao.json']) { try { const response = await fetch(url); if (response.ok) { config = await response.json(); break; } } catch (_) {} }
  if (!config?.site) return;
  if (/^\d{10,15}$/.test(config.site.whatsapp || '')) { BIO_PHONE = config.site.whatsapp; updateBioLinks(); }
  if (config.site.videoPrincipal) { const src = /^https:\/\//.test(config.site.videoPrincipal) ? config.site.videoPrincipal : config.site.videoPrincipal.replace(/^\//, ''); videoMain.src = src; videoBlur.src = src; }
})();

function startPresentation() {
  completedPlays = 0;
  videoMain.currentTime = 0;
  videoBlur.currentTime = 0;
  videoMain.muted = false;
  videoBlur.muted = true;
  videoCard.classList.add('playing');
  videoStatus.textContent = 'REPRODUZINDO COM SOM';
  videoBlur.play().catch(() => {});
  videoMain.play().catch(() => {
    videoCard.classList.remove('playing');
    videoStatus.textContent = 'TOQUE PARA REPRODUZIR';
  });
}

videoPlay.addEventListener('click', startPresentation);

videoMain.addEventListener('ended', () => {
  completedPlays += 1;
  if (completedPlays === 1) {
    videoMain.currentTime = 0;
    videoBlur.currentTime = 0;
    videoStatus.textContent = 'REPETINDO UMA VEZ';
    videoBlur.play().catch(() => {});
    videoMain.play().catch(() => {});
    return;
  }

  videoMain.muted = true;
  videoMain.currentTime = 0;
  videoBlur.currentTime = 0;
  videoBlur.pause();
  videoCard.classList.remove('playing');
  videoStatus.textContent = 'FINALIZADO · TOQUE NOVAMENTE';
  videoPlay.querySelector('strong').textContent = 'Ouvir novamente';
  videoPlay.querySelector('small').textContent = 'O som volta ao tocar';
});
