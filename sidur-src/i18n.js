/* Idioma del sidur: ?lang=xx o el idioma guardado por Parashapp (localStorage 'lang').
   Los textos del libro están en español; aquí se traducen (nombres de tefilot en la fonética de cada idioma).
   Orden de cada fila: en, fr, it, de, he (null en he = se muestra solo el nombre hebreo). */
(function () {
  'use strict';
  var L = ['en', 'fr', 'it', 'de', 'he'];
  var lang = new URLSearchParams(location.search).get('lang');
  if (!lang) { try { lang = localStorage.getItem('lang'); } catch (e) {} }
  var col = L.indexOf(lang);

  var D = {
    /* grupos */
    'Entre semana': ['Weekdays', 'En semaine', 'Giorni feriali', 'Wochentags', 'ימות החול'],
    'Bendiciones': ['Blessings', 'Bénédictions', 'Benedizioni', 'Segenssprüche', 'ברכות'],
    'Shabat': ['Shabbat', 'Chabbat', 'Shabbat', 'Schabbat', 'שבת'],
    'Rosh Jodesh y fiestas': ['Rosh Chodesh & holidays', "Roch 'Hodech et fêtes", 'Rosh Chodesh e feste', 'Rosch Chodesch & Feiertage', 'ראש חודש ומועדים'],
    'Otras tefilot': ['Other prayers', 'Autres prières', 'Altre tefillot', 'Weitere Gebete', 'תפילות נוספות'],

    /* partes y subtítulos */
    'Shajarit': ['Shacharit', "Cha'harit", 'Shachrit', 'Schacharit', null],
    'Oración de la mañana': ['Morning prayer', 'Prière du matin', 'Preghiera del mattino', 'Morgengebet', 'תפילת הבוקר'],
    'Minjá': ['Mincha', "Min'ha", 'Minchà', 'Mincha', null],
    'Oración de la tarde': ['Afternoon prayer', "Prière de l'après-midi", 'Preghiera del pomeriggio', 'Nachmittagsgebet', 'תפילת אחר הצהריים'],
    'Arvit': ['Arvit', 'Arvit', 'Arvit', 'Arwit', null],
    'Oración de la noche': ['Evening prayer', 'Prière du soir', 'Preghiera della sera', 'Abendgebet', 'תפילת הערב'],
    'Birkat Hamazón': ['Birkat Hamazon', 'Birkat Hamazone', 'Birkat Hamazon', 'Birkat Hamason', null],
    'Bendición después de comer': ['Grace after meals', 'Bénédiction après le repas', 'Benedizione dopo il pasto', 'Tischsegen nach dem Essen', 'ברכה אחרי האוכל'],
    'Shemá al HaMitá': ['Shema al HaMitah', 'Chema al HaMita', 'Shemà al HaMità', 'Schma al haMita', null],
    'Antes de dormir': ['Before sleep', 'Avant de dormir', 'Prima di dormire', 'Vor dem Schlafen', 'לפני השינה'],
    'Kabalat Shabat': ['Kabbalat Shabbat', 'Kabbalat Chabbat', 'Kabbalat Shabbat', 'Kabbalat Schabbat', null],
    'Recibimiento del Shabat y Arvit': ['Welcoming Shabbat and Arvit', 'Accueil du Chabbat et Arvit', 'Accoglienza dello Shabbat e Arvit', 'Empfang des Schabbat und Arwit', 'קבלת שבת וערבית'],
    'Kidush y Seudá': ['Kiddush & Seudah', 'Kiddouch et Séouda', 'Kiddush e Seudà', 'Kiddusch & Seuda', null],
    'La mesa de Shabat': ['The Shabbat table', 'La table du Chabbat', 'La tavola di Shabbat', 'Der Schabbattisch', 'שולחן שבת'],
    'Shajarit de Shabat': ['Shabbat Shacharit', "Cha'harit de Chabbat", 'Shachrit di Shabbat', 'Schacharit am Schabbat', null],
    'Musaf de Shabat': ['Shabbat Musaf', 'Moussaf de Chabbat', 'Musaf di Shabbat', 'Mussaf am Schabbat', null],
    'Oración adicional': ['Additional prayer', 'Prière additionnelle', 'Preghiera aggiuntiva', 'Zusatzgebet', 'תפילת מוסף'],
    'Kidush del día': ['Daytime Kiddush', 'Kiddouch du jour', 'Kiddush del giorno', 'Kiddusch am Tag', null],
    'Kidush de la mañana de Shabat': ['Shabbat morning Kiddush', 'Kiddouch du Chabbat matin', 'Kiddush di Shabbat mattina', 'Kiddusch am Schabbatmorgen', 'קידוש של שבת בבוקר'],
    'Minjá de Shabat': ['Shabbat Mincha', "Min'ha de Chabbat", 'Minchà di Shabbat', 'Mincha am Schabbat', null],
    'Seudá Shlishit': ['Seudah Shlishit', 'Séouda Chlichit', 'Seudà Shelishit', 'Seuda Schlischit', null],
    'La tercera comida': ['The third meal', 'Le troisième repas', 'Il terzo pasto', 'Die dritte Mahlzeit', 'הסעודה השלישית'],
    'Havdalá': ['Havdalah', 'Havdala', 'Havdalà', 'Hawdala', null],
    'Salida del Shabat': ['End of Shabbat', 'Sortie du Chabbat', 'Uscita dello Shabbat', 'Schabbatausgang', 'מוצאי שבת'],
    'Rosh Jodesh': ['Rosh Chodesh', "Roch 'Hodech", 'Rosh Chodesh', 'Rosch Chodesch', null],
    'Comienzo del mes': ['Start of the month', 'Début du mois', 'Inizio del mese', 'Monatsbeginn', 'תחילת החודש'],
    'Janucá': ['Chanukah', "'Hanoucca", 'Chanukkà', 'Chanukka', null],
    'Fiesta de las luces': ['Festival of lights', 'Fête des lumières', 'Festa delle luci', 'Lichterfest', 'חג האורים'],
    'Sefirat HaÓmer': ['Sefirat HaOmer', 'Séfirat HaOmer', 'Sefirat HaOmer', 'Sefirat haOmer', null],
    'Cuenta del Ómer': ['Counting of the Omer', "Compte de l'Omer", "Conteggio dell'Omer", 'Omerzählung', 'ספירת העומר'],
    'Kidush Levaná': ['Kiddush Levanah', 'Kiddouch Lévana', 'Kiddush Levanà', 'Kiddusch Lewana', null],
    'Bendición de la luna': ['Blessing of the moon', 'Bénédiction de la lune', 'Benedizione della luna', 'Mondsegen', 'ברכת הלבנה'],

    /* secciones */
    'Modé Aní': ['Modeh Ani', 'Modé Ani', 'Modè Anì', 'Modeh Ani', null],
    'Birkot HaShájar': ['Birkot HaShachar', "Birkot HaCha'har", 'Birkot HaShachar', 'Birkot haSchachar', null],
    'Birkot HaTorá': ['Birkot HaTorah', 'Birkot HaTora', 'Birkot HaTorà', 'Birkot haTora', null],
    'Petijat Eliyahu': ['Petichat Eliyahu', "Péti'hat Eliyahou", 'Petichat Eliyahu', 'Petichat Elijahu', null],
    'Talit': ['Tallit', 'Talit', 'Tallit', 'Tallit', null],
    'Tefilín': ['Tefillin', 'Téfilines', 'Tefillin', 'Tefillin', null],
    'Tefilat Janá': ['Tefillat Chana', "Téfilat 'Hana", 'Tefillat Channà', 'Tefillat Channa', null],
    'Korbanot': ['Korbanot', 'Korbanot', 'Korbanot', 'Korbanot', null],
    'Ketoret': ['Ketoret', 'Kétoret', 'Ketoret', 'Ketoret', null],
    'Hodu': ['Hodu', 'Hodou', 'Hodu', 'Hodu', null],
    'Pesukei DeZimrá': ['Pesukei DeZimrah', 'Psouké DeZimra', 'Pesuké DeZimrà', 'Pessuke deSimra', null],
    'Shemá y sus bendiciones': ['Shema and its blessings', 'Chema et ses bénédictions', 'Shemà e le sue benedizioni', 'Schma und seine Segenssprüche', null],
    'Amidá': ['Amidah', 'Amida', 'Amidà', 'Amida', null],
    'Vidui': ['Viduy', 'Vidouï', 'Viddui', 'Widduj', null],
    'Lectura de la Torá': ['Torah reading', 'Lecture de la Torah', 'Lettura della Torà', 'Toralesung', null],
    'Ashré': ['Ashrei', 'Achré', 'Ashrè', 'Aschre', null],
    'Uva LeTzión': ['Uva LeTzion', 'Ouva LeTsion', 'Uvà LeTzion', 'Uwa leZion', null],
    'Beit Yaakov': ['Beit Yaakov', 'Beth Yaakov', 'Bet Yaakov', 'Bejt Jaakow', null],
    'Shir shel Yom': ['Shir shel Yom', 'Chir chel Yom', 'Shir shel Yom', 'Schir schel Jom', null],
    'Kavé': ['Kaveh', 'Kavé', 'Kavè', 'Kawe', null],
    'Alenu': ['Aleinu', 'Alénou', 'Alenu', 'Alejnu', null],
    'Trece Principios de Fe': ['Thirteen Principles of Faith', 'Treize principes de foi', 'Tredici principi di fede', 'Dreizehn Glaubensgrundsätze', null],
    'Diez Recuerdos': ['Ten Remembrances', 'Dix souvenirs', 'Dieci ricordi', 'Zehn Erinnerungen', null],
    'Korbanot y Ashré': ['Korbanot & Ashrei', 'Korbanot et Achré', 'Korbanot e Ashrè', 'Korbanot & Aschre', null],
    'Barjú': ['Barchu', 'Barékhou', 'Barchù', 'Barchu', null],
    'Berajá Ajaroná': ['Beracha Acharonah', "Brakha A'harona", 'Berachà Acharonà', 'Bracha Acharona', null],
    'Berajot HaNehenín': ['Berachot HaNehenin', 'Brakhot HaNéhénine', 'Berachot HaNehenin', 'Brachot haNehenin', null],
    'Hadlakat Nerot': ['Hadlakat Nerot', 'Hadlakat Nérot', 'Hadlakat Nerot', 'Hadlakat Nerot', null],
    'Shir HaShirim': ['Shir HaShirim', 'Chir HaChirim', 'Shir HaShirim', 'Schir haSchirim', null],
    'Shalom Aleijem': ['Shalom Aleichem', 'Chalom Alékhem', 'Shalom Alechem', 'Schalom Alejchem', null],
    'Eshet Jayil': ['Eshet Chayil', "Échet 'Hayil", 'Eshet Chayil', 'Eschet Chajil', null],
    'Atkinu Seudatá': ['Atkinu Seudata', 'Atkinou Séoudata', 'Atkinu Seudatà', 'Atkinu Seudata', null],
    'Kidush': ['Kiddush', 'Kiddouch', 'Kiddush', 'Kiddusch', null],
    'Birkat HaBanim': ['Birkat HaBanim', 'Birkat HaBanim', 'Birkat HaBanim', 'Birkat haBanim', null],
    'Seudá': ['Seudah', 'Séouda', 'Seudà', 'Seuda', null],
    'Zohar': ['Zohar', 'Zohar', 'Zohar', 'Sohar', null],
    'Zemirot': ['Zemirot', 'Zémirot', 'Zemirot', 'Semirot', null],
    'Salmos de Shabat': ['Shabbat Psalms', 'Psaumes du Chabbat', 'Salmi di Shabbat', 'Schabbatpsalmen', null],
    'HaGomel': ['HaGomel', 'HaGomel', 'HaGomel', 'haGomel', null],
    'Zéved HaBat': ['Zeved HaBat', 'Zéved HaBat', 'Zeved HaBat', 'Sewed haBat', null],
    'Haftará': ['Haftarah', 'Haftara', 'Haftarà', 'Haftara', null],
    'Birkat HaJódesh': ['Birkat HaChodesh', "Birkat Ha'Hodech", 'Birkat HaChodesh', 'Birkat haChodesch', null],
    'Amidá de Musaf': ['Musaf Amidah', 'Amida de Moussaf', 'Amidà di Musaf', 'Mussaf-Amida', null],
    'Antes de Havdalá': ['Before Havdalah', 'Avant la Havdala', 'Prima della Havdalà', 'Vor der Hawdala', null],
    'Zemirot de Motzaé Shabat': ['Motzaei Shabbat songs', 'Chants de Motsaé Chabbat', 'Zemirot di Motzaè Shabbat', 'Lieder zu Mozaej Schabbat', null],
    'Veyitén Lejá': ['Veyiten Lecha', 'Véyitèn Lekha', 'Veyitten Lechà', 'Wejiten Lecha', null],
    'Seudá de Melavé Malká': ['Melaveh Malkah meal', 'Repas de Mélavé Malka', 'Seudà di Melavè Malkà', 'Melawe-Malka-Mahl', null],
    'Hallel': ['Hallel', 'Hallel', 'Hallel', 'Hallel', null],
    'Musaf': ['Musaf', 'Moussaf', 'Musaf', 'Mussaf', null],
    'Barjí Nafshí': ['Barchi Nafshi', 'Barkhi Nafchi', 'Barchì Nafshì', 'Barchi Nafschi', null],
    'Hadlakat HaJanukiá': ['Lighting the Chanukiah', "Allumage de la 'Hanoukia", 'Accensione della Chanukkià', 'Anzünden der Chanukkia', null],
    'Shajarit de Janucá': ['Chanukah Shacharit', "Cha'harit de 'Hanoucca", 'Shachrit di Chanukkà', 'Schacharit zu Chanukka', null],
    'Birkat HaLevaná': ['Birkat HaLevanah', 'Birkat HaLévana', 'Birkat HaLevanà', 'Birkat haLewana', null],

    /* atajos del índice */
    'Desde el principio': ['From the beginning', 'Depuis le début', "Dall'inizio", 'Von Anfang an', 'מההתחלה'],
    'Baruj Sheamar': ['Baruch Sheamar', 'Baroukh Chéamar', 'Baruch Sheamar', 'Baruch Scheamar', null],
    'Shemá': ['Shema', 'Chema', 'Shemà', 'Schma', null],
    'Ashré Yoshvé': ['Ashrei Yoshvei', 'Achré Yochvé', 'Ashrè Yoshvè', 'Aschre Joschwe', null],

    /* interfaz */
    'Índice': ['Contents', 'Sommaire', 'Indice', 'Inhalt', 'תוכן העניינים'],
    'Ajustes de lectura': ['Reading settings', 'Réglages de lecture', 'Impostazioni di lettura', 'Leseeinstellungen', 'הגדרות קריאה'],
    'Cerrar': ['Close', 'Fermer', 'Chiudi', 'Schließen', 'סגור'],
    'Tamaño': ['Size', 'Taille', 'Dimensione', 'Größe', 'גודל'],
    'Reducir': ['Smaller', 'Réduire', 'Riduci', 'Kleiner', 'הקטן'],
    'Aumentar': ['Larger', 'Agrandir', 'Ingrandisci', 'Größer', 'הגדל'],
    'Fondo': ['Background', 'Fond', 'Sfondo', 'Hintergrund', 'רקע'],
    'Blanco': ['White', 'Blanc', 'Bianco', 'Weiß', 'לבן'],
    'Auto': ['Auto', 'Auto', 'Auto', 'Auto', 'אוטומטי'],
    'Noche': ['Night', 'Nuit', 'Notte', 'Nacht', 'לילה'],
    'Nusaj Sefaradí': ['Nusach Sefardi', "Noussa'h Séfarade", 'Nusach Sefardita', 'Nusach Sefardi', 'נוסח ספרד'],
    'Edot HaMizraj': ['Edot HaMizrach', "Édot HaMizra'h", 'Edot HaMizrach', 'Edot haMisrach', 'עדות המזרח'],
    'Sidur': ['Siddur', 'Siddour', 'Siddur', 'Siddur', 'סידור'],
    'Donado por': ['Donated by', 'Offert par', 'Donato da', 'Gespendet von', 'נתרם על ידי'],
    'Continuar donde quedaste': ['Continue where you left off', 'Reprendre où vous en étiez', 'Riprendi da dove eri rimasto', 'Weiterlesen, wo du aufgehört hast', 'המשך מהמקום שבו הפסקת'],
    'Ir al índice': ['Go to contents', 'Aller au sommaire', "Vai all'indice", 'Zum Inhalt', 'לתוכן העניינים'],
    colophon: [
      'Text based on the <em>Siddur Edot HaMizrach</em>, published on Sefaria in the public domain (CC0). Cantillation marks and bibliographic references have been removed for cleaner reading. For any question of nusach or halacha, consult your printed siddur or your rabbi.',
      "Texte basé sur le <em>Siddur Edot HaMizrach</em>, publié sur Sefaria dans le domaine public (CC0). Les signes de cantillation et les références bibliographiques ont été retirés pour une lecture plus claire. Pour toute question de noussa'h ou de halakha, consultez votre siddour imprimé ou votre rav.",
      'Testo basato sul <em>Siddur Edot HaMizrach</em>, pubblicato su Sefaria nel pubblico dominio (CC0). Sono stati rimossi i segni di cantillazione e i riferimenti bibliografici per una lettura più pulita. Per ogni dubbio di nusach o halachà, consulta il tuo siddur stampato o il tuo rav.',
      'Text basierend auf dem <em>Siddur Edot HaMizrach</em>, auf Sefaria gemeinfrei veröffentlicht (CC0). Kantillationszeichen und Quellenangaben wurden für ein klareres Lesen entfernt. Bei Fragen zu Nusach oder Halacha frage in deinem gedruckten Siddur oder bei deinem Rabbiner nach.',
      'הטקסט מבוסס על <em>סידור עדות המזרח</em> שפורסם בספריא כנחלת הכלל (CC0). טעמי המקרא ומראי המקומות הוסרו לקריאה נקייה יותר. בכל שאלה של נוסח או הלכה יש לעיין בסידור מודפס או לשאול את הרב.'
    ],

    /* grabación del profesor (embed.js) */
    'Ahora toca la <b>última</b> palabra': ['Now tap the <b>last</b> word', 'Touchez maintenant le <b>dernier</b> mot', "Ora tocca l'<b>ultima</b> parola", 'Tippe jetzt auf das <b>letzte</b> Wort', 'עכשיו גע במילה <b>האחרונה</b>'],
    'Toca la <b>primera</b> palabra del tramo': ['Tap the <b>first</b> word of the range', 'Touchez le <b>premier</b> mot du passage', 'Tocca la <b>prima</b> parola del tratto', 'Tippe auf das <b>erste</b> Wort des Bereichs', 'גע במילה <b>הראשונה</b> של הקטע'],
    'Palabras': ['Words', 'Mots', 'Parole', 'Wörter', 'מילים'],
    'Cancelar': ['Cancel', 'Annuler', 'Annulla', 'Abbrechen', 'ביטול'],
    'Grabar': ['Record', 'Enregistrer', 'Registra', 'Aufnehmen', 'הקלט'],
    'Grabar tramo': ['Record range', 'Enregistrer un passage', 'Registra tratto', 'Bereich aufnehmen', 'הקלט קטע'],
    'Guardando…': ['Saving…', 'Enregistrement…', 'Salvataggio…', 'Speichern…', 'שומר…'],
    'Parar y guardar': ['Stop and save', 'Arrêter et enregistrer', 'Ferma e salva', 'Stoppen und speichern', 'עצור ושמור'],
    'Permiso de micrófono denegado': ['Microphone permission denied', 'Accès au micro refusé', 'Permesso microfono negato', 'Mikrofonzugriff verweigert', 'הגישה למיקרופון נדחתה'],
    'No se pudo usar el micrófono': ['Could not use the microphone', "Impossible d'utiliser le micro", 'Impossibile usare il microfono', 'Mikrofon konnte nicht verwendet werden', 'לא ניתן להשתמש במיקרופון'],
    'No se pudo guardar': ['Could not save', "Impossible d'enregistrer", 'Impossibile salvare', 'Speichern fehlgeschlagen', 'השמירה נכשלה']
  };

  function T(s) {
    if (col < 0) return s;
    var r = D[s];
    return r && r[col] ? r[col] : s;
  }
  window.sidurT = T;
  if (col < 0) return;

  var he = lang === 'he';
  var root = document.documentElement;
  root.lang = lang;
  root.setAttribute('data-lang', lang);

  // textos sueltos (no se toca el texto hebreo del libro)
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: function (n) {
      if (n.nodeType === 1) return n.matches('p.t, article.sec > p') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  var n, nodes = [];
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(function (node) {
    var v = node.nodeValue, k = v.trim();
    var el = node.parentElement;
    // en hebreo, los nombres transliterados del índice se vacían: ya está el nombre hebreo al lado
    if (he && el.classList.contains('es') && !el.classList.contains('solo') && D[k] && D[k][4] === null) { node.nodeValue = ''; return; }
    var t = T(k);
    if (t !== k) node.nodeValue = v.replace(k, t);
  });

  // atributos
  Array.prototype.forEach.call(document.querySelectorAll('[aria-label]'), function (el) {
    el.setAttribute('aria-label', T(el.getAttribute('aria-label')));
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-i]'), function (el) {
    var r = D[el.getAttribute('data-i')];
    if (r && r[col]) el.innerHTML = r[col];
  });
  // etiqueta de la barra superior ("dónde estoy")
  Array.prototype.forEach.call(document.querySelectorAll('[data-es]'), function (el) {
    var es = el.getAttribute('data-es');
    if (he) {
      var h = el.querySelector('.half-title .he, .sec-head .he');
      el.setAttribute('data-es', h ? h.textContent : T(es));
    } else {
      el.setAttribute('data-es', T(es));
    }
  });
})();
