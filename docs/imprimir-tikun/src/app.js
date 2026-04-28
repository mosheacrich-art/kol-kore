/* Tikkun Korim — zoom/pan viewer + tikkun.io rendering (MIT license) */

const PAGES = window.TIKKUN_PAGES || [];
const PARASHA_INDEX = window.PARASHA_INDEX || [];
const book = document.getElementById('book');
const printBtn = document.getElementById('printBtn');
const parashaSelect = document.getElementById('parashaSelect');

const NUN_HAFUCHA = '׆';

/* ── Text filters (exact copy of tikkun.io text-filter.ts) ─────────── */
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

/* ── Render helpers ─────────────────────────────────────────────────── */
function renderCell(frags, annotated, isPetucha) {
  var petucha = isPetucha ? ' mod-petucha' : '';
  if (!frags.length)
    return '<td class="tikkun-cell"><div class="line empty-line"></div></td>';
  var setuma = frags.length > 1 ? ' mod-setuma' : '';
  var html = frags.map(function(f) {
    var inner = annotated ? annotate(ketiv(f)) : escapeHtml(kri(f));
    return '<span class="fragment' + setuma + '">' + inner + '</span>';
  }).join('');
  return '<td class="tikkun-cell"><div class="line' + petucha + '"><div class="column">' + html + '</div></div></td>';
}

function renderAmud(lines, pageNum) {
  var rows = lines.map(function(line) {
    var f = line.f || (line.t ? [line.t] : []);
    return '<tr>' + renderCell(f, true, line.p) + renderCell(f, false, line.p) + '</tr>';
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

/* ── Render into canvas ─────────────────────────────────────────────── */
var canvas = document.createElement('div');
canvas.id = 'book-canvas';
book.appendChild(canvas);

if (!PAGES.length) {
  canvas.innerHTML = '<div class="err">לא נמצא קובץ הנתונים.</div>';
} else {
  canvas.innerHTML = PAGES.map(function(lines, i) { return renderAmud(lines, i+1); }).join('');
}

/* ── Parasha select ─────────────────────────────────────────────────── */
PARASHA_INDEX.forEach(function(p) {
  var opt = document.createElement('option');
  opt.value = p.page; opt.textContent = p.name;
  parashaSelect.appendChild(opt);
});

/* ── Zoom / Pan state ───────────────────────────────────────────────── */
var z = { scale: 1, tx: 0, ty: 0 };

function applyZoom() {
  canvas.style.transform =
    'translate(' + z.tx + 'px,' + z.ty + 'px) scale(' + z.scale + ')';
}

/* Fit the first amud fully in the viewport on load */
function fitToScreen() {
  var bw = book.clientWidth;
  var bh = book.clientHeight;
  var cw = canvas.offsetWidth;   /* natural canvas width (1280px) */
  var firstAmud = canvas.querySelector('.amud');
  var ch = firstAmud ? firstAmud.offsetHeight : canvas.offsetHeight;
  var pad = 48;
  var s = Math.min(bw / (cw + pad), bh / (ch + pad));
  z.scale = s;
  z.tx = (bw - cw * s) / 2;
  z.ty = 24;
  applyZoom();
}

/* Run after two frames (fonts + layout settled) */
requestAnimationFrame(function() { requestAnimationFrame(fitToScreen); });

/* ── Wheel zoom (toward cursor) ─────────────────────────────────────── */
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

/* ── Drag to pan ────────────────────────────────────────────────────── */
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

/* ── Touch: pinch-zoom + single-finger pan ──────────────────────────── */
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

/* ── Navigate to page ───────────────────────────────────────────────── */
function scrollToPage(pageNum) {
  var el = canvas.querySelector('[data-page="' + pageNum + '"]');
  if (!el) return;
  /* Convert element's screen y to canvas-natural y, then set ty to put it at top */
  var bRect = book.getBoundingClientRect();
  var eRect = el.getBoundingClientRect();
  var naturalY = (eRect.top - bRect.top - z.ty) / z.scale;
  z.ty = -naturalY * z.scale + 24;
  applyZoom();
}

parashaSelect.addEventListener('change', function() {
  var v = parseInt(parashaSelect.value);
  if (v) scrollToPage(v);
});

/* Reset transform for print, restore after */
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

/* ── Hash navigation ────────────────────────────────────────────────── */
function stripDiacritics(s) { return String(s).replace(/[֑-ׇ]/g, ''); }
function findParasha(name) {
  var n = stripDiacritics(name);
  return PARASHA_INDEX.find(function(p) { return stripDiacritics(p.name) === n; });
}
function handleHash() {
  var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!hash) return;
  if (hash.indexOf('page=') === 0) scrollToPage(parseInt(hash.slice(5)));
  else if (hash.indexOf('parasha=') === 0) {
    var e = findParasha(hash.slice(8));
    if (e) scrollToPage(e.page);
  }
}
requestAnimationFrame(function() { requestAnimationFrame(handleHash); });
window.addEventListener('hashchange', handleHash);
window.addEventListener('message', function(e) {
  if (e.data && e.data.scrollToParasha) {
    var entry = findParasha(e.data.scrollToParasha);
    if (entry) scrollToPage(entry.page);
  }
});
