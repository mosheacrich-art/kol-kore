/* Tikkun Korim — async loader + per-parasha rendering + word tracking */

const book          = document.getElementById('book');
const printBtn      = document.getElementById('printBtn');
const parashaSelect = document.getElementById('parashaSelect');

/* ── Theme ──────────────────────────────────────────────────────────── */
;(function() {
  if (new URLSearchParams(location.search).get('theme') === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  }
})();

/* ── Embed mode ─────────────────────────────────────────────────────── */
var isEmbed = new URLSearchParams(location.search).get('embed') === '1';
if (isEmbed) document.body.classList.add('embed');

/* ── Canvas ─────────────────────────────────────────────────────────── */
var canvas = document.createElement('div');
canvas.id = 'book-canvas';
book.appendChild(canvas);

function showLoading() {
  canvas.innerHTML = '<div class="err" style="padding-top:80px">טוֹעֵן…</div>';
}
showLoading();

/* ── State ──────────────────────────────────────────────────────────── */
var PAGES         = [];
var PARASHA_INDEX = window.PARASHA_INDEX || [];
var currentPage   = 1;

/* ── Text filters ───────────────────────────────────────────────────── */
var NUN_HAFUCHA = '׆';

function ketiv(text) {
  return text
    .replace('#(פ)', '')
    .replace('(' + NUN_HAFUCHA + ')#', NUN_HAFUCHA + ' ')
    .replace('#(' + NUN_HAFUCHA + ')', ' ' + NUN_HAFUCHA)
    .split(' ')
    .map(function(w) {
      return w.split('־').map(function(word) {
        var p = word.split('#');
        return p.length <= 1 ? p[0] : p.slice(1).join('');
      }).join('־');
    })
    .join(' ')
    .replace(/\[/g, '{').replace(/\]/g, '}');
}

