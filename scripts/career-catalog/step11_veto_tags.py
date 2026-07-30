"""Vétó-címkék (occupation.attrs) — determinisztikus kizárás-alap.

Miért: a „mit NEM szeretnél?" wizard-kérdés kemény szűrője. Aki kizárja a
gyerekekkel való munkát, annál a `children` címkés szerep (dadus, tanító) SOHA
nem jelenik meg. A címkék forrása mérhető adat + struktúra, nem találgatás:

  1. O*NET Work Context (CX, 1-5) és Work Activities (IM, 1-5) küszöbökkel —
     betegség-expozíció, magasság, veszély, kültér, vezetés, konfliktus,
     ügyfél-front, értékesítés, gondozás, fizikai munka, ülő/képernyős,
     monotónia; Work Schedules (CTP 2. kategória) = szabálytalan munkarend %.
  2. ISCO-4 struktúra ott, ahol az O*NET-ben nincs közvetlen mérés
     (gyerekek: tanár/óvodapedagógus/gyermekgondozó csoportok).
  3. magyar név-kulcsszavak (gyermek…, állat…).
  4. SOC-szintű kézi felülbírálás (mindent felülír).

Hiányzó SOC-adatnál a bázis-kód (xx-xxxx.00) értékei lépnek be.
Kimenet: occupations.core/archived.json `attrs` mező + review-Excel.
"""
import json, os, re, collections
import openpyxl
from openpyxl.styles import Font, Alignment

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ONET = os.path.join(BASE, "onet", "v303", "db_30_3_text")
REPO = os.path.dirname(BASE)
CORE = os.path.join(REPO, "src/lib/career/catalog/occupations.core.json")
ARCHIVED = os.path.join(REPO, "src/lib/career/catalog/occupations.archived.json")

# ── O*NET elemek ─────────────────────────────────────────────────────────────
CONTEXT = {  # Scale ID = CX (1-5)
    "disease": "4.C.2.c.1.b",       # Exposed to Disease or Infections
    "heights": "4.C.2.c.1.c",       # Exposed to High Places
    "hazardCond": "4.C.2.c.1.d",    # Exposed to Hazardous Conditions
    "hazardEquip": "4.C.2.c.1.e",   # Exposed to Hazardous Equipment
    "contaminants": "4.C.2.b.1.d",  # Exposed to Contaminants
    "outdoors": "4.C.2.a.1.c",      # Outdoors, Exposed to Weather
    "vehicleEnclosed": "4.C.2.a.1.f",
    "vehicleOpen": "4.C.2.a.1.e",
    "angry": "4.C.1.d.2",           # Dealing With Unpleasant/Angry People
    "violent": "4.C.1.d.3",         # Dealing with Violent People
    "customers": "4.C.1.b.1.f",     # Deal With External Customers
    "sitting": "4.C.2.d.1.a",       # Spend Time Sitting
    "standing": "4.C.2.d.1.b",
    "repeating": "4.C.3.b.7",       # Importance of Repeating Same Tasks
    "repetitiveMotion": "4.C.2.d.1.i",
}
ACTIVITY = {  # Scale ID = IM (1-5)
    "caring": "4.A.4.a.5",          # Assisting and Caring for Others
    "selling": "4.A.4.a.6",         # Selling or Influencing Others
    "publicPerform": "4.A.4.a.8",   # Performing for/Working With the Public
    "physical": "4.A.3.a.1",        # Performing General Physical Activities
    "vehicleOps": "4.A.3.a.4",      # Operating Vehicles/Equipment
}
SCHEDULES = "4.C.3.d.4"             # CTP, 2. kategória = szabálytalan %

