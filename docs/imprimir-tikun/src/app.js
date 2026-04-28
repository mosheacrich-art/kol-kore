/* Tikkun Korim — rendering exacto basado en tikkun.io (MIT license) */

const PAGES = window.TIKKUN_PAGES || [];
const PARASHA_INDEX = window.PARASHA_INDEX || [];
const book = document.getElementById('book');
const printBtn = document.getElementById('printBtn');
const parashaSelect = document.getElementById('parashaSelect');

const NUN_HAFUCHA = '׶'; // ׆

/* --- textFilter equivalente al de tikkun.io --- */
function ketiv(text) {
  return text
    .replace('#(פ)', '')
    .replace(`(${NUN_HAFUCHA})#`, `${NUN_HAFUCHA} `)
    .replace(`#(${NUN_HAFUCHA})`, ` ${NUN_HAFUCHA}`)
    .split(' ')
    .map(maqafWord =>
      maqafWord.split('־').map(word => {
        const parts = word.split('#');
        if (parts.length <= 1) return parts[0];
        return parts.slice(1).join('');
      }).join('־')
    )
    .join(' ')
    .replace(/\[/g, '{').replace(/\]/g, '}');
}

function kri(text) {
  return text
    .replace('#(פ)', '')
    .replace(`(${NUN_HAFUCHA})#`, `${NUN_HAFUCHA} `)
    .replace(`#(${NUN_HAFUCHA})`, ` ${NUN_HAFUCHA}`)
    .replace(/־/g, ' ')
    .replace(/#\[.+?\]/g, ' ')
    .replace(new RegExp(`[^א-ת\\s${NUN_HAFUCHA}]`, 'g'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* --- Render a single line cell (annotated or plain) --- */
function renderCell(rawText, annotated, isPetucha) {
  const text = annotated ? ketiv(rawText) : kri(rawText);
  const petucha = isPetucha ? ' mod-petucha' : '';
  const isSetuma = rawText.includes('#(ס)') || false;
  const setuma = isSetuma ? ' mod-setuma' : '';
  return `<td>` +
    `<div class="line${petucha}"><div class="column"><span class="fragment${setuma}">${escape(text)}</span></div></div>` +
    `</td>`;
}

/* --- Render one amud (42 lines) as a two-column table --- */
function renderAmud(lines, pageNum) {
  const rows = lines.map(line =>
    `<tr>${renderCell(line.t, true, line.p)}${renderCell(line.t, false, line.p)}</tr>`
  ).join('');

  return `<section class="amud no-break" data-page="${pageNum}">` +
    `<div class="amud-header no-print-hide">` +
      `<span class="col-label">תִּקּוּן</span>` +
      `<span class="amud-num">${pageNum}</span>` +
      `<span class="col-label">סֵפֶר תּוֹרָה</span>` +
    `</div>` +
    `<table class="tikkun-table" dir="rtl"><tbody>${rows}</tbody></table>` +
    `</section>`;
}

function render() {
  if (!PAGES.length) {
    book.innerHTML = '<div class="err">לא נמצא קובץ הנתונים.</div>';
    return;
  }
  book.innerHTML = PAGES.map((lines, i) => renderAmud(lines, i + 1)).join('');
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

function plain(s) { return String(s).replace(/[֑-ׇ]/g, ''); }
function findParasha(name) {
  const needle = plain(name);
  return PARASHA_INDEX.find(p => plain(p.name) === needle);
}

function handleHash() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (!hash) return;
  if (hash.startsWith('page=')) scrollToPage(parseInt(hash.slice(5)));
  else if (hash.startsWith('parasha=')) {
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
