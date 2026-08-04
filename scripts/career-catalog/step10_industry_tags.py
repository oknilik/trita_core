"""Tételes iparág-címkék a katalógusba (occupation.industries).

Miért: a scope-szűrés (a wizardban bejelölt terület = kemény szűrő) ISCO-prefix
alapon nem működik — a vezetői szerepek mind az 1-es főcsoportban ülnek, így az
„Informatikai igazgató" kiesne a tech-szűrőből. Itt minden foglalkozás explicit,
TÖBBES címkét kap; az üres címke-lista = univerzális szerep (pl. ügyvezető),
ami minden scope-ban megjelenik.

Rétegek (mindegyik hozzáadhat címkét):
  1. ISCO 2 jegyű prefix → iparágak (a wizard-térkép inverze)
  2. ISCO 4 jegyű kurált tábla (vezetői + határterületi csoportok)
  3. magyar név kulcsszavai (kereszt-címkékhez, pl. „egészségügyi informatikus")

Kimenet: occupations.core.json frissítve + review-Excel a docs/product/data alá.
"""
import json, os, re, collections
import openpyxl
from openpyxl.styles import Font, Alignment

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CORE = os.path.join(REPO, "src/lib/career/catalog/occupations.core.json")
ARCHIVED = os.path.join(REPO, "src/lib/career/catalog/occupations.archived.json")

# A wizard-iparágak ISCO-2 térképének inverze (egy prefix több iparághoz tartozhat)
PREFIX_TO_INDUSTRIES = {
    "25": ["tech"], "35": ["tech"],
    "22": ["health"], "32": ["health"],
    "23": ["education"],
    "24": ["finance", "people"],
    "33": ["finance", "sales"],
    "41": ["finance"], "42": ["finance", "sales"], "43": ["transport", "finance"],
    "52": ["sales"],
    "21": ["engineering", "science", "creative"],
    "26": ["creative", "media", "public"],
    "34": ["media", "hospitality", "services", "education"],
    "31": ["engineering", "science", "operations"],
    "81": ["operations"], "82": ["operations"], "83": ["transport", "operations"],
    "93": ["operations", "transport"],
    "54": ["public"], "11": ["public"], "01": ["public"],
    "71": ["trades", "engineering"], "72": ["trades"], "73": ["trades"],
    "74": ["trades"], "75": ["trades"],
    "51": ["hospitality", "services"], "91": ["services"], "94": ["hospitality"],
    "53": ["health", "services"],
    "61": ["trades"], "62": ["trades"], "92": ["trades"],
    "44": ["services"], "96": ["services"], "95": ["sales"],
}

# Vezetői és határterületi ISCO-4 csoportok — funkcionális terület szerint
ISCO4_OVERRIDE = {
    "1111": ["public"], "1112": ["public"], "1113": ["public"], "1114": ["public"],
    "1120": [],  # ügyvezető — univerzális
    "1211": ["finance"], "1212": ["people"], "1213": ["operations", "public"],
    "1219": [],  # üzleti szolgáltatási vezető — univerzális
    "1221": ["sales"], "1222": ["creative", "media"], "1223": ["science", "tech"],
    "1311": ["trades"], "1312": ["trades"],
    "1321": ["operations"], "1322": ["operations"], "1323": ["engineering"],
    "1324": ["transport", "operations"],
    "1330": ["tech"],
    "1341": ["services", "health"], "1342": ["health"], "1343": ["health"],
    "1344": ["public"], "1345": ["education"], "1346": ["finance"],
    "1349": ["public"],
    "1411": ["hospitality"], "1412": ["hospitality"], "1420": ["sales"],
    "1431": ["services"], "1439": ["services"],
    # határterületek a 2-9 főcsoportból
    "2166": ["creative", "media"],           # grafikus / multimédia (a webes al-szerepek SOC-szinten kapnak tech-et)
    "2431": ["creative", "media", "sales"],  # reklám / marketing
    "2432": ["media", "creative"],           # PR
    "2433": ["sales", "tech"],               # műszaki értékesítő
    "2434": ["sales", "tech"],               # IKT-értékesítő
    "2421": ["operations", "finance"],       # elemző / szervező
    "2423": ["people"], "2424": ["people", "education"],
    "2263": ["health", "operations"],        # munkavédelem
    "3252": ["health", "tech"],              # eü. informatika
    "3521": ["media", "creative"],           # hang/kép-technikusok (nem IT)
    "3339": ["sales"], "3332": ["hospitality", "services"],
    "3323": ["operations", "sales"],         # beszerző
    "3341": ["finance", "services"],
    "2265": ["health", "science"], "2131": ["science", "health"],
    "2622": ["education", "media"],
    "2330": ["education"], "2320": ["education"], "2310": ["education", "science"],
    "5165": ["education", "transport"],      # oktató (járművezetés)
    "3423": ["services", "education"],       # fitnesz / rekreáció — nem klinikum
    "5311": ["education", "services"],       # kisgyermeknevelő
    "5312": ["education"],                   # pedagógiai asszisztens — NEM egészségügy
    "5321": ["health"], "5322": ["health", "services"], "5329": ["health"],
    "5411": ["public"], "5412": ["public"], "5413": ["public"], "5414": ["public", "services"],
}

