// Breakdown of large Siddur Sefard weekday sections into their component prayers.
//
// Some Sefaria "sections" (e.g. "Hodu") are really a bundle of many distinct
// prayers. This map splits those bundles into one card per prayer.
// The Amidah is intentionally left whole.
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

  // ── Minjá · Korbanot ──────────────────────────────────────────────────
  [`${MI}, Korbanot`]: [
    { title: 'Parashat HaTamid',   heTitle: 'פָּרָשַׁת הַתָּמִיד',    seg: '1-3' },
    { title: 'Parashat HaKetóret', heTitle: 'פָּרָשַׁת הַקְּטֹֽרֶת',   seg: '4-6' },
    { title: 'Pitum HaKetóret',    heTitle: 'פִּטּוּם הַקְּטֹֽרֶת',    seg: '7-13' },
    { title: 'Aná BeJóaj',         heTitle: 'אָנָּא בְּכֹֽחַ',         seg: '15-22' },
    { title: 'Ashréi',             heTitle: 'אַשְׁרֵי',               seg: '23' },
    { title: 'Jatzí Kadish',       heTitle: 'חֲצִי קַדִּישׁ',          seg: '25-28' },
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
}
