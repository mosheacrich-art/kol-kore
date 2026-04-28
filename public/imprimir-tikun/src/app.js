/* Tikkun Korim — two-column renderer using tikkun.io page data */

const PAGES = window.TIKKUN_PAGES || [];
const PARASHA_INDEX = window.PARASHA_INDEX || [];
const book = document.getElementById('book');
const printBtn = document.getElementById('printBtn');
const parashaSelect = document.getElementById('parashaSelect');

// Strip nikkud + taamim (U+0591–U+05C7) for plain Torah scroll text
function stripDiacritics(s) {
  return s.replace(/[֑-ׇ]/g, '');
}

// Strip the #(פ) paragraph marker from display text
function cleanText(s) {
  return s.replace(/#\(פ\)/g, '').replace(/#\(ס\)/g, '').trim();
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildLine(line) {
  const annotated = cleanText(line.t);
  const plain = stripDiacritics(annotated);
  const isPetucha = line.p;
  const isSetuma = line.s;
  const cls = isPetucha ? 'tl petucha' : isSetuma ? 'tl setuma' : 'tl';
  // Each row: right=tikkun (nikkud), left=sefer (plain)
  return `<div class="${cls}">` +
    `<span class="tc">${escape(annotated)}</span>` +
    `<span class="ts">${escape(plain)}</span>` +
    `</div>`;
}

function buildPage(lines, pageNum) {
  const linesHtml = lines.map(buildLine).join('');
  return `<section class="amud" data-page="${pageNum}">` +
    `<div class="amud-header">` +
      `<span class="col-label">תִּקּוּן</span>` +
      `<span class="amud-num">${pageNum}</span>` +
      `<span class="col-label">סֵפֶר</span>` +
    `</div>` +
    `<div class="amud-body">${linesHtml}</div>` +
    `</section>`;
}

function render() {
  if (!PAGES.length) {
    book.innerHTML = '<div class="err">לא נמצא קובץ הנתונים.</div>';
    return;
  }
  const html = PAGES.map((lines, i) => buildPage(lines, i + 1)).join('');
  book.innerHTML = html;
}

function populateSelect() {
  PARASHA_INDEX.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.page;
    opt.textContent = p.name;
    parashaSelect.appendChild(opt);
  });
}

function scrollToPage(pageNum) {
  const el = book.querySelector(`[data-page="${pageNum}"]`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

parashaSelect.addEventListener('change', () => {
  const v = parseInt(parashaSelect.value);
  if (v) scrollToPage(v);
});

printBtn.addEventListener('click', () => window.print());

render();
populateSelect();

function plain(s) {
  return String(s).replace(/[֑-ׇ]/g, '');
}

function findParasha(name) {
  const needle = plain(name);
  return PARASHA_INDEX.find(p => plain(p.name) === needle);
}

// Handle URL hash navigation: #parasha=בראשית or #page=5
function handleHash() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!hash) return;
  if (hash.startsWith('page=')) {
    scrollToPage(parseInt(hash.slice(5)));
  } else if (hash.startsWith('parasha=')) {
    const entry = findParasha(hash.slice(8));
    if (entry) scrollToPage(entry.page);
  }
}
requestAnimationFrame(() => requestAnimationFrame(handleHash));
window.addEventListener('hashchange', handleHash);
window.addEventListener('message', e => {
  if (e.data?.scrollToParasha) {
    const entry = findParasha(e.data.scrollToParasha);
    if (entry) scrollToPage(entry.page);
  }
});
