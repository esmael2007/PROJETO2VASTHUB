(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var submitBtn = document.getElementById('submitBtn');
  var successPanel = document.getElementById('successPanel');
  var formError = document.getElementById('formError');
  var signupHint = document.querySelector('.signup-hint');

  function setError(name, message) {
    var field = form.querySelector('[name="' + name + '"]');
    var errorEl = form.querySelector('[data-error-for="' + name + '"]');
    var wrap = field ? field.closest('.field') : null;
    if (errorEl) errorEl.textContent = message || '';
    if (wrap) wrap.classList.toggle('has-error', !!message);
  }

  function validate() {
    var ok = true;
    formError.textContent = '';

    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Informe um e-mail válido.'); ok = false;
    } else setError('email', '');

    var senha = form.senha.value;
    if (!senha) {
      setError('senha', 'Digite sua senha.'); ok = false;
    } else setError('senha', '');

    return ok;
  }

  form.addEventListener('input', function (e) {
    var name = e.target.name;
    if (!name) return;
    var wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('has-error')) setError(name, '');
    formError.textContent = '';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';

    /* simulação de autenticação — troque pela chamada real da sua API */
    window.setTimeout(function () {
      form.hidden = true;
      signupHint.hidden = true;
      successPanel.hidden = false;
    }, 700);
  });

  /* ---------------- mostrar/ocultar senha ---------------- */
  var senha = document.getElementById('senha');
  var senhaToggle = document.getElementById('senhaToggle');
  senhaToggle.addEventListener('click', function () {
    var show = senha.type === 'password';
    senha.type = show ? 'text' : 'password';
    senhaToggle.setAttribute('aria-pressed', String(show));
    senhaToggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  });

  /* ---------------- header sticky ---------------- */
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
