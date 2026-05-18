/* Tikkun Korim — async loader + per-parasha rendering */

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

/* ── Loading state ──────────────────────────────────────────────────── */
function showLoading() {
  canvas.innerHTML = '<div class="err" style="padding-top:80px">טוֹעֵן…</div>';
}
function showError() {
  canvas.innerHTML = '<div class="err">שגיאה בטעינת הנתונים.</div>';
}
showLoading();

/* ── State ──────────────────────────────────────────────────────────── */
var PAGES         = [];
var PARASHA_INDEX = window.PARASHA_INDEX || [];
var currentPage   = 1;   /* first page of currently rendered parasha */

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

/* ── Render ─────────────────────────────────────────────────────────── */
function renderFrags(frags, annotated) {
  var setuma = frags.length > 1 ? ' mod-setuma' : '';
  return frags.map(function(f) {
    var inner = annotated ? annotate(ketiv(f)) : escapeHtml(kri(f));
    return '<span class="fragment' + setuma + '">' + inner + '</span>';
  }).join('');
}

function renderCell(line, annotated) {
  if (line.cols) {
    var cols = line.cols.map(function(col) {
      return '<div class="haazinu-col">' + renderFrags(col, annotated) + '</div>';
    });
    return '<td class="tikkun-cell"><div class="haazinu-row">' + cols.join('') + '</div></td>';
  }
  var frags = line.f || (line.t ? [line.t] : []);
  var petucha = line.p ? ' mod-petucha' : '';
  if (!frags.length)
    return '<td class="tikkun-cell"><div class="line empty-line"></div></td>';
  return '<td class="tikkun-cell"><div class="line' + petucha + '"><div class="column">' +
    renderFrags(frags, annotated) + '</div></div></td>';
}

function renderAmud(lines, pageNum) {
  var rows = lines.map(function(line) {
    return '<tr>' + renderCell(line, true) + renderCell(line, false) + '</tr>';
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

/* ── Parasha page ranges ────────────────────────────────────────────── */
function getParashaRange(startPage) {
  var idx = PARASHA_INDEX.findIndex(function(p) { return p.page === startPage; });
  var end = (idx >= 0 && idx + 1 < PARASHA_INDEX.length)
    ? PARASHA_INDEX[idx + 1].page - 1
    : PAGES.length;
  return { start: startPage, end: end };
}

/* ── Render a parasha (by its first page number, 1-indexed) ─────────── */
function renderParasha(startPage) {
  if (!PAGES.length) return;
  currentPage = startPage;
  var range = getParashaRange(startPage);
  var html = '';
  for (var i = range.start - 1; i < range.end && i < PAGES.length; i++) {
    html += renderAmud(PAGES[i], i + 1);
  }
  canvas.innerHTML = html;

  if (isEmbed) {
    requestAnimationFrame(function() { requestAnimationFrame(fitWidth); });
  } else {
    z = { scale: 1, tx: 0, ty: 0 };
    requestAnimationFrame(function() { requestAnimationFrame(fitToScreen); });
  }
}

/* ── Zoom / Pan state ───────────────────────────────────────────────── */
var z = { scale: 1, tx: 0, ty: 0 };

function applyZoom() {
  canvas.style.transform =
    'translate(' + z.tx + 'px,' + z.ty + 'px) scale(' + z.scale + ')';
}

function fitToScreen() {
  var bw = book.clientWidth;
  var bh = book.clientHeight;
  var cw = canvas.offsetWidth;
  var firstAmud = canvas.querySelector('.amud');
  var ch = firstAmud ? firstAmud.offsetHeight : canvas.offsetHeight;
  var pad = 48;
  var s = Math.min(bw / (cw + pad), bh / (ch + pad));
  z.scale = s;
  z.tx = (bw - cw * s) / 2;
  z.ty = 24;
  applyZoom();
}

function fitWidth() {
  var s = book.clientWidth / canvas.offsetWidth;
  canvas.style.zoom = s;
  canvas.style.transform = 'none';
}

if (!isEmbed) {
  book.addEventListener('wheel', function(e) {
    e.preventDefault();
    var factor = e.deltaY < 0 ? 1.12 : 1/1.12;
    var rect = book.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
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
    z.tx = e.clientX - drag.sx; z.ty = e.clientY - drag.sy;
    applyZoom();
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

  book.addEventListener('touchend', function() {
    drag.on = false; pinch.active = false;
  });
}

if (isEmbed) {
  window.addEventListener('resize', fitWidth);
}

/* ── Navigate to parasha (find the parasha that contains this page) ──── */
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

/* ── Hash / message navigation ──────────────────────────────────────── */
function stripDiacritics(s) { return String(s).replace(/[֑-ׇ]/g, ''); }
function findParasha(name) {
  var n = stripDiacritics(name);
  return PARASHA_INDEX.find(function(p) { return stripDiacritics(p.name) === n; });
}

var pendingNav = null;   /* navigation requested before data loaded */

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
  if (e.data && e.data.scrollToParasha) {
    var entry = findParasha(e.data.scrollToParasha);
    if (entry) {
      if (!PAGES.length) { pendingNav = 'parasha=' + e.data.scrollToParasha; return; }
      renderParasha(entry.page);
    }
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

  /* Apply Haazinu patch */
  Object.keys(patch).forEach(function(pi) {
    if (!PAGES[pi]) return;
    Object.keys(patch[pi]).forEach(function(li) {
      PAGES[pi][li] = patch[pi][li];
    });
  });

  /* Populate parasha select */
  PARASHA_INDEX.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.page; opt.textContent = p.name;
    parashaSelect.appendChild(opt);
  });

  /* Handle any pending navigation from hash/message */
  var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (pendingNav) {
    handleNav(pendingNav);
    pendingNav = null;
  } else if (hash) {
    handleHash();
  } else {
    /* Default: show first parasha */
    var firstPage = PARASHA_INDEX.length ? PARASHA_INDEX[0].page : 1;
    parashaSelect.value = firstPage;
    renderParasha(firstPage);
  }
}).catch(function() {
  showError();
});