function kri(text) {
  return text
    .replace('#(פ)', '')
    .replace('(' + NUN_HAFUCHA + ')#', NUN_HAFUCHA + ' ')
    .replace('#(' + NUN_HAFUCHA + ')', ' ' + NUN_HAFUCHA)
    .replace(/־/g, ' ')
    .replace(/#\[[\s\S]+?\]/g, ' ')
    .replace(new RegExp('[^א-ת\\s׆]', 'g'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function annotate(text) {
  return text.split(/(\{[^}]*\})/).map(function(part) {
    if (part[0] === '{' && part[part.length-1] === '}')
      return '<span class="ktiv-kri">' + escapeHtml(part.slice(1,-1)) + '</span>';
    return escapeHtml(part);
  }).join('');
}

/* ── Word tracking state ────────────────────────────────────────────── */
var fragCounter = 0;   /* global, reset each parasha render */
var wordFragMap = [];  /* wordIdx → fragIdx  (sefer-column, plain words) */
var activeFragIdx = -1;

function buildWordMap() {
  wordFragMap = [];
  var wi = 0;
  /* Use sefer column (last .tikkun-cell in each row) for plain-text word count */
  var cells = canvas.querySelectorAll('tr .tikkun-cell:last-child .fragment[data-fi]');
  cells.forEach(function(span) {
    var fi = parseInt(span.dataset.fi);
    var words = span.textContent.replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean);
    words.forEach(function() { wordFragMap[wi++] = fi; });
  });
}

function highlightWord(wordIdx) {
  if (wordIdx < 0 || wordIdx >= wordFragMap.length) {
    if (activeFragIdx >= 0) {
      canvas.querySelectorAll('[data-fi="' + activeFragIdx + '"]').forEach(function(el) {
        el.classList.remove('w-active');
      });
      activeFragIdx = -1;
    }
    return;
  }
  var fi = wordFragMap[wordIdx];
  if (fi === activeFragIdx) return;
  /* Remove previous highlight */
  if (activeFragIdx >= 0) {
    canvas.querySelectorAll('[data-fi="' + activeFragIdx + '"]').forEach(function(el) {
      el.classList.remove('w-active');
    });
  }
  /* Add new highlight */
  canvas.querySelectorAll('[data-fi="' + fi + '"]').forEach(function(el) {
    el.classList.add('w-active');
  });
  /* Scroll active fragment into view (embed mode) */
  if (isEmbed) {
    var el = canvas.querySelector('[data-fi="' + fi + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  activeFragIdx = fi;
}

/* ── Render ─────────────────────────────────────────────────────────── */
function renderFrags(frags, annotated, baseFi) {
  var setuma = frags.length > 1 ? ' mod-setuma' : '';
  return frags.map(function(f, i) {
    var fi = baseFi + i;
    var inner = annotated ? annotate(ketiv(f)) : escapeHtml(kri(f));
    return '<span class="fragment' + setuma + '" data-fi="' + fi + '">' + inner + '</span>';
  }).join('');
}

function renderCell(line, annotated, baseFi) {
  if (line.cols) {
    var cols = line.cols.map(function(col, ci) {
      return '<div class="haazinu-col">' + renderFrags(col, annotated, baseFi + ci) + '</div>';
    });
    return '<td class="tikkun-cell"><div class="haazinu-row">' + cols.join('') + '</div></td>';
  }
  var frags = line.f || (line.t ? [line.t] : []);
  var petucha = line.p ? ' mod-petucha' : '';
  if (!frags.length)
    return '<td class="tikkun-cell"><div class="line empty-line"></div></td>';
  return '<td class="tikkun-cell"><div class="line' + petucha + '"><div class="column">' +
    renderFrags(frags, annotated, baseFi) + '</div></div></td>';
}

function lineFragCount(line) {
  if (line.cols) return line.cols.reduce(function(s, c) { return s + c.length; }, 0);
  var f = line.f || (line.t ? [line.t] : []);
  return f.length;
}

function renderAmud(lines, pageNum) {
  var rows = lines.map(function(line) {
    var baseFi = fragCounter;
    fragCounter += lineFragCount(line);  /* advance once — same fi for both cells */
    return '<tr>' + renderCell(line, true, baseFi) + renderCell(line, false, baseFi) + '</tr>';
  }).join('');
  return '<section class="amud" data-page="' + pageNum + '">' +
    '<div class="amud-header no-print">' +
      '<span class="col-label">תִּקּוּן</span>' +
      '<span class="amud-num">' + pageNum + '</span>' +
      '<span class="col-label">סֵפֶר תּוֹרָה</span>' +
    '</div>' +
    '<table class="tikkun-table" dir="rtl"><tbody>' + rows + '</tbody></table>' +
  '</section>';
}

/* ── Parasha range (with line offsets) ─────────────────────────────── */
function getParashaEntry(startPage) {
  return PARASHA_INDEX.find(function(p) { return p.page === startPage; });
}

/* ── Render a parasha — only its lines, fragment counter starts at 0 ── */
function renderParasha(startPage) {
  if (!PAGES.length) return;
  currentPage = startPage;
  activeFragIdx = -1;
  fragCounter = 0;

  var pi = PARASHA_INDEX.findIndex(function(p) { return p.page === startPage; });
  var thisP = PARASHA_INDEX[pi] || { page: startPage, line: 1 };
  var nextP = pi + 1 < PARASHA_INDEX.length ? PARASHA_INDEX[pi + 1] : null;

  /* line field in parasha-index is 1-based offset: actual start = line - 1 */
  var startLine = Math.max(0, thisP.line - 1);
  var endPage   = nextP ? nextP.page : PAGES.length;          /* 1-indexed */
  var endLine   = nextP ? Math.max(0, nextP.line - 1) : -1;   /* -1 = full page */

  var html = '';
  for (var p = startPage - 1; p < endPage && p < PAGES.length; p++) {
    var sl = (p === startPage - 1) ? startLine : 0;
    var el = (p === endPage - 1 && endLine >= 0) ? endLine : PAGES[p].length;
    var lines = PAGES[p].slice(sl, el);
    if (lines.length) html += renderAmud(lines, p + 1);
  }

  canvas.innerHTML = html || '<div class="err">לא נמצא תוכן לפרשה זו.</div>';
  buildWordMap();

  if (isEmbed) {
    requestAnimationFrame(function() { requestAnimationFrame(fitWidth); });
  } else {
    z = { scale: 1, tx: 0, ty: 0 };
    requestAnimationFrame(function() { requestAnimationFrame(fitToScreen); });
  }
}

/* ── Zoom / Pan ─────────────────────────────────────────────────────── */
var z = { scale: 1, tx: 0, ty: 0 };

function applyZoom() {
  canvas.style.transform =
    'translate(' + z.tx + 'px,' + z.ty + 'px) scale(' + z.scale + ')';
}

function fitToScreen() {
  var bw = book.clientWidth, bh = book.clientHeight;
  var cw = canvas.offsetWidth;
  var firstAmud = canvas.querySelector('.amud');
  var ch = firstAmud ? firstAmud.offsetHeight : canvas.offsetHeight;
  var s = Math.min(bw / (cw + 48), bh / (ch + 48));
  z.scale = s; z.tx = (bw - cw * s) / 2; z.ty = 24;
  applyZoom();
}

function fitWidth() {
  canvas.style.zoom = book.clientWidth / canvas.offsetWidth;
  canvas.style.transform = 'none';
}

if (!isEmbed) {
  book.addEventListener('wheel', function(e) {
    e.preventDefault();
    var factor = e.deltaY < 0 ? 1.12 : 1/1.12;
    var rect = book.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    z.tx = mx - (mx - z.tx) * factor;
    z.ty = my - (my - z.ty) * factor;
    z.scale = Math.max(0.08, Math.min(6, z.scale * factor));
    applyZoom();
  }, { passive: false });

  var drag = { on: false, sx: 0, sy: 0 };
  book.addEventListener('mousedown', function(e) {
    drag.on = true; drag.sx = e.clientX - z.tx; drag.sy = e.clientY - z.ty;
    book.classList.add('dragging');
  });
  window.addEventListener('mousemove', function(e) {
    if (!drag.on) return;
    z.tx = e.clientX - drag.sx; z.ty = e.clientY - drag.sy; applyZoom();
  });
  window.addEventListener('mouseup', function() {
    drag.on = false; book.classList.remove('dragging');
  });

  var pinch = { active: false, lastDist: 0, mx: 0, my: 0 };
  book.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
      pinch.active = true;
      pinch.lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      pinch.mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - book.getBoundingClientRect().left;
      pinch.my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - book.getBoundingClientRect().top;
    } else if (e.touches.length === 1) {
      drag.on = true;
      drag.sx = e.touches[0].clientX - z.tx;
      drag.sy = e.touches[0].clientY - z.ty;
    }
  }, { passive: true });

  book.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (e.touches.length === 2 && pinch.active) {
      var dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      var factor = dist / pinch.lastDist;
      z.tx = pinch.mx - (pinch.mx - z.tx) * factor;
      z.ty = pinch.my - (pinch.my - z.ty) * factor;
      z.scale = Math.max(0.08, Math.min(6, z.scale * factor));
      pinch.lastDist = dist;
      applyZoom();
    } else if (e.touches.length === 1 && drag.on) {
      z.tx = e.touches[0].clientX - drag.sx;
      z.ty = e.touches[0].clientY - drag.sy;
      applyZoom();
    }
  }, { passive: false });

  book.addEventListener('touchend', function() { drag.on = false; pinch.active = false; });
}

