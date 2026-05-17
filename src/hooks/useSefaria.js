import { useState, useEffect, useRef } from 'react'
import { flattenVerses, stripHtml } from '../utils/hebrew'

// ── Text fetching ─────────────────────────────────────────────────────────

const cache = new Map()

// Process raw Sefaria `he` array into clean prayer-only text
function processVerses(raw) {
  return flattenVerses(raw)
    .map(v =>
      // 1. Strip <small>…</small> blocks entirely (Sefaria annotations/rubrics)
      stripHtml(v.replace(/<small[^>]*>[\s\S]*?<\/small>/gi, ''))
    )
    .map(v =>
      // 2. Remove inline parenthetical/bracketed content that has no nikkud
      v
        .replace(/\([^)]*\)/g, m => /[ְ-ׇ]/.test(m) ? m : '')
        .replace(/\[[^\]]*\]/g, m => /[ְ-ׇ]/.test(m) ? m : '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    // 3. Drop any paragraph still lacking nikkud (remaining rubrics / empty strings)
    .filter(v => v && /[ְ-ׇ]/.test(v))
}

// Sefaria API: spaces → underscores, commas stay literal
function refToUrl(ref) {
  return `https://www.sefaria.org/api/texts/${ref.replace(/ /g, '_')}?commentary=0&context=0&pad=0&wrapLinks=0&transLangPref=en`
}

async function fetchRef(ref) {
  const url = refToUrl(ref)
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sefaria API error ${res.status}`)
  const data = await res.json()
  cache.set(url, data)
  return data
}

export function useAliyah(ref, enabled = true, heText = null) {
  const [state, setState] = useState({ verses: heText || [], loading: false, error: null })
  const lastRef = useRef(null)

  useEffect(() => {
    if (heText) { setState({ verses: heText, loading: false, error: null }); return }
    if (!ref || !enabled || ref === lastRef.current) return
    lastRef.current = ref
    setState(s => ({ ...s, loading: true, error: null }))
    fetchRef(ref)
      .then(data => {
        const verses = processVerses(data.he || [])
        setState({ verses, loading: false, error: null })
      })
      .catch(err => setState({ verses: [], loading: false, error: err.message }))
  }, [ref, enabled, heText])

  return state
}

export function useAliyahText(ref, enabled = true, heText = null) {
  const [verses, setVerses] = useState(heText || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (heText) { setVerses(heText); return }
    if (!ref || !enabled) return

    const url = refToUrl(ref)
    if (cache.has(url)) {
      const data = cache.get(url)
      setVerses(processVerses(data.he || []))
      return
    }

    setLoading(true)
    setError(null)
    fetchRef(ref)
      .then(data => {
        setVerses(processVerses(data.he || []))
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [ref, enabled, heText])

  return { verses, loading, error }
}

// ── Siddur index (structure from Sefaria v2 API) ──────────────────────────

const siddurIndexCache = new Map()
const siddurShabbatIndexCache = new Map()
const rawIndexCache = new Map()

async function fetchSiddurRaw(slug) {
  if (rawIndexCache.has(slug)) return rawIndexCache.get(slug)
  const res = await fetch(`https://www.sefaria.org/api/v2/index/${slug}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  rawIndexCache.set(slug, data)
  return data
}

const SERVICE_META = {
  // Ashkenaz — services are children of a "Weekday" wrapper node
  Shacharit: { id: 'shacharit', heb: 'שַׁחֲרִית', color: '#f59e0b', name: 'Shajarit' },
  Minchah:   { id: 'mincha',    heb: 'מִנְחָה',    color: '#8b5cf6', name: 'Minjá'   },
  Mincha:    { id: 'mincha',    heb: 'מִנְחָה',    color: '#8b5cf6', name: 'Minjá'   },
  Maariv:    { id: 'maariv',   heb: 'עַרְבִית',   color: '#1e40af', name: 'Arvit'   },
  // Sefard — combined titles at root level (no "Weekday" wrapper)
  'Weekday Shacharit': { id: 'shacharit', heb: 'שַׁחֲרִית', color: '#f59e0b', name: 'Shajarit' },
  'Weekday Mincha':    { id: 'mincha',    heb: 'מִנְחָה',    color: '#8b5cf6', name: 'Minjá'   },
  'Weekday Maariv':    { id: 'maariv',   heb: 'עַרְבִית',   color: '#1e40af', name: 'Arvit'   },
}

// Collect all leaves under a node; track the immediate child of the service as subGroup
function extractSections(srvNode, pathPrefix, bookName) {
  const sections = []
  if (!srvNode.nodes?.length) return sections

  for (const child of srvNode.nodes) {
    const childPath = [...pathPrefix, child.title]
    if (!child.nodes?.length) {
      // Leaf directly under service (Sefard-style)
      sections.push({ title: child.title, heTitle: child.heTitle || '', ref: [bookName, ...childPath].join(', '), subGroup: '' })
    } else {
      // Subgroup with children (Ashkenaz-style)
      const subGroup = child.title
      collectDeep(child.nodes, childPath, bookName, subGroup, sections)
    }
  }
  return sections
}

