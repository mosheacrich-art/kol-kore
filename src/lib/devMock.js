/*
 * DEV-ONLY in-memory Supabase stand-in.
 *
 * Used exclusively by `vite dev` when VITE_SUPABASE_URL is not configured, so the
 * whole UI can be previewed without credentials. Never bundled in production
 * (the import in lib/supabase.js is gated by import.meta.env.DEV).
 *
 * Switch roles from the console:  localStorage.mockRole = 'student'; location.reload()
 * Sign out simulation:             localStorage.mockSignedOut = '1'; location.reload()
 */

const day = (offset, h = 10, m = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d.toISOString()
}
const isoDate = (offset) => day(offset).slice(0, 10)

const TEACHER = { id: 'u-teacher', role: 'teacher', name: 'Isaac Ayash', teacher_code: 'PKW0AK', email: 'isaac@example.com', created_at: day(-200) }
const STUDENTS = [
  { id: 'u-ben',  role: 'student', name: 'Ben',                teacher_id: 'u-teacher', parasha_id: null,      extra_parasha_ids: null, bar_mitzvah: null,         listens: 4,  progress: 0,  streak: 0, subscription_status: 'active', created_at: day(-90) },
  { id: 'u-maor', role: 'student', name: 'maor michalashvili', teacher_id: 'u-teacher', parasha_id: 'metzora', extra_parasha_ids: null, bar_mitzvah: isoDate(120), listens: 18, progress: 35, streak: 3, subscription_status: 'active', created_at: day(-60) },
  { id: 'u-moshe',role: 'student', name: 'Moshé Acrich',       teacher_id: 'u-teacher', parasha_id: null,      extra_parasha_ids: null, bar_mitzvah: null,         listens: 0,  progress: 0,  streak: 0, subscription_status: 'active', created_at: day(-30) },
]

const db = {
  profiles: [TEACHER, ...STUDENTS],
  homework: [
    { id: 'hw-1', teacher_id: 'u-teacher', student_id: 'u-maor', task: 'Audio de todo 4', subject: null, type: 'parasha', parasha_id: 'metzora', aliyah_idx: 3, word_start: 0, word_end: 299, require_audio: true, due: isoDate(6), status: 'pending', created_at: day(-2) },
    { id: 'hw-2', teacher_id: 'u-teacher', student_id: 'u-ben', task: 'Repasar los taamim de la 1ª aliyá', subject: 'Trop', type: 'parasha', parasha_id: 'bereshit', aliyah_idx: 0, word_start: null, word_end: null, require_audio: false, due: isoDate(-3), status: 'submitted', recording_url: null, created_at: day(-9) },
    { id: 'hw-3', teacher_id: 'u-teacher', student_id: 'u-moshe', task: 'Leer la haftará con nikud', subject: null, type: 'haftara', parasha_id: null, haftara_id: 'haftara-bereshit', aliyah_idx: null, require_audio: false, due: isoDate(-1), status: 'late', created_at: day(-12) },
  ],
  classes: [
    { id: 'c-1', teacher_id: 'u-teacher', student_id: 'u-ben',  student_name: 'Ben',                type: 'Clase',   scheduled_at: day(0, 10), duration_min: 60, notes: 'Parashá · Bereshit' },
    { id: 'c-2', teacher_id: 'u-teacher', student_id: 'u-maor', student_name: 'maor michalashvili', type: 'Lectura', scheduled_at: day(0, 13), duration_min: 60, notes: 'Estudiar Parashá · 4ª Aliyá' },
    { id: 'c-3', teacher_id: 'u-teacher', student_id: 'u-moshe',student_name: 'Moshé Acrich',       type: 'Trop',    scheduled_at: day(2, 17, 30), duration_min: 45, notes: null },
  ],
  notifications: [
    { id: 'n-1', teacher_id: 'u-teacher', student_id: 'u-maor', student_name: 'maor michalashvili', type: 'audio',  message: 'Ha enviado una grabación', aliyah_label: '4ª Aliyá', parasha_id: 'metzora', read: false, created_at: day(0, 9, 12) },
    { id: 'n-2', teacher_id: 'u-teacher', student_id: 'u-ben',  student_name: 'Ben',                type: 'listen', message: 'Escuchó la 1ª aliyá 3 veces', aliyah_label: '1ª Aliyá', parasha_id: 'bereshit', read: true, created_at: day(-1, 18, 40) },
    { id: 'n-3', teacher_id: 'u-teacher', student_id: 'u-maor', type: 'homework', message: 'Audio de todo 4', parasha_id: 'metzora', aliyah_label: 'Aliyá 4', read: false, created_at: day(-2, 11) },
    { id: 'n-4', teacher_id: 'u-teacher', student_id: 'u-ben', type: 'evaluation', message: 'Muy bien la lectura, cuidado con el zakef katón.', parasha_id: 'bereshit', aliyah_label: '1ª Aliyá', read: false, created_at: day(-1, 20) },
  ],
  audio_files: [],
  public_audios: [],
  audio_listens: [
    { student_id: 'u-maor', parasha_id: 'metzora', aliyah_idx: 3, count: 12, last_listened_at: day(-1) },
    { student_id: 'u-maor', parasha_id: 'metzora', aliyah_idx: 0, count: 6, last_listened_at: day(-4) },
  ],
  aliyah_time: [
    { student_id: 'u-maor', parasha_id: 'metzora', aliyah_idx: 3, seconds: 2460 },
    { student_id: 'u-maor', parasha_id: 'metzora', aliyah_idx: 0, seconds: 900 },
  ],
  study_sessions: [
    { student_id: 'u-maor', date: isoDate(0), seconds: 1260 },
    { student_id: 'u-maor', date: isoDate(-1), seconds: 2100 },
    { student_id: 'u-ben', date: isoDate(-2), seconds: 600 },
  ],
}

