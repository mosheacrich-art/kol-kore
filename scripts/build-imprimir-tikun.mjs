/**
 * Builds public/imprimir-tikun/ from New project 2.
 * Images stay on ahavativrit.com — no local copies needed.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const SRC   = 'C:/Users/moshe/Documents/New project 2'
const OUT   = join(__dir, '../public/imprimir-tikun')

mkdirSync(join(OUT, 'src'),  { recursive: true })
mkdirSync(join(OUT, 'data'), { recursive: true })

// ── 1. column-layout.js — replace local image paths with remote URLs ──
const layout = readFileSync(`${SRC}/data/column-layout.js`, 'utf8')
writeFileSync(
  join(OUT, 'data/column-layout.js'),
  layout.replace(/"data\/columns\//g, '"http://www.ahavativrit.com/images/')
)
console.log('✓ column-layout.js  (remote image URLs)')

// ── 2. torah-data.js — straight copy ─────────────────────────────────
copyFileSync(`${SRC}/data/torah-data.js`, join(OUT, 'data/torah-data.js'))
console.log('✓ torah-data.js')

// ── 3. styles.css — straight copy ────────────────────────────────────
copyFileSync(`${SRC}/src/styles.css`, join(OUT, 'src/styles.css'))
console.log('✓ styles.css')

// ── 4. app.js — copy + append parasha-jump support ───────────────────
const appJs = readFileSync(`${SRC}/src/app.js`, 'utf8')
const nav = `
/* ── Parasha navigation (added for perasha-app embed) ──────────────── */
function stripNikud(s) {
  return String(s).replace(/[\\u0591-\\u05C7]/g, '')
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
`
writeFileSync(join(OUT, 'src/app.js'), appJs + nav)
console.log('✓ app.js  (+ parasha navigation)')

// ── 5. index.html — no word-index (not needed for printing) ──────────
const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>תיקון קוראים</title>
    <link rel="stylesheet" href="src/styles.css" />
  </head>
  <body>
    <header class="book-toolbar">
      <div class="toolbar-title">תיקון קוראים</div>
      <button id="printButton" type="button">PDF / הדפסה</button>
    </header>
    <main id="book" class="book" aria-label="תיקון קוראים מלא">
      <section class="loading">טוען את הספר...</section>
    </main>
    <script src="data/torah-data.js"><\\/script>
    <script src="data/column-layout.js"><\\/script>
    <script src="src/app.js"><\\/script>
  </body>
</html>
`
writeFileSync(join(OUT, 'index.html'), html.replace(/\\\//g, '/'))
console.log('✓ index.html')

console.log('\n✓ Done → public/imprimir-tikun/')