# ── Metrikus szabályok (küszöbök az 1-5 skálán; irregular: %) ────────────────
def metric_tags(m):
    tags = set()
    g = lambda k, d=0.0: m.get(k, d)  # noqa: E731
    if g("disease") >= 3.5: tags.add("blood")
    if g("heights") >= 3.0: tags.add("heights")
    if max(g("hazardCond"), g("hazardEquip"), g("contaminants")) >= 3.5: tags.add("hazard")
    if g("outdoors") >= 3.5: tags.add("outdoor")
    if g("vehicleEnclosed") >= 4.0 or g("vehicleOpen") >= 3.5 or g("vehicleOps") >= 3.5:
        tags.add("driving")
    if g("angry") >= 3.8 or g("violent") >= 2.5: tags.add("conflict")
    if g("customers") >= 4.3 or g("publicPerform") >= 4.0: tags.add("customers")
    if g("selling") >= 3.5: tags.add("sales")
    if g("caring") >= 4.0: tags.add("care")
    if g("irregular") >= 40.0: tags.add("shift")
    if g("physical") >= 3.5 or g("standing") >= 4.2: tags.add("physical")
    if g("sitting") >= 4.3: tags.add("screen")
    if g("repeating") >= 3.8 or g("repetitiveMotion") >= 4.0: tags.add("monotony")
    return tags

# ── Strukturális szabályok ───────────────────────────────────────────────────
# gyerekek: tanárok (233x/234x), gyermekgondozás (5311/5312) — az O*NET-ben
# nincs „gyerekekkel dolgozik" mérés, ezért itt struktúra dönt.
CHILDREN_ISCO = {"2330", "2341", "2342", "5311", "5312"}
CHILDREN_SOC_PREFIX = ("25-2",)  # K-12 tanárok
CARE_ISCO = {"2221", "3221", "5321", "5322", "5329", "3412", "2635", "3258"}
ANIMALS_ISCO = {"2250", "3240", "5164"}

KEYWORDS = [
    (r"gyermek|gyerek|óvod|dadus|bébisz|tanító\b|csecsemő|pediát|iskolapszich|ifjúság", "children"),
    (r"állatorvos|állatgondoz|állattenyészt", "animals"),
    (r"ápol|gondozó|mentőtiszt|mentőápoló|hospice", "care"),
]

# SOC-szintű kézi felülbírálás: {SOC: {"add": [...], "remove": [...]}}
SOC_OVERRIDE = {
    # Parkgondozó: a "gondozó" kulcsszó növényre vonatkozik, nem emberre.
    "37-3011.00": {"remove": ["care"]},
}

VALID = {"children", "care", "blood", "customers", "sales", "conflict", "shift",
         "physical", "outdoor", "screen", "driving", "heights", "hazard",
         "monotony", "animals"}


def read(name):
    with open(os.path.join(ONET, name), encoding="utf-8") as fh:
        header = fh.readline().rstrip("\n").split("\t")
        for line in fh:
            yield dict(zip(header, line.rstrip("\n").split("\t")))


# ── O*NET beolvasás ──────────────────────────────────────────────────────────
metrics = collections.defaultdict(dict)
wanted_ctx = {v: k for k, v in CONTEXT.items()}
for r in read("Work Context.txt"):
    soc = r["O*NET-SOC Code"]
    try:
        if r["Scale ID"] == "CX" and r["Element ID"] in wanted_ctx:
            metrics[soc][wanted_ctx[r["Element ID"]]] = float(r["Data Value"])
        elif r["Scale ID"] == "CTP" and r["Element ID"] == SCHEDULES and r["Category"] == "2":
            metrics[soc]["irregular"] = float(r["Data Value"])
    except (ValueError, KeyError):
        continue
wanted_act = {v: k for k, v in ACTIVITY.items()}
for r in read("Work Activities.txt"):
    if r["Scale ID"] != "IM" or r["Element ID"] not in wanted_act:
        continue
    try:
        metrics[r["O*NET-SOC Code"]][wanted_act[r["Element ID"]]] = float(r["Data Value"])
    except ValueError:
        continue


