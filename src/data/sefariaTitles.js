// Translation map for Sefaria siddur section titles.
// Keys are the EXACT English strings Sefaria returns in its v2 index API.
// 'en' key is omitted — English speakers see the original Sefaria title.

const TITLES = {

  // ── Shema aliyah labels ───────────────────────────────────────────────────
  "Ve'ahavta":               { es: 'Veavtá',   fr: 'Véahavta', it: "Ve'ahavta", he: 'וְאָהַבְתָּ' },
  'Vehaya':                  { es: 'Vehayá',   fr: 'Vehaya',   it: 'Vehaya',    he: 'וְהָיָה'      },
  'Vayomer':                 { es: 'Vayómer',  fr: 'Vayomer',  it: 'Vayomer',   he: 'וַיֹּאמֶר'    },

  // ── Ashkenaz & Sefard shared ──────────────────────────────────────────────
  'Modeh Ani':                { es: 'Modé Ani',                    fr: 'Modeh Ani',                          it: 'Modeh Ani',                        he: 'מוֹדֶה אֲנִי' },
  'Morning Blessings':        { es: 'Birjot HaShajar',             fr: 'Bénédictions du matin',              it: 'Benedizioni del mattino',          he: 'בִּרְכוֹת הַשַּׁחַר' },
  'Tallit':                   { es: 'Talit',                        fr: 'Tallit',                             it: 'Tallit',                           he: 'טַלִּית' },
  'Torah Blessings':          { es: 'Birjot HaTorá (mañana)',       fr: 'Bénédictions de la Torah (matin)',   it: 'Benedizioni della Torah (mattino)', he: 'בִּרְכוֹת הַתּוֹרָה' },
  'Ashrei':                   { es: 'Ashrei',                       fr: 'Achré',                              it: 'Ashrei',                           he: 'אַשְׁרֵי' },
  'Amidah':                   { es: 'Amidá',                        fr: 'Amida',                              it: 'Amidà',                            he: 'עֲמִידָה' },
  'Tachanun':                 { es: 'Tajanuním',                    fr: 'Tahanoune',                          it: 'Tachanun',                         he: 'תַּחֲנוּן' },
  'Torah Reading':            { es: 'Lectura de la Torá',           fr: 'Lecture de la Torah',                it: 'Lettura della Torah',              he: 'קְרִיאַת הַתּוֹרָה' },
  'Aleinu':                   { es: 'Aleinu',                       fr: 'Alénou',                             it: 'Aleinu',                           he: 'עָלֵינוּ' },
  'Minchah':                  { es: 'Minjá',                        fr: 'Minha',                              it: 'Mincha',                           he: 'מִנְחָה' },
  'Maariv':                   { es: 'Arvit',                        fr: 'Maariv',                             it: 'Maariv',                           he: 'עַרְבִית' },
  'Kabbalat Shabbat':         { es: 'Kabalat Shabat',               fr: 'Kabbala Chabbat',                    it: 'Kabbalat Shabbat',                 he: 'קַבָּלַת שַׁבָּת' },
  'Hallel':                   { es: 'Halel',                        fr: 'Hallel',                             it: 'Hallel',                           he: 'הַלֵּל' },
  'Havdalah':                 { es: 'Havdalá',                      fr: 'Havdala',                            it: 'Havdalà',                          he: 'הַבְדָּלָה' },
  'Kedushah':                 { es: 'Kedushá',                      fr: 'Kédoucha',                           it: 'Kedushah',                         he: 'קְדֻשָּׁה' },
  'Adon Olam':                { es: 'Adón Olam',                    fr: 'Adon Olam',                          it: 'Adon Olam',                        he: 'אֲדוֹן עוֹלָם' },
  'Kiddush':                  { es: 'Kidush',                       fr: 'Kiddouch',                           it: 'Kiddush',                          he: 'קִדּוּשׁ' },

  // ── Ashkenaz-specific ─────────────────────────────────────────────────────
  'Tefillin':                 { es: 'Tefilín',                      fr: 'Téfilines',                          it: 'Tefillin',                         he: 'תְּפִלִּין' },
  'Netilat Yadayim':          { es: 'Netilat Yadáyim',              fr: 'Nétilat Yadayim',                    it: 'Netilat Yadayim',                  he: 'נְטִילַת יָדַיִם' },
  'Asher Yatzar':             { es: 'Asher Yatzár',                 fr: 'Acher Yatsar',                       it: 'Asher Yatzar',                     he: 'אֲשֶׁר יָצַר' },
  'Elokai Neshama':           { es: 'Elokai Neshamá',               fr: 'Elohaï Nechama',                     it: 'Elokai Neshama',                   he: 'אֱלֹהַי נְשָׁמָה' },
  'Tzitzit':                  { es: 'Tzitzit',                      fr: 'Tsitsit',                            it: 'Tzitzit',                          he: 'צִיצִית' },
  'Ma Tovu':                  { es: 'Ma Tovu',                      fr: 'Ma Tovou',                           it: 'Ma Tovu',                          he: 'מַה טֹּבוּ' },
  'Yigdal':                   { es: 'Yigdal',                       fr: 'Yigdal',                             it: 'Yigdal',                           he: 'יִגְדַּל' },
  'Akedah':                   { es: 'Akedá',                        fr: 'Akéda',                              it: 'Akedah',                           he: 'עֲקֵדָה' },
  'Sovereignty of Heaven':    { es: 'Kabbalat Ol Maljut Shamáyim', fr: "Acceptation du joug céleste",        it: 'Sovranità del Cielo',              he: 'קַבָּלַת עֹל מַלְכוּת שָׁמַיִם' },
  'Kiyor':                    { es: 'Kior',                         fr: 'Kiyor',                              it: 'Kiyor',                            he: 'כִּיּוֹר' },
  'Terumat HaDeshen':         { es: 'Terumat HaDeshen',             fr: 'Térouma HaDeshen',                   it: 'Terumat HaDeshen',                 he: 'תְּרוּמַת הַדֶּשֶׁן' },
  'Korban HaTamid':           { es: 'Korban HaTamid',               fr: 'Korban HaTamid',                     it: 'Korban HaTamid',                   he: 'קָרְבַּן הַתָּמִיד' },
  'Ketoret':                  { es: 'Ketóret',                      fr: 'Kétoret',                            it: 'Ketoret',                          he: 'קְטֹרֶת' },
  'Order of the Temple Service': { es: 'Orden del Servicio del Templo', fr: 'Ordre du service du Temple',    it: 'Ordine del servizio del Tempio',   he: 'סדר עבודת בית המקדש' },
  'Laws of Sacrifices':       { es: 'Leyes de los Sacrificios',     fr: 'Lois des sacrifices',                it: 'Leggi dei sacrifici',              he: 'הלכות קרבנות' },
  'Baraita of Rabbi Yishmael':{ es: 'Baraita de Rabí Yishmaél',    fr: 'Baraïta de Rabbi Yichmael',          it: 'Baraita di Rabbi Ishmael',         he: 'בָּרַיְתָא דְרַבִּי יִשְׁמָעֵאל' },
  'Kaddish DeRabbanan':       { es: 'Kadish DeRabanán',             fr: 'Kaddich DeRabbanan',                 it: 'Kaddish DeRabbanan',               he: 'קַדִּישׁ דְּרַבָּנָן' },
  'Pesukei Dezimra':          { es: 'Pesukei DeZimrá',              fr: 'Pesouqei de-Zimra',                  it: 'Pesukei De-Zimra',                 he: 'פְּסוּקֵי דְּזִמְרָה' },
  "Baruch She'amar":          { es: 'Baruj Sheamár',                fr: "Baroukh Che'amar",                   it: "Baruch She'amar",                  he: 'בָּרוּךְ שֶׁאָמַר' },
  'Blessings of the Shema':   { es: 'Berajot del Shemá',            fr: 'Bénédictions du Chéma',              it: 'Benedizioni dello Shemà',          he: 'בִּרְכוֹת שְׁמַע' },
  'Post Amidah':              { es: 'Tras la Amidá',                fr: "Après l'Amida",                      it: "Dopo l'Amidà",                     he: 'אחרי העמידה' },
  'Concluding Prayers':       { es: 'Plegarias Finales',            fr: 'Prières finales',                    it: 'Preghiere conclusive',             he: 'תפילות סיום' },
  'Zemirot':                  { es: 'Zemirot',                      fr: 'Zemirot',                            it: 'Zemirot',                          he: 'זְמִירוֹת' },
  "Eshet Chayil":             { es: 'Eshet Jayil',                  fr: 'Échèt Hayil',                        it: 'Eshet Chayil',                     he: 'אֵשֶׁת חַיִל' },

  // ── Sefard-specific ───────────────────────────────────────────────────────
  'Tefilin':                  { es: 'Tefilín',                      fr: 'Téfilines',                          it: 'Tefillin',                         he: 'תְּפִלִּין' },
  'Introductory Prayers':     { es: 'Plegarias Introductorias',     fr: "Prières d'introduction",             it: 'Preghiere introduttive',           he: 'תפילות הכנה' },
  'Upon Entering Synagogue':  { es: 'Al Entrar a la Sinagoga',      fr: 'En entrant à la synagogue',          it: 'Entrando in sinagoga',             he: 'בכניסה לבית הכנסת' },
  'Blessings on Torah':       { es: 'Birjot HaTorá',                fr: 'Bénédictions de la Torah',           it: 'Benedizioni della Torah',          he: 'בִּרְכוֹת הַתּוֹרָה' },
  'Morning Prayer':           { es: 'Tefilá de la Mañana',          fr: 'Prière du matin',                    it: 'Preghiera mattutina',              he: 'תְּפִלַּת הַשַּׁחַר' },
  'Korbanot':                 { es: 'Korbanot',                     fr: 'Korbanot',                           it: 'Korbanot',                         he: 'קָרְבָּנוֹת' },
  "B'raita d'Rabi Yishmael":  { es: 'Baraita de Rabí Yishmaél',    fr: 'Baraïta de Rabbi Yichmael',          it: 'Baraita di Rabbi Ishmael',         he: 'בָּרַיְתָא דְרַבִּי יִשְׁמָעֵאל' },
  'Hodu':                     { es: 'Hodú',                         fr: 'Hodou',                              it: 'Hodu',                             he: 'הוֹדוּ' },
  'Yishtabach':               { es: 'Yishtabaj',                    fr: 'Yichtabach',                         it: 'Yishtabach',                       he: 'יִשְׁתַּבַּח' },
  'The Shema':                { es: 'El Shemá',                     fr: 'Le Chéma',                           it: 'Lo Shemà',                         he: 'שְׁמַע יִשְׂרָאֵל' },
  'Avinu Malkeinu':           { es: 'Avinu Malkeinu',               fr: 'Avinou Malkenou',                    it: 'Avinu Malkeinu',                   he: 'אָבִינוּ מַלְכֵּנוּ' },
  'For Monday & Thursday':    { es: 'Para Lunes y Jueves',          fr: 'Pour lundi et jeudi',                it: 'Per lunedì e giovedì',             he: 'לשני ולחמישי' },
  'Beit Yaakov':              { es: 'Beit Yaakov',                  fr: 'Beit Yaakov',                        it: 'Beit Yaakov',                      he: 'בֵּית יַעֲקֹב' },
  'Song of the Day':          { es: 'Canción del Día',              fr: 'Chant du jour',                      it: 'Canto del giorno',                 he: 'שִׁיר שֶׁל יוֹם' },
  'Barchi Nafshi':            { es: 'Barji Nafshi',                 fr: 'Barchi Nafchi',                      it: 'Barchi Nafshi',                    he: 'בָּרְכִי נַפְשִׁי' },
  "L'David Hashem":           { es: 'LeDavid HaShem',               fr: 'LeDavid Hachem',                     it: 'LeDavid Hashem',                   he: 'לְדָוִד ה׳' },
  'Kaveh':                    { es: 'Kavé',                         fr: 'Kavéh',                              it: 'Kaveh',                            he: 'קַוֵּה' },
  'Six Rememberances':        { es: 'Seis Recordatorios',           fr: 'Six mémorations',                    it: 'Sei memorie',                      he: 'שש זכירות' },
  'Thirteen Principles':      { es: 'Trece Principios',             fr: 'Treize principes',                   it: 'Tredici principi',                 he: 'שלושה עשר עיקרים' },
  'Chapter of Fear of God':   { es: 'Capítulo del Temor de Dios',  fr: 'Chapitre de la crainte de Dieu',     it: 'Capitolo del timore di Dio',       he: 'פרק יראת שמים' },
  'Chapter of Repentance':    { es: 'Capítulo del Arrepentimiento', fr: 'Chapitre du repentir',               it: 'Capitolo del pentimento',          he: 'פרק התשובה' },
  'Chapter of Manna':         { es: 'Capítulo del Maná',            fr: 'Chapitre de la manne',               it: 'Capitolo della manna',             he: 'פרק המן' },
  'Supplications After Prayers': { es: 'Súplicas tras la Tefilá',  fr: 'Supplications après la prière',      it: 'Suppliche dopo la preghiera',      he: 'תחנות אחרי התפילה' },
  'Chapter of Song':          { es: 'Capítulo del Canto',           fr: 'Chapitre du chant',                  it: 'Capitolo del canto',               he: 'פרק השיר' },
  'Sefirat HaOmer':           { es: 'Sefirat HaOmer',               fr: 'Séfirat HaOmer',                     it: "Conteggio dell'Omer",              he: 'סְפִירַת הָעֹמֶר' },
  'Bedtime Shema':            { es: 'Shemá antes de dormir',        fr: 'Chéma du coucher',                   it: 'Shemà della sera',                 he: 'קריאת שמע על המיטה' },
  'Priestly Blessing':        { es: 'Birkat Kohaním',               fr: 'Bénédiction sacerdotale',            it: 'Benedizione sacerdotale',          he: 'בִּרְכַּת כֹּהֲנִים' },
  'Birkat Hamazon':           { es: 'Birkat HaMazón',               fr: 'Birkat Hamazone',                    it: 'Birkat Hamazon',                   he: 'בִּרְכַּת הַמָּזוֹן' },

  // ── SubGroup headers ─────────────────────────────────────────────────────
  'Preparatory Prayers':      { es: 'Preparación',                  fr: 'Prières préparatoires',              it: 'Preghiere preparatorie',           he: 'תפילות הכנה' },
}

export function tSef(title, lang) {
  if (!title || lang === 'en') return title
  const entry = TITLES[title]
  if (!entry) return title
  return entry[lang] || entry.es || title
}
