// Special Torah readings for Jewish holidays — same Sefaria ref format as parashot.js

export const MOADIM_LIST = [
  { id: 'arba-parshiot', name: 'Arba Parshiot',  heb: 'אַרְבַּע פָּרָשִׁיּוֹת', en: 'Cuatro Parshiot Especiales', color: '#ef4444' },
  { id: 'rosh-jodesh',   name: 'Rosh Jodesh',    heb: 'רֹאשׁ חֹדֶשׁ',           en: 'Inicio de Mes',            color: '#06b6d4' },
  { id: 'rosh-hashana',  name: 'Rosh Hashaná',   heb: 'רֹאשׁ הַשָּׁנָה',         en: 'Año Nuevo Judío',          color: '#f59e0b' },
  { id: 'yom-kipur',     name: 'Yom Kipur',      heb: 'יוֹם כִּפּוּר',           en: 'Día del Perdón',           color: '#94a3b8' },
  { id: 'sucot',         name: 'Sucot',           heb: 'סֻכּוֹת',                en: 'Fiesta de las Cabañas',    color: '#22c55e' },
  { id: 'januca',        name: 'Janucá',          heb: 'חֲנֻכָּה',               en: 'Fiesta de las Luces',      color: '#3b82f6' },
  { id: 'purim',         name: 'Purim',           heb: 'פּוּרִים',               en: 'Fiesta de Purim',          color: '#e879f9' },
  { id: 'pesaj',         name: 'Pesaj',           heb: 'פֶּסַח',                 en: 'Fiesta de la Liberación',  color: '#84cc16' },
  { id: 'shavuot',       name: 'Shavuot',         heb: 'שָׁבוּעוֹת',             en: 'Fiesta de las Semanas',    color: '#d97706' },
  { id: 'taanit',       name: 'Taanit',          heb: 'תַּעֲנִית',              en: 'Días de ayuno',            color: '#78716c' },
]