function collectDeep(nodes, basePath, bookName, subGroup, results) {
  for (const node of nodes) {
    const nodePath = [...basePath, node.title]
    if (!node.nodes?.length) {
      results.push({ title: node.title, heTitle: node.heTitle || '', ref: [bookName, ...nodePath].join(', '), subGroup })
    } else {
      collectDeep(node.nodes, nodePath, bookName, subGroup, results)
    }
  }
}

function buildService(srvNode, pathPrefix, bookName) {
  const meta = SERVICE_META[srvNode.title]
  const sections = extractSections(srvNode, pathPrefix, bookName)

  const subsections = []
  for (const s of sections) {
    let group = subsections.find(g => g.name === s.subGroup)
    if (!group) { group = { name: s.subGroup, items: [] }; subsections.push(group) }
    group.items.push({ title: s.title, heTitle: s.heTitle, ref: s.ref })
  }

  return { ...meta, total: sections.length, subsections, allSections: sections }
}

// Titles to exclude from all services
const EXCLUDED_SECTIONS = new Set(['Avinu Malkeinu'])

function filterService(srv) {
  const allSections = srv.allSections.filter(s => !EXCLUDED_SECTIONS.has(s.title))
  const subsections = srv.subsections
    .map(sub => ({ ...sub, items: sub.items.filter(i => !EXCLUDED_SECTIONS.has(i.title)) }))
    .filter(sub => sub.items.length > 0)
  return { ...srv, allSections, subsections, total: allSections.length }
}

// Inline Hebrew text for Berajot service (not from Sefaria)
export const BERAJOT_INLINE = {
  'berajot:talit-tefilin': {
    name: 'Talit y Tefilín',
    heTitle: 'טַלִּית וּתְפִלִּין',
    aliyot: [
      {
        n: 1, label: 'בְּהִתְעַטֵּף בְּצִיצִית',
        heText: [
          'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ לְהִתְעַטֵּף בַּצִּיצִת.',
        ],
      },
      {
        n: 2, label: 'לְהָנִיחַ תְּפִלִּין',
        heText: [
          'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ לְהָנִיחַ תְּפִלִּין.',
        ],
      },
      {
        n: 3, label: 'עַל מִצְוַת תְּפִלִּין',
        heText: [
          'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ עַל מִצְוַת תְּפִלִּין.',
          'בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.',
        ],
      },
    ],
  },
  'berajot:birjot-hatora': {
    name: 'Birjot HaTorá',
    heTitle: 'בִּרְכוֹת הַתּוֹרָה',
    aliyot: [
      {
        n: 1, label: 'לִפְנֵי הַקְּרִיאָה',
        heText: [
          'בָּרְכוּ אֶת יְהֹוָה הַמְבֹרָךְ.',
          'בָּרוּךְ יְהֹוָה הַמְבֹרָךְ לְעוֹלָם וָעֶד.',
          'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים, וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה יְהֹוָה, נוֹתֵן הַתּוֹרָה.',
        ],
      },
      {
        n: 2, label: 'לְאַחַר הַקְּרִיאָה',
        heText: [
          'בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן לָנוּ תּוֹרַת אֱמֶת, וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵנוּ. בָּרוּךְ אַתָּה יְהֹוָה, נוֹתֵן הַתּוֹרָה.',
        ],
      },
    ],
  },
}

// Hardcoded Berajot service (prepended before the main services)
function makeBerajotService() {
  const items = [
    { title: 'Talit y Tefilín', heTitle: 'טַלִּית וּתְפִלִּין', ref: 'berajot:talit-tefilin' },
    { title: 'Birjot HaTorá',  heTitle: 'בִּרְכוֹת הַתּוֹרָה',  ref: 'berajot:birjot-hatora' },
  ]
  return {
    id: 'berajot', name: 'Berajot', heb: 'בְּרָכוֹת', color: '#10b981',
    total: 2,
    subsections: [{ name: '', items }],
    allSections: items.map(i => ({ ...i, subGroup: '' })),
  }
}

function parseWeekdayServices(data, bookName) {
  const schema = data.schema
  if (!schema) return []

  const rootNodes = schema.nodes || []
  const nusach = bookName.includes('Sefard') ? 'sefard' : 'ashkenaz'

  let raw = []

  // Strategy 1 (Ashkenaz): explicit "Weekday" wrapper node whose children are the services
  const weekdayNode = rootNodes.find(n => n.title === 'Weekday' || n.title === 'Weekday Prayers')
  if (weekdayNode?.nodes?.length) {
    raw = weekdayNode.nodes
      .filter(n => SERVICE_META[n.title])
      .map(srvNode => buildService(srvNode, ['Weekday', srvNode.title], bookName))
  } else {
    // Strategy 2 (Sefard): combined titles like "Weekday Shacharit" at root level
    const sefardServices = rootNodes.filter(n => SERVICE_META[n.title])
    raw = sefardServices.map(srvNode => buildService(srvNode, [srvNode.title], bookName))
  }

  // Filter unwanted sections and prepend Berajot
  return [makeBerajotService(), ...raw.map(filterService)]
}

