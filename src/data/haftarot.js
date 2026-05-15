// All 54 weekly haftarot + holiday haftarot — Ashkenaz minhag
// Sefaria ref format, organized by Torah book for color grouping

export const ALL_HAFTAROT = [

  // ── BERESHIT ──────────────────────────────────────────────────────────────
  {
    id: 'haftara-bereshit', name: 'Haftará Bereshit', heb: 'הַפְטָרַת בְּרֵאשִׁית',
    book: 'bereshit', parasha: 'bereshit',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 42:5-43:10' }],
  },
  {
    id: 'haftara-noach', name: 'Haftará Noaj', heb: 'הַפְטָרַת נֹחַ',
    book: 'bereshit', parasha: 'noach',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 54:1-55:5' }],
  },
  {
    id: 'haftara-lech-lecha', name: 'Haftará Lej Lejá', heb: 'הַפְטָרַת לֶךְ לְךָ',
    book: 'bereshit', parasha: 'lech-lecha',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 40:27-41:16' }],
  },
  {
    id: 'haftara-vayera', name: 'Haftará Vayerá', heb: 'הַפְטָרַת וַיֵּרָא',
    book: 'bereshit', parasha: 'vayera',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Kings 4:1-37' }],
  },
  {
    id: 'haftara-chayei-sara', name: 'Haftará Jayei Sará', heb: 'הַפְטָרַת חַיֵּי שָׂרָה',
    book: 'bereshit', parasha: 'chayei-sara',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 1:1-31' }],
  },
  {
    id: 'haftara-toldot', name: 'Haftará Toldot', heb: 'הַפְטָרַת תּוֹלְדֹת',
    book: 'bereshit', parasha: 'toldot',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Malachi 1:1-2:7' }],
  },
  {
    id: 'haftara-vayetze', name: 'Haftará Vayetzé', heb: 'הַפְטָרַת וַיֵּצֵא',
    book: 'bereshit', parasha: 'vayetze',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Hosea 12:13-14:10' }],
  },
  {
    id: 'haftara-vayishlach', name: 'Haftará Vayishlaj', heb: 'הַפְטָרַת וַיִּשְׁלַח',
    book: 'bereshit', parasha: 'vayishlach',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Hosea 11:7-12:12' }],
  },
  {
    id: 'haftara-vayeshev', name: 'Haftará Vayeshev', heb: 'הַפְטָרַת וַיֵּשֶׁב',
    book: 'bereshit', parasha: 'vayeshev',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Amos 2:6-3:8' }],
  },
  {
    id: 'haftara-miketz', name: 'Haftará Miketz', heb: 'הַפְטָרַת מִקֵּץ',
    book: 'bereshit', parasha: 'miketz',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 3:15-4:1' }],
  },
  {
    id: 'haftara-vayigash', name: 'Haftará Vayigash', heb: 'הַפְטָרַת וַיִּגַּשׁ',
    book: 'bereshit', parasha: 'vayigash',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 37:15-28' }],
  },
  {
    id: 'haftara-vayechi', name: 'Haftará Vayejí', heb: 'הַפְטָרַת וַיְחִי',
    book: 'bereshit', parasha: 'vayechi',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 2:1-12' }],
  },

  // ── SHEMOT ────────────────────────────────────────────────────────────────
  {
    id: 'haftara-shemot', name: 'Haftará Shemot', heb: 'הַפְטָרַת שְׁמוֹת',
    book: 'shemot', parasha: 'shemot',
    aliyot: [
      { n: 1, label: 'Haftará',      ref: 'Isaiah 27:6-28:13' },
      { n: 2, label: 'Conclusión',   ref: 'Isaiah 29:22-23' },
    ],
  },
  {
    id: 'haftara-vaera', name: 'Haftará Vaerá', heb: 'הַפְטָרַת וָאֵרָא',
    book: 'shemot', parasha: 'vaera',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 28:25-29:21' }],
  },
  {
    id: 'haftara-bo', name: 'Haftará Bo', heb: 'הַפְטָרַת בֹּא',
    book: 'shemot', parasha: 'bo',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Jeremiah 46:13-28' }],
  },
  {
    id: 'haftara-beshalach', name: 'Haftará Beshalaj', heb: 'הַפְטָרַת בְּשַׁלַּח',
    book: 'shemot', parasha: 'beshalach',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Judges 4:4-5:31' }],
  },
  {
    id: 'haftara-yitro', name: 'Haftará Yitró', heb: 'הַפְטָרַת יִתְרוֹ',
    book: 'shemot', parasha: 'yitro',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Isaiah 6:1-7:6' },
      { n: 2, label: 'Conclusión', ref: 'Isaiah 9:5-6' },
    ],
  },
  {
    id: 'haftara-mishpatim', name: 'Haftará Mishpatim', heb: 'הַפְטָרַת מִשְׁפָּטִים',
    book: 'shemot', parasha: 'mishpatim',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Jeremiah 34:8-22' },
      { n: 2, label: 'Conclusión', ref: 'Jeremiah 33:25-26' },
    ],
  },
  {
    id: 'haftara-terumah', name: 'Haftará Terumá', heb: 'הַפְטָרַת תְּרוּמָה',
    book: 'shemot', parasha: 'terumah',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 5:26-6:13' }],
  },
  {
    id: 'haftara-tetzaveh', name: 'Haftará Tetzavé', heb: 'הַפְטָרַת תְּצַוֶּה',
    book: 'shemot', parasha: 'tetzaveh',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 43:10-27' }],
  },
  {
    id: 'haftara-ki-tisa', name: 'Haftará Ki Tisá', heb: 'הַפְטָרַת כִּי תִשָּׂא',
    book: 'shemot', parasha: 'ki-tisa',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 18:1-39' }],
  },
  {
    id: 'haftara-vayakhel', name: 'Haftará Vayakhel', heb: 'הַפְטָרַת וַיַּקְהֵל',
    book: 'shemot', parasha: 'vayakhel',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 7:40-50' }],
  },
  {
    id: 'haftara-pekudei', name: 'Haftará Pekudei', heb: 'הַפְטָרַת פְקוּדֵי',
    book: 'shemot', parasha: 'pekudei',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 7:51-8:21' }],
  },

  // ── VAYIKRA ───────────────────────────────────────────────────────────────
  {
    id: 'haftara-vayikra', name: 'Haftará Vayikrá', heb: 'הַפְטָרַת וַיִּקְרָא',
    book: 'vayikra', parasha: 'vayikra',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 43:21-44:23' }],
  },
  {
    id: 'haftara-tzav', name: 'Haftará Tzav', heb: 'הַפְטָרַת צַו',
    book: 'vayikra', parasha: 'tzav',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Jeremiah 7:21-8:3' },
      { n: 2, label: 'Conclusión', ref: 'Jeremiah 9:22-23' },
    ],
  },
  {
    id: 'haftara-shemini', name: 'Haftará Sheminí', heb: 'הַפְטָרַת שְׁמִינִי',
    book: 'vayikra', parasha: 'shemini',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Samuel 6:1-7:17' }],
  },
  {
    id: 'haftara-tazria', name: 'Haftará Tazría', heb: 'הַפְטָרַת תַּזְרִיעַ',
    book: 'vayikra', parasha: 'tazria',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Kings 4:42-5:19' }],
  },
  {
    id: 'haftara-metzora', name: 'Haftará Metzorá', heb: 'הַפְטָרַת מְצֹרָע',
    book: 'vayikra', parasha: 'metzora',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Kings 7:3-20' }],
  },
  {
    id: 'haftara-acharei-mot', name: 'Haftará Ajarei Mot', heb: 'הַפְטָרַת אַחֲרֵי מוֹת',
    book: 'vayikra', parasha: 'acharei-mot',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 22:1-19' }],
  },
  {
    id: 'haftara-kedoshim', name: 'Haftará Kedoshim', heb: 'הַפְטָרַת קְדֹשִׁים',
    book: 'vayikra', parasha: 'kedoshim',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Amos 9:7-15' }],
  },
  {
    id: 'haftara-emor', name: 'Haftará Emor', heb: 'הַפְטָרַת אֱמֹר',
    book: 'vayikra', parasha: 'emor',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 44:15-31' }],
  },
  {
    id: 'haftara-behar', name: 'Haftará Behar', heb: 'הַפְטָרַת בְּהַר',
    book: 'vayikra', parasha: 'behar',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Jeremiah 32:6-27' }],
  },
  {
    id: 'haftara-bechukotai', name: 'Haftará Bejukotai', heb: 'הַפְטָרַת בְּחֻקֹּתַי',
    book: 'vayikra', parasha: 'bechukotai',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Jeremiah 16:19-17:14' }],
  },

  // ── BAMIDBAR ──────────────────────────────────────────────────────────────
  {
    id: 'haftara-bamidbar', name: 'Haftará Bamidbar', heb: 'הַפְטָרַת בְּמִדְבַּר',
    book: 'bamidbar', parasha: 'bamidbar',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Hosea 2:1-22' }],
  },
  {
    id: 'haftara-naso', name: 'Haftará Nasó', heb: 'הַפְטָרַת נָשֹׂא',
    book: 'bamidbar', parasha: 'naso',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Judges 13:2-25' }],
  },
  {
    id: 'haftara-behaalotecha', name: 'Haftará Behaalotejá', heb: 'הַפְטָרַת בְּהַעֲלֹתְךָ',
    book: 'bamidbar', parasha: 'behaalotecha',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Zechariah 2:14-4:7' }],
  },
  {
    id: 'haftara-shelach', name: 'Haftará Shelaj', heb: 'הַפְטָרַת שְׁלַח',
    book: 'bamidbar', parasha: 'shelach',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Joshua 2:1-24' }],
  },
  {
    id: 'haftara-korach', name: 'Haftará Koraj', heb: 'הַפְטָרַת קֹרַח',
    book: 'bamidbar', parasha: 'korach',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Samuel 11:14-12:22' }],
  },
  {
    id: 'haftara-chukat', name: 'Haftará Jukat', heb: 'הַפְטָרַת חֻקַּת',
    book: 'bamidbar', parasha: 'chukat',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Judges 11:1-33' }],
  },
  {
    id: 'haftara-balak', name: 'Haftará Balak', heb: 'הַפְטָרַת בָּלָק',
    book: 'bamidbar', parasha: 'balak',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Micah 5:6-6:8' }],
  },
  {
    id: 'haftara-pinchas', name: 'Haftará Pinjás', heb: 'הַפְטָרַת פִּינְחָס',
    book: 'bamidbar', parasha: 'pinchas',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 18:46-19:21' }],
  },
  {
    id: 'haftara-matot', name: 'Haftará Matot', heb: 'הַפְטָרַת מַטּוֹת',
    book: 'bamidbar', parasha: 'matot',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Jeremiah 1:1-2:3' }],
  },
  {
    id: 'haftara-masei', name: 'Haftará Masé', heb: 'הַפְטָרַת מַסְעֵי',
    book: 'bamidbar', parasha: 'masei',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Jeremiah 2:4-28' },
      { n: 2, label: 'Conclusión', ref: 'Jeremiah 3:4' },
    ],
  },

  // ── DEVARIM ───────────────────────────────────────────────────────────────
  {
    id: 'haftara-devarim', name: 'Haftará Devarim', heb: 'הַפְטָרַת דְּבָרִים',
    book: 'devarim', parasha: 'devarim',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 1:1-27' }],
  },
  {
    id: 'haftara-vaetchanan', name: 'Haftará Vaetjanán', heb: 'הַפְטָרַת וָאֶתְחַנַּן',
    book: 'devarim', parasha: 'vaetchanan',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 40:1-26' }],
  },
  {
    id: 'haftara-ekev', name: 'Haftará Ekev', heb: 'הַפְטָרַת עֵקֶב',
    book: 'devarim', parasha: 'ekev',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 49:14-51:3' }],
  },
  {
    id: 'haftara-reeh', name: 'Haftará Reé', heb: 'הַפְטָרַת רְאֵה',
    book: 'devarim', parasha: 'reeh',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 54:11-55:5' }],
  },
  {
    id: 'haftara-shoftim', name: 'Haftará Shoftim', heb: 'הַפְטָרַת שֹׁפְטִים',
    book: 'devarim', parasha: 'shoftim',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 51:12-52:12' }],
  },
  {
    id: 'haftara-ki-tetze', name: 'Haftará Ki Tetzé', heb: 'הַפְטָרַת כִּי תֵצֵא',
    book: 'devarim', parasha: 'ki-tetze',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 54:1-10' }],
  },
  {
    id: 'haftara-ki-tavo', name: 'Haftará Ki Tavó', heb: 'הַפְטָרַת כִּי תָבוֹא',
    book: 'devarim', parasha: 'ki-tavo',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 60:1-22' }],
  },
  {
    id: 'haftara-nitzavim', name: 'Haftará Nitzavim', heb: 'הַפְטָרַת נִצָּבִים',
    book: 'devarim', parasha: 'nitzavim',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 61:10-63:9' }],
  },
  {
    id: 'haftara-vayelech', name: 'Haftará Vayelej', heb: 'הַפְטָרַת וַיֵּלֶךְ',
    book: 'devarim', parasha: 'vayelech',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 55:6-56:8' }],
  },
  {
    id: 'haftara-haazinu', name: 'Haftará Haazinu', heb: 'הַפְטָרַת הַאֲזִינוּ',
    book: 'devarim', parasha: 'haazinu',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Samuel 22:1-51' }],
  },
  {
    id: 'haftara-vezot-haberacha', name: 'Haftará Vezot HaBerajá', heb: 'הַפְטָרַת וְזֹאת הַבְּרָכָה',
    book: 'devarim', parasha: 'vezot-haberacha',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Joshua 1:1-18' }],
  },

  // ── HAFTAROT DE FESTIVIDADES ───────────────────────────────────────────────
  {
    id: 'haftara-shekalim', name: 'Haftará Shekalim', heb: 'הַפְטָרַת שְׁקָלִים',
    book: 'bereshit', chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Kings 12:1-17' }],
  },
  {
    id: 'haftara-zajor', name: 'Haftará Zajor', heb: 'הַפְטָרַת זָכוֹר',
    book: 'bereshit', chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Samuel 15:2-34' }],
  },
  {
    id: 'haftara-para', name: 'Haftará Pará', heb: 'הַפְטָרַת פָּרָה',
    book: 'bamidbar', chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 36:16-38' }],
  },
  {
    id: 'haftara-hajodesh', name: 'Haftará HaJodesh', heb: 'הַפְטָרַת הַחֹדֶשׁ',
    book: 'shemot', chag: 'arba-parshiot', color: '#ef4444',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Ezekiel 45:16-46:18' }],
  },
  {
    id: 'haftara-shabbat-shuva', name: 'Haftará Shabat Shuva', heb: 'הַפְטָרַת שַׁבַּת שׁוּבָה',
    book: 'devarim', chag: 'rosh-hashana', color: '#f59e0b',
    aliyot: [
      { n: 1, label: 'Parte 1', ref: 'Hosea 14:2-10' },
      { n: 2, label: 'Parte 2', ref: 'Micah 7:18-20' },
    ],
  },
  {
    id: 'haftara-rosh-hashana-1', name: 'Haftará Rosh Hashaná – Día 1', heb: 'הַפְטָרַת רֹאשׁ הַשָּׁנָה א׳',
    book: 'bereshit', chag: 'rosh-hashana', color: '#f59e0b',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Samuel 1:1-2:10' }],
  },
  {
    id: 'haftara-rosh-hashana-2', name: 'Haftará Rosh Hashaná – Día 2', heb: 'הַפְטָרַת רֹאשׁ הַשָּׁנָה ב׳',
    book: 'bereshit', chag: 'rosh-hashana', color: '#f59e0b',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Jeremiah 31:2-20' }],
  },
  {
    id: 'haftara-yom-kipur-shajarit', name: 'Haftará Yom Kipur – Shajarit', heb: 'הַפְטָרַת יוֹם כִּפּוּר שַׁחֲרִית',
    book: 'devarim', chag: 'yom-kipur', color: '#94a3b8',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 57:14-58:14' }],
  },
  {
    id: 'haftara-yom-kipur-minja', name: 'Haftará Yom Kipur – Minjá', heb: 'הַפְטָרַת יוֹם כִּפּוּר מִנְחָה',
    book: 'devarim', chag: 'yom-kipur', color: '#94a3b8',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Jonah 1:1-4:11' },
      { n: 2, label: 'Conclusión', ref: 'Micah 7:18-20' },
    ],
  },
  {
    id: 'haftara-sucot-1', name: 'Haftará Sucot – Día 1', heb: 'הַפְטָרַת סֻכּוֹת א׳',
    book: 'vayikra', chag: 'sucot', color: '#22c55e',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Zechariah 14:1-21' }],
  },
  {
    id: 'haftara-sucot-2', name: 'Haftará Sucot – Día 2', heb: 'הַפְטָרַת סֻכּוֹת ב׳',
    book: 'vayikra', chag: 'sucot', color: '#22c55e',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 8:2-21' }],
  },
  {
    id: 'haftara-shemini-atzeret', name: 'Haftará Shemini Atzeret', heb: 'הַפְטָרַת שְׁמִינִי עֲצֶרֶת',
    book: 'devarim', chag: 'sucot', color: '#22c55e',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'I Kings 8:54-9:1' }],
  },
  {
    id: 'haftara-simjat-tora', name: 'Haftará Simjat Torá', heb: 'הַפְטָרַת שִׂמְחַת תּוֹרָה',
    book: 'devarim', chag: 'sucot', color: '#22c55e',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Joshua 1:1-18' }],
  },
  {
    id: 'haftara-pesaj-1', name: 'Haftará Pesaj – Día 1', heb: 'הַפְטָרַת פֶּסַח א׳',
    book: 'shemot', chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Joshua 5:2-6:1' },
      { n: 2, label: 'Conclusión', ref: 'Joshua 6:27' },
    ],
  },
  {
    id: 'haftara-pesaj-2', name: 'Haftará Pesaj – Día 2', heb: 'הַפְטָרַת פֶּסַח ב׳',
    book: 'shemot', chag: 'pesaj', color: '#84cc16',
    aliyot: [
      { n: 1, label: 'Parte 1', ref: 'II Kings 23:1-9' },
      { n: 2, label: 'Parte 2', ref: 'II Kings 23:21-25' },
    ],
  },
  {
    id: 'haftara-pesaj-7', name: 'Haftará Pesaj – Día 7', heb: 'הַפְטָרַת פֶּסַח ז׳',
    book: 'shemot', chag: 'pesaj', color: '#84cc16',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'II Samuel 22:1-51' }],
  },
  {
    id: 'haftara-pesaj-8', name: 'Haftará Pesaj – Día 8', heb: 'הַפְטָרַת פֶּסַח ח׳',
    book: 'shemot', chag: 'pesaj', color: '#84cc16',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Isaiah 10:32-12:6' }],
  },
  {
    id: 'haftara-shavuot-1', name: 'Haftará Shavuot – Día 1', heb: 'הַפְטָרַת שָׁבוּעוֹת א׳',
    book: 'vayikra', chag: 'shavuot', color: '#d97706',
    aliyot: [
      { n: 1, label: 'Haftará',    ref: 'Ezekiel 1:1-28' },
      { n: 2, label: 'Conclusión', ref: 'Ezekiel 3:12' },
    ],
  },
  {
    id: 'haftara-shavuot-2', name: 'Haftará Shavuot – Día 2', heb: 'הַפְטָרַת שָׁבוּעוֹת ב׳',
    book: 'bamidbar', chag: 'shavuot', color: '#d97706',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Habakkuk 3:1-19' }],
  },
  {
    id: 'haftara-shabbat-hagadol', name: 'Haftará Shabat HaGadol', heb: 'הַפְטָרַת שַׁבַּת הַגָּדוֹל',
    book: 'vayikra', chag: 'pesaj', color: '#84cc16',
    aliyot: [{ n: 1, label: 'Haftará', ref: 'Malachi 3:4-24' }],
  },
]
