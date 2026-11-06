(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactMotion = matchMedia('(max-width: 560px)').matches;
  const root = document.documentElement;
  const progress = document.createElement('span');
  progress.className = 'bio-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);

  const items = [
    document.querySelector('.bio-header'),
    document.querySelector('.bio-media'),
    document.querySelector('.quick-note'),
    document.querySelector('.scroll-cue'),
    ...document.querySelectorAll('.bio-link'),
    document.querySelector('.bio-footer')
  ].filter(Boolean);

  items.forEach((item, index) => {
    item.classList.add('bio-reveal');
    item.style.setProperty('--bio-delay', `${Math.min(index * 55, 220)}ms`);
    if (item.matches('.bio-link:nth-child(even)')) item.classList.add('from-right');
  });

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-visible'));
    root.classList.add('motion-reduced');
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.04, rootMargin: '0px 0px 48px' });
  items.forEach(item => observer.observe(item));

  let ticking = false;
  const updateMotion = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    progress.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
    const media = compactMotion ? null : document.querySelector('.bio-media img');
    const rect = document.querySelector('.bio-media')?.getBoundingClientRect();
    if (media && rect) {
      const offset = Math.max(-12, Math.min(12, (innerHeight * .5 - (rect.top + rect.height * .5)) * .025));
      media.style.setProperty('--bio-parallax', `${offset}px`);
    }
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateMotion);
      ticking = true;
    }
  }, { passive: true });
  updateMotion();
})();

(()=>{const d=document.querySelector('#bio-video-dialog'),v=d?.querySelector('video');if(!d||!v)return;document.querySelector('.video-trigger')?.addEventListener('click',()=>{d.showModal();v.currentTime=0;v.play().catch(()=>{});});d.querySelector('.video-close').addEventListener('click',()=>d.close());d.addEventListener('close',()=>v.pause());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});})();
