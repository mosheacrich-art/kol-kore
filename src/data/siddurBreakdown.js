// Breakdown of large Siddur Sefard weekday sections into their component prayers.
//
// Each Sefaria "section" (e.g. "Hodu", "Amidah") is really a bundle of many
// distinct prayers. This map splits those bundles into one card per prayer.
//
// Keyed by the exact Sefaria section ref. Each part becomes its own item:
//   - `seg`  → a segment sub-ref into that section, e.g. "2-6" → "<section> 2-6"
//   - `ref`  → an explicit ref that overrides `<section> <seg>` (used to point the
//              Keriat Shemá card back at the whole section so it keeps the
//              dedicated taamim / 3-parashiot reader in TefilaStudy).
//
// Segment numbers are 1-indexed and were verified against the live Sefaria API.
// Ranges are deliberately generous at the edges; TefilaStudy strips the halachic
// rubrics (paragraphs without nikkud) before display.

const SH = 'Siddur Sefard, Weekday Shacharit'
const MI = 'Siddur Sefard, Weekday Mincha'
const MA = 'Siddur Sefard, Weekday Maariv'

export const SIDDUR_BREAKDOWN = {

  // ── Shajarit · Hodu (Pesukei DeZimrá) ──────────────────────────────────
  [`${SH}, Hodu`]: [
    { title: 'Hodu LaShem',                    heTitle: 'הוֹדוּ לַיהֹוָה',              seg: '2-6' },
    { title: 'Mizmor Shir Janucat HaBait',     heTitle: 'מִזְמוֹר שִׁיר חֲנֻכַּת הַבַּֽיִת', seg: '8' },
    { title: 'Adonai Melej',                   heTitle: 'יְהֹוָה מֶֽלֶךְ',              seg: '9-11' },
    { title: 'Baruj SheAmar',                  heTitle: 'בָּרוּךְ שֶׁאָמַר',           seg: '13' },
    { title: 'Mizmor LeTodá',                  heTitle: 'מִזְמוֹר לְתוֹדָה',           seg: '15' },
    { title: 'Yehí Jevod',                     heTitle: 'יְהִי כְבוֹד',               seg: '17' },
    { title: 'Ashréi',                         heTitle: 'אַשְׁרֵי',                   seg: '19' },
    { title: 'Halelu-Iá · Tehilim 146',        heTitle: 'הַלְלוּיָהּ · קמ״ו',          seg: '21' },
    { title: 'Halelu-Iá · Tehilim 147',        heTitle: 'הַלְלוּיָהּ · קמ״ז',          seg: '23' },
    { title: 'Halelu-Iá · Tehilim 148',        heTitle: 'הַלְלוּיָהּ · קמ״ח',          seg: '25' },
    { title: 'Halelu-Iá · Tehilim 149',        heTitle: 'הַלְלוּיָהּ · קמ״ט',          seg: '27' },
    { title: 'Halelu-Iá · Tehilim 150',        heTitle: 'הַלְלוּיָהּ · ק״נ',           seg: '29' },
    { title: 'Baruj Adonai LeOlam',            heTitle: 'בָּרוּךְ יְהֹוָה לְעוֹלָם',    seg: '31' },
    { title: 'Vayivárej David',                heTitle: 'וַיְבָֽרֶךְ דָּוִיד',          seg: '34-36' },
    { title: 'Vayosha · Az Yashir',            heTitle: 'וַיּֽוֹשַׁע · אָז יָשִׁיר',    seg: '38-39' },
  ],

  // ── Shajarit · Yishtabaj ───────────────────────────────────────────────
  [`${SH}, Yishtabach`]: [
    { title: 'Yishtabaj',      heTitle: 'יִשְׁתַּבַּח',     seg: '2' },
    { title: 'Jatzí Kadish',   heTitle: 'חֲצִי קַדִּישׁ',    seg: '6-9' },
  ],

  // ── Shajarit · Keriat Shemá uVirjoteha ─────────────────────────────────
  [`${SH}, The Shema`]: [
    { title: 'Barjú',            heTitle: 'בָּרְכוּ',            seg: '3-5' },
    { title: 'Yotzer Or',        heTitle: 'יוֹצֵר אוֹר',         seg: '7-14' },
    { title: 'Ahavá Rabá',       heTitle: 'אַהֲבָה רַבָּה',      seg: '16' },
    { title: 'The Shema',        heTitle: 'קְרִיאַת שְׁמַע',     ref: `${SH}, The Shema` },
    { title: 'Emet VeYatziv',    heTitle: 'אֱמֶת וְיַצִּיב',     seg: '31-38' },
  ],

  // ── Shajarit · Amidá (19 berajot) ─────────────────────────────────────
  [`${SH}, Amidah`]: [
    { title: '1 · Avot',                 heTitle: 'אָבוֹת',                    seg: '1-7' },
    { title: '2 · Guevurot',             heTitle: 'גְּבוּרוֹת',                seg: '8-19' },
    { title: 'Kedushá',                  heTitle: 'קְדֻשָּׁה',                 seg: '20-33' },
    { title: '3 · Kedushat HaShem',      heTitle: 'קְדֻשַּׁת הַשֵּׁם',          seg: '34-39' },
    { title: '4 · Biná',                 heTitle: 'בִּינָה',                   seg: '40-41' },
    { title: '5 · Teshuvá',              heTitle: 'תְּשׁוּבָה',                seg: '42-43' },
    { title: '6 · Selijá',               heTitle: 'סְלִיחָה',                  seg: '44-45' },
    { title: '7 · Gueulá',               heTitle: 'גְּאוּלָּה',                seg: '46-48' },
    { title: '8 · Refuá',                heTitle: 'רְפוּאָה',                  seg: '49-53' },
    { title: '9 · Birkat HaShanim',      heTitle: 'בִּרְכַּת הַשָּׁנִים',       seg: '54-60' },
    { title: '10 · Kibutz Galuyot',      heTitle: 'קִבּוּץ גָּלֻיּוֹת',         seg: '61-63' },
    { title: '11 · Mishpat',             heTitle: 'מִשְׁפָּט',                 seg: '64-69' },
    { title: '12 · Birkat HaMinim',      heTitle: 'בִּרְכַּת הַמִּינִים',       seg: '70-71' },
    { title: '13 · Tzadikim',            heTitle: 'צַדִּיקִים',                seg: '72-73' },
    { title: '14 · Binyan Yerushalayim', heTitle: 'בִּנְיַן יְרוּשָׁלַֽיִם',    seg: '74-75' },
    { title: '15 · Maljut Bet David',    heTitle: 'מַלְכוּת בֵּית דָּוִד',      seg: '76-77' },
    { title: '16 · Shomea Tefilá',       heTitle: 'שׁוֹמֵעַ תְּפִלָּה',         seg: '78-81' },
    { title: '17 · Avodá',               heTitle: 'עֲבוֹדָה',                  seg: '82-91' },
    { title: '18 · Hodaá',               heTitle: 'הוֹדָאָה',                  seg: '92-107' },
    { title: 'Birkat Kohanim',           heTitle: 'בִּרְכַּת כֹּהֲנִים',        seg: '108-115' },
    { title: '19 · Shalom',              heTitle: 'שָׁלוֹם',                   seg: '116-125' },
  ],

  // ── Minjá · Korbanot ──────────────────────────────────────────────────
  [`${MI}, Korbanot`]: [
    { title: 'Parashat HaTamid',   heTitle: 'פָּרָשַׁת הַתָּמִיד',    seg: '1-3' },
    { title: 'Parashat HaKetóret', heTitle: 'פָּרָשַׁת הַקְּטֹֽרֶת',   seg: '4-6' },
    { title: 'Pitum HaKetóret',    heTitle: 'פִּטּוּם הַקְּטֹֽרֶת',    seg: '7-13' },
    { title: 'Aná BeJóaj',         heTitle: 'אָנָּא בְּכֹֽחַ',         seg: '15-22' },
    { title: 'Ashréi',             heTitle: 'אַשְׁרֵי',               seg: '23' },
    { title: 'Jatzí Kadish',       heTitle: 'חֲצִי קַדִּישׁ',          seg: '25-28' },
  ],

  // ── Minjá · Amidá (19 berajot) ───────────────────────────────────────
  [`${MI}, Amidah`]: [
    { title: '1 · Avot',                 heTitle: 'אָבוֹת',                    seg: '1-7' },
    { title: '2 · Guevurot',             heTitle: 'גְּבוּרוֹת',                seg: '8-19' },
    { title: 'Kedushá',                  heTitle: 'קְדֻשָּׁה',                 seg: '20-33' },
    { title: '3 · Kedushat HaShem',      heTitle: 'קְדֻשַּׁת הַשֵּׁם',          seg: '34-39' },
    { title: '4 · Biná',                 heTitle: 'בִּינָה',                   seg: '40-41' },
    { title: '5 · Teshuvá',              heTitle: 'תְּשׁוּבָה',                seg: '42-43' },
    { title: '6 · Selijá',               heTitle: 'סְלִיחָה',                  seg: '44-45' },
    { title: '7 · Gueulá',               heTitle: 'גְּאוּלָּה',                seg: '46-49' },
    { title: '8 · Refuá',                heTitle: 'רְפוּאָה',                  seg: '50-51' },
    { title: '9 · Birkat HaShanim',      heTitle: 'בִּרְכַּת הַשָּׁנִים',       seg: '52-58' },
    { title: '10 · Kibutz Galuyot',      heTitle: 'קִבּוּץ גָּלֻיּוֹת',         seg: '59-60' },
    { title: '11 · Mishpat',             heTitle: 'מִשְׁפָּט',                 seg: '61-66' },
    { title: '12 · Birkat HaMinim',      heTitle: 'בִּרְכַּת הַמִּינִים',       seg: '67-68' },
    { title: '13 · Tzadikim',            heTitle: 'צַדִּיקִים',                seg: '69-70' },
    { title: '14 · Binyan Yerushalayim', heTitle: 'בִּנְיַן יְרוּשָׁלַֽיִם',    seg: '71-76' },
    { title: '15 · Maljut Bet David',    heTitle: 'מַלְכוּת בֵּית דָּוִד',      seg: '77-78' },
    { title: '16 · Shomea Tefilá',       heTitle: 'שׁוֹמֵעַ תְּפִלָּה',         seg: '79-83' },
    { title: '17 · Avodá',               heTitle: 'עֲבוֹדָה',                  seg: '84-93' },
    { title: '18 · Hodaá',               heTitle: 'הוֹדָאָה',                  seg: '94-109' },
    { title: 'Birkat Kohanim',           heTitle: 'בִּרְכַּת כֹּהֲנִים',        seg: '110-117' },
    { title: '19 · Shalom',              heTitle: 'שָׁלוֹם',                   seg: '118-123' },
    { title: 'Sof Tefilá',               heTitle: 'סוֹף תְּפִלָּה',             seg: '124-128' },
  ],

  // ── Arvit · Keriat Shemá uVirjoteha ──────────────────────────────────
  [`${MA}, The Shema`]: [
    { title: 'Barjú',                    heTitle: 'בָּרְכוּ',                  seg: '4-6' },
    { title: "Ma'ariv Aravim",           heTitle: 'מַעֲרִיב עֲרָבִים',         seg: '7' },
    { title: 'Ahavat Olam',              heTitle: 'אַהֲבַת עוֹלָם',            seg: '8' },
    { title: 'The Shema',                heTitle: 'קְרִיאַת שְׁמַע',           ref: `${MA}, The Shema` },
    { title: 'Emet VeEmuná',             heTitle: 'אֱמֶת וֶאֱמוּנָה',          seg: '22-24' },
    { title: 'Hashkivenu',               heTitle: 'הַשְׁכִּיבֵֽנוּ',           seg: '26' },
    { title: 'Baruj Adonai LeOlam',      heTitle: 'בָּרוּךְ יְהֹוָה לְעוֹלָם',  seg: '28-29' },
    { title: 'Jatzí Kadish',             heTitle: 'חֲצִי קַדִּישׁ',            seg: '31-33' },
  ],

  // ── Arvit · Amidá (19 berajot) ──────────────────────────────────────
  [`${MA}, Amidah`]: [
    { title: '1 · Avot',                 heTitle: 'אָבוֹת',                    seg: '1-7' },
    { title: '2 · Guevurot',             heTitle: 'גְּבוּרוֹת',                seg: '8-19' },
    { title: '3 · Kedushat HaShem',      heTitle: 'קְדֻשַּׁת הַשֵּׁם',          seg: '20-25' },
    { title: '4 · Biná',                 heTitle: 'בִּינָה',                   seg: '26-29' },
    { title: '5 · Teshuvá',              heTitle: 'תְּשׁוּבָה',                seg: '30-31' },
    { title: '6 · Selijá',               heTitle: 'סְלִיחָה',                  seg: '32-33' },
    { title: '7 · Gueulá',               heTitle: 'גְּאוּלָּה',                seg: '34-35' },
    { title: '8 · Refuá',                heTitle: 'רְפוּאָה',                  seg: '36-37' },
    { title: '9 · Birkat HaShanim',      heTitle: 'בִּרְכַּת הַשָּׁנִים',       seg: '38-44' },
    { title: '10 · Kibutz Galuyot',      heTitle: 'קִבּוּץ גָּלֻיּוֹת',         seg: '46-47' },
    { title: '11 · Mishpat',             heTitle: 'מִשְׁפָּט',                 seg: '48-52' },
    { title: '12 · Birkat HaMinim',      heTitle: 'בִּרְכַּת הַמִּינִים',       seg: '54-55' },
    { title: '13 · Tzadikim',            heTitle: 'צַדִּיקִים',                seg: '56-57' },
    { title: '14 · Binyan Yerushalayim', heTitle: 'בִּנְיַן יְרוּשָׁלַֽיִם',    seg: '58-59' },
    { title: '15 · Maljut Bet David',    heTitle: 'מַלְכוּת בֵּית דָּוִד',      seg: '60-61' },
    { title: '16 · Shomea Tefilá',       heTitle: 'שׁוֹמֵעַ תְּפִלָּה',         seg: '62-63' },
    { title: '17 · Avodá',               heTitle: 'עֲבוֹדָה',                  seg: '64-72' },
    { title: '18 · Hodaá',               heTitle: 'הוֹדָאָה',                  seg: '73-86' },
    { title: '19 · Shalom',              heTitle: 'שָׁלוֹם',                   seg: '87-92' },
    { title: 'Sof Tefilá · Kadish · Alenu', heTitle: 'סוֹף תְּפִלָּה', seg: '93-121' },
  ],
}