export const ALL_MOADIM = [

  // ── ARBA PARSHIOT ──────────────────────────────────────────────────────────
  {
    id: 'parshat-shekalim', name: 'Parashá Shekalim', heb: 'פָּרָשַׁת שְׁקָלִים',
    chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [
      { n: 1, label: 'Maftir', ref: 'Exodus 30:11-16' },
    ],
  },
  {
    id: 'parshat-zajor', name: 'Parashá Zajor', heb: 'פָּרָשַׁת זָכוֹר',
    chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [
      { n: 1, label: 'Maftir', ref: 'Deuteronomy 25:17-19' },
    ],
  },
  {
    id: 'parshat-para', name: 'Parashá Pará', heb: 'פָּרָשַׁת פָּרָה',
    chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [
      { n: 1, label: 'Maftir', ref: 'Numbers 19:1-22' },
    ],
  },
  {
    id: 'parshat-hajodesh', name: 'Parashá HaJodesh', heb: 'פָּרָשַׁת הַחֹדֶשׁ',
    chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [
      { n: 1, label: 'Maftir', ref: 'Exodus 12:1-20' },
    ],
  },

  // ── ROSH JODESH ────────────────────────────────────────────────────────────
  {
    id: 'rosh-jodesh', name: 'Rosh Jodesh', heb: 'רֹאשׁ חֹדֶשׁ',
    chag: 'rosh-jodesh', color: '#06b6d4',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 28:1-5' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 28:6-10' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 28:11-13' },
      { n: 4, label: '4ª Aliyá', ref: 'Numbers 28:14-15' },
    ],
  },

  // ── ROSH HASHANÁ ───────────────────────────────────────────────────────────
  {
    id: 'rosh-hashana-1', name: 'Rosh Hashaná – Día 1', heb: 'רֹאשׁ הַשָּׁנָה יוֹם א׳',
    chag: 'rosh-hashana', color: '#f59e0b',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Genesis 21:1-4' },
      { n: 2, label: '2ª Aliyá', ref: 'Genesis 21:5-12' },
      { n: 3, label: '3ª Aliyá', ref: 'Genesis 21:13-21' },
      { n: 4, label: '4ª Aliyá', ref: 'Genesis 21:22-27' },
      { n: 5, label: '5ª Aliyá', ref: 'Genesis 21:28-34' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:1-6' },
    ],
  },
  {
    id: 'rosh-hashana-2', name: 'Rosh Hashaná – Día 2', heb: 'רֹאשׁ הַשָּׁנָה יוֹם ב׳',
    chag: 'rosh-hashana', color: '#f59e0b',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Genesis 22:1-3' },
      { n: 2, label: '2ª Aliyá', ref: 'Genesis 22:4-8' },
      { n: 3, label: '3ª Aliyá', ref: 'Genesis 22:9-14' },
      { n: 4, label: '4ª Aliyá', ref: 'Genesis 22:15-19' },
      { n: 5, label: '5ª Aliyá', ref: 'Genesis 22:20-24' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:1-6' },
    ],
  },

  // ── YOM KIPUR ──────────────────────────────────────────────────────────────
  {
    id: 'yom-kipur-shajarit', name: 'Yom Kipur – Shajarit', heb: 'יוֹם כִּפּוּר שַׁחֲרִית',
    chag: 'yom-kipur', color: '#94a3b8',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Leviticus 16:1-6' },
      { n: 2, label: '2ª Aliyá', ref: 'Leviticus 16:7-11' },
      { n: 3, label: '3ª Aliyá', ref: 'Leviticus 16:12-17' },
      { n: 4, label: '4ª Aliyá', ref: 'Leviticus 16:18-24' },
      { n: 5, label: '5ª Aliyá', ref: 'Leviticus 16:25-30' },
      { n: 6, label: '6ª Aliyá', ref: 'Leviticus 16:31-34' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:7-11' },
    ],
  },
  {
    id: 'yom-kipur-minja', name: 'Yom Kipur – Minjá', heb: 'יוֹם כִּפּוּר מִנְחָה',
    chag: 'yom-kipur', color: '#94a3b8',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Leviticus 18:1-10' },
      { n: 2, label: '2ª Aliyá', ref: 'Leviticus 18:11-21' },
      { n: 3, label: '3ª Aliyá', ref: 'Leviticus 18:22-30' },
    ],
  },

  // ── SUCOT ──────────────────────────────────────────────────────────────────
  {
    id: 'sucot-1', name: 'Sucot – Día 1', heb: 'סֻכּוֹת יוֹם א׳',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Leviticus 22:26-23:3' },
      { n: 2, label: '2ª Aliyá', ref: 'Leviticus 23:4-14' },
      { n: 3, label: '3ª Aliyá', ref: 'Leviticus 23:15-22' },
      { n: 4, label: '4ª Aliyá', ref: 'Leviticus 23:23-32' },
      { n: 5, label: '5ª Aliyá', ref: 'Leviticus 23:33-44' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:12-16' },
    ],
  },
  {
    id: 'sucot-2', name: 'Sucot – Día 2', heb: 'סֻכּוֹת יוֹם ב׳',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Leviticus 22:26-23:3' },
      { n: 2, label: '2ª Aliyá', ref: 'Leviticus 23:4-14' },
      { n: 3, label: '3ª Aliyá', ref: 'Leviticus 23:15-22' },
      { n: 4, label: '4ª Aliyá', ref: 'Leviticus 23:23-32' },
      { n: 5, label: '5ª Aliyá', ref: 'Leviticus 23:33-44' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:12-16' },
    ],
  },
  {
    id: 'sucot-jol-1', name: 'Jol HaMoed Sucot – Día 1', heb: 'חֹל הַמּוֹעֵד סֻכּוֹת א׳',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 29:17-19' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 29:20-22' },
    ],
  },
  {
    id: 'sucot-jol-2', name: 'Jol HaMoed Sucot – Día 2', heb: 'חֹל הַמּוֹעֵד סֻכּוֹת ב׳',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 29:20-22' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 29:23-25' },
    ],
  },
  {
    id: 'sucot-jol-3', name: 'Jol HaMoed Sucot – Día 3', heb: 'חֹל הַמּוֹעֵד סֻכּוֹת ג׳',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 29:23-25' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 29:26-28' },
    ],
  },
  {
    id: 'sucot-hoshana-raba', name: 'Hoshana Rabá', heb: 'הוֹשַׁעְנָא רַבָּא',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 29:26-28' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 29:29-31' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 29:32-34' },
    ],
  },
  {
    id: 'shemini-atzeret', name: 'Shemini Atzeret', heb: 'שְׁמִינִי עֲצֶרֶת',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Deuteronomy 14:22-15:11' },
      { n: 2, label: '2ª Aliyá', ref: 'Deuteronomy 15:12-18' },
      { n: 3, label: '3ª Aliyá', ref: 'Deuteronomy 15:19-16:3' },
      { n: 4, label: '4ª Aliyá', ref: 'Deuteronomy 16:4-12' },
      { n: 5, label: '5ª Aliyá', ref: 'Deuteronomy 16:13-17' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 29:35-30:1' },
    ],
  },
  {
    id: 'simjat-tora', name: 'Simjat Torá', heb: 'שִׂמְחַת תּוֹרָה',
    chag: 'sucot', color: '#22c55e',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Deuteronomy 33:1-7' },
      { n: 2, label: '2ª Aliyá', ref: 'Deuteronomy 33:8-12' },
      { n: 3, label: '3ª Aliyá', ref: 'Deuteronomy 33:13-17' },
      { n: 4, label: '4ª Aliyá', ref: 'Deuteronomy 33:18-21' },
      { n: 5, label: '5ª Aliyá', ref: 'Deuteronomy 33:22-26' },
      { n: 6, label: '6ª Aliyá', ref: 'Deuteronomy 33:27-34:12' },
      { n: 7, label: 'Jatán Torá', ref: 'Genesis 1:1-2:3' },
    ],
  },

  // ── JANUCÁ ─────────────────────────────────────────────────────────────────
  {
    id: 'januca-1', name: 'Janucá – Día 1', heb: 'חֲנֻכָּה יוֹם א׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:1-6' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:7-11' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:12-17' },
    ],
  },
  {
    id: 'januca-2', name: 'Janucá – Día 2', heb: 'חֲנֻכָּה יוֹם ב׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:18-20' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:21-23' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:24-29' },
    ],
  },
  {
    id: 'januca-3', name: 'Janucá – Día 3', heb: 'חֲנֻכָּה יוֹם ג׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:24-26' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:27-29' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:30-35' },
    ],
  },
  {
    id: 'januca-4', name: 'Janucá – Día 4', heb: 'חֲנֻכָּה יוֹם ד׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:30-32' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:33-35' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:36-41' },
    ],
  },
  {
    id: 'januca-5', name: 'Janucá – Día 5', heb: 'חֲנֻכָּה יוֹם ה׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:36-38' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:39-41' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:42-47' },
    ],
  },
  {
    id: 'januca-6', name: 'Janucá – Día 6', heb: 'חֲנֻכָּה יוֹם ו׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:42-44' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:45-47' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:48-53' },
    ],
  },
  {
    id: 'januca-7', name: 'Janucá – Día 7', heb: 'חֲנֻכָּה יוֹם ז׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:48-50' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:51-53' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:54-59' },
    ],
  },
  {
    id: 'januca-8', name: 'Janucá – Día 8', heb: 'חֲנֻכָּה יוֹם ח׳',
    chag: 'januca', color: '#3b82f6',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 7:54-56' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 7:57-59' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 7:60-8:4' },
    ],
  },

  // ── PURIM ──────────────────────────────────────────────────────────────────
  {
    id: 'purim', name: 'Purim – Parashá Amalek', heb: 'פּוּרִים · פָּרָשַׁת עֲמָלֵק',
    chag: 'purim', color: '#e879f9',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 17:8-10' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 17:11-13' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 17:14-16' },
    ],
  },

  // ── PESAJ ──────────────────────────────────────────────────────────────────
  {
    id: 'pesaj-1', name: 'Pesaj – Día 1', heb: 'פֶּסַח יוֹם א׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 12:21-25' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 12:26-36' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 12:37-42' },
      { n: 4, label: '4ª Aliyá', ref: 'Exodus 12:43-51' },
      { n: 5, label: '5ª Aliyá', ref: 'Exodus 13:1-16' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:16-25' },
    ],
  },
  {
    id: 'pesaj-2', name: 'Pesaj – Día 2', heb: 'פֶּסַח יוֹם ב׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Leviticus 22:26-23:3' },
      { n: 2, label: '2ª Aliyá', ref: 'Leviticus 23:4-14' },
      { n: 3, label: '3ª Aliyá', ref: 'Leviticus 23:15-22' },
      { n: 4, label: '4ª Aliyá', ref: 'Leviticus 23:23-32' },
      { n: 5, label: '5ª Aliyá', ref: 'Leviticus 23:33-44' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:16-25' },
    ],
  },
  {
    id: 'pesaj-jol-1', name: 'Jol HaMoed Pesaj – Día 1', heb: 'חֹל הַמּוֹעֵד פֶּסַח א׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 13:1-4' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 13:5-10' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 13:11-16' },
      { n: 4, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },
  {
    id: 'pesaj-jol-2', name: 'Jol HaMoed Pesaj – Día 2', heb: 'חֹל הַמּוֹעֵד פֶּסַח ב׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 22:24-26' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 22:27-23:5' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 23:6-19' },
      { n: 4, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },
  {
    id: 'pesaj-jol-3', name: 'Jol HaMoed Pesaj – Día 3', heb: 'חֹל הַמּוֹעֵד פֶּסַח ג׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 34:1-10' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 34:11-17' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 34:18-26' },
      { n: 4, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },
  {
    id: 'pesaj-jol-4', name: 'Jol HaMoed Pesaj – Día 4', heb: 'חֹל הַמּוֹעֵד פֶּסַח ד׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Numbers 9:1-5' },
      { n: 2, label: '2ª Aliyá', ref: 'Numbers 9:6-8' },
      { n: 3, label: '3ª Aliyá', ref: 'Numbers 9:9-14' },
      { n: 4, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },
  {
    id: 'pesaj-7', name: 'Pesaj – Día 7', heb: 'פֶּסַח יוֹם ז׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 13:17-14:8' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 14:9-14' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 14:15-25' },
      { n: 4, label: '4ª Aliyá', ref: 'Exodus 14:26-15:26' },
      { n: 5, label: '5ª Aliyá', ref: 'Exodus 15:1-26' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },
  {
    id: 'pesaj-8', name: 'Pesaj – Día 8', heb: 'פֶּסַח יוֹם ח׳',
    chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Deuteronomy 15:19-16:3' },
      { n: 2, label: '2ª Aliyá', ref: 'Deuteronomy 16:4-8' },
      { n: 3, label: '3ª Aliyá', ref: 'Deuteronomy 16:9-12' },
      { n: 4, label: '4ª Aliyá', ref: 'Deuteronomy 16:13-17' },
      { n: 5, label: '5ª Aliyá', ref: 'Deuteronomy 16:13-17' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:19-25' },
    ],
  },

  // ── SHAVUOT ────────────────────────────────────────────────────────────────
  {
    id: 'shavuot-1', name: 'Shavuot – Día 1', heb: 'שָׁבוּעוֹת יוֹם א׳',
    chag: 'shavuot', color: '#d97706',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 19:1-6' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 19:7-13' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 19:14-19' },
      { n: 4, label: '4ª Aliyá', ref: 'Exodus 19:20-20:14' },
      { n: 5, label: '5ª Aliyá', ref: 'Exodus 20:15-23' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:26-31' },
    ],
  },
  {
    id: 'shavuot-2', name: 'Shavuot – Día 2', heb: 'שָׁבוּעוֹת יוֹם ב׳',
    chag: 'shavuot', color: '#d97706',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Deuteronomy 15:19-16:3' },
      { n: 2, label: '2ª Aliyá', ref: 'Deuteronomy 16:4-8' },
      { n: 3, label: '3ª Aliyá', ref: 'Deuteronomy 16:9-12' },
      { n: 4, label: '4ª Aliyá', ref: 'Deuteronomy 16:13-17' },
      { n: 5, label: '5ª Aliyá', ref: 'Deuteronomy 16:13-17' },
      { n: 8, label: 'Maftir',   ref: 'Numbers 28:26-31' },
    ],
  },

  // ── TAANIT ─────────────────────────────────────────────────────────────────
  {
    id: 'taanit-shajarit', name: 'Taanit – Shajarit', heb: 'תַּעֲנִית שַׁחֲרִית',
    chag: 'taanit', color: '#78716c',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 32:11-14' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 34:1-3' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 34:4-10' },
    ],
  },
  {
    id: 'taanit-minja', name: 'Taanit – Minjá', heb: 'תַּעֲנִית מִנְחָה',
    chag: 'taanit', color: '#78716c',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 32:11-14' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 34:1-3' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 34:4-10' },
    ],
  },
  {
    id: 'tisha-beav-shajarit', name: "Tishá BeAv – Shajarit", heb: 'תִּשְׁעָה בְּאָב שַׁחֲרִית',
    chag: 'taanit', color: '#78716c',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Deuteronomy 4:25-29' },
      { n: 2, label: '2ª Aliyá', ref: 'Deuteronomy 4:30-35' },
      { n: 3, label: '3ª Aliyá', ref: 'Deuteronomy 4:36-40' },
    ],
  },
  {
    id: 'tisha-beav-minja', name: "Tishá BeAv – Minjá", heb: 'תִּשְׁעָה בְּאָב מִנְחָה',
    chag: 'taanit', color: '#78716c',
    aliyot: [
      { n: 1, label: '1ª Aliyá', ref: 'Exodus 32:11-14' },
      { n: 2, label: '2ª Aliyá', ref: 'Exodus 34:1-3' },
      { n: 3, label: '3ª Aliyá', ref: 'Exodus 34:4-10' },
    ],
  },
]
