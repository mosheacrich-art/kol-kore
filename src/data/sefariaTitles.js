// Translation map for Sefaria siddur section titles (English → app languages)
// Keys are the exact English strings Sefaria returns in its index API.
// Falls back to the original English string if not found.

const TITLES = {
  // ── SubGroup headers ──────────────────────────────────────────────────────
  'Preparatory Prayers': {
    es: 'Preparación', fr: 'Prières préparatoires', it: 'Preghiere preparatorie', he: 'תפילות הכנה',
  },

  // ── Individual section titles ─────────────────────────────────────────────
  'Modeh Ani': {
    es: 'Modé Ani', fr: 'Modeh Ani', it: 'Modeh Ani', he: 'מוֹדֶה אֲנִי',
  },
  'Handwashing Morning Ritual': {
    es: 'Netilat Yadaim', fr: 'Lavage des mains', it: 'Lavaggio delle mani', he: 'נטילת ידיים',
  },
  'Morning Blessings': {
    es: 'Birjot HaShajar', fr: 'Bénédictions du matin', it: 'Benedizioni del mattino', he: 'בִּרְכוֹת הַשַּׁחַר',
  },
  'Tallit': {
    es: 'Talit', fr: 'Tallit', it: 'Tallit', he: 'טַלִּית',
  },
  'Tefillin': {
    es: 'Tefilín', fr: 'Téfilines', it: 'Tefillin', he: 'תְּפִלִּין',
  },
  'Torah Blessings': {
    es: 'Birjot HaTorá (mañana)', fr: 'Bénédictions de la Torah (matin)', it: 'Benedizioni della Torah (mattino)', he: 'בִּרְכוֹת הַתּוֹרָה',
  },
  'Blessings on Torah': {
    es: 'Birjot HaTorá', fr: 'Bénédictions de la Torah', it: 'Benedizioni della Torah', he: 'בִּרְכוֹת הַתּוֹרָה',
  },
  'Pesukei D\'Zimra': {
    es: 'Pesukei DeZimrá', fr: 'Pesouqei de-Zimra', it: 'Pesukei De-Zimra', he: 'פְּסוּקֵי דְּזִמְרָה',
  },
  'Barchu': {
    es: 'Barjú', fr: 'Barkou', it: 'Barchu', he: 'בָּרְכוּ',
  },
  'Shema and Its Blessings': {
    es: 'Shemá y sus Berajot', fr: 'Chema et ses Bénédictions', it: 'Shemà e le sue Benedizioni', he: 'שְׁמַע וּבִרְכוֹתֶיהָ',
  },
  'Shacharit Amidah': {
    es: 'Amidá de Shajarit', fr: 'Amida de Chaharit', it: 'Amidà di Shacharit', he: 'עֲמִידָה שַׁחֲרִית',
  },
  'Minchah Amidah': {
    es: 'Amidá de Minjá', fr: 'Amida de Minha', it: 'Amidà di Mincha', he: 'עֲמִידָה מִנְחָה',
  },
  'Maariv Amidah': {
    es: 'Amidá de Arvit', fr: 'Amida de Maariv', it: 'Amidà di Maariv', he: 'עֲמִידָה עַרְבִית',
  },
  'Amidah': {
    es: 'Amidá', fr: 'Amida', it: 'Amidà', he: 'עֲמִידָה',
  },
  'Tachanun': {
    es: 'Tajanuním', fr: 'Tahanoune', it: 'Tachanun', he: 'תַּחֲנוּנִים',
  },
  'Hallel': {
    es: 'Halel', fr: 'Hallel', it: 'Hallel', he: 'הַלֵּל',
  },
  'Torah Reading Weekday': {
    es: 'Lectura de la Torá', fr: 'Lecture de la Torah', it: 'Lettura della Torah', he: 'קְרִיאַת הַתּוֹרָה',
  },
  'Ashrei-Uva Letzion': {
    es: 'Ashrei y Uvá Letzión', fr: 'Achré et Ouva Létsione', it: 'Ashrei e Uva Letzion', he: 'אַשְׁרֵי וּבָא לְצִיּוֹן',
  },
  'Ashrei': {
    es: 'Ashrei', fr: 'Achré', it: 'Ashrei', he: 'אַשְׁרֵי',
  },
  'Uva Letzion': {
    es: 'Uvá Letzión', fr: 'Ouva Létsione', it: 'Uva Letzion', he: 'וּבָא לְצִיּוֹן',
  },
  'Aleinu': {
    es: 'Aleinu', fr: 'Alénou', it: 'Aleinu', he: 'עָלֵינוּ',
  },
  "Mourner's Kaddish": {
    es: 'Kadish del Doliente', fr: 'Kaddich du deuil', it: 'Kaddish del dolente', he: 'קַדִּישׁ יָתוֹם',
  },
  'Kaddish': {
    es: 'Kadish', fr: 'Kaddich', it: 'Kaddish', he: 'קַדִּישׁ',
  },
  'Half Kaddish': {
    es: 'Medio Kadish', fr: 'Demi-Kaddich', it: 'Mezzo Kaddish', he: 'חֲצִי קַדִּישׁ',
  },
  'Havdalah': {
    es: 'Havdalá', fr: 'Havdala', it: 'Havdalà', he: 'הַבְדָּלָה',
  },
  'Kedushah De\'Sidra': {
    es: 'Kedushá DeSidur', fr: 'Kédoucha de-Sidra', it: 'Kedushah De-Sidra', he: 'קְדֻשַּׁת דְּסִדְרָא',
  },
  'Kedushah': {
    es: 'Kedushá', fr: 'Kédoucha', it: 'Kedushah', he: 'קְדֻשָּׁה',
  },
  'Musaf Amidah': {
    es: 'Amidá de Musaf', fr: 'Amida de Moussaf', it: 'Amidà di Musaf', he: 'עֲמִידָה מוּסָף',
  },
  'Musaf Kedushah': {
    es: 'Kedushá de Musaf', fr: 'Kédoucha de Moussaf', it: 'Kedushah di Musaf', he: 'קְדֻשַּׁת מוּסָף',
  },
  'Shema': {
    es: 'Shemá', fr: 'Chéma', it: 'Shemà', he: 'שְׁמַע',
  },
  'Siddur': {
    es: 'Siddur', fr: 'Siddour', it: 'Siddur', he: 'סִדּוּר',
  },
  'Lecha Dodi': {
    es: 'Lejá Dodí', fr: 'Lékha Dodi', it: 'Lecha Dodi', he: 'לְכָה דוֹדִי',
  },
  'Kabbalat Shabbat': {
    es: 'Kabalat Shabat', fr: 'Kabbala Chabbat', it: 'Kabbalat Shabbat', he: 'קַבָּלַת שַׁבָּת',
  },
  'Birkat Hamazon': {
    es: 'Birkat HaMazón', fr: 'Birkat Hamazone', it: 'Birkat Hamazon', he: 'בִּרְכַּת הַמָּזוֹן',
  },
  'Counting of the Omer': {
    es: 'Sefirat HaOmer', fr: 'Décompte du Omer', it: 'Conteggio dell\'Omer', he: 'סְפִירַת הָעֹמֶר',
  },
  'Psalm of the Day': {
    es: 'Salmo del Día', fr: 'Psaume du jour', it: 'Salmo del giorno', he: 'שִׁיר שֶׁל יוֹם',
  },
  'Song of the Day': {
    es: 'Canción del Día', fr: 'Chant du jour', it: 'Canto del giorno', he: 'שִׁיר שֶׁל יוֹם',
  },
  'Ein Keloheinu': {
    es: 'Ein Keloheinu', fr: 'Ein Kélohenou', it: 'Ein Keloheinu', he: 'אֵין כֵּאלֹהֵינוּ',
  },
  'Pitum Haketoreth': {
    es: 'Pitum HaKetóret', fr: 'Pittoum Haketoreth', it: 'Pitum Haketoreth', he: 'פִּטּוּם הַקְּטֹרֶת',
  },
  'Study after Prayer': {
    es: 'Estudio tras la Tefilá', fr: 'Étude après la prière', it: 'Studio dopo la preghiera', he: 'לימוד אחרי התפילה',
  },
  'Minchah': {
    es: 'Minjá', fr: 'Minha', it: 'Mincha', he: 'מִנְחָה',
  },
  'Maariv': {
    es: 'Arvit', fr: 'Maariv', it: 'Maariv', he: 'עַרְבִית',
  },
  'Shacharit': {
    es: 'Shajarit', fr: 'Chaharit', it: 'Shacharit', he: 'שַׁחֲרִית',
  },
}

export function tSef(title, lang) {
  if (!title) return title
  const entry = TITLES[title]
  if (!entry) return title
  return entry[lang] || entry.es || title
}