let idSeq = 100
const nextId = (p) => `${p}-${++idSeq}`

function joinRelations(row, select) {
  // Supports `*, student:student_id(name)` style joins against profiles
  const out = { ...row }
  const re = /(\w+):(\w+)\(([^)]*)\)/g
  let m
  while ((m = re.exec(select || ''))) {
    const [, alias, fk] = m
    const target = db.profiles.find(p => p.id === row[fk])
    out[alias] = target ? { name: target.name } : null
  }
  return out
}

class Query {
  constructor(table) {
    this.table = table
    this.filters = []
    this.op = 'select'
    this.payload = null
    this.selectStr = '*'
    this._single = false
    this._maybe = false
    this.head = false
    this.count = null
    this.orderBy = null
    this.limitN = null
    this.returning = false
  }
  select(str = '*', opts = {}) {
    this.selectStr = str
    if (this.op !== 'select') this.returning = true
    if (opts.head) this.head = true
    if (opts.count) this.count = opts.count
    return this
  }
  insert(rows) { this.op = 'insert'; this.payload = rows; return this }
  upsert(rows) { this.op = 'upsert'; this.payload = rows; return this }
  update(values) { this.op = 'update'; this.payload = values; return this }
  delete() { this.op = 'delete'; return this }
  eq(c, v) { this.filters.push(r => r[c] === v); return this }
  neq(c, v) { this.filters.push(r => r[c] !== v); return this }
  in(c, vs) { this.filters.push(r => vs.includes(r[c])); return this }
  gte(c, v) { this.filters.push(r => r[c] >= v); return this }
  gt(c, v) { this.filters.push(r => r[c] > v); return this }
  lte(c, v) { this.filters.push(r => r[c] <= v); return this }
  lt(c, v) { this.filters.push(r => r[c] < v); return this }
  is(c, v) { this.filters.push(r => (r[c] ?? null) === v); return this }
  not() { return this }
  or() { return this }
  match(obj) { Object.entries(obj).forEach(([c, v]) => this.eq(c, v)); return this }
  ilike(c, v) { const s = String(v).replace(/%/g, '').toLowerCase(); this.filters.push(r => String(r[c] ?? '').toLowerCase().includes(s)); return this }
  order(c, { ascending = true } = {}) { this.orderBy = { c, ascending }; return this }
  limit(n) { this.limitN = n; return this }
  range(a, b) { this.limitN = b - a + 1; return this }
  maybeSingle() { this._single = true; this._maybe = true; return this }
  single() { this._single = true; return this }

