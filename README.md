# Parashapp

Torah-study platform for teachers and students: the 54 parashiot, haftarot,
tefilá and Tikkun Korim with teacher audio synced word by word, homework,
classes and Bar Mitzvah preparation. React 19 + Vite + Tailwind, Supabase,
Capacitor (iOS/Android).

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

Without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, `vite dev` runs on an
in-memory **preview dataset** (`src/lib/devMock.js`) so every screen can be
explored without credentials. It is tree-shaken out of production builds.

- Switch role: `localStorage.mockRole = 'student'` (or `'teacher'`) and reload
- Simulate sign-out: `localStorage.mockSignedOut = '1'`

The dev server also proxies `/api/sefaria` and `/api/hebcal` (see `vite.config.js`).

## Design system

| Layer | Where |
|---|---|
| Tokens (color, shadow, parchment, light/dark) | `src/index.css` (`:root` / `.dark`) |
| Tailwind mapping (`bg-surface`, `text-ink-3`, `text-accent`, `bg-gold`…) | `tailwind.config.js` |
| Component classes (`.card`, `.btn-*`, `.input`, `.badge-*`, `.tabs`, `.segmented`, `.nav-item`) | `src/index.css` |
| React primitives (Logo, PageHeader, Avatar, Modal, EmptyState, SearchInput, Progress…) | `src/components/ui/` |
| App shell (sidebar, header, drawer, focus mode) | `src/components/shell/AppShell.jsx` |

Typography: Inter (UI), Source Serif 4 (editorial headings), Heebo (Hebrew UI),
Frank Ruhl Libre (Hebrew labels), Taamey Frank CLM (scripture with niqqud/te'amim),
STAM/Keter (Tikkun sefer column). Icons: `lucide-react`.

Brand mark: `public/brand/parashapp-mark.svg` (+ `-dark.svg` for dark mode).
Replace both with the official logo files when available.

## Sacred text

Torah text is never generated or edited by the UI.

- Reader text comes from Sefaria (`src/hooks/useSefaria.js`).
- Tikkun Korim renders `public/imprimir-tikun/data/tikkun-pages.json` (245 amudim,
  petuchot/setumot, shirot, ketiv/kri) — `src/app.js` + `src/styles.css` there are
  presentation only.
