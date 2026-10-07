"""Genera index.html (el libro completo) a partir de data/raw/*.json.

Fuente: Siddur Edot HaMizrach (Sefaria, CC0).
Uso:  python build.py
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw")

# ───────────────────────── Estructura del libro ─────────────────────────
# grupo → partes → secciones (es, he, [archivos])
S = lambda es, he, *files: (es, he, list(files))

GROUPS = [
    ("Entre semana", [
        ("shajarit", "שחרית", "Shajarit", "Oración de la mañana", [
            S("Modé Aní", "מודה אני", "Preparatory_Prayers__Modeh_Ani"),
            S("Birkot HaShájar", "ברכות השחר", "Preparatory_Prayers__Morning_Blessings"),
            S("Birkot HaTorá", "ברכות התורה", "Preparatory_Prayers__Torah_Blessings"),
            S("Petijat Eliyahu", "פתיחת אליהו", "Weekday_Shacharit__Petichat_Eliyahu"),
            S("Talit", "עטיפת ציצית", "Weekday_Shacharit__Order_of_Talit"),
            S("Tefilín", "הנחת תפילין", "Weekday_Shacharit__Order_of_Tefillin"),
            S("Tefilat Janá", "תפילת חנה", "Weekday_Shacharit__Hannas_Prayer"),
            S("Korbanot", "קרבנות", "Weekday_Shacharit__Morning_Prayer"),
            S("Ketoret", "פטום הקטורת", "Weekday_Shacharit__Incense_Offering"),
            S("Hodu", "הודו", "Weekday_Shacharit__Hodu"),
            S("Pesukei DeZimrá", "פסוקי דזמרה", "Weekday_Shacharit__Pesukei_DZimra"),
            S("Shemá y sus bendiciones", "קריאת שמע וברכותיה", "Weekday_Shacharit__The_Shema"),
            S("Amidá", "עמידה", "Weekday_Shacharit__Amida"),
            S("Vidui", "וידוי", "Weekday_Shacharit__Vidui"),
            S("Lectura de la Torá", "קריאת התורה", "Weekday_Shacharit__Torah_Reading"),
            S("Ashré", "אשרי", "Weekday_Shacharit__Ashrei"),
            S("Uva LeTzión", "ובא לציון", "Weekday_Shacharit__Uva_LeSion"),
            S("Beit Yaakov", "בית יעקב", "Weekday_Shacharit__Beit_Yaakov"),
            S("Shir shel Yom", "שיר של יום", "Weekday_Shacharit__Song_of_the_Day"),
            S("Kavé", "קוה", "Weekday_Shacharit__Kaveh"),
            S("Alenu", "עלינו לשבח", "Weekday_Shacharit__Alenu"),
            S("Trece Principios de Fe", "שלשה עשר עיקרים", "Additions_for_Shacharit__Thirteen_Principles_of_Faith"),
            S("Diez Recuerdos", "עשר זכירות", "Additions_for_Shacharit__Ten_Remembrances"),
        ]),
        ("minja", "מנחה", "Minjá", "Oración de la tarde", [
            S("Korbanot y Ashré", "קרבנות ואשרי", "Weekday_Mincha__Offerings"),
            S("Amidá", "עמידה", "Weekday_Mincha__Amida"),
            S("Vidui", "וידוי", "Weekday_Mincha__Vidui"),
            S("Alenu", "עלינו לשבח", "Weekday_Mincha__Alenu"),
        ]),
        ("arvit", "ערבית", "Arvit", "Oración de la noche", [
            S("Barjú", "ברכו", "Weekday_Arvit__Barchu"),
            S("Shemá y sus bendiciones", "קריאת שמע וברכותיה", "Weekday_Arvit__The_Shema"),
            S("Amidá", "עמידה", "Weekday_Arvit__Amidah"),
            S("Alenu", "עלינו לשבח", "Weekday_Arvit__Alenu"),
        ]),
    ]),
    ("Bendiciones", [
        ("birkat-hamazon", "ברכת המזון", "Birkat Hamazón", "Bendición después de comer", [
            S("Birkat Hamazón", "ברכת המזון", "Post_Meal_Blessing"),
            S("Berajá Ajaroná", "ברכה מעין שלוש", "Al_Hamihya"),
            S("Berajot HaNehenín", "ברכות הנהנין", "Blessings_on_Enjoyments"),
        ]),
        ("shema-mita", "קריאת שמע שעל המטה", "Shemá al HaMitá", "Antes de dormir", [
            S("Shemá al HaMitá", "קריאת שמע שעל המיטה", "Bedtime_Shema"),
        ]),
    ]),
    ("Shabat", [
        ("kabalat-shabat", "קבלת שבת", "Kabalat Shabat", "Recibimiento del Shabat y Arvit", [
            S("Hadlakat Nerot", "הדלקת נרות", "Shabbat_Candle_Lighting"),
            S("Shir HaShirim", "שיר השירים", "Song_of_Songs"),
            S("Kabalat Shabat", "קבלת שבת", "Kabbalat_Shabbat"),
            S("Barjú", "ברכו", "Shabbat_Arvit__Barchu"),
            S("Shemá y sus bendiciones", "קריאת שמע וברכותיה", "Shabbat_Arvit__The_Shema"),
            S("Amidá", "עמידה", "Shabbat_Arvit__Magen_Avot"),
            S("Alenu", "עלינו לשבח", "Shabbat_Arvit__Alenu"),
        ]),
        ("seuda-shabat", "קידוש וסעודה", "Kidush y Seudá", "La mesa de Shabat", [
            S("Shalom Aleijem", "שלום עליכם", "Shabbat_Evening__Shalom_Alekhem"),
            S("Eshet Jayil", "אשת חיל", "Shabbat_Evening__Eshet_Hayil"),
            S("Atkinu Seudatá", "אתקינו סעודתא", "Shabbat_Evening__Atkenu_Seudata"),
            S("Kidush", "קידוש", "Shabbat_Evening__Kiddush"),
            S("Birkat HaBanim", "ברכת הבנים", "Shabbat_Evening__Blessing_of_Children"),
            S("Seudá", "סעודה", "Shabbat_Evening__First_Meal"),
            S("Zohar", "זוהר", "Shabbat_Evening__Zohar"),
            S("Zemirot", "זמירות", "Shabbat_Evening__Songs_for_Shabbat"),
        ]),
        ("shajarit-shabat", "שחרית של שבת", "Shajarit de Shabat", "Oración de la mañana", [
            S("Salmos de Shabat", "מזמורי שבת", "Shabbat_Shacharit__Psalms_for_Shabbat"),
            S("Pesukei DeZimrá", "פסוקי דזמרה", "Shabbat_Shacharit__Pesukei_DZimra"),
            S("Shemá y sus bendiciones", "קריאת שמע וברכותיה", "Shabbat_Shacharit__The_Shema"),
            S("Amidá", "עמידה", "Shabbat_Shacharit__Amidah"),
            S("Lectura de la Torá", "קריאת התורה", "Shabbat_Shacharit__Torah_Reading"),
            S("HaGomel", "ברכת הגומל", "Shabbat_Shacharit__HaGomel"),
            S("Zéved HaBat", "זבד הבת", "Shabbat_Shacharit__Zeved_HaBat"),
            S("Haftará", "הפטרה", "Shabbat_Shacharit__Haftarah"),
            S("Birkat HaJódesh", "ברכת החדש", "Shabbat_Shacharit__Birkat_HaChodesh"),
            S("Ashré", "אשרי", "Shabbat_Shacharit__Ashrei"),
        ]),
        ("musaf-shabat", "מוסף של שבת", "Musaf de Shabat", "Oración adicional", [
            S("Amidá de Musaf", "עמידת מוסף", "Shabbat_Mussaf__Amida"),
            S("Ketoret", "פטום הקטורת", "Shabbat_Mussaf__Incense_Offering"),
            S("Alenu", "עלינו לשבח", "Shabbat_Mussaf__Alenu"),
        ]),
        ("kidush-hayom", "קידוש היום", "Kidush del día", "Kidush de la mañana de Shabat", [
            S("Kidush", "קידוש היום", "Daytime_Meal__Kiddush"),
        ]),
        ("minja-shabat", "מנחה של שבת", "Minjá de Shabat", "Oración de la tarde", [
            S("Korbanot", "קרבנות", "Shabbat_Mincha__Offerings"),
            S("Uva LeTzión", "ובא לציון", "Shabbat_Mincha__Uva_LeSion"),
            S("Amidá", "עמידה", "Shabbat_Mincha__Amida"),
            S("Alenu", "עלינו לשבח", "Shabbat_Mincha__Alenu"),
        ]),
        ("seuda-shlishit", "סעודה שלישית", "Seudá Shlishit", "La tercera comida", [
            S("Seudá Shlishit", "סעודה שלישית", "Third_Meal"),
        ]),
        ("havdala", "הבדלה", "Havdalá", "Salida del Shabat", [
            S("Antes de Havdalá", "מוצאי שבת", "Havdalah__Before_Havdalah"),
            S("Havdalá", "סדר הבדלה", "Havdalah__Havdala"),
            S("Zemirot de Motzaé Shabat", "שירים למוצאי שבת", "Havdalah__Motzei_Shabbat_Songs"),
            S("Veyitén Lejá", "ויתן לך", "Havdalah__Veyiten_Lecha"),
            S("Seudá de Melavé Malká", "סעודה רביעית", "Havdalah__Fourth_Meal"),
        ]),
    ]),
    ("Rosh Jodesh y fiestas", [
        ("rosh-jodesh", "ראש חודש", "Rosh Jodesh", "Comienzo del mes", [
            S("Hallel", "הלל", "Rosh_Hodesh__Hallel"),
            S("Uva LeTzión", "ובא לציון", "Rosh_Hodesh__Uva_LeSion"),
            S("Shir shel Yom", "שיר של יום", "Rosh_Hodesh__Song_of_the_Day"),
            S("Musaf", "מוסף", "Rosh_Hodesh__Mussaf"),
            S("Barjí Nafshí", "ברכי נפשי", "Rosh_Hodesh__Barchi_Nafshi"),
            S("Kavé", "קוה", "Rosh_Hodesh__Kaveh"),
            S("Ketoret", "פטום הקטורת", "Rosh_Hodesh__Incense_Offering"),
            S("Alenu", "עלינו לשבח", "Rosh_Hodesh__Alenu"),
        ]),
        ("januca", "חנוכה", "Janucá", "Fiesta de las luces", [
            S("Hadlakat HaJanukiá", "הדלקת נרות חנוכה", "Hanukkah__Menorah_Lighting"),
            S("Shajarit de Janucá", "שחרית לחנוכה", "Hanukkah__Shacharit"),
        ]),
    ]),
    ("Otras tefilot", [
        ("sefirat-haomer", "ספירת העומר", "Sefirat HaÓmer", "Cuenta del Ómer", [
            S("Sefirat HaÓmer", "ספירת העומר", "Counting_of_the_Omer"),
        ]),
        ("kidush-levana", "קידוש לבנה", "Kidush Levaná", "Bendición de la luna", [
            S("Birkat HaLevaná", "ברכת הלבנה", "Blessing_of_the_Moon"),
        ]),
    ]),
]

# ───────────────────────── Limpieza del texto ─────────────────────────
TAAMIM = re.compile("[֑-ֽ֯׀׃׆‍]")
NIKUD = re.compile("[ְ-ׇּׁׂ]")
LETTER = re.compile("[א-ת]")
CITE = re.compile(r"\s*\((?:בא[\"״'׳]?ח|סנסן)[^)]*\)")
SOF = "׃"


# Variantes femeninas ("האשה אומרת: מוֹדָה", "(לאשה תְּנִיחֶנָּה)"): se quitan, solo queda el texto masculino.
FEM_PAREN = re.compile(r"\s*\(\s*(?:ה?אשה אומרת|לאשה|לנקבה|ובאשה|ולאשה)[^)]*\)")
FEM_INLINE = re.compile(r"\s*(?:ה?אשה אומרת):?\s*[^\s:]+:?")
FEM_ONLY = {"בָּרוּךְ שֶׁעָשַׂנִי כִּרְצוֹנוֹ:"}
PAREN = re.compile(r"\(([^()]*)\)")


def strip_paren_notes(s):
    """Paréntesis: quita las palabras sin nikud (notas, citas); si no queda texto, quita el paréntesis entero."""
    def rep(m):
        kept = [w for w in m.group(1).split() if NIKUD.search(w)]
        return "(" + " ".join(kept) + ")" if kept else ""
    return PAREN.sub(rep, s)


def clean(s: str) -> str:
    s = s.replace(SOF, ":")
    s = TAAMIM.sub("", s)
    s = CITE.sub("", s)
    s = FEM_PAREN.sub("", s)
    s = FEM_INLINE.sub("", s)
    s = strip_paren_notes(s)
    s = s.replace("־", "־")  # maqaf se conserva
    s = re.sub(r"[ \t ]+", " ", s).strip()
    return s


def pointed(s):
    return bool(NIKUD.search(s))


def esc(s):
    return html.escape(s, quote=False)


try:
    with open(os.path.join(HERE, "data", "rubrics_es.json"), encoding="utf8") as _f:
        RUB_ES = json.load(_f)
except OSError:
    RUB_ES = {}


def rub_span(joined):
    es = RUB_ES.get(joined)
    if es == "":
        return ""
    if es:
        return '<span class="r" lang="es" dir="ltr">' + esc(es) + "</span>"
    return '<span class="r">' + esc(joined) + "</span>"


def tokens_to_html(text):
    """Marca como indicación (rúbrica) las rachas de palabras sin nikud."""
    toks = text.split(" ")
    out, run = [], []

    def flush():
        if not run:
            return
        joined = " ".join(run)
        letters = len(LETTER.findall(joined))
        if letters >= 3:
            pass  # indicación / comentario: no se muestra
        else:
            out.append(esc(joined))
        run.clear()

    for t in toks:
        is_plain = bool(LETTER.search(t)) and not NIKUD.search(t)
        is_punct = not LETTER.search(t)
        if is_plain or (is_punct and run):
            run.append(t)
        else:
            flush()
            out.append(esc(t))
    flush()
    return " ".join(out)


def paragraphs(parts):
    """Convierte la lista cruda a (tipo, html) con tipo 'p' (texto) o 'r' (indicación)."""
    items = [clean(x) for x in parts if isinstance(x, str)]
    items = [x for x in items if x]
    # quita títulos redundantes al inicio (cortos y sin nikud)
    drops = 0
    while items and drops < 2 and not pointed(items[0]) and len(items[0].split()) <= 3:
        items.pop(0)
        drops += 1
    out = []
    for x in items:
        if not pointed(x) or x in FEM_ONLY:
            continue  # indicaciones y comentarios fuera
        h = tokens_to_html(x).strip()
        if NIKUD.search(h):
            out.append(("p", h, 0, False))
    return out


def load(key):
    path = os.path.join(RAW, key + ".json")
    with open(path, encoding="utf8") as f:
        data = json.load(f)
    flat = []

    def fl(x):
        if isinstance(x, list):
            for y in x:
                fl(y)
        else:
            flat.append(x)

    fl(data["text"])
    return flat


# ───────────────────────── Render ─────────────────────────
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"]
ORN = '<div class="orn" aria-hidden="true"><i></i></div>'


# atajos dentro del índice: parte -> [(etiqueta es, hebreo, destino)]
ANCHORS = {"shajarit-11": ("baruj-sheamar", "שאמר והיה"), "minja-1": ("ashrei", "אשרי יושבי")}
SHORTCUTS = {
    "shajarit": [("Desde el principio", "", "shajarit"), ("Tefilín", "תפילין", "shajarit-6"), ("Hodu", "הודו", "shajarit-10"),
                 ("Baruj Sheamar", "ברוך שאמר", "baruj-sheamar"), ("Shemá", "שמע", "shajarit-12"),
                 ("Amidá", "עמידה", "shajarit-13")],
    "minja": [("Desde el principio", "", "minja"), ("Ashré Yoshvé", "אשרי יושבי", "ashrei")],
}


def render_section(pid, idx, es, he, files, part_es=''):
    sid = f"{pid}-{idx + 1}"
    body = []
    anchor = ANCHORS.get(sid)
    for key in files:
        for kind, h, words, is_es in paragraphs(load(key)):
            if kind == "p":
                aid = ""
                if anchor and NIKUD.sub("", re.sub("<[^>]+>", "", h)).__contains__(anchor[1]):
                    aid = f' id="{anchor[0]}"'
                    anchor = None
                body.append(f'<p class="t"{aid} lang="he">{h}</p>')
            else:
                cls = "r short" if words <= 6 else "r"
                attrs = 'lang="es" dir="ltr"' if is_es else 'lang="he"'
                body.append(f'<p class="{cls}" {attrs}>{h}</p>')
    if not body:
        return "", sid
    return (
        f'<article class="sec" id="{sid}" data-es="{esc(es)}" lang="he">\n'
        f'<header class="sec-head"><h3 class="he">{esc(he)}</h3><p class="es">{esc(es)}</p>{ORN}</header>\n'
        + "\n".join(body)
        + "\n</article>\n"
    ), sid


def build():
    book, toc_inline, toc_drawer = [], [], []
    n = 0
    for gname, parts in GROUPS:
        toc_inline.append(f'<h2 class="toc-group">{esc(gname)}</h2><ol class="toc">')
        toc_drawer.append(f'<h2 class="toc-group">{esc(gname)}</h2>')
        for pid, he, es, sub, sections in parts:
            roman = ROMAN[n]
            n += 1
            secs_html, links = [], []
            for i, (ses, she, files) in enumerate(sections):
                h, sid = render_section(pid, i, ses, she, files, es)
                if h:
                    secs_html.append(h)
                    links.append((sid, ses, she))
            book.append(
                f'<section class="part" id="{pid}" data-es="{esc(es)}">\n'
                f'<header class="half-title"><span class="num">{roman}</span>'
                f'<h2 class="he" lang="he">{esc(he)}</h2><p class="es">{esc(es)}</p>'
                f'{ORN}<p class="sub">{esc(sub)}</p></header>\n'
                + "\n".join(secs_html)
                + "</section>\n"
            )
            if pid in SHORTCUTS:
                quick = "".join(
                    f'<li><a href="#{t}"><span class="es{"" if h else " solo"}">{esc(l)}</span><span class="dots"></span>'
                    f'<span class="he" lang="he">{esc(h)}</span></a></li>'
                    for l, h, t in SHORTCUTS[pid]
                )
                toc_inline.append(
                    f'<li class="has-sub"><details><summary><span class="es">{esc(es)}</span><span class="dots"></span>'
                    f'<span class="he" lang="he">{esc(he)}</span></summary><ul class="quick">{quick}</ul></details></li>'
                )
            else:
                toc_inline.append(
                    f'<li><a href="#{pid}"><span class="es">{esc(es)}</span><span class="dots"></span>'
                    f'<span class="he" lang="he">{esc(he)}</span></a></li>'
                )
            if pid in SHORTCUTS:
                drawer_items = "".join(
                    f'<li><a href="#{t}"><span class="es{"" if h else " solo"}">{esc(l)}</span>'
                    f'<span class="he" lang="he">{esc(h)}</span></a></li>'
                    for l, h, t in SHORTCUTS[pid]
                )
            else:
                drawer_items = "".join(
                    f'<li><a href="#{sid}"><span class="es">{esc(ses)}</span>'
                    f'<span class="he" lang="he">{esc(she)}</span></a></li>'
                    for sid, ses, she in links
                )
            toc_drawer.append(
                f'<details class="toc-part"><summary><span class="es">{esc(es)}</span>'
                f'<span class="he" lang="he">{esc(he)}</span></summary><ul>'
                + drawer_items
                + f'</ul></details>'
            )
        toc_inline.append("</ol>")

    with open(os.path.join(HERE, "template.html"), encoding="utf8") as f:
        tpl = f.read()
    out = (
        tpl.replace("<!--TOC_INLINE-->", "\n".join(toc_inline))
        .replace("<!--TOC_DRAWER-->", "\n".join(toc_drawer))
        .replace("<!--BOOK-->", "\n".join(book))
    )
    css = open(os.path.join(HERE, "style.css"), encoding="utf8").read()
    js = open(os.path.join(HERE, "app.js"), encoding="utf8").read()
    i18n = open(os.path.join(HERE, "i18n.js"), encoding="utf8").read()
    out = out.replace('<script src="i18n.js"></script>', "<script>\n" + i18n + "\n</script>")
    out = out.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + css + "\n</style>")
    out = out.replace('<script src="app.js"></script>', "<script>\n" + js + "\n</script>")
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf8") as f:
        f.write(out)
    print("OK:", n, "partes ·", len(out) // 1024, "KB")


if __name__ == "__main__":
    build()