def metrics_for(soc):
    if soc in metrics:
        return metrics[soc], soc
    base = soc.split(".")[0] + ".00"
    if base in metrics:
        return metrics[base], base
    return {}, None


# ISCO-4 csoportátlag fallback azokra, ahol az O*NET-ben nincs adat (pl. Taxis) —
# a katalógus azonos ISCO-csoportú, adatolt tételeiből.
def isco_group_means(all_occupations):
    groups = collections.defaultdict(list)
    for occ in all_occupations:
        isco = occ.get("isco")
        m, source = metrics_for(occ["id"])
        if isco and source:
            groups[isco].append(m)
    means = {}
    for isco, rows in groups.items():
        keys = set().union(*rows)
        means[isco] = {k: sum(r.get(k, 0.0) for r in rows) / len(rows) for k in keys}
    return means


def tags_for(occupation, group_means):
    soc = occupation["id"]
    isco = occupation.get("isco") or ""
    name = occupation.get("hu", "")
    m, source = metrics_for(soc)
    if source is None and isco in group_means:
        m, source = group_means[isco], f"isco:{isco}"
    tags = metric_tags(m)
    if isco in CHILDREN_ISCO or any(soc.startswith(p) for p in CHILDREN_SOC_PREFIX):
        tags.add("children")
    if isco in CARE_ISCO:
        tags.add("care")
    if isco in ANIMALS_ISCO:
        tags.add("animals")
    for pattern, tag in KEYWORDS:
        if re.search(pattern, name, re.IGNORECASE):
            tags.add(tag)
    override = SOC_OVERRIDE.get(soc, {})
    tags |= set(override.get("add", []))
    tags -= set(override.get("remove", []))
    return sorted(tags & VALID), source


def process(path, group_means):
    data = json.load(open(path))
    missing = []
    fallback = []
    for occupation in data["occupations"]:
        tags, source = tags_for(occupation, group_means)
        occupation["attrs"] = tags
        if source is None:
            missing.append(occupation["hu"])
        elif str(source).startswith("isco:"):
            fallback.append(f"{occupation['hu']} ({', '.join(tags) or '–'})")
    json.dump(data, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
    return data["occupations"], missing, fallback


all_occs = (json.load(open(CORE))["occupations"] + json.load(open(ARCHIVED))["occupations"])
GROUP_MEANS = isco_group_means(all_occs)
active, missing, fallback = process(CORE, GROUP_MEANS)
process(ARCHIVED, GROUP_MEANS)
print("ISCO-fallback:", len(fallback))
for line in fallback:
    print("  ", line)

dist = collections.Counter(tag for occ in active for tag in occ["attrs"])
print("aktív tételek:", len(active))
print("címke-megoszlás:", dict(dist.most_common()))
print("O*NET-adat nélkül (csak struktúra/kulcsszó):", len(missing), missing[:6])
for tag in sorted(VALID):
    names = [o["hu"] for o in active if tag in o["attrs"]]
    print(f"\n{tag} ({len(names)}):", "; ".join(names[:10]))

# ── review-Excel ─────────────────────────────────────────────────────────────
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Vétó-címkék"
ws.append(["SOC", "Magyar név", "ISCO", "Címkék (auto)", "JAVÍTOTT CÍMKÉK (ha kell)", "Megjegyzés"])
for cell in ws[1]:
    cell.font = Font(bold=True, size=10)
    cell.alignment = Alignment(wrap_text=True)
ws.freeze_panes = "A2"
for occ in sorted(active, key=lambda o: (",".join(o["attrs"]), o["hu"])):
    ws.append([occ["id"], occ["hu"], occ["isco"], ", ".join(occ["attrs"]) or "(nincs)", "", ""])
for col, width in {"A": 12, "B": 38, "C": 8, "D": 40, "E": 40, "F": 24}.items():
    ws.column_dimensions[col].width = width
out = os.path.join(REPO, "docs/product/data/veto-tags-review.xlsx")
wb.save(out)
print("\nreview:", out)