  run() {
    const rows = db[this.table] || (db[this.table] = [])
    const match = r => this.filters.every(f => f(r))
    let data = null
    if (this.op === 'insert' || this.op === 'upsert') {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(r => {
        if (this.op === 'upsert' && r.id) {
          const ex = rows.find(x => x.id === r.id)
          if (ex) { Object.assign(ex, r); return ex }
        }
        const row = { id: nextId(this.table), created_at: new Date().toISOString(), ...r }
        rows.push(row)
        return row
      })
      data = list.map(r => joinRelations(r, this.selectStr))
      return { data: this.returning ? (this._single ? data[0] : data) : null, error: null }
    }
    if (this.op === 'update') {
      const hit = rows.filter(match)
      hit.forEach(r => Object.assign(r, this.payload))
      return { data: this.returning ? hit : null, error: null }
    }
    if (this.op === 'delete') {
      db[this.table] = rows.filter(r => !match(r))
      return { data: null, error: null }
    }
    data = rows.filter(match)
    if (this.orderBy) {
      const { c, ascending } = this.orderBy
      data = [...data].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (ascending ? 1 : -1))
    }
    if (this.limitN != null) data = data.slice(0, this.limitN)
    data = data.map(r => joinRelations(r, this.selectStr))
    const count = data.length
    if (this.head) return { data: null, count, error: null }
    if (this._single) return { data: data[0] ?? null, error: data[0] || this._maybe ? null : { message: 'No rows' }, count }
    return { data, count, error: null }
  }
  then(resolve, reject) {
    return new Promise(r => setTimeout(r, 120)).then(() => this.run()).then(resolve, reject)
  }
}

export function createMockClient() {
  const role = localStorage.getItem('mockRole') === 'student' ? 'student' : 'teacher'
  const signedOut = localStorage.getItem('mockSignedOut') === '1'
  const profile = role === 'teacher' ? TEACHER : STUDENTS[1]
  const user = { id: profile.id, email: profile.email || 'student@example.com', user_metadata: {}, created_at: profile.created_at }
  let session = signedOut ? null : { user, access_token: 'dev' }
  const listeners = new Set()

  const emit = (event) => listeners.forEach(cb => cb(event, session))

  console.info(`%c[Parashapp dev] Mock Supabase · role=${role}`, 'color:#C99732;font-weight:600')

  return {
    from: (table) => new Query(table),
    channel: () => {
      const ch = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} }
      return ch
    },
    removeChannel: () => {},
    rpc: async () => ({ data: null, error: null }),
    functions: { invoke: async () => ({ data: null, error: null }) },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'dev' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session?.user ?? null }, error: null }),
      onAuthStateChange: (cb) => {
        listeners.add(cb)
        setTimeout(() => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session), 50)
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }
      },
      signInWithPassword: async () => { localStorage.removeItem('mockSignedOut'); session = { user, access_token: 'dev' }; emit('SIGNED_IN'); return { data: { session }, error: null } },
      signUp: async () => ({ data: { user, session }, error: null }),
      signInWithOAuth: async () => ({ data: null, error: null }),
      signInWithIdToken: async () => ({ data: null, error: null }),
      signOut: async () => { localStorage.setItem('mockSignedOut', '1'); session = null; emit('SIGNED_OUT'); return { error: null } },
      resetPasswordForEmail: async () => ({ data: null, error: null }),
      updateUser: async () => ({ data: { user }, error: null }),
      exchangeCodeForSession: async () => ({ data: { session }, error: null }),
      setSession: async () => ({ data: { session }, error: null }),
    },
  }
}
