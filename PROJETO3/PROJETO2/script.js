/* ---- carrossel ---- */
  (function () {
    const root = document.querySelector('.carousel');
    const viewport = root.querySelector('.carousel-viewport');
    const track = document.getElementById('track');
    const dotsBox = document.getElementById('dots');
    const counter = document.getElementById('counter');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = null;
    const originals = Array.from(track.children);
    const real = originals.length;

    /* clona antes e depois para o loop nunca mostrar vazio nas bordas */
    [-1, 1].forEach((side) => {
      originals.forEach((s) => {
        const c = s.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.tabIndex = -1;
        side < 0 ? track.insertBefore(c, track.firstChild) : track.appendChild(c);
      });
    });
    const slides = Array.from(track.children);
    let index = real;

    slides.forEach((slide, i) => slide.addEventListener('click', () => { go(i); stop(); }));
    originals.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot-btn';
      dot.setAttribute('aria-label', 'Ir para o slide ' + (i + 1));
      dot.addEventListener('click', () => { go(real + i); stop(); });
      dotsBox.appendChild(dot);
    });
    const dots = Array.from(dotsBox.children);

    function current() { return ((index % real) + real) % real; }

    function layout(animate) {
      const w = slides[0].offsetWidth; /* offsetWidth ignora o scale dos slides inativos */
      if (!animate) track.style.transition = 'none';
      track.style.transform = 'translateX(' + (viewport.clientWidth / 2 - w / 2 - index * w) + 'px)';
      if (!animate) { void track.offsetWidth; track.style.transition = ''; }
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === current());
        d.setAttribute('aria-selected', i === current());
      });
      counter.textContent = String(current() + 1).padStart(2, '0') + ' / ' + String(real).padStart(2, '0');
    }

    track.addEventListener('transitionend', () => {
      if (index < real || index >= real * 2) { index = real + current(); layout(false); }
    });

    function go(i) { index = i; layout(true); }

    document.getElementById('prev').addEventListener('click', () => { go(index - 1); stop(); });
    document.getElementById('next').addEventListener('click', () => { go(index + 1); stop(); });

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(index - 1); stop(); }
      if (e.key === 'ArrowRight') { go(index + 1); stop(); }
    });

    /* arrastar / deslizar */
    let startX = null;
    viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    viewport.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); stop(); }
      startX = null;
    });
    viewport.addEventListener('pointercancel', () => { startX = null; });

    function start() { if (!reduce.matches && !timer) timer = setInterval(() => go(index + 1), 6000); }
    function stop() { clearInterval(timer); timer = null; }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    window.addEventListener('resize', () => layout(false));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layout(false));
    layout(false);
    start();
  })();

  /* ---- título sempre em 2 linhas, qualquer que seja a fonte carregada ---- */
  (function () {
    const h1 = document.querySelector('.headline');
    function fit() {
      h1.style.setProperty('--h-size', '');
      let size = parseFloat(getComputedStyle(h1).fontSize);
      let guard = 60;
      while (h1.scrollWidth > h1.clientWidth + 1 && size > 22 && guard--) {
        size *= 0.97;
        h1.style.setProperty('--h-size', size + 'px');
      }
    }
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();

  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
