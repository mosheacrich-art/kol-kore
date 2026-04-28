/* Tikkun Korim — rendering exacto basado en tikkun.io (MIT license) */

const PAGES = window.TIKKUN_PAGES || [];
const PARASHA_INDEX = window.PARASHA_INDEX || [];
const book = document.getElementById('book');
const printBtn = document.getElementById('printBtn');
const parashaSelect = document.getElementById('parashaSelect');

const NUN_HAFUCHA = '׆'; // ׆

/* --- textFilter: fiel copia de tikkun.io text-filter.ts --- */
function ketiv(text) {
  return text
    .replace('#(פ)', '')
    .replace('(' + NUN_HAFUCHA + ')#', NUN_HAFUCHA + ' ')
    .replace('#(' + NUN_HAFUCHA + ')', ' ' + NUN_HAFUCHA)
    .split(' ')
    .map(function(maqafWord) {
      return maqafWord.split('־').map(function(word) {
        var parts = word.split('#');
        if (parts.length <= 1) return parts[0];
        return parts.slice(1).join('');
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Renders annotated text, turning {kri} markers into styled spans */
function renderAnnotatedHtml(text) {
  return text.split(/(\{[^}]*\})/).map(function(part) {
    if (part.charAt(0) === '{' && part.charAt(part.length - 1) === '}') {
      return '<span class="ktiv-kri">' + escapeHtml(part.slice(1, -1)) + '</span>';
    }
    return escapeHtml(part);
  }).join('');
}

/* --- Render one cell (all fragments, annotated or plain) --- */
function renderCell(frags, annotated, isPetucha) {
  var petucha = isPetucha ? ' mod-petucha' : '';
  var fragHtml = frags.map(function(rawFrag) {
    var isSetuma = rawFrag.indexOf('#(ס)') !== -1;
    var setuma = isSetuma ? ' mod-setuma' : '';
    var inner;
    if (annotated) {
      inner = renderAnnotatedHtml(ketiv(rawFrag));
    } else {
      inner = escapeHtml(kri(rawFrag));
    }
    return '<span class="fragment' + setuma + '">' + inner + '</span>';
  }).join('');

  return '<td>' +
    '<div class="line' + petucha + '">' +
      '<div class="column">' + fragHtml + '</div>' +
    '</div>' +
    '</td>';
}

/* --- Render one amud (42 lines) as a two-column table --- */
function renderAmud(lines, pageNum) {
  var rows = lines.map(function(line) {
    var frags = line.f || [line.t || ''];
    return '<tr>' + renderCell(frags, true, line.p) + renderCell(frags, false, line.p) + '</tr>';
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

function render() {
  if (!PAGES.length) {
    book.innerHTML = '<div class="err">לא נמצא קובץ הנתונים.</div>';
    return;
  }
  book.innerHTML = PAGES.map(function(lines, i) {
    return renderAmud(lines, i + 1);
  }).join('');
}

function populateSelect() {
  PARASHA_INDEX.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.page;
    opt.textContent = p.name;
    parashaSelect.appendChild(opt);
  });
}

function scrollToPage(pageNum) {
  var el = book.querySelector('[data-page="' + pageNum + '"]');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

parashaSelect.addEventListener('change', function() {
  var v = parseInt(parashaSelect.value);
  if (v) scrollToPage(v);
});

printBtn.addEventListener('click', function() { window.print(); });

render();
populateSelect();

function stripDiacritics(s) { return String(s).replace(/[֑-ׇ]/g, ''); }
function findParasha(name) {
  var needle = stripDiacritics(name);
  return PARASHA_INDEX.find(function(p) { return stripDiacritics(p.name) === needle; });
}

function handleHash() {
  var hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!hash) return;
  if (hash.indexOf('page=') === 0) scrollToPage(parseInt(hash.slice(5)));
  else if (hash.indexOf('parasha=') === 0) {
    var entry = findParasha(hash.slice(8));
    if (entry) scrollToPage(entry.page);
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
