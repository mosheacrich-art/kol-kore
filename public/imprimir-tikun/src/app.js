const DATA = window.TIKKUN_TORAH_DATA;
const COLUMN_LAYOUT = window.TIKKUN_COLUMN_LAYOUT;
const WORD_INDEX = window.TIKKUN_WORD_INDEX;
const book = document.querySelector("#book");
const printButton = document.querySelector("#printButton");
const LINES_PER_AMUD = 42;
const TORAH_LINE_LIMIT = 45;

const bookNames = new Map((DATA?.books || []).map((item) => [item.en, item.he]));
const htmlDecoder = document.createElement("div");
const columnWordRanges = new Map();

if (WORD_INDEX?.words?.length) {
  WORD_INDEX.words.forEach((word) => {
    if (!word.column) return;
    const current = columnWordRanges.get(word.column) || { start: word.id, end: word.id, count: 0 };
    current.start = Math.min(current.start, word.id);
    current.end = Math.max(current.end, word.id);
    current.count += 1;
    columnWordRanges.set(word.column, current);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanTikkunSource(value) {
  return String(value)
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, "")
    .replace(/<i[^>]*>[\s\S]*?<\/i>/g, "")
    .replace(/<span class="mam-spi-pe">\{פ\}<\/span>/g, "")
    .replace(/<span class="mam-spi-samekh">\{ס\}<\/span>/g, "")
    .replace(/<br\s*\/?>/g, " ");
}

function htmlToText(value) {
  htmlDecoder.innerHTML = cleanTikkunSource(value);
  return htmlDecoder.textContent
    .replace(/[\u05C3]/g, "")
    .replace(/[\u05BE]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visualLength(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

function parashaBreak(value) {
  if (String(value).includes('class="mam-spi-pe"')) return "petucha";
  if (String(value).includes('class="mam-spi-samekh"')) return "setuma";
  return "";
}

function hebrewRef(verse) {
  const name = bookNames.get(verse.book) || verse.book;
  return `${name} ${verse.chapter}:${verse.verse}`;
}

function words(value) {
  return String(value).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function pairWords(verse) {
  const torahWords = words(verse.torah);
  const tikkunWords = words(htmlToText(verse.tikkun));

  if (torahWords.length === tikkunWords.length) {
    return torahWords.map((torah, index) => ({
      torah,
      tikkun: tikkunWords[index],
      ref: verse.ref,
      displayRef: hebrewRef(verse),
      parasha: verse.parasha,
    }));
  }

  return torahWords.map((torah, index) => {
    const start = Math.floor((index * tikkunWords.length) / torahWords.length);
    const end = Math.floor(((index + 1) * tikkunWords.length) / torahWords.length);
    const tikkun = tikkunWords.slice(start, Math.max(start + 1, end)).join(" ");
    return {
      torah,
      tikkun: tikkun || torah,
      ref: verse.ref,
      displayRef: hebrewRef(verse),
      parasha: verse.parasha,
    };
  });
}

function pushLine(lines, current) {
  lines.push({
    torah: current.torah.join(" "),
    tikkun: current.tikkun.join(" "),
    firstRef: current.firstRef,
    lastRef: current.lastRef,
    firstDisplayRef: current.firstDisplayRef,
    lastDisplayRef: current.lastDisplayRef,
    parasha: current.parasha,
    blank: current.torah.length === 0,
  });
}

function buildAmudLines(verses) {
  const lines = [];
  let current = {
    torah: [],
    tikkun: [],
    firstRef: "",
    lastRef: "",
    firstDisplayRef: "",
    lastDisplayRef: "",
    parasha: "",
  };

  verses.forEach((verse) => {
    pairWords(verse).forEach((token) => {
      const nextTorah = [...current.torah, token.torah].join(" ");
      if (current.torah.length > 0 && visualLength(nextTorah) > TORAH_LINE_LIMIT) {
        pushLine(lines, current);
        current = { torah: [], tikkun: [], firstRef: "", lastRef: "", firstDisplayRef: "", lastDisplayRef: "", parasha: "" };
      }

      current.torah.push(token.torah);
      current.tikkun.push(token.tikkun);
      current.firstRef ||= token.ref;
      current.lastRef = token.ref;
      current.firstDisplayRef ||= token.displayRef;
      current.lastDisplayRef = token.displayRef;
      current.parasha ||= token.parasha;
    });

    const breakType = parashaBreak(verse.tikkun);

    if (breakType === "setuma") {
      current.torah.push("       ");
      current.tikkun.push("       ");
    }

    if (breakType === "petucha") {
      if (current.torah.length > 0) pushLine(lines, current);
      const displayRef = hebrewRef(verse);
      lines.push({ torah: "", tikkun: "", firstRef: verse.ref, lastRef: verse.ref, firstDisplayRef: displayRef, lastDisplayRef: displayRef, parasha: verse.parasha, blank: true });
      current = { torah: [], tikkun: [], firstRef: "", lastRef: "", firstDisplayRef: "", lastDisplayRef: "", parasha: "" };
    }
  });

  if (current.torah.length > 0) pushLine(lines, current);
  return lines;
}

function paginate(lines) {
  const pages = [];
  for (let index = 0; index < lines.length; index += LINES_PER_AMUD) {
    pages.push(lines.slice(index, index + LINES_PER_AMUD));
  }
  return pages;
}

function parashaPageMap(pages) {
  const map = new Map();
  pages.forEach((page, index) => {
    const name = firstRealLine(page)?.parasha;
    if (name && !map.has(name)) map.set(name, index + 3);
  });
  return map;
}

function coverPage() {
  return `
    <section class="book-page cover-page">
      <div class="cover-frame">
        <div class="cover-kicker">חמשה חומשי תורה</div>
        <h1>תיקון קוראים</h1>
        <div class="cover-subtitle">לפי חלוקת 245 עמודים / 42 שורות</div>
      </div>
    </section>
  `;
}

function tocPage(pages) {
  const pageByParasha = parashaPageMap(pages);
  const items = DATA.parashot.map((parasha) => `
    <div class="toc-row">
      <span>${escapeHtml(parasha.name)}</span>
      <span>${pageByParasha.get(parasha.name) || ""}</span>
    </div>
  `).join("");

  return `
    <section class="book-page toc-page">
      <h2>מפתח פרשיות</h2>
      <div class="toc-grid">${items}</div>
    </section>
  `;
}

function exactColumnToc(columns) {
  const groups = new Map();

  columns.forEach((column) => {
    column.parashot.forEach((label) => {
      const name = label.replace(/^פָּרָשָׁה:\s*/, "");
      if (!groups.has(name)) groups.set(name, column.page);
    });
  });

  const items = [...groups.entries()].map(([name, page]) => `
    <div class="toc-row">
      <span>${escapeHtml(name)}</span>
      <span>${page}</span>
    </div>
  `).join("");

  return `
    <section class="book-page toc-page">
      <h2>מפתח פרשיות</h2>
      <div class="toc-grid">${items}</div>
    </section>
  `;
}

function exactColumnPage(column) {
  const sefer = column.sefer.replace(/^סֵפֶר:\s*/, "");
  const parasha = column.parashot.map((item) => item.replace(/^פָּרָשָׁה:\s*/, "")).join(" / ");
  const range = columnWordRanges.get(column.column) || { start: "", end: "", count: "" };

  return `
    <section class="book-page exact-column-page"
      data-column="${column.column}"
      data-word-start="${range.start}"
      data-word-end="${range.end}"
      data-word-count="${range.count}">
      <header class="page-head">
        <span>${escapeHtml(sefer)}</span>
        <span>${escapeHtml(parasha)}</span>
        <span>עמוד ${column.column}</span>
      </header>
      <figure class="column-image-frame">
        <img src="${escapeHtml(column.image)}" alt="Sefer Torah column ${column.column} of 245" />
      </figure>
      <footer class="page-foot">${column.page}</footer>
    </section>
  `;
}

function renderExactColumns() {
  const columns = COLUMN_LAYOUT?.columns || [];
  if (!columns.length) return false;

  book.innerHTML = [
    coverPage(),
    exactColumnToc(columns),
    ...columns.map(exactColumnPage),
  ].join("");

  return true;
}

function firstRealLine(lines) {
  return lines.find((line) => !line.blank) || lines[0];
}

function lastRealLine(lines) {
  return [...lines].reverse().find((line) => !line.blank) || lines.at(-1);
}

function lineMarkup(line) {
  const className = line.blank ? "amud-line blank-line" : "amud-line";
  return `
    <div class="${className}">
      <span class="line-tikkun">${escapeHtml(line.tikkun)}</span>
      <span class="line-torah">${escapeHtml(line.torah)}</span>
    </div>
  `;
}

function contentPage(pageLines, index) {
  const first = firstRealLine(pageLines);
  const last = lastRealLine(pageLines);
  const padded = [...pageLines];
  while (padded.length < LINES_PER_AMUD) {
    padded.push({ torah: "", tikkun: "", blank: true });
  }

  return `
    <section class="book-page content-page">
      <header class="page-head">
        <span>${escapeHtml(first.parasha)}</span>
        <span>${escapeHtml(first.firstDisplayRef)} - ${escapeHtml(last.lastDisplayRef)}</span>
      </header>
      <div class="amud">
        <div class="column-labels">
          <span>תיקון</span>
          <span>ספר תורה</span>
        </div>
        ${padded.map(lineMarkup).join("")}
      </div>
      <footer class="page-foot">${index + 3}</footer>
    </section>
  `;
}

function renderBook() {
  if (renderExactColumns()) return;

  if (!DATA?.verses?.length) {
    book.innerHTML = '<section class="loading">לא נמצא קובץ הטקסט.</section>';
    return;
  }

  const lines = buildAmudLines(DATA.verses);
  const pages = paginate(lines);
  book.innerHTML = [
    coverPage(),
    tocPage(pages),
    ...pages.map(contentPage),
  ].join("");
}

window.TikkunAPI = {
  words: WORD_INDEX?.words || [],
  columns: COLUMN_LAYOUT?.columns || [],
  stats: WORD_INDEX?.stats || {},
  getWord(id) {
    return this.words.find((word) => word.id === Number(id)) || null;
  },
  getColumnWords(column) {
    return this.words.filter((word) => word.column === Number(column));
  },
  getColumnRange(column) {
    return columnWordRanges.get(Number(column)) || null;
  },
  getParashaWords(parasha) {
    return this.words.filter((word) => word.parasha === parasha);
  },
  getRefWords(ref) {
    return this.words.filter((word) => word.ref === ref);
  },
  searchPlain(query) {
    const needle = String(query).trim();
    if (!needle) return [];
    return this.words.filter((word) => word.plain.includes(needle));
  },
};

printButton.addEventListener("click", () => window.print());
renderBook();

/* ── Parasha navigation (added for perasha-app embed) ──────────────── */
function stripNikud(s) {
  return String(s).replace(/[\u0591-\u05C7]/g, '')
}

function scrollToParasha(hebName) {
  if (!hebName) return
  const plain = stripNikud(hebName)
  // Look in exact-column-page headers
  const pages = [...book.querySelectorAll('.exact-column-page')]
  const target = pages.find(page => {
    const head = page.querySelector('.page-head')
    return head && stripNikud(head.textContent).includes(plain)
  })
  // Fallback: toc-page or content-page
  if (target) {
    target.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
}

function handleHashNav() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ''))
  if (!raw) return
  if (raw.startsWith('column=')) {
    const col = parseInt(raw.slice('column='.length))
    const el = book.querySelector('[data-column="' + col + '"]')
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  } else if (raw.startsWith('parasha=')) {
    scrollToParasha(raw.slice('parasha='.length))
  } else {
    scrollToParasha(raw)
  }
}

// Wait for renderBook to finish, then handle hash
requestAnimationFrame(() => requestAnimationFrame(handleHashNav))
window.addEventListener('hashchange', handleHashNav)

// postMessage from parent (perasha-app selector)
window.addEventListener('message', (e) => {
  if (e.data && e.data.scrollToParasha) scrollToParasha(e.data.scrollToParasha)
})