const SHABBAT_SERVICE_META = {
  'Kabbalat Shabbat':      { id: 'kabbalat',         heb: 'קַבָּלַת שַׁבָּת',  color: '#6366f1', name: 'Kabalat Shabat',    order: 1 },
  'Maariv for Shabbat':    { id: 'arvit-shabat',     heb: 'עַרְבִית שַׁבָּת',  color: '#1e40af', name: 'Arvit de Shabat',   order: 2 },
  'Shabbat Maariv':        { id: 'arvit-shabat',     heb: 'עַרְבִית שַׁבָּת',  color: '#1e40af', name: 'Arvit de Shabat',   order: 2 },
  'Shacharit for Shabbat': { id: 'shacharit-shabat', heb: 'שַׁחֲרִית שַׁבָּת', color: '#f59e0b', name: 'Shajarit de Shabat', order: 3 },
  'Shabbat Shacharit':     { id: 'shacharit-shabat', heb: 'שַׁחֲרִית שַׁבָּת', color: '#f59e0b', name: 'Shajarit de Shabat', order: 3 },
  'Musaf for Shabbat':     { id: 'musaf-shabat',     heb: 'מוּסָף שַׁבָּת',    color: '#10b981', name: 'Musaf de Shabat',   order: 4 },
  'Shabbat Musaf':         { id: 'musaf-shabat',     heb: 'מוּסָף שַׁבָּת',    color: '#10b981', name: 'Musaf de Shabat',   order: 4 },
  'Mincha for Shabbat':    { id: 'mincha-shabat',    heb: 'מִנְחָה שַׁבָּת',   color: '#8b5cf6', name: 'Minjá de Shabat',   order: 5 },
  'Shabbat Mincha':        { id: 'mincha-shabat',    heb: 'מִנְחָה שַׁבָּת',   color: '#8b5cf6', name: 'Minjá de Shabat',   order: 5 },
  'Minchah for Shabbat':   { id: 'mincha-shabat',    heb: 'מִנְחָה שַׁבָּת',   color: '#8b5cf6', name: 'Minjá de Shabat',   order: 5 },
}

function parseShabbatServices(data, bookName) {
  const schema = data.schema
  if (!schema) return []
  const rootNodes = schema.nodes || []

  let raw = []

  // Strategy 1: explicit "Shabbat" wrapper node (Ashkenaz)
  const shabbatNode = rootNodes.find(n => n.title === 'Shabbat' || n.title === 'Shabbat Prayers')
  if (shabbatNode?.nodes?.length) {
    raw = shabbatNode.nodes
      .filter(n => SHABBAT_SERVICE_META[n.title])
      .map(srvNode => buildService(srvNode, ['Shabbat', srvNode.title], bookName))
  } else {
    // Strategy 2: root-level nodes with Shabbat title (Sefard)
    raw = rootNodes
      .filter(n => SHABBAT_SERVICE_META[n.title])
      .map(srvNode => buildService(srvNode, [srvNode.title], bookName))
  }

  return raw
    .map(filterService)
    .sort((a, b) => (SHABBAT_SERVICE_META[a.name]?.order ?? 99) - (SHABBAT_SERVICE_META[b.name]?.order ?? 99))
}

export function useSiddurIndex(nusach) {
  const [state, setState] = useState({ services: null, loading: false, error: null })

  useEffect(() => {
    if (!nusach) return
    const slug     = nusach === 'ashkenaz' ? 'Siddur_Ashkenaz' : 'Siddur_Sefard'
    const bookName = nusach === 'ashkenaz' ? 'Siddur Ashkenaz' : 'Siddur Sefard'

    if (siddurIndexCache.has(slug)) {
      setState({ services: siddurIndexCache.get(slug), loading: false, error: null })
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    fetchSiddurRaw(slug)
      .then(data => {
        const services = parseWeekdayServices(data, bookName)
        siddurIndexCache.set(slug, services)
        setState({ services, loading: false, error: null })
      })
      .catch(err => setState({ services: null, loading: false, error: err.message }))
  }, [nusach])

  return state
}

export function useSiddurShabbatIndex(nusach) {
  const [state, setState] = useState({ services: null, loading: false, error: null })

  useEffect(() => {
    if (!nusach) return
    const slug     = nusach === 'ashkenaz' ? 'Siddur_Ashkenaz' : 'Siddur_Sefard'
    const bookName = nusach === 'ashkenaz' ? 'Siddur Ashkenaz' : 'Siddur Sefard'
    const cacheKey = `${slug}:shabbat`

    if (siddurShabbatIndexCache.has(cacheKey)) {
      setState({ services: siddurShabbatIndexCache.get(cacheKey), loading: false, error: null })
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    fetchSiddurRaw(slug)
      .then(data => {
        const services = parseShabbatServices(data, bookName)
        siddurShabbatIndexCache.set(cacheKey, services)
        setState({ services, loading: false, error: null })
      })
      .catch(err => setState({ services: null, loading: false, error: err.message }))
  }, [nusach])

  return state
}