if (isEmbed) window.addEventListener('resize', fitWidth);

/* ── Parasha navigation ─────────────────────────────────────────────── */
function showParashaContaining(pageNum) {
  var owner = PARASHA_INDEX[0];
  for (var i = 0; i < PARASHA_INDEX.length; i++) {
    if (PARASHA_INDEX[i].page <= pageNum) owner = PARASHA_INDEX[i];
    else break;
  }
  parashaSelect.value = owner.page;
  renderParasha(owner.page);
}

parashaSelect.addEventListener('change', function() {
  var v = parseInt(parashaSelect.value);
  if (v) renderParasha(v);
});

/* ── Print ──────────────────────────────────────────────────────────── */
if (!isEmbed) {
  window.addEventListener('beforeprint', function() {
    canvas.style.transform = 'none';
    canvas.style.width = '100%';
    canvas.style.padding = '0';
  });
  window.addEventListener('afterprint', function() {
    canvas.style.width = '';
    canvas.style.padding = '';
    applyZoom();
  });
  printBtn.addEventListener('click', function() { window.print(); });
}

/* ── Hash / postMessage navigation ─────────────────────────────────── */
function stripDiacritics(s) { return String(s).replace(/[֑-ׇ]/g, ''); }
function findParasha(name) {
  var n = stripDiacritics(name);
  return PARASHA_INDEX.find(function(p) { return stripDiacritics(p.name) === n; });
}

var pendingNav = null;

function handleNav(hash) {
  if (!hash) return;
  if (!PAGES.length) { pendingNav = hash; return; }
  if (hash.indexOf('page=') === 0) showParashaContaining(parseInt(hash.slice(5)));
  else if (hash.indexOf('parasha=') === 0) {
    var e = findParasha(hash.slice(8));
    if (e) renderParasha(e.page);
  }
}

function handleHash() {
  handleNav(decodeURIComponent(location.hash.replace(/^#/, '')));
}

window.addEventListener('hashchange', handleHash);

window.addEventListener('message', function(e) {
  if (!e.data) return;
  /* Parasha navigation */
  if (e.data.scrollToParasha) {
    var entry = findParasha(e.data.scrollToParasha);
    if (entry) {
      if (!PAGES.length) { pendingNav = 'parasha=' + e.data.scrollToParasha; return; }
      renderParasha(entry.page);
    }
  }
  /* Word tracking */
  if (typeof e.data.wordIdx === 'number') {
    highlightWord(e.data.wordIdx);
  }
});

/* ── Async data load ────────────────────────────────────────────────── */
var base = (function() {
  var s = document.currentScript;
  if (!s) return '../data/';
  return s.src.replace(/src\/app\.js.*$/, 'data/');
})();

Promise.all([
  fetch(base + 'tikkun-pages.json').then(function(r) { return r.json(); }),
  fetch(base + 'haazinu-patch.json').then(function(r) { return r.json(); })
]).then(function(results) {
  PAGES = results[0];
  var patch = results[1];

  Object.keys(patch).forEach(function(pi) {
    if (!PAGES[pi]) return;
    Object.keys(patch[pi]).forEach(function(li) { PAGES[pi][li] = patch[pi][li]; });
  });

  PARASHA_INDEX.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.page; opt.textContent = p.name;
    parashaSelect.appendChild(opt);
  });

  var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (pendingNav) {
    handleNav(pendingNav); pendingNav = null;
  } else if (hash) {
    handleHash();
  } else {
    var firstPage = PARASHA_INDEX.length ? PARASHA_INDEX[0].page : 1;
    parashaSelect.value = firstPage;
    renderParasha(firstPage);
  }
}).catch(function() {
  canvas.innerHTML = '<div class="err">שגיאה בטעינת הנתונים.</div>';
});
