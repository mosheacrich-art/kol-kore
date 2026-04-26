import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Maps our parasha IDs → Hebrew names as they appear in word-index.json
const ID_TO_HEB = {
  'bereshit':          'בראשית',
  'noach':             'נח',
  'lech-lecha':        'לך לך',
  'vayera':            'וירא',
  'chayei-sarah':      'חיי שרה',
  'toldot':            'תולדות',
  'vayetzei':          'ויצא',
  'vayishlach':        'וישלח',
  'vayeshev':          'וישב',
  'miketz':            'מקץ',
  'vayigash':          'ויגש',
  'vayechi':           'ויחי',
  'shemot':            'שמות',
  'vaera':             'וארא',
  'bo':                'בא',
  'beshalach':         'בשלח',
  'yitro':             'יתרו',
  'mishpatim':         'משפטים',
  'terumah':           'תרומה',
  'tetzaveh':          'תצוה',
  'ki-tisa':           'כי תשא',
  'vayakhel':          'ויקהל',
  'pekudei':           'פקודי',
  'vayikra':           'ויקרא',
  'tzav':              'צו',
  'shemini':           'שמיני',
  'tazria':            'תזריע',
  'metzora':           'מצרע',
  'achrei-mot':        'אחרי מות',
  'kedoshim':          'קדשים',
  'emor':              'אמר',
  'behar':             'בהר',
  'bechukotai':        'בחקתי',
  'bamidbar':          'במדבר',
  'nasso':             'נשא',
  'behaalotecha':      'בהעלתך',
  'shelach':           'שלח',
  'korach':            'קרח',
  'chukat':            'חקת',
  'balak':             'בלק',
  'pinchas':           'פינחס',
  'matot':             'מטות',
  'masei':             'מסעי',
  'devarim':           'דברים',
  'vaetchanan':        'ואתחנן',
  'ekev':              'עקב',
  'reeh':              'ראה',
  'shoftim':           'שפטים',
  'ki-tetzei':         'כי תצא',
  'ki-tavo':           'כי תבוא',
  'nitzavim':          'נצבים',
  'vayeilech':         'וילך',
  'haazinu':           'האזינו',
  'vezot-haberakhah':  'וזאת הברכה',
}

const tikkunPath = 'C:/Users/moshe/Documents/New project 2/data/word-index.json'
console.log('Reading word-index.json…')
const data = JSON.parse(readFileSync(tikkunPath, 'utf8'))

// Group by Hebrew parasha name
const byName = {}
for (const w of data.words) {
  if (!byName[w.parasha]) byName[w.parasha] = []
  // Keep only what TikkunView needs — keeps files small
  byName[w.parasha].push({ id: w.id, t: w.tikkun, p: w.plain, c: w.chapter, v: w.verse })
}

const outDir = join(__dir, '../public/tikkun-words')
mkdirSync(outDir, { recursive: true })

let written = 0, missing = 0
for (const [id, heb] of Object.entries(ID_TO_HEB)) {
  const words = byName[heb]
  if (!words) {
    console.warn(`  MISSING: ${id} → "${heb}"`)
    missing++
    continue
  }
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(words))
  console.log(`  ✓ ${id.padEnd(22)} ${String(words.length).padStart(4)} palabras`)
  written++
}

console.log(`\n✓ ${written} parashiot escritas${missing ? `  ✗ ${missing} sin datos` : ''}`)
console.log(`  → public/tikkun-words/`)