# Magyar név-kulcsszavak → plusz címke (kereszt-címkézéshez)
KEYWORDS = [
    (r"informatik|szoftver|\bIT\b|webfejleszt|adatbázis|adattudós|hálózati\b|kiberbiztonság|rendszergazda", "tech"),
    (r"egészségügy|orvos|ápol|klinik|gyógysz|fogász|pszicholó|terapeuta|mentő", "health"),
    (r"értékesít|kereskedelmi képvisel|üzletköt", "sales"),
    (r"pénzügy|számvit|könyvel|adó\w*tanácsad|biztosítás|hitel|banki|könyvvizsg", "finance"),
    (r"tanár|oktat|pedagóg|nevelő|képzés", "education"),
    (r"marketing|reklám|\bPR\b|kommunikáció", "creative"),
    (r"mérnök", "engineering"),
    (r"jogász|jogi|ügyvéd|bíró|közjegyz|compliance", "public"),
    (r"toborz|HR-|munkaügy|személyzeti", "people"),
    (r"logisztik|szállítmány|raktár|fuvar", "transport"),
    (r"szakács|séf|felszolgál|vendéglát|szálloda|turis|idegenvezet", "hospitality"),
    (r"kutató|laboratóriumi|biológus|vegyész|fizikus", "science"),
]

# SOC-szintű felülbírálás — ott, ahol az ISCO-csoport túl durva felbontású
# (egy csoportban ül a grafikus és a felülettervező, a dokumentátor és az
# eü. informatikus). Ez MINDENT felülír, kulcsszó sem fut rá.
SOC_OVERRIDE = {
    "27-1011.00": ["creative", "media"],          # Művészeti vezető — nem IT
    "27-1024.00": ["creative", "media"],          # Grafikus — nem IT
    "15-1255.00": ["tech", "creative"],           # Felhasználói felület tervező
    "15-1255.01": ["tech", "creative"],           # Videójáték-tervező
    "51-9162.00": ["operations", "trades"],       # CNC-programozó — gyártás, nem IT
    "11-9041.00": ["engineering", "science"],     # Műszaki igazgató
    "11-9121.01": ["science", "health"],          # Klinikai kutatási koordinátor
    "29-2072.00": ["health"],                     # Egészségügyi dokumentátor
}

VALID = {"tech","health","education","finance","sales","creative","media","operations",
         "people","public","engineering","hospitality","science","trades","transport","services"}


def tags_for(occupation):
    isco = occupation.get("isco") or ""
    name = occupation.get("hu", "")
    if occupation.get("id") in SOC_OVERRIDE:
        return list(SOC_OVERRIDE[occupation["id"]])
    if isco in ISCO4_OVERRIDE:
        base = list(ISCO4_OVERRIDE[isco])
        universal = len(base) == 0
    else:
        base = list(PREFIX_TO_INDUSTRIES.get(isco[:2], []))
        universal = False
    for pattern, tag in KEYWORDS:
        if re.search(pattern, name, re.IGNORECASE) and tag not in base:
            base.append(tag)
    if universal:
        return []
    return [t for t in dict.fromkeys(base) if t in VALID][:4]


def process(path):
    data = json.load(open(path))
    untagged = []
    for occupation in data["occupations"]:
        tags = tags_for(occupation)
        occupation["industries"] = tags
        if not tags and (occupation.get("isco") or "") not in ISCO4_OVERRIDE:
            untagged.append(occupation)
    json.dump(data, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
    return data["occupations"], untagged


active, untagged = process(CORE)
process(ARCHIVED)

dist = collections.Counter(tag for occ in active for tag in occ["industries"])
universal = [occ for occ in active if not occ["industries"]]
print("aktív tételek:", len(active))
print("címke-megoszlás:", dict(dist.most_common()))
print("univerzális (minden scope-ban):", len(universal), [o["hu"] for o in universal][:6])
print("címke nélkül maradt:", len(untagged), [o["hu"] for o in untagged][:8])

# review-Excel
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Iparág-címkék"
ws.append(["SOC", "Magyar név", "ISCO", "Címkék (auto)", "JAVÍTOTT CÍMKÉK (ha kell)", "Megjegyzés"])
for cell in ws[1]:
    cell.font = Font(bold=True, size=10)
    cell.alignment = Alignment(wrap_text=True)
ws.freeze_panes = "A2"
for occ in sorted(active, key=lambda o: (o["industries"] == [], ",".join(o["industries"]), o["hu"])):
    ws.append([occ["id"], occ["hu"], occ["isco"],
               ", ".join(occ["industries"]) or "(univerzális)", "", ""])
for col, width in {"A": 12, "B": 38, "C": 8, "D": 30, "E": 30, "F": 24}.items():
    ws.column_dimensions[col].width = width
out = os.path.join(REPO, "docs/product/data/industry-tags-review.xlsx")
wb.save(out)
print("review:", out)
