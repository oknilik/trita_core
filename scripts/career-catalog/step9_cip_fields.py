"""Képzési TERÜLET a foglalkozásokhoz — O*NET CIP-crosswalkból.

A CIP (Classification of Instructional Programs) azt mondja meg, milyen képzési
programokból vezet út az adott foglalkozásba. A 2 jegyű CIP-családokat a mi
magyar képzési-terület kategóriáinkra képezzük le, így összevethető a felhasználó
végzettségének SZAKIRÁNYA a szerep belépési igényével — nem csak a szintje.
"""
import json, os, collections
import openpyxl

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "src", "cip.xlsx")
OUT = os.path.join(BASE, "build", "onet_cip_fields.json")

# 2 jegyű CIP-család → magyar képzési terület (a wizard kategóriái)
CIP_FAMILY_TO_FIELD = {
    "01": "natural_science",   # mezőgazdaság
    "03": "natural_science",   # természeti erőforrások
    "04": "tech_engineering",  # építészet
    "05": "humanities",
    "09": "humanities",        # kommunikáció, újságírás
    "10": "tech_engineering",  # kommunikációs technológiák
    "11": "tech_engineering",  # informatika
    "12": "trade",             # vendéglátás, személyi szolgáltatás
    "13": "pedagogy",
    "14": "tech_engineering",  # mérnöki
    "15": "tech_engineering",  # mérnöki technológiák
    "16": "humanities",        # idegen nyelvek
    "19": "pedagogy",
    "22": "legal",
    "23": "humanities",
    "24": "humanities",
    "25": "humanities",        # könyvtár
    "26": "natural_science",   # biológia
    "27": "natural_science",   # matematika
    "28": "none_other",        # katonai
    "29": "none_other",
    "30": "humanities",        # interdiszciplináris
    "31": "health",            # rekreáció, sport
    "38": "humanities",
    "39": "humanities",
    "40": "natural_science",   # fizika, kémia
    "41": "natural_science",
    "42": "humanities",        # pszichológia (HU-ban jellemzően bölcsész/társadalomtud.)
    "43": "legal",             # rendészet, tűzvédelem
    "44": "humanities",        # közigazgatás, szociális
    "45": "humanities",        # társadalomtudomány
    "46": "trade",             # építőipari szakmák
    "47": "trade",             # szerelő, javító
    "48": "trade",             # precíziós gyártás
    "49": "trade",             # közlekedés, szállítás
    "50": "arts",
    "51": "health",
    "52": "economics",
    "54": "humanities",        # történelem
    "60": "health",            # rezidensképzés
}

wb = openpyxl.load_workbook(SRC, read_only=True)
ws = wb.worksheets[0]

counts: dict[str, collections.Counter] = {}
header_seen = False
for row in ws.iter_rows(values_only=True):
    cells = [str(c).strip() if c is not None else "" for c in row]
    if not header_seen:
        if cells[0] == "2020 CIP Code":
            header_seen = True
        continue
    cip, _title, soc = cells[0], cells[1], cells[2]
    if not cip or not soc:
        continue
    field = CIP_FAMILY_TO_FIELD.get(cip[:2])
    if not field or field == "none_other":
        continue
    counts.setdefault(soc, collections.Counter())[field] += 1

result = {}
for soc, counter in counts.items():
    total = sum(counter.values())
    # A legerősebb terület mindig bekerül; a többi akkor, ha érdemi hányadot ad.
    ordered = counter.most_common()
    fields = [ordered[0][0]]
    for field, hits in ordered[1:]:
        if hits / total >= 0.15:
            fields.append(field)
    result[soc] = fields[:3]

json.dump(result, open(OUT, "w"), ensure_ascii=False)
print("foglalkozás képzési-terület adattal:", len(result))
dist = collections.Counter(f for fields in result.values() for f in fields)
print("terület-megoszlás:", dict(dist.most_common()))
for soc in ("15-1252.00", "29-1141.00", "23-1011.00", "47-2111.00", "13-2011.00"):
    print(" ", soc, result.get(soc))
