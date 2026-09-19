(function () {
  'use strict';

  var card = document.querySelector('.signup-card');
  var form = document.getElementById('signupForm');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.step-panel'));
  var stepItems = Array.prototype.slice.call(document.querySelectorAll('.step-item'));
  var visualSteps = Array.prototype.slice.call(document.querySelectorAll('.visual-step'));
  var backBtn = document.getElementById('backBtn');
  var nextBtn = document.getElementById('nextBtn');
  var submitBtn = document.getElementById('submitBtn');
  var successPanel = document.getElementById('successPanel');

  var TOTAL_STEPS = steps.length;
  var current = 1;

  /* ---------------- navegação entre passos ---------------- */
  function showStep(n) {
    current = n;
    card.setAttribute('data-step', String(n));

    steps.forEach(function (panel) {
      panel.classList.toggle('is-active', Number(panel.dataset.step) === n);
    });
    visualSteps.forEach(function (v) {
      v.classList.toggle('is-active', Number(v.dataset.visual) === n);
    });
    stepItems.forEach(function (item) {
      var idx = Number(item.dataset.stepIndex);
      item.classList.toggle('is-active', idx === n);
      item.classList.toggle('is-done', idx < n);
    });

    backBtn.hidden = n === 1;
    nextBtn.hidden = n === TOTAL_STEPS;
    submitBtn.hidden = n !== TOTAL_STEPS;

    var firstField = steps[n - 1].querySelector('input, select, textarea');
    if (firstField) {
      window.setTimeout(function () { firstField.focus({ preventScroll: true }); }, 260);
    }

    /* só rola a página se o topo do card estiver escondido atrás do header sticky */
    var headerH = document.getElementById('header').offsetHeight;
    var cardTop = card.getBoundingClientRect().top;
    if (cardTop < headerH) {
      window.scrollTo({ top: window.scrollY + cardTop - headerH - 16, behavior: 'smooth' });
    }
  }

  stepItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var idx = Number(item.dataset.stepIndex);
      if (idx < current) showStep(idx); // só permite voltar clicando
    });
    item.style.cursor = 'pointer';
  });

  /* ---------------- validação ---------------- */
  function setError(name, message) {
    var field = form.querySelector('[name="' + name + '"]');
    var errorEl = form.querySelector('[data-error-for="' + name + '"]');
    var wrap = field ? field.closest('.field') : null;
    if (errorEl) errorEl.textContent = message || '';
    if (wrap) wrap.classList.toggle('has-error', !!message);
  }

  function validateStep(n) {
    var ok = true;

    if (n === 1) {
      var nome = form.nomeLoja.value.trim();
      if (!nome) { setError('nomeLoja', 'Diga o nome da sua loja.'); ok = false; }
      else setError('nomeLoja', '');

      var zap = form.whatsappLoja.value.replace(/\D/g, '');
      if (zap.length < 10) { setError('whatsappLoja', 'Informe um WhatsApp válido, com DDD.'); ok = false; }
      else setError('whatsappLoja', '');

      if (!form.categoriaLoja.value) { setError('categoriaLoja', 'Escolha uma categoria.'); ok = false; }
      else setError('categoriaLoja', '');

      var desc = form.descricaoLoja.value.trim();
      if (!desc) { setError('descricaoLoja', 'Escreva uma descrição curta.'); ok = false; }
      else setError('descricaoLoja', '');
    }

    if (n === 2) {
      var link = form.linkLoja.value.trim();
      if (!link) { setError('linkLoja', 'Escolha um link para a sua loja.'); ok = false; }
      else if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(link)) {
        setError('linkLoja', 'Use só letras minúsculas, números e hífen.'); ok = false;
      } else setError('linkLoja', '');
    }

    if (n === 3) {
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'Informe um e-mail válido.'); ok = false; }
      else setError('email', '');

      var senha = form.senha.value;
      if (senha.length < 6) { setError('senha', 'A senha precisa ter no mínimo 6 dígitos.'); ok = false; }
      else setError('senha', '');

      if (!form.termos.checked) { setError('termos', 'Você precisa aceitar os termos para continuar.'); ok = false; }
      else setError('termos', '');
    }

    return ok;
  }

  nextBtn.addEventListener('click', function () {
    if (!validateStep(current)) return;
    if (current < TOTAL_STEPS) showStep(current + 1);
  });
  backBtn.addEventListener('click', function () {
    if (current > 1) showStep(current - 1);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateStep(3)) return;
    form.hidden = true;
    document.querySelector('.stepper').hidden = true;
    successPanel.hidden = false;
  });

  /* limpa o erro assim que a pessoa corrige o campo */
  form.addEventListener('input', function (e) {
    var name = e.target.name;
    if (!name) return;
    var wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('has-error')) setError(name, '');
  });

  /* ---------------- contador da descrição ---------------- */
  var descricao = document.getElementById('descricaoLoja');
  var descCount = document.getElementById('descCount');
  descricao.addEventListener('input', function () {
    descCount.textContent = String(descricao.value.length);
  });

  /* ---------------- WhatsApp: máscara simples ---------------- */
  var whatsapp = document.getElementById('whatsappLoja');
  whatsapp.addEventListener('input', function () {
    var d = whatsapp.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    whatsapp.value = out;
  });

  /* ---------------- slug automático do link ---------------- */
  var nomeLoja = document.getElementById('nomeLoja');
  var linkLoja = document.getElementById('linkLoja');
  var linkEditedManually = false;

  function slugify(str) {
    return str
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  nomeLoja.addEventListener('input', function () {
    if (linkEditedManually) return;
    linkLoja.value = slugify(nomeLoja.value);
  });
  linkLoja.addEventListener('input', function () {
    linkEditedManually = true;
    var cleaned = slugify(linkLoja.value);
    if (cleaned !== linkLoja.value.toLowerCase()) {
      var pos = linkLoja.selectionStart;
      linkLoja.value = cleaned;
      linkLoja.setSelectionRange(pos, pos);
    }
  });

  /* ---------------- upload de logo ---------------- */
  var uploadBox = document.getElementById('uploadBox');
  var logoInput = document.getElementById('logoInput');
  var uploadEmpty = document.getElementById('uploadEmpty');
  var uploadPreview = document.getElementById('uploadPreview');
  var uploadPreviewImg = document.getElementById('uploadPreviewImg');
  var uploadFileName = document.getElementById('uploadFileName');
  var uploadFileSize = document.getElementById('uploadFileSize');
  var uploadRemove = document.getElementById('uploadRemove');

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function () {
      uploadPreviewImg.src = reader.result;
      uploadFileName.textContent = file.name;
      uploadFileSize.textContent = formatSize(file.size);
      uploadEmpty.hidden = true;
      uploadPreview.hidden = false;
      setError('logo', '');
    };
    reader.readAsDataURL(file);
  }

  uploadBox.addEventListener('click', function (e) {
    if (e.target.closest('.upload-remove')) return;
    logoInput.click();
  });
  uploadBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logoInput.click(); }
  });
  logoInput.addEventListener('change', function () {
    if (logoInput.files && logoInput.files[0]) handleFile(logoInput.files[0]);
  });

  ['dragenter', 'dragover'].forEach(function (evt) {
    uploadBox.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      uploadBox.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach(function (evt) {
    uploadBox.addEventListener(evt, function (e) {
      e.preventDefault(); e.stopPropagation();
      uploadBox.classList.remove('is-dragover');
    });
  });
  uploadBox.addEventListener('drop', function (e) {
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  uploadRemove.addEventListener('click', function (e) {
    e.stopPropagation();
    logoInput.value = '';
    uploadPreviewImg.src = '';
    uploadEmpty.hidden = false;
    uploadPreview.hidden = true;
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

  showStep(1);
})();
