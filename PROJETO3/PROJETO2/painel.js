(function () {
  'use strict';

  /* =======================================================
     UTIL
  ======================================================= */
  var DAY = 86400000;
  var NOW = new Date();

  function fmtBRL(n) {
    return (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function fmtInt(n) { return (n || 0).toLocaleString('pt-BR'); }
  function fmtDate(d) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function fmtDateShort(d) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  function daysAgo(n) { return new Date(NOW.getTime() - n * DAY).toISOString(); }
  function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  /* =======================================================
     SEED DE DADOS (mock)
  ======================================================= */
  var CATEGORIAS = { roupas: 'Roupas', calcados: 'Calçados', acessorios: 'Acessórios' };
  var SUBCATEGORIAS = {
    roupas: ['Blusa', 'Camisa', 'Vestido', 'Calça', 'Saia', 'Short', 'Casaco', 'Jaqueta', 'Moletom', 'Conjunto'],
    calcados: ['Tênis', 'Sandália', 'Sapato', 'Bota', 'Chinelo'],
    acessorios: ['Bolsa', 'Cinto', 'Óculos', 'Bijuteria', 'Chapéu', 'Lenço', 'Meia']
  };
  var THUMB_COLORS = ['#ff3ec8', '#c9f231', '#5fe3f5', '#8b7cf6', '#ffb547'];
  var SIZE_OPTIONS = {
    roupas: ['PP', 'P', 'M', 'G', 'GG'],
    calcados: ['35', '36', '37', '38', '39', '40', '41', '42'],
    acessorios: ['Único']
  };
  function normalizeSizes(value) {
    var list = Array.isArray(value) ? value : [];
    return list.map(function (size) { return String(size || '').trim(); })
      .filter(function (size) { return size; })
      .filter(function (size, index, arr) { return arr.indexOf(size) === index; });
  }
  function sizeOptionsFor(categoria, selecionadas) {
    var selected = normalizeSizes(selecionadas);
    var opts = SIZE_OPTIONS[categoria] || ['Único'];
    return opts.map(function (size) {
      return '<label class="size-option"><input type="checkbox" name="produtoTamanho" value="' + escapeHtml(size) + '"' + (selected.indexOf(size) !== -1 ? ' checked' : '') + '><span>' + escapeHtml(size) + '</span></label>';
    }).join('');
  }

  /* imagem do produto: recebe um File, devolve uma dataURL já redimensionada/comprimida */
  function readAndResizeImage(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) { reject(new Error('invalid')); return; }
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality || 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function buildThumb(p) {
    return p.imagem
      ? '<img class="thumb thumb--img" src="' + p.imagem + '" alt="">'
      : '<span class="thumb" style="background:linear-gradient(145deg,#f7f6f4,#ece9e4)"></span>';
  }

  function seedProdutos() {
    var base = [
      ['Vestido Aurora', 'roupas', 'Vestido', 189.9, 4, 6, 34, 2],
      ['Vestido Pink', 'roupas', 'Vestido', 189.0, 12, 5, 21, 6],
      ['Calça Sol', 'roupas', 'Calça', 149.9, 18, 6, 26, 4],
      ['Bolsa Lua', 'acessorios', 'Bolsa', 129.9, 2, 5, 15, 9],
      ['Jaqueta Jeans', 'roupas', 'Jaqueta', 219.9, 9, 4, 12, 18],
      ['Tênis Branco', 'calcados', 'Tênis', 259.9, 14, 6, 19, 5],
      ['Bolsa Trança', 'acessorios', 'Bolsa', 159.9, 1, 4, 8, 40],
      ['Conjunto Linho', 'roupas', 'Conjunto', 279.9, 6, 5, 10, 33],
      ['Sandália Verão', 'calcados', 'Sandália', 139.9, 22, 6, 17, 3],
      ['Cinto Couro', 'acessorios', 'Cinto', 89.9, 3, 5, 5, 52],
      ['Blusa Tricô', 'roupas', 'Blusa', 119.9, 16, 5, 22, 7],
      ['Óculos Sol', 'acessorios', 'Óculos', 99.9, 0, 4, 3, 61]
    ];
    return base.map(function (p, i) {
      return {
        id: uid('prod'),
        nome: p[0], categoria: p[1], subcategoria: p[2], preco: p[3],
        estoque: p[4], estoqueMin: p[5], vendas30: p[6], ultimaVendaDias: p[7],
        cor: THUMB_COLORS[i % THUMB_COLORS.length],
        imagem: null,
        tamanhos: SIZE_OPTIONS[p[1]] || ['Único']
      };
    });
  }

  function seedPedidos(produtos) {
    function byNome(n) { return produtos.filter(function (p) { return p.nome === n; })[0] || produtos[0]; }
    var statusPool = ['pendente', 'preparo', 'enviado'];
    var raw = [
      [0, 'Marina Silva', ['Vestido Aurora', 'Bolsa Lua'], [1, 1]],
      [1, 'Camila Torres', ['Tênis Branco'], [1]],
      [2, 'Beatriz Lima', ['Calça Sol', 'Blusa Tricô'], [2, 1]],
      [3, 'Ana Souza', ['Vestido Pink'], [1]],
      [5, 'Marina Silva', ['Sandália Verão'], [1]],
      [6, 'Juliana Alves', ['Jaqueta Jeans'], [1]],
      [8, 'Larissa Melo', ['Cinto Couro', 'Blusa Tricô'], [1, 2]],
      [10, 'Fernanda Costa', ['Bolsa Trança'], [1]],
      [12, 'Patrícia Rocha', ['Vestido Aurora'], [1]],
      [14, 'Camila Torres', ['Calça Sol', 'Tênis Branco'], [1, 1]],
      [17, 'Beatriz Lima', ['Óculos Sol'], [1]],
      [20, 'Marina Silva', ['Vestido Pink', 'Bolsa Lua'], [1, 1]],
      [23, 'Ana Souza', ['Sandália Verão'], [2]],
      [27, 'Juliana Alves', ['Blusa Tricô'], [1]],
      [31, 'Larissa Melo', ['Tênis Branco'], [1]],
      [35, 'Fernanda Costa', ['Calça Sol'], [1]],
      [40, 'Patrícia Rocha', ['Vestido Aurora', 'Cinto Couro'], [1, 1]],
      [46, 'Camila Torres', ['Jaqueta Jeans'], [1]],
      [52, 'Marina Silva', ['Vestido Pink'], [1]],
      [58, 'Beatriz Lima', ['Bolsa Lua'], [1]],
      [65, 'Ana Souza', ['Calça Sol', 'Blusa Tricô'], [1, 1]],
      [73, 'Juliana Alves', ['Tênis Branco'], [1]],
      [82, 'Larissa Melo', ['Vestido Aurora'], [1]],
      [91, 'Fernanda Costa', ['Sandália Verão'], [1]],
      [100, 'Patrícia Rocha', ['Bolsa Trança'], [1]],
      [112, 'Camila Torres', ['Vestido Pink'], [1]],
      [125, 'Marina Silva', ['Jaqueta Jeans'], [1]],
      [140, 'Beatriz Lima', ['Calça Sol'], [2]],
      [155, 'Ana Souza', ['Cinto Couro'], [1]],
      [170, 'Juliana Alves', ['Vestido Aurora', 'Óculos Sol'], [1, 1]]
    ];
    return raw.map(function (r, i) {
      var itens = r[2].map(function (nome, j) {
        var prod = byNome(nome);
        var qtd = r[3][j];
        return { produto: prod.nome, qtd: qtd, preco: prod.preco };
      });
      var total = itens.reduce(function (s, it) { return s + it.qtd * it.preco; }, 0);
      var status = r[0] < 3 ? statusPool[i % 3] : (i % 11 === 0 ? 'cancelado' : 'entregue');
      return {
        id: 'PED-' + String(1000 + i),
        cliente: r[1],
        data: daysAgo(r[0]),
        itens: itens,
        total: total,
        status: status
      };
    });
  }

  function seedCupons() {
    return [
      { id: uid('cup'), nome: 'BEMVINDA10', tipo: 'percentual', valor: 10, validade: daysAgo(-20), limite: 200, limitePorCliente: 1, usos: 84, ativo: true, resultado: 3120 },
      { id: uid('cup'), nome: 'FRETEGRATIS', tipo: 'fixo', valor: 15, validade: daysAgo(-5), limite: 100, limitePorCliente: 2, usos: 61, ativo: true, resultado: 2890 },
      { id: uid('cup'), nome: 'VERAO20', tipo: 'percentual', valor: 20, validade: daysAgo(10), limite: 150, limitePorCliente: 1, usos: 150, ativo: true, resultado: 5410 },
      { id: uid('cup'), nome: 'PRIMEIRACOMPRA', tipo: 'fixo', valor: 25, validade: daysAgo(-60), limite: 500, limitePorCliente: 1, usos: 212, ativo: true, resultado: 8760 },
      { id: uid('cup'), nome: 'NATAL15', tipo: 'percentual', valor: 15, validade: daysAgo(45), limite: 300, limitePorCliente: 1, usos: 288, ativo: true, resultado: 6120 },
      { id: uid('cup'), nome: 'LIQUIDA30', tipo: 'percentual', valor: 30, validade: daysAgo(-10), limite: 80, limitePorCliente: 1, usos: 12, ativo: false, resultado: 540 }
    ];
  }

  /* =======================================================
     ESTADO / PERSISTÊNCIA
  ======================================================= */
  var STORAGE_KEY = 'vesthub_painel_v1';
  var state = null;

  function seedState() {
    var produtos = seedProdutos();
    return {
      storeName: 'Luna Store',
      metaMensal: 20000,
      produtos: produtos,
      pedidos: seedPedidos(produtos),
      cupons: seedCupons(),
      movimentacoes: [
        { id: uid('mov'), produto: 'Vestido Aurora', tipo: 'saida', qtd: 2, motivo: 'Venda', data: daysAgo(0.3) },
        { id: uid('mov'), produto: 'Tênis Branco', tipo: 'entrada', qtd: 20, motivo: 'Reposição de fornecedor', data: daysAgo(1.2) },
        { id: uid('mov'), produto: 'Bolsa Lua', tipo: 'saida', qtd: 1, motivo: 'Venda', data: daysAgo(2) },
        { id: uid('mov'), produto: 'Calça Sol', tipo: 'entrada', qtd: 25, motivo: 'Reposição de fornecedor', data: daysAgo(4) },
        { id: uid('mov'), produto: 'Vestido Pink', tipo: 'saida', qtd: 1, motivo: 'Venda', data: daysAgo(5) }
      ],
      acoesSemVenda: {}
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed.produtos)) {
          parsed.produtos = parsed.produtos.map(function (p) {
            if (!p) return p;
            p.tamanhos = normalizeSizes(p.tamanhos && p.tamanhos.length ? p.tamanhos : (SIZE_OPTIONS[p.categoria] || ['Único']));
            return p;
          });
        }
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return seedState();
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* =======================================================
     TOASTS
  ======================================================= */
  var toastStack = document.getElementById('toastStack');
  var ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/></svg>'
  };
  function toast(type, title, text) {
    var el = document.createElement('div');
    el.className = 'toast is-' + type;
    el.innerHTML =
      '<span class="toast-icon">' + ICONS[type] + '</span>' +
      '<span class="toast-text"><strong>' + escapeHtml(title) + '</strong>' + (text ? escapeHtml(text) : '') + '</span>' +
      '<button class="toast-close" type="button" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
    toastStack.appendChild(el);
    function remove() {
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); }, 200);
    }
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, 5000);
  }

  /* =======================================================
     MODAL
  ======================================================= */
  var modalOverlay = document.getElementById('modalOverlay');
  var modalBody = document.getElementById('modalBody');
  var modalCloseBtn = document.getElementById('modalClose');

  function openModal(html) {
    modalBody.innerHTML = html;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = modalBody.querySelector('input, select, textarea, button');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeModal() {
    modalOverlay.hidden = true;
    modalBody.innerHTML = '';
    document.body.style.overflow = '';
  }
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modalOverlay.hidden) closeModal(); });

  /* =======================================================
     GRÁFICOS SVG (sem dependência externa)
  ======================================================= */
  function buildLineChart(values, labels, opts) {
    opts = opts || {};
    var w = 560, h = 220, padL = 40, padR = 14, padT = 16, padB = 26;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var max = Math.max.apply(null, values.concat([1])) * 1.15;
    var min = 0;
    var stepX = values.length > 1 ? innerW / (values.length - 1) : 0;

    function x(i) { return padL + i * stepX; }
    function y(v) { return padT + innerH - ((v - min) / (max - min || 1)) * innerH; }

    var points = values.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ');
    var areaPoints = points + ' ' + x(values.length - 1) + ',' + (padT + innerH) + ' ' + x(0) + ',' + (padT + innerH);

    var gridLines = '';
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (innerH / 3) * g;
      gridLines += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="var(--line)" stroke-width="1"/>';
    }

    var labelStep = Math.max(1, Math.ceil(labels.length / 7));
    var xLabels = labels.map(function (l, i) {
      if (i % labelStep !== 0 && i !== labels.length - 1) return '';
      return '<text class="chart-axis-label" x="' + x(i) + '" y="' + (h - 6) + '" text-anchor="middle">' + escapeHtml(l) + '</text>';
    }).join('');

    var dots = values.map(function (v, i) {
      return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="' + (opts.color || 'var(--ink)') + '"><title>' + (opts.fmt ? opts.fmt(v) : v) + '</title></circle>';
    }).join('');

    return (
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico">' +
      gridLines +
      '<polygon points="' + areaPoints + '" fill="' + (opts.fill || 'rgba(0,0,0,.05)') + '"/>' +
      '<polyline points="' + points + '" fill="none" stroke="' + (opts.color || 'var(--ink)') + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + xLabels +
      '</svg>'
    );
  }

  function buildBarChart(values, labels, opts) {
    opts = opts || {};
    var w = 560, h = 220, padL = 40, padR = 14, padT = 16, padB = 26;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var max = Math.max.apply(null, values.concat([1])) * 1.15;
    var n = values.length;
    var gap = innerW / n * 0.32;
    var barW = innerW / n - gap;

    var gridLines = '';
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (innerH / 3) * g;
      gridLines += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="var(--line)" stroke-width="1"/>';
    }

    var labelStep = Math.max(1, Math.ceil(labels.length / 7));
    var bars = '', xLabels = '';
    values.forEach(function (v, i) {
      var bx = padL + i * (innerW / n) + gap / 2;
      var bh = (v / max) * innerH;
      var by = padT + innerH - bh;
      bars += '<rect x="' + bx + '" y="' + by + '" width="' + barW + '" height="' + bh + '" rx="3" fill="' + (opts.color || 'var(--pink)') + '"><title>' + (opts.fmt ? opts.fmt(v) : v) + '</title></rect>';
      if (i % labelStep === 0 || i === labels.length - 1) {
        xLabels += '<text class="chart-axis-label" x="' + (bx + barW / 2) + '" y="' + (h - 6) + '" text-anchor="middle">' + escapeHtml(labels[i]) + '</text>';
      }
    });

    return (
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Gráfico de barras">' +
      gridLines + bars + xLabels +
      '</svg>'
    );
  }

  /* bucketiza pedidos em periodos (dia/semana/mês conforme o intervalo) */
  function bucketPedidos(pedidos, days) {
    var mode = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';
    var buckets = [];
    var keyFor;

    if (mode === 'day') {
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(NOW.getTime() - i * DAY);
        buckets.push({ key: d.toDateString(), label: fmtDateShort(d), total: 0, count: 0 });
      }
      keyFor = function (d) { return new Date(d).toDateString(); };
    } else if (mode === 'week') {
      var weeks = Math.ceil(days / 7);
      for (var w = weeks - 1; w >= 0; w--) {
        var start = new Date(NOW.getTime() - w * 7 * DAY);
        buckets.push({ key: 'w' + w, label: fmtDateShort(start), total: 0, count: 0 });
      }
      keyFor = function (d) {
        var diff = NOW.getTime() - new Date(d).getTime();
        var w = Math.floor(diff / (7 * DAY));
        return 'w' + w;
      };
    } else {
      var months = Math.ceil(days / 30);
      for (var m = months - 1; m >= 0; m--) {
        var md = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
        buckets.push({ key: md.getFullYear() + '-' + md.getMonth(), label: md.toLocaleDateString('pt-BR', { month: 'short' }), total: 0, count: 0 });
      }
      keyFor = function (d) {
        var dd = new Date(d);
        return dd.getFullYear() + '-' + dd.getMonth();
      };
    }

    var map = {};
    buckets.forEach(function (b) { map[b.key] = b; });
    pedidos.forEach(function (p) {
      var k = keyFor(p.data);
      if (map[k]) {
        if (p.status !== 'cancelado') map[k].total += p.total;
        map[k].count += 1;
      }
    });
    return buckets;
  }

  /* =======================================================
     ROTEAMENTO DE VIEWS
  ======================================================= */
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  var sideLinks = Array.prototype.slice.call(document.querySelectorAll('.side-link'));
  var renderers = {};

  function showView(name) {
    views.forEach(function (v) { v.classList.toggle('is-active', v.dataset.view === name); });
    sideLinks.forEach(function (l) { l.classList.toggle('is-active', l.dataset.view === name); });
    if (renderers[name]) renderers[name]();
    window.scrollTo(0, 0);
    if (history.replaceState) history.replaceState(null, '', '#' + name);
  }

  sideLinks.forEach(function (link) {
    link.addEventListener('click', function () { showView(link.dataset.view); });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    window.location.href = 'login.html';
  });

  document.getElementById('resetDataBtn').addEventListener('click', function () {
    if (!window.confirm('Isso vai apagar suas alterações e restaurar os dados de exemplo. Continuar?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = seedState();
    saveState();
    toast('info', 'Dados restaurados', 'Os dados de exemplo foram recarregados.');
    Object.keys(renderers).forEach(function (k) { renderers[k](); });
  });

  /* =======================================================
     VISÃO GERAL
  ======================================================= */
  var currentPeriodDays = 30;

  function periodPedidos(days) {
    var since = NOW.getTime() - days * DAY;
    return state.pedidos.filter(function (p) { return new Date(p.data).getTime() >= since; });
  }
  function prevPeriodPedidos(days) {
    var since = NOW.getTime() - days * 2 * DAY;
    var until = NOW.getTime() - days * DAY;
    return state.pedidos.filter(function (p) {
      var t = new Date(p.data).getTime();
      return t >= since && t < until;
    });
  }

  function sumTotal(list) {
    return list.filter(function (p) { return p.status !== 'cancelado'; }).reduce(function (s, p) { return s + p.total; }, 0);
  }
  function sumItens(list) {
    return list.filter(function (p) { return p.status !== 'cancelado'; }).reduce(function (s, p) {
      return s + p.itens.reduce(function (s2, it) { return s2 + it.qtd; }, 0);
    }, 0);
  }
  function deltaPct(curr, prev) {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }
  function uniqueClients(list) {
    var set = {};
    list.forEach(function (p) { set[p.cliente] = true; });
    return Object.keys(set).length;
  }

  function renderKpis() {
    var days = currentPeriodDays;
    var listaPeriodo = periodPedidos(days).filter(function (p) { return p.status !== 'cancelado'; });
    var listaPrev = prevPeriodPedidos(days).filter(function (p) { return p.status !== 'cancelado'; });

    var vendasHoje = sumTotal(periodPedidos(1));
    var vendasSemana = sumTotal(periodPedidos(7));
    var vendasMes = sumTotal(periodPedidos(30));
    var faturamentoTotal = sumTotal(listaPeriodo);
    var pedidosCount = listaPeriodo.length;
    var itensVendidos = sumItens(listaPeriodo);
    var ticketMedio = pedidosCount ? faturamentoTotal / pedidosCount : 0;
    var delta = deltaPct(faturamentoTotal, sumTotal(listaPrev));

    var cards = [
      { label: 'Vendas do dia', value: fmtBRL(vendasHoje) },
      { label: 'Vendas da semana', value: fmtBRL(vendasSemana) },
      { label: 'Vendas do mês', value: fmtBRL(vendasMes) },
      { label: 'Faturamento no período', value: fmtBRL(faturamentoTotal), delta: delta },
      { label: 'Ticket médio', value: fmtBRL(ticketMedio) },
      { label: 'Pedidos realizados', value: fmtInt(pedidosCount) },
      { label: 'Itens vendidos', value: fmtInt(itensVendidos) },
      { label: 'Clientes atendidos', value: fmtInt(uniqueClients(listaPeriodo)) }
    ];

    document.getElementById('kpiGrid').innerHTML = cards.map(function (c) {
      var deltaHtml = '';
      if (typeof c.delta === 'number') {
        var up = c.delta >= 0;
        deltaHtml = '<span class="kpi-delta ' + (up ? 'is-up' : 'is-down') + '">' +
          (up ? '↑' : '↓') + ' ' + Math.abs(c.delta) + '% vs período anterior</span>';
      }
      return '<div class="kpi-card"><span class="kpi-label">' + c.label + '</span><span class="kpi-value">' + c.value + '</span>' + deltaHtml + '</div>';
    }).join('');

    /* meta do mês */
    var faturamentoMes = sumTotal(periodPedidos(30));
    var pct = clamp(Math.round((faturamentoMes / state.metaMensal) * 100), 0, 999);
    var circumference = 326.7;
    var offset = circumference - Math.min(pct, 100) / 100 * circumference;
    document.getElementById('goalCircle').style.strokeDashoffset = String(offset);
    document.getElementById('goalPercent').textContent = pct + '%';
    document.getElementById('goalCurrent').textContent = fmtBRL(faturamentoMes);
    document.getElementById('goalTarget').textContent = fmtBRL(state.metaMensal);

    /* ranking de produtos no período */
    var vendasPorProduto = {};
    listaPeriodo.forEach(function (p) {
      p.itens.forEach(function (it) {
        vendasPorProduto[it.produto] = (vendasPorProduto[it.produto] || 0) + it.qtd;
      });
    });
    var ranking = Object.keys(vendasPorProduto).map(function (nome) {
      return { nome: nome, qtd: vendasPorProduto[nome] };
    }).sort(function (a, b) { return b.qtd - a.qtd; }).slice(0, 5);
    var maxQtd = ranking.length ? ranking[0].qtd : 1;

    document.getElementById('rankingList').innerHTML = ranking.length ? ranking.map(function (r, i) {
      return '<li class="ranking-item"><span class="ranking-pos">' + (i + 1) + '</span>' +
        '<div class="ranking-body"><div class="ranking-top"><span>' + escapeHtml(r.nome) + '</span><span>' + r.qtd + ' un.</span></div>' +
        '<div class="ranking-bar"><i style="width:' + Math.round((r.qtd / maxQtd) * 100) + '%"></i></div></div></li>';
    }).join('') : '<li class="mini-empty">Sem vendas no período selecionado.</li>';

    /* gráficos */
    var buckets = bucketPedidos(periodPedidos(days), days);
    var labels = buckets.map(function (b) { return b.label; });
    var totals = buckets.map(function (b) { return b.total; });
    var counts = buckets.map(function (b) { return b.count; });

    document.getElementById('chartFaturamento').innerHTML = totals.some(function (v) { return v > 0; })
      ? buildLineChart(totals, labels, { color: 'var(--pink)', fill: 'rgba(255,62,200,.12)', fmt: fmtBRL })
      : '<p class="chart-empty">Sem faturamento no período.</p>';
    document.getElementById('chartPedidos').innerHTML = counts.some(function (v) { return v > 0; })
      ? buildBarChart(counts, labels, { color: 'var(--cyan)', fmt: function (v) { return v + ' pedidos'; } })
      : '<p class="chart-empty">Sem pedidos no período.</p>';

    var periodLabel = days === 1 ? 'hoje' : days + ' dias';
    document.getElementById('faturamentoHint').textContent = 'Últimos ' + periodLabel;
    document.getElementById('pedidosHint').textContent = 'Últimos ' + periodLabel;
  }

  document.getElementById('periodFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-days]');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (b) { b.classList.toggle('is-active', b === btn); });
    currentPeriodDays = Number(btn.dataset.days);
    renderKpis();
  });

  renderers['visao-geral'] = function () { renderKpis(); };

  /* =======================================================
     PEDIDOS
  ======================================================= */
  var pedidosPeriodDays = 180;
  var pedidosStatusFiltro = 'todos';
  var pedidosBusca = '';

  var STATUS_LABEL = { pendente: 'Pendente', preparo: 'Em preparo', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' };

  function clientStats(nome) {
    var pedidosCliente = state.pedidos.filter(function (p) { return p.cliente.toLowerCase() === nome.toLowerCase(); });
    var total = pedidosCliente.filter(function (p) { return p.status !== 'cancelado'; }).reduce(function (s, p) { return s + p.total; }, 0);
    return { pedidos: pedidosCliente, total: total, count: pedidosCliente.length };
  }

  function renderPedidos() {
    var since = NOW.getTime() - pedidosPeriodDays * DAY;
    var lista = state.pedidos.filter(function (p) { return new Date(p.data).getTime() >= since; });

    if (pedidosStatusFiltro !== 'todos') {
      lista = lista.filter(function (p) { return p.status === pedidosStatusFiltro; });
    }
    if (pedidosBusca.trim()) {
      var q = pedidosBusca.trim().toLowerCase();
      lista = lista.filter(function (p) { return p.cliente.toLowerCase().indexOf(q) !== -1; });
    }
    lista = lista.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); });

    /* cartão de cliente quando a busca aponta para um único nome */
    var customerCard = document.getElementById('customerCard');
    var uniqueNames = {};
    lista.forEach(function (p) { uniqueNames[p.cliente] = true; });
    var names = Object.keys(uniqueNames);
    if (pedidosBusca.trim() && names.length === 1) {
      var stats = clientStats(names[0]);
      customerCard.hidden = false;
      customerCard.innerHTML =
        '<div><p class="cc-name">' + escapeHtml(names[0]) + '</p><p class="cc-sub">Histórico completo do cliente</p></div>' +
        '<div class="cc-stats">' +
        '<div class="cc-stat"><strong>' + fmtBRL(stats.total) + '</strong><span>Total gasto</span></div>' +
        '<div class="cc-stat"><strong>' + stats.count + '</strong><span>Compras</span></div>' +
        '</div>';
    } else {
      customerCard.hidden = true;
      customerCard.innerHTML = '';
    }

    var tbody = document.getElementById('tabelaPedidosBody');
    var empty = document.getElementById('pedidosEmpty');
    if (!lista.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      tbody.innerHTML = lista.map(function (p) {
        var qtdItens = p.itens.reduce(function (s, it) { return s + it.qtd; }, 0);
        return '<tr>' +
          '<td class="cell-strong">' + p.id + '</td>' +
          '<td>' + escapeHtml(p.cliente) + '</td>' +
          '<td class="cell-faint">' + fmtDate(p.data) + '</td>' +
          '<td>' + qtdItens + ' item' + (qtdItens > 1 ? 's' : '') + '</td>' +
          '<td class="cell-strong">' + fmtBRL(p.total) + '</td>' +
          '<td><span class="badge badge--' + p.status + '">' + STATUS_LABEL[p.status] + '</span></td>' +
          '<td><div class="row-actions"><button class="icon-btn" type="button" data-ver-pedido="' + p.id + '" aria-label="Ver pedido">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
          '</button></div></td>' +
          '</tr>';
      }).join('');
    }

    var badge = document.getElementById('navBadgePedidos');
    var pendentes = state.pedidos.filter(function (p) { return p.status === 'pendente'; }).length;
    badge.hidden = pendentes === 0;
    badge.textContent = pendentes;
  }

  function openPedidoModal(id) {
    var p = state.pedidos.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var stats = clientStats(p.cliente);
    var itemRows = p.itens.map(function (it) {
      return '<tr><td>' + escapeHtml(it.produto) + '</td><td>' + it.qtd + '</td><td>' + fmtBRL(it.preco) + '</td><td>' + fmtBRL(it.qtd * it.preco) + '</td></tr>';
    }).join('');

    var statusOptions = Object.keys(STATUS_LABEL).map(function (k) {
      return '<option value="' + k + '"' + (k === p.status ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>';
    }).join('');

    openModal(
      '<h2 class="modal-title">Pedido ' + p.id + '</h2>' +
      '<p class="modal-sub">Feito em ' + fmtDate(p.data) + '</p>' +
      '<div class="detail-grid">' +
      '<div class="detail-item"><span>Cliente</span><strong>' + escapeHtml(p.cliente) + '</strong></div>' +
      '<div class="detail-item"><span>Total gasto (histórico)</span><strong>' + fmtBRL(stats.total) + '</strong></div>' +
      '<div class="detail-item"><span>Compras do cliente</span><strong>' + stats.count + '</strong></div>' +
      '<div class="detail-item"><span>Valor deste pedido</span><strong>' + fmtBRL(p.total) + '</strong></div>' +
      '</div>' +
      '<table class="items-table"><thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>' +
      '<tbody>' + itemRows + '</tbody>' +
      '<tfoot><tr><td colspan="3">Total</td><td>' + fmtBRL(p.total) + '</td></tr></tfoot></table>' +
      '<div class="form-row"><label for="statusSelect">Atualizar status</label>' +
      '<select id="statusSelect">' + statusOptions + '</select></div>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-close-modal>Fechar</button>' +
      '<button class="btn btn--solid" type="button" id="salvarStatusBtn">Salvar status</button>' +
      '</div>'
    );

    document.getElementById('salvarStatusBtn').addEventListener('click', function () {
      var novo = document.getElementById('statusSelect').value;
      p.status = novo;
      saveState();
      renderPedidos();
      closeModal();
      toast('success', 'Status atualizado', p.id + ' agora está "' + STATUS_LABEL[novo] + '".');
    });
    modalBody.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
  }

  document.getElementById('periodFilterPedidos').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-days]');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (b) { b.classList.toggle('is-active', b === btn); });
    pedidosPeriodDays = Number(btn.dataset.days);
    renderPedidos();
  });
  document.getElementById('statusChips').addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (b) { b.classList.toggle('is-active', b === btn); });
    pedidosStatusFiltro = btn.dataset.status;
    renderPedidos();
  });
  var buscaTimer;
  document.getElementById('buscaCliente').addEventListener('input', function (e) {
    clearTimeout(buscaTimer);
    var v = e.target.value;
    buscaTimer = setTimeout(function () { pedidosBusca = v; renderPedidos(); }, 200);
  });
  document.getElementById('tabelaPedidosBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-ver-pedido]');
    if (btn) openPedidoModal(btn.dataset.verPedido);
  });

  renderers['pedidos'] = renderPedidos;

  /* =======================================================
     ESTOQUE
  ======================================================= */
  var estoqueBusca = '';
  var estoqueCategoria = 'todas';
  var estoqueSubcategoria = 'todas';

  function todasSubcategorias() {
    var set = {};
    Object.keys(SUBCATEGORIAS).forEach(function (k) { SUBCATEGORIAS[k].forEach(function (s) { set[s] = true; }); });
    return Object.keys(set).sort();
  }

  function atualizarFiltroSubcategoria() {
    var select = document.getElementById('filtroSubcategoria');
    var lista = estoqueCategoria === 'todas' ? todasSubcategorias() : SUBCATEGORIAS[estoqueCategoria];
    var atual = estoqueSubcategoria;
    var mantemAtual = lista.indexOf(atual) !== -1;
    select.innerHTML = '<option value="todas">Todas as subcategorias</option>' +
      lista.map(function (s) { return '<option value="' + escapeHtml(s) + '"' + (mantemAtual && s === atual ? ' selected' : '') + '>' + escapeHtml(s) + '</option>'; }).join('');
    if (!mantemAtual) { estoqueSubcategoria = 'todas'; select.value = 'todas'; }
  }

  function estoqueStatus(p) {
    if (p.estoque <= 0) return 'critico';
    if (p.estoque <= p.estoqueMin) return p.estoque <= Math.ceil(p.estoqueMin / 2) ? 'critico' : 'baixo';
    return 'ok';
  }
  var ESTOQUE_LABEL = { ok: 'Em estoque', baixo: 'Estoque baixo', critico: 'Estoque crítico' };

  function renderEstoque(opts) {
    opts = opts || {};
    var lista = state.produtos.slice();
    if (estoqueCategoria !== 'todas') lista = lista.filter(function (p) { return p.categoria === estoqueCategoria; });
    if (estoqueSubcategoria !== 'todas') lista = lista.filter(function (p) { return p.subcategoria === estoqueSubcategoria; });
    if (estoqueBusca.trim()) {
      var q = estoqueBusca.trim().toLowerCase();
      lista = lista.filter(function (p) { return p.nome.toLowerCase().indexOf(q) !== -1; });
    }

    document.getElementById('tabelaEstoqueBody').innerHTML = lista.map(function (p) {
      var st = estoqueStatus(p);
      var tamanhos = p.tamanhos && p.tamanhos.length ? p.tamanhos.join(', ') : '—';
      return '<tr class="' + (st === 'critico' ? 'is-critico' : st === 'baixo' ? 'is-baixo' : '') + '">' +
        '<td><div class="product-cell">' + buildThumb(p) + '<span class="cell-strong">' + escapeHtml(p.nome) + '</span></div></td>' +
        '<td class="cell-faint">' + CATEGORIAS[p.categoria] + (p.subcategoria ? '<br><span class="cell-subcat">' + escapeHtml(p.subcategoria) + '</span>' : '') + '</td>' +
        '<td class="cell-faint">' + escapeHtml(tamanhos) + '</td>' +
        '<td>' + fmtBRL(p.preco) + '</td>' +
        '<td><div class="stepper-input">' +
        '<button type="button" data-ajustar="' + p.id + '" data-delta="-1" aria-label="Diminuir">−</button>' +
        '<span class="' + (st === 'critico' ? 'is-critico' : st === 'baixo' ? 'is-baixo' : '') + '">' + p.estoque + '</span>' +
        '<button type="button" data-ajustar="' + p.id + '" data-delta="1" aria-label="Aumentar">+</button>' +
        '</div></td>' +
        '<td><input type="number" min="0" value="' + p.estoqueMin + '" class="min-input" data-min-for="' + p.id + '" style="width:56px;padding:6px 8px;border:1.5px solid var(--line);border-radius:7px;background:var(--bg);color:var(--fg)"></td>' +
        '<td><span class="badge badge--' + st + '">' + ESTOQUE_LABEL[st] + '</span></td>' +
        '<td><div class="row-actions">' +
        '<button class="icon-btn" type="button" data-editar="' + p.id + '" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>' +
        '<button class="icon-btn" type="button" data-movimentar="' + p.id + '" aria-label="Movimentar estoque"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg></button>' +
        '<button class="icon-btn is-danger" type="button" data-remover="' + p.id + '" aria-label="Remover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>' +
        '</div></td></tr>';
    }).join('');

    /* alerta consolidado */
    var criticos = state.produtos.filter(function (p) { return estoqueStatus(p) === 'critico'; });
    var alertBox = document.getElementById('alertEstoque');
    if (criticos.length) {
      alertBox.hidden = false;
      alertBox.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>' +
        '<span><strong>' + criticos.length + ' produto' + (criticos.length > 1 ? 's estão' : ' está') + ' com estoque crítico:</strong> ' +
        criticos.map(function (p) { return escapeHtml(p.nome); }).join(', ') + '.</span>';
    } else {
      alertBox.hidden = true;
    }

    /* relatórios */
    var menorEstoque = state.produtos.slice().sort(function (a, b) { return a.estoque - b.estoque; }).slice(0, 5);
    document.getElementById('listaMenorEstoque').innerHTML = menorEstoque.map(function (p) {
      return '<li class="mini-item"><strong>' + escapeHtml(p.nome) + '</strong><span>' + p.estoque + ' un.</span></li>';
    }).join('');

    var semMovimentacao = state.produtos.slice().sort(function (a, b) { return b.ultimaVendaDias - a.ultimaVendaDias; }).slice(0, 5);
    document.getElementById('listaSemMovimentacao').innerHTML = semMovimentacao.map(function (p) {
      return '<li class="mini-item"><strong>' + escapeHtml(p.nome) + '</strong><span>' + p.ultimaVendaDias + ' dias</span></li>';
    }).join('');

    /* movimentações recentes */
    var movs = state.movimentacoes.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); }).slice(0, 8);
    document.getElementById('listaMovimentacoes').innerHTML = movs.length ? movs.map(function (m) {
      var isIn = m.tipo === 'entrada';
      return '<li class="mov-item"><span class="mov-icon ' + (isIn ? 'is-in' : 'is-out') + '">' +
        (isIn ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' :
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>') +
        '</span><span class="mov-text"><strong>' + (isIn ? '+' : '−') + m.qtd + ' ' + escapeHtml(m.produto) + '</strong><span class="mov-meta">' + escapeHtml(m.motivo) + ' · ' + fmtDate(m.data) + '</span></span></li>';
    }).join('') : '<li class="mov-empty">Nenhuma movimentação registrada ainda.</li>';

    /* badge da sidebar */
    var badge = document.getElementById('navBadgeEstoque');
    badge.hidden = criticos.length === 0;
    badge.textContent = criticos.length;

    if (opts.notify && criticos.length) {
      if (criticos.length <= 2) {
        criticos.forEach(function (p) {
          toast('danger', 'Estoque crítico', p.nome + ' — restam ' + p.estoque + ' un.');
        });
      } else {
        toast('danger', 'Estoque crítico', criticos.length + ' produtos precisam de reposição.');
      }
    }
  }

  function registrarMovimentacao(produto, tipo, qtd, motivo) {
    state.movimentacoes.unshift({ id: uid('mov'), produto: produto.nome, tipo: tipo, qtd: qtd, motivo: motivo || (tipo === 'entrada' ? 'Reposição' : 'Ajuste manual'), data: new Date().toISOString() });
  }

  function ajustarEstoque(id, delta) {
    var p = state.produtos.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    p.estoque = Math.max(0, p.estoque + delta);
    registrarMovimentacao(p, delta > 0 ? 'entrada' : 'saida', Math.abs(delta), 'Ajuste manual');
    saveState();
    renderEstoque();
  }

  function subcategoriaOptions(categoria, selecionada) {
    return (SUBCATEGORIAS[categoria] || []).map(function (s) {
      return '<option value="' + s + '"' + (s === selecionada ? ' selected' : '') + '>' + s + '</option>';
    }).join('');
  }

  function openProdutoModal(produto) {
    var editing = !!produto;
    var fotoAtual = editing ? (produto.imagem || null) : null;

    openModal(
      '<h2 class="modal-title">' + (editing ? 'Editar produto' : 'Adicionar produto') + '</h2>' +
      '<p class="modal-sub">Essas informações aparecem no seu catálogo e no controle de estoque.</p>' +
      '<form id="produtoForm">' +

      '<div class="form-row"><label>Foto do produto</label>' +
      '<div class="photo-upload" id="photoUpload" tabindex="0" role="button" aria-describedby="photoHint">' +
      '<input type="file" id="fotoInput" accept="image/png,image/jpeg,image/webp" hidden>' +
      '<div class="photo-empty" id="photoEmpty"' + (fotoAtual ? ' hidden' : '') + '>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 21"/></svg>' +
      '<p><strong>Clique para enviar</strong> ou arraste a foto aqui</p>' +
      '<span id="photoHint">PNG, JPG ou WEBP</span>' +
      '</div>' +
      '<div class="photo-preview" id="photoPreview"' + (fotoAtual ? '' : ' hidden') + '>' +
      '<img id="photoPreviewImg" src="' + (fotoAtual || '') + '" alt="Prévia do produto">' +
      '<button type="button" class="upload-remove" id="photoRemove" aria-label="Remover foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div></div></div>' +

      '<div class="form-row"><label for="pNome">Nome do produto</label><input type="text" id="pNome" required value="' + (editing ? escapeHtml(produto.nome) : '') + '"></div>' +
      '<div class="form-row-split">' +
      '<div class="form-row"><label for="pCategoria">Categoria</label><select id="pCategoria">' +
      Object.keys(CATEGORIAS).map(function (k) { return '<option value="' + k + '"' + (editing && produto.categoria === k ? ' selected' : '') + '>' + CATEGORIAS[k] + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-row"><label for="pSubcategoria">Subcategoria</label><select id="pSubcategoria">' +
      subcategoriaOptions(editing ? produto.categoria : Object.keys(CATEGORIAS)[0], editing ? produto.subcategoria : null) +
      '</select></div>' +
      '</div>' +
      '<div class="form-row"><label>Tamanhos disponíveis</label>' +
      '<div class="size-picker" id="sizePicker">' + sizeOptionsFor(editing ? produto.categoria : 'roupas', editing ? produto.tamanhos : SIZE_OPTIONS.roupas) + '</div></div>' +
      '<div class="form-row"><label for="pPreco">Preço (R$)</label><input type="number" id="pPreco" min="0" step="0.01" required value="' + (editing ? produto.preco : '') + '"></div>' +
      '<div class="form-row-split">' +
      '<div class="form-row"><label for="pEstoque">Estoque inicial</label><input type="number" id="pEstoque" min="0" required value="' + (editing ? produto.estoque : 0) + '"></div>' +
      '<div class="form-row"><label for="pMin">Estoque mínimo</label><input type="number" id="pMin" min="0" required value="' + (editing ? produto.estoqueMin : 5) + '"></div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-close-modal>Cancelar</button>' +
      '<button class="btn btn--solid" type="submit">' + (editing ? 'Salvar alterações' : 'Adicionar produto') + '</button>' +
      '</div>' +
      '</form>'
    );
    modalBody.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });

    /* categoria -> repovoa subcategoria e tamanhos */
    document.getElementById('pCategoria').addEventListener('change', function (e) {
      var categoria = e.target.value;
      document.getElementById('pSubcategoria').innerHTML = subcategoriaOptions(categoria, null);
      document.getElementById('sizePicker').innerHTML = sizeOptionsFor(categoria, SIZE_OPTIONS[categoria] || ['Único']);
    });

    /* upload de foto */
    var photoUpload = document.getElementById('photoUpload');
    var fotoInput = document.getElementById('fotoInput');
    var photoEmpty = document.getElementById('photoEmpty');
    var photoPreview = document.getElementById('photoPreview');
    var photoPreviewImg = document.getElementById('photoPreviewImg');

    function setFoto(dataUrl) {
      fotoAtual = dataUrl;
      if (dataUrl) {
        photoPreviewImg.src = dataUrl;
        photoEmpty.hidden = true;
        photoPreview.hidden = false;
      } else {
        photoPreviewImg.src = '';
        photoEmpty.hidden = false;
        photoPreview.hidden = true;
      }
    }
    function handleFotoFile(file) {
      readAndResizeImage(file, 640, 0.82).then(setFoto).catch(function () {
        toast('danger', 'Não foi possível usar essa imagem', 'Tente um arquivo PNG, JPG ou WEBP.');
      });
    }
    photoUpload.addEventListener('click', function (e) { if (!e.target.closest('#photoRemove')) fotoInput.click(); });
    photoUpload.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fotoInput.click(); } });
    fotoInput.addEventListener('change', function () { if (fotoInput.files && fotoInput.files[0]) handleFotoFile(fotoInput.files[0]); });
    ['dragenter', 'dragover'].forEach(function (evt) { photoUpload.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); photoUpload.classList.add('is-dragover'); }); });
    ['dragleave', 'drop'].forEach(function (evt) { photoUpload.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); photoUpload.classList.remove('is-dragover'); }); });
    photoUpload.addEventListener('drop', function (e) { var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleFotoFile(f); });
    document.getElementById('photoRemove').addEventListener('click', function (e) { e.stopPropagation(); setFoto(null); });

    document.getElementById('produtoForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('pNome').value.trim();
      var categoria = document.getElementById('pCategoria').value;
      var subcategoria = document.getElementById('pSubcategoria').value;
      var tamanhos = normalizeSizes(Array.prototype.slice.call(document.querySelectorAll('input[name="produtoTamanho"]:checked')).map(function (input) { return input.value; }));
      var preco = parseFloat(document.getElementById('pPreco').value) || 0;
      var estoque = parseInt(document.getElementById('pEstoque').value, 10) || 0;
      var min = parseInt(document.getElementById('pMin').value, 10) || 0;
      if (!nome) return;

      if (!tamanhos.length) {
        tamanhos = SIZE_OPTIONS[categoria] || ['Único'];
      }

      if (editing) {
        produto.nome = nome; produto.categoria = categoria; produto.subcategoria = subcategoria; produto.tamanhos = tamanhos;
        produto.preco = preco; produto.estoque = estoque; produto.estoqueMin = min; produto.imagem = fotoAtual;
        toast('success', 'Produto atualizado', nome);
      } else {
        state.produtos.push({
          id: uid('prod'), nome: nome, categoria: categoria, subcategoria: subcategoria, preco: preco,
          estoque: estoque, estoqueMin: min, vendas30: 0, ultimaVendaDias: 0,
          cor: THUMB_COLORS[state.produtos.length % THUMB_COLORS.length], imagem: fotoAtual, tamanhos: tamanhos
        });
        toast('success', 'Produto adicionado', nome + ' já está no seu estoque.');
      }
      saveState();
      atualizarFiltroSubcategoria();
      renderEstoque();
      closeModal();
    });
  }

  function openMovimentacaoModal(produto) {
    openModal(
      '<h2 class="modal-title">Movimentar estoque</h2>' +
      '<p class="modal-sub">' + escapeHtml(produto.nome) + ' — estoque atual: ' + produto.estoque + ' un.</p>' +
      '<form id="movForm">' +
      '<div class="form-row"><label for="movTipo">Tipo</label><select id="movTipo"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>' +
      '<div class="form-row"><label for="movQtd">Quantidade</label><input type="number" id="movQtd" min="1" value="1" required></div>' +
      '<div class="form-row"><label for="movMotivo">Motivo</label><input type="text" id="movMotivo" placeholder="Ex: Reposição de fornecedor"></div>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-close-modal>Cancelar</button>' +
      '<button class="btn btn--solid" type="submit">Registrar</button>' +
      '</div></form>'
    );
    modalBody.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.getElementById('movForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var tipo = document.getElementById('movTipo').value;
      var qtd = parseInt(document.getElementById('movQtd').value, 10) || 0;
      var motivo = document.getElementById('movMotivo').value.trim();
      if (qtd <= 0) return;
      produto.estoque = tipo === 'entrada' ? produto.estoque + qtd : Math.max(0, produto.estoque - qtd);
      registrarMovimentacao(produto, tipo, qtd, motivo);
      saveState();
      renderEstoque();
      closeModal();
      toast('success', 'Movimentação registrada', (tipo === 'entrada' ? '+' : '−') + qtd + ' ' + produto.nome);
    });
  }

  function confirmRemoverProduto(produto) {
    openModal(
      '<div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></div>' +
      '<h2 class="modal-title">Remover produto?</h2>' +
      '<p class="modal-sub">Isso vai remover "' + escapeHtml(produto.nome) + '" do seu estoque e catálogo. Essa ação não pode ser desfeita.</p>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-close-modal>Cancelar</button>' +
      '<button class="btn btn--danger" type="button" id="confirmRemoverBtn">Remover</button>' +
      '</div>'
    );
    modalBody.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.getElementById('confirmRemoverBtn').addEventListener('click', function () {
      state.produtos = state.produtos.filter(function (p) { return p.id !== produto.id; });
      saveState();
      renderEstoque();
      closeModal();
      toast('info', 'Produto removido', produto.nome);
    });
  }

  document.getElementById('btnNovoProduto').addEventListener('click', function () { openProdutoModal(null); });
  document.getElementById('buscaProduto').addEventListener('input', function (e) { estoqueBusca = e.target.value; renderEstoque(); });
  document.getElementById('filtroCategoria').addEventListener('change', function (e) {
    estoqueCategoria = e.target.value;
    atualizarFiltroSubcategoria();
    renderEstoque();
  });
  document.getElementById('filtroSubcategoria').addEventListener('change', function (e) { estoqueSubcategoria = e.target.value; renderEstoque(); });

  document.getElementById('tabelaEstoqueBody').addEventListener('click', function (e) {
    var ajustar = e.target.closest('[data-ajustar]');
    if (ajustar) { ajustarEstoque(ajustar.dataset.ajustar, Number(ajustar.dataset.delta)); return; }
    var editar = e.target.closest('[data-editar]');
    if (editar) { openProdutoModal(state.produtos.filter(function (p) { return p.id === editar.dataset.editar; })[0]); return; }
    var mover = e.target.closest('[data-movimentar]');
    if (mover) { openMovimentacaoModal(state.produtos.filter(function (p) { return p.id === mover.dataset.movimentar; })[0]); return; }
    var remover = e.target.closest('[data-remover]');
    if (remover) { confirmRemoverProduto(state.produtos.filter(function (p) { return p.id === remover.dataset.remover; })[0]); }
  });
  document.getElementById('tabelaEstoqueBody').addEventListener('change', function (e) {
    var input = e.target.closest('[data-min-for]');
    if (!input) return;
    var p = state.produtos.filter(function (x) { return x.id === input.dataset.minFor; })[0];
    if (!p) return;
    p.estoqueMin = Math.max(0, parseInt(input.value, 10) || 0);
    saveState();
    renderEstoque();
    toast('info', 'Mínimo atualizado', p.nome + ' — alerta a partir de ' + p.estoqueMin + ' un.');
  });

  renderers['estoque'] = function () { atualizarFiltroSubcategoria(); renderEstoque({ notify: true }); };

  /* =======================================================
     PRODUTOS SEM VENDA
  ======================================================= */
  var SUGESTOES = [
    { key: 'promocao', label: 'Criar promoção' },
    { key: 'cupom', label: 'Aplicar cupom' },
    { key: 'destaque', label: 'Destacar na vitrine' },
    { key: 'preco', label: 'Ajustar preço' }
  ];

  function renderSemVenda() {
    var lista = state.produtos.filter(function (p) { return p.ultimaVendaDias >= 30; })
      .sort(function (a, b) { return b.ultimaVendaDias - a.ultimaVendaDias; });

    var tbody = document.getElementById('tabelaSemVendaBody');
    var empty = document.getElementById('semVendaEmpty');
    if (!lista.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    tbody.innerHTML = lista.map(function (p) {
      var acoes = state.acoesSemVenda[p.id] || [];
      var buttons = SUGESTOES.map(function (s) {
        var done = acoes.indexOf(s.key) !== -1;
        return '<button type="button" class="suggest-btn' + (done ? ' is-done' : '') + '" data-sugestao="' + p.id + '" data-acao="' + s.key + '">' +
          (done ? '✓ ' : '') + s.label + '</button>';
      }).join('');
      return '<tr>' +
        '<td><div class="product-cell">' + buildThumb(p) + '<span class="cell-strong">' + escapeHtml(p.nome) + '</span></div></td>' +
        '<td class="cell-faint">' + p.ultimaVendaDias + ' dias</td>' +
        '<td>' + p.estoque + ' un.</td>' +
        '<td><div class="suggest-actions">' + buttons + '</div></td>' +
        '</tr>';
    }).join('');
  }

  document.getElementById('tabelaSemVendaBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-sugestao]');
    if (!btn) return;
    var id = btn.dataset.sugestao, acao = btn.dataset.acao;
    var p = state.produtos.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (!state.acoesSemVenda[id]) state.acoesSemVenda[id] = [];
    var list = state.acoesSemVenda[id];
    var idx = list.indexOf(acao);
    var label = SUGESTOES.filter(function (s) { return s.key === acao; })[0].label;
    if (idx === -1) {
      list.push(acao);
      toast('success', 'Ação registrada', label + ' para "' + p.nome + '".');
    } else {
      list.splice(idx, 1);
    }
    saveState();
    renderSemVenda();
  });

  renderers['sem-venda'] = renderSemVenda;

  /* =======================================================
     CUPONS
  ======================================================= */
  var cupomFiltro = 'todos';

  function cupomStatus(c) {
    if (!c.ativo) return 'desativado';
    if (new Date(c.validade).getTime() < NOW.getTime()) return 'expirado';
    return 'ativo';
  }
  var CUPOM_STATUS_LABEL = { ativo: 'Ativo', expirado: 'Expirado', desativado: 'Desativado' };

  function renderCupons() {
    var lista = state.cupons.slice();
    if (cupomFiltro === 'ativos') lista = lista.filter(function (c) { return cupomStatus(c) === 'ativo'; });
    if (cupomFiltro === 'expirados') lista = lista.filter(function (c) { return cupomStatus(c) === 'expirado'; });
    if (cupomFiltro === 'desativados') lista = lista.filter(function (c) { return cupomStatus(c) === 'desativado'; });

    document.getElementById('coupomGrid').innerHTML = lista.length ? lista.map(function (c) {
      var st = cupomStatus(c);
      var usoPct = clamp(Math.round((c.usos / c.limite) * 100), 0, 100);
      return '<div class="coupon-card' + (st === 'desativado' ? ' is-desativado' : '') + '">' +
        '<div class="coupon-top"><div><p class="coupon-name">' + escapeHtml(c.nome) + '</p>' +
        '<span class="badge badge--' + st + '">' + CUPOM_STATUS_LABEL[st] + '</span></div>' +
        '<div class="coupon-value">' + (c.tipo === 'percentual' ? c.valor + '<small>%</small>' : fmtBRL(c.valor)) + '</div></div>' +
        '<div class="coupon-meta">' +
        '<div><span>Validade</span><strong>' + fmtDate(c.validade) + '</strong></div>' +
        '<div><span>Uso por cliente</span><strong>' + c.limitePorCliente + 'x</strong></div>' +
        '<div><span>Usos</span><strong>' + c.usos + ' / ' + c.limite + '</strong></div>' +
        '<div class="coupon-usage-bar"><i style="width:' + usoPct + '%"></i></div>' +
        '</div>' +
        '<div class="coupon-result"><span>Vendas geradas</span><strong>' + fmtBRL(c.resultado) + '</strong></div>' +
        '<div class="coupon-actions">' +
        '<button class="btn btn--sm" type="button" data-editar-cupom="' + c.id + '">Editar</button>' +
        '<button class="btn btn--sm' + (c.ativo ? ' btn--danger' : '') + '" type="button" data-toggle-cupom="' + c.id + '">' + (c.ativo ? 'Desativar' : 'Reativar') + '</button>' +
        '</div></div>';
    }).join('') : '<p class="table-empty">Nenhum cupom nessa categoria.</p>';
  }

  function openCupomModal(cupom) {
    var editing = !!cupom;
    openModal(
      '<h2 class="modal-title">' + (editing ? 'Editar cupom' : 'Criar cupom') + '</h2>' +
      '<p class="modal-sub">Configure as regras de uso do cupom.</p>' +
      '<form id="cupomForm">' +
      '<div class="form-row"><label for="cNome">Nome do cupom</label><input type="text" id="cNome" required style="text-transform:uppercase" value="' + (editing ? escapeHtml(cupom.nome) : '') + '"></div>' +
      '<div class="form-row-split">' +
      '<div class="form-row"><label for="cTipo">Tipo de desconto</label><select id="cTipo"><option value="percentual"' + (editing && cupom.tipo === 'percentual' ? ' selected' : '') + '>Porcentagem (%)</option><option value="fixo"' + (editing && cupom.tipo === 'fixo' ? ' selected' : '') + '>Valor fixo (R$)</option></select></div>' +
      '<div class="form-row"><label for="cValor">Valor do desconto</label><input type="number" id="cValor" min="0" step="0.01" required value="' + (editing ? cupom.valor : '') + '"></div>' +
      '</div>' +
      '<div class="form-row"><label for="cValidade">Data de validade</label><input type="date" id="cValidade" required value="' + (editing ? new Date(cupom.validade).toISOString().slice(0, 10) : '') + '"></div>' +
      '<div class="form-row-split">' +
      '<div class="form-row"><label for="cLimite">Limite de utilização</label><input type="number" id="cLimite" min="1" required value="' + (editing ? cupom.limite : 100) + '"></div>' +
      '<div class="form-row"><label for="cLimiteCliente">Usos por cliente</label><input type="number" id="cLimiteCliente" min="1" required value="' + (editing ? cupom.limitePorCliente : 1) + '"></div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn" type="button" data-close-modal>Cancelar</button>' +
      '<button class="btn btn--solid" type="submit">' + (editing ? 'Salvar alterações' : 'Criar cupom') + '</button>' +
      '</div></form>'
    );
    modalBody.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
    document.getElementById('cupomForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('cNome').value.trim().toUpperCase();
      var tipo = document.getElementById('cTipo').value;
      var valor = parseFloat(document.getElementById('cValor').value) || 0;
      var validade = new Date(document.getElementById('cValidade').value).toISOString();
      var limite = parseInt(document.getElementById('cLimite').value, 10) || 1;
      var limitePorCliente = parseInt(document.getElementById('cLimiteCliente').value, 10) || 1;
      if (!nome) return;

      if (editing) {
        cupom.nome = nome; cupom.tipo = tipo; cupom.valor = valor; cupom.validade = validade;
        cupom.limite = limite; cupom.limitePorCliente = limitePorCliente;
        toast('success', 'Cupom atualizado', nome);
      } else {
        state.cupons.push({
          id: uid('cup'), nome: nome, tipo: tipo, valor: valor, validade: validade,
          limite: limite, limitePorCliente: limitePorCliente, usos: 0, ativo: true, resultado: 0
        });
        toast('success', 'Cupom criado', nome + ' já está disponível para os clientes.');
      }
      saveState();
      renderCupons();
      closeModal();
    });
  }

  document.getElementById('btnNovoCupom').addEventListener('click', function () { openCupomModal(null); });
  document.getElementById('cupomTabs').addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (b) { b.classList.toggle('is-active', b === btn); });
    cupomFiltro = btn.dataset.cupomStatus;
    renderCupons();
  });
  document.getElementById('coupomGrid').addEventListener('click', function (e) {
    var editar = e.target.closest('[data-editar-cupom]');
    if (editar) { openCupomModal(state.cupons.filter(function (c) { return c.id === editar.dataset.editarCupom; })[0]); return; }
    var toggle = e.target.closest('[data-toggle-cupom]');
    if (toggle) {
      var c = state.cupons.filter(function (x) { return x.id === toggle.dataset.toggleCupom; })[0];
      c.ativo = !c.ativo;
      saveState();
      renderCupons();
      toast('info', c.ativo ? 'Cupom reativado' : 'Cupom desativado', c.nome);
    }
  });

  renderers['cupons'] = renderCupons;

  /* =======================================================
     MINHA LOJA
  ======================================================= */
  function renderMinhaLoja() {
    var produtosAtivos = state.produtos.length;
    var cuponsAtivos = state.cupons.filter(function (c) { return cupomStatus(c) === 'ativo'; }).length;
    var stats = [
      { label: 'Produtos no catálogo', value: fmtInt(produtosAtivos) },
      { label: 'Categorias', value: fmtInt(Object.keys(CATEGORIAS).length) },
      { label: 'Cupons ativos', value: fmtInt(cuponsAtivos) },
      { label: 'Banners no ar', value: '3' }
    ];
    document.getElementById('storeStats').innerHTML = stats.map(function (s) {
      return '<div class="store-stat"><strong>' + s.value + '</strong><span>' + s.label + '</span></div>';
    }).join('');
  }
  document.getElementById('deviceToggle').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-device]');
    if (!btn) return;
    Array.prototype.forEach.call(this.children, function (b) { b.classList.toggle('is-active', b === btn); });
    document.getElementById('previewFrameWrap').classList.toggle('is-mobile', btn.dataset.device === 'mobile');
  });

  renderers['minha-loja'] = renderMinhaLoja;

  /* =======================================================
     INIT
  ======================================================= */
  function applyStoreName() {
    document.getElementById('topbarStoreName').textContent = state.storeName;
    var target = document.querySelector('[data-store-name-target]');
    if (target) target.textContent = state.storeName;
  }

  state = loadState();
  applyStoreName();

  var initialView = (location.hash || '').replace('#', '');
  var validViews = views.map(function (v) { return v.dataset.view; });
  showView(validViews.indexOf(initialView) !== -1 ? initialView : 'visao-geral');
})();
