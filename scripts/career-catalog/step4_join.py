"""Összefűzés: O*NET psychometria + ESCO magyar nevek/leírások + ISCO-08 csoport.
Kimenet: occupations-v2.json (gépi) + occupation-catalog-v2.md (emberi review)."""
import json, os, re, difflib, statistics as st
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "/Users/leinadoknilik/trita/codebase"
CW = json.load(open(os.path.join(BASE, "build", "crosswalk.json")))
ONET = json.load(open(os.path.join(BASE, "build", "onet_derived.json")))
ESCO = json.load(open(os.path.join(BASE, "build", "esco_hu.json")))
FEOR = json.load(open(os.path.join(BASE, "build", "isco_feor.json")))
TIER_PATH = os.path.join(BASE, "build", "hu_tiers.json")
TIERS = json.load(open(TIER_PATH)) if os.path.exists(TIER_PATH) else {}

DIM_HU = {"INTE": "H becsületesség-alázat", "RESO": "E emocionalitás", "TEMP": "X extraverzió",
          "ADAP": "A barátságosság", "THOR": "C lelkiismeretesség", "OPEN": "O nyitottság"}
DIM_SHORT = {"INTE": "H", "RESO": "E", "TEMP": "X", "ADAP": "A", "THOR": "C", "OPEN": "O"}
ENTRY_HU = {"open": "nincs formális belépési követelmény", "course": "tanfolyam / rövid képzés",
            "vocational": "szakma / technikus", "higher": "felsőfokú diploma",
            "specialized": "szakirányú diploma + szakvizsga/kamara"}
MAJOR_HU = {
    "0": "Fegyveres szervek foglalkozásai", "1": "Vezetők, felsővezetők",
    "2": "Felsőfokú képzettséget igénylő foglalkozások", "3": "Egyéb felsőfokú vagy középfokú képzettséget igénylő foglalkozások",
    "4": "Irodai és ügyviteli (adminisztratív) jellegű foglalkozások", "5": "Kereskedelmi és szolgáltatási foglalkozások",
    "6": "Mezőgazdasági és erdőgazdálkodási foglalkozások", "7": "Ipari és építőipari foglalkozások",
    "8": "Gépkezelők, összeszerelők, járművezetők", "9": "Szakképzettséget nem igénylő (egyszerű) foglalkozások",
}

occ_by_code = ESCO["occupations"]
groups = ESCO["iscoGroups"]
by_soc = defaultdict(list)
for r in CW["rows"]:
    by_soc[r["soc"]].append(r)

codes_sorted = sorted(occ_by_code)


def esco_lookup(code):
    """Pontos, majd leghosszabb prefix-egyezés az ESCO-kódra."""
    if code in occ_by_code:
        return occ_by_code[code]
    best = None
    for c in codes_sorted:
        if code.startswith(c) and (best is None or len(c) > len(best)):
            best = c
    return occ_by_code.get(best) if best else None


STOP = {"and", "or", "of", "the", "in", "for", "except", "all", "other", "workers", "worker"}


def tokens(title):
    words = re.findall(r"[a-z]+", title.lower())
    return {w.rstrip("s") for w in words if w not in STOP and len(w) > 2}


def title_similarity(a, b):
    """Szó-halmaz (Jaccard) egyezés — a karakter-szintű hasonlóság félrevezető
    ('elementary school teacher' vs 'secondary school teacher' magas, de rossz)."""
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    return inter / len(ta | tb)


def first_sentences(text, limit=260):
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return ""
    out = ""
    for part in re.split(r"(?<=[.!?])\s+", text):
        if out and len(out) + len(part) > limit:
            break
        out = (out + " " + part).strip()
        if len(out) > limit * 0.6:
            break
    return out


catalog = []
for soc, occ in ONET["occupations"].items():
    rows = by_soc.get(soc, [])
    if not rows:
        continue
    iscos = Counter(r["escoCode"].split(".")[0].zfill(4) for r in rows if r["escoCode"][:1].isdigit())
    modal_isco = iscos.most_common(1)[0][0] if iscos else None
    # Az ISCO-csoportot a crosswalk CSOPORT-szintű sora adja (csupasz 4 jegyű
    # ESCO-kód = ISCO-08 csoport); ez a hiteles hozzárendelés. Ha nincs ilyen sor,
    # a modális csoport a fallback. (A tételszintű sorok zajosak: egy SOC-hoz
    # több csoportból is kerülhet ESCO-foglalkozás.)
    group_rows = [r for r in rows if r["escoCode"].isdigit() and len(r["escoCode"]) == 4]
    if group_rows:
        group_rows.sort(key=lambda r: -title_similarity(r["escoTitle"], occ["enTitle"]))
        isco_from_group = group_rows[0]["escoCode"]
    else:
        isco_from_group = None
    isco = isco_from_group or modal_isco
    # A megnevezés-jelöltek csak a kiválasztott ISCO-csoportból jöhetnek
    rows = [r for r in rows if r["escoCode"].split(".")[0].zfill(4) == isco] or rows
    # legjobban egyező ESCO-tétel az EN cím alapján, előnyben a HU-adattal bíró
    scored = []
    for r in rows:
        hu = esco_lookup(r["escoCode"])
        sim = title_similarity(r["escoTitle"], occ["enTitle"])
        # bónuszok: van HU leírás; és a generikusabb (kevesebb szintű) ESCO-kód
        depth_bonus = 0.12 / max(1, r["escoCode"].count(".") ** 2)
        scored.append((sim + (0.15 if hu and hu.get("huDescription") else 0) + depth_bonus, r, hu))
    scored.sort(key=lambda x: -x[0])
    best_sim, best_row, best_hu = scored[0]
    group = groups.get(isco or "", {})

    official = FEOR["iscoNames"].get(isco or "", "") or group.get("huLabel", "")
    market = []
    for _, r, hu in scored[:8]:
        if hu and hu.get("huLabel"):
            market.append(hu["huLabel"])
        for a in (hu or {}).get("huAlt", [])[:2]:
            market.append(a)
    market = list(dict.fromkeys(market))[:8]
    # Kanonikus HU név: a piaci (ESCO) név csak ha a cím-egyezés meggyőző;
    # különben a hivatalos ISCO/FEOR csoportnév. A gyenge egyezés review-ra megy.
    name_confident = best_sim >= 0.60 and bool((best_hu or {}).get("huLabel"))
    hu_label = (best_hu or {}).get("huLabel") if name_confident else (official or (best_hu or {}).get("huLabel") or "")
    aliases = [m for m in market if m != hu_label][:6]

    hu_desc = first_sentences((best_hu or {}).get("huDescription", ""))
    feors = FEOR["iscoToFeor"].get(isco or "", [])
    catalog.append({
        "id": f"onet.{soc}",
        "soc": soc,
        "isco08": isco,
        "iscoNameHu": FEOR["iscoNames"].get(isco or "", ""),
        "feor08": [f["feor"] for f in feors],
        "feorLabel": feors[0]["feorName"] if feors else "",
        "escoCode": best_row["escoCode"],
        "huLabel": hu_label,
        "huLabelOfficial": official,
        "huMarketLabels": market,
        "huAliases": aliases,
        "nameConfident": name_confident,
        "feorAll": feors,
        "enTitle": occ["enTitle"],
        "iscoGroupHu": group.get("huLabel", ""),
        "huDescription": hu_desc,
        "enDescription": first_sentences(occ["enDescription"], 300),
        "entryLevel": occ["entryLevel"],
        "jobZone": occ["jobZone"],
        "eduMinHu": occ["eduMinHu"],
        "eduModalShare": occ["eduModalShare"],
        "riasec": occ["riasec"],
        "riasecTop": occ["riasecTop"],
        "demand": occ["demand"],
        "absolute": occ["absolute"],
        "huTier": TIERS.get(soc, 2),
        "include": TIERS.get(soc, 2) <= 2,
        "labelSource": "esco" if (best_hu or {}).get("huLabel") else ("isco" if group.get("huLabel") else "none"),
        "descSource": "esco" if hu_desc else "onet-en",
        "matchScore": round(best_sim, 2),
    })

catalog.sort(key=lambda c: (c["isco08"] or "9999", c["huLabel"]))

# ── gépi kimenet ────────────────────────────────────────────────────────────
os.makedirs(os.path.join(REPO, "docs/product/data"), exist_ok=True)
json.dump({
    "meta": {
        "version": "2026-07-30",
        "sources": {
            "psychometrics": "O*NET 30.3 Database (U.S. DOL/ETA), CC BY 4.0",
            "huLabels": "ESCO v1.2 (European Commission), ISCO-08 alapú",
            "crosswalk": "ESCO_to_ONET-SOC.xlsx (O*NET Resource Center)",
            "feor": "KSH ISCO-08 -> FEOR-08 fordítókulcs (fordkulcs_isco_feor_hu.pdf)",
        },
        "loadings": ONET["loadings"],
        "count": len(catalog),
    },
    "occupations": catalog,
}, open(os.path.join(REPO, "docs/product/data/occupations-v2.json"), "w"), ensure_ascii=False, indent=1)

# ── emberi review-doksi ─────────────────────────────────────────────────────
lines = []
A = lines.append
A("# Foglalkozás-katalógus v2 — nyers levezetés (review-hoz)")
A("")
A("> Generált dokumentum, 2026-07-30. Forrás-adatok: **O\\*NET 30.3 Database** "
  "(U.S. Department of Labor / ETA, CC BY 4.0), **ESCO v1.2** (Európai Bizottság, "
  "ISCO-08 alapú magyar megnevezések és leírások), **ESCO_to_ONET-SOC** crosswalk "
  "(O\\*NET Resource Center). Generátor: `scripts/career-catalog/` (ld. "
  "`career-engine-plan.md` F2). Gépi kimenet: `docs/product/data/occupations-v2.json`.")
A("")
A(f"**Tételszám:** {len(catalog)} foglalkozás · "
  f"kanonikus HU név piaci (ESCO) alakban: {sum(1 for c in catalog if c['nameConfident'])} · "
  f"hivatalos ISCO/FEOR csoportnévre visszaesett (név-review kell): "
  f"{sum(1 for c in catalog if not c['nameConfident'])} · "
  f"HU leírás ESCO-ból: {sum(1 for c in catalog if c['descSource']=='esco')} · "
  f"FEOR-08 kóddal: {sum(1 for c in catalog if c['feor08'])}")
A("")
A("## Hogyan olvasd")
A("")
A("- **Belépési minimum**: O\\*NET Job Zone (1–5) → a mi `entryLevel` skálánk, plusz a "
  "birtokosok által leggyakrabban megjelölt végzettségi szint (modal Required Level of "
  "Education), magyar megfelelőre fordítva. A százalék azt mutatja, a válaszadók mekkora "
  "része jelölte ezt a szintet.")
A("- **Holland-kód (RIASEC)**: O\\*NET Occupational Interests 1–7 skálája 0–100-ra vetítve, "
  "mind a hat betűre. A `top3` a három legerősebb betű.")
A("- **HEXACO differenciál cél-profil**: a 21 O\\*NET Work Style *előjeles hatás-értékéből* "
  "(Work Styles Impact, −3…+3) származtatva. Foglalkozáson belül centrálva (az „itt minden "
  "fontos” hatás kiszűrve), stílusonként standardizálva, majd a dokumentált loading-mátrixszal "
  "HEXACO-dimenziókra aggregálva. `cél` = a dimenzió ideális értéke 0–100-on, `tol` = "
  "tolerancia (mekkora eltérés még nem számít), `w` = a dimenzió súlya ennél a foglalkozásnál. "
  "Ez az **alak** (mi jellemzi ezt a munkát a többihez képest).")
A("- **HEXACO abszolút szint**: ugyanaz a levezetés centrálás NÉLKÜL — ez a „mennyi kell "
  "belőle egyáltalán” információ. A motor a kettőt külön használja (differenciál = rangsor, "
  "abszolút = általános szint).")
A("")
A("## Nyitott döntések (ld. a dokumentum végén is)")
A("")
A("1. **A H (becsületesség-alázat) alacsony célértéke** több értékesítési/tárgyalási "
  "foglalkozásnál megjelenik (a Work Style „Humility” negatív hatás-értéke miatt). "
  "Termékdöntés kell: a motor SOHA ne jutalmazza az alacsony H-t „illeszkedésként”, "
  "csak környezet-jellemzésként említse.")
A("2. A magyar megnevezés kanonikus formája: ESCO-foglalkozásnév (piaci) vagy ISCO/FEOR "
  "csoportnév (hivatalos)? Jelenleg ESCO-név az elsődleges, ISCO-csoportnév a fallback.")
A("3. A magyar belépési útvonal (szakmajegyzék, kamarai tagság, tipikus képzési idő) "
  "még nincs benne — a Job Zone és a végzettség-megoszlás amerikai adat.")
A("")

def render(entries):
  global current_major
  current_major = None
  for c in entries:
    major = (c["isco08"] or "9")[0]
    if major != current_major:
        current_major = major
        A("")
        A(f"## {major} — {MAJOR_HU.get(major, 'Egyéb')}")
        A("")
    title = c["huLabel"] or c["enTitle"]
    A(f"### {title}")
    A("")
    feor = ("; ".join(f"{f['feor']} {f['feorName']}" for f in c["feorAll"]) or "—")
    A(f"`{c['soc']}` · **ISCO-08 {c['isco08']}** {c['iscoNameHu'] or c['iscoGroupHu']} · "
      f"**FEOR-08:** {feor} · ESCO `{c['escoCode']}` · EN: {c['enTitle']}"
      + ("" if c["nameConfident"] else " · ⚠️ **név-review kell**"))
    if c["huAliases"]:
        A("")
        A(f"*Piaci megnevezések (ESCO):* {', '.join(c['huAliases'])}")
    A("")
    A(c["huDescription"] or f"_(HU leírás nincs; EN:)_ {c['enDescription']}")
    A("")
    entry = ENTRY_HU.get(c["entryLevel"] or "", "—")
    share = f" · a válaszadók {c['eduModalShare']}%-a jelölte" if c["eduModalShare"] else ""
    A(f"**Végzettségi minimum:** {entry} (Job Zone {c['jobZone']}) · tipikus: "
      f"{c['eduMinHu'] or '—'}{share}")
    A("")
    if c["riasec"]:
        rl = " · ".join(f"{k} {c['riasec'][k]:.0f}" for k in "RIASEC" if k in c["riasec"])
        A(f"**Holland-kód:** {c['riasecTop']} — {rl}")
        A("")
    top = [e for e in c["demand"] if e["weight"] >= 0.10][:4]
    dem = " · ".join(f"{DIM_SHORT[e['dim']]} cél {e['target']:.0f}±{e['tolerance']:.0f} (w={e['weight']:.2f})"
                     for e in top)
    A(f"**HEXACO differenciál cél-profil:** {dem or '—'}")
    A("")
    absl = " · ".join(f"{DIM_SHORT[d]} {c['absolute'][d]['level']:.0f}" for d in
                      ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"])
    A(f"**HEXACO abszolút szint:** {absl}")
    A("")

core = [c for c in catalog if c["huTier"] <= 2]
niche = [c for c in catalog if c["huTier"] == 3]
out_of_scope = [c for c in catalog if c["huTier"] == 4]

A("# I. rész — termékbe javasolt tételek (T1+T2)")
A("")
A(f"{len(core)} foglalkozás: {sum(1 for c in core if c['huTier']==1)} nagy létszámú (T1) + "
  f"{sum(1 for c in core if c['huTier']==2)} létező, közepes/kisebb (T2).")
render(core)

A("")
A("---")
A("")
A(f"# II. rész — niche (T3, {len(niche)} tétel)")
A("")
A("Létezik Magyarországon, de nagyon szűk szegmens. Az adat megvan, a termék "
  "listájába első körben nem kerül be — te dönthetsz róla az Excelben.")
render(niche)

A("")
A("---")
A("")
A(f"# III. rész — kihagyásra javasolt (T4, {len(out_of_scope)} tétel)")
A("")
A("A magyar munkaerőpiacon nem értelmezhető vagy elhanyagolható (pl. amerikai "
  "iskolarendszer-specifikus, olaj-/gázkitermelés, mélybányászat, tengeri hajózás, "
  "kihalt irodai szerepek).")
A("")
A("| O\\*NET-SOC | EN cím | HU név |")
A("|---|---|---|")
for c in out_of_scope:
    A(f"| `{c['soc']}` | {c['enTitle']} | {c['huLabel']} |")
A("")
A("---")
A("")
A("## Függelék A — név-review lista")
A("")
A("Ezeknél a tételeknél a magyar megnevezés a hivatalos ISCO/FEOR csoportnévre esett vissza, "
  "mert az ESCO-tétel címe nem egyezett meggyőzően az O\\*NET foglalkozással. Itt érdemes "
  "kézzel dönteni a végleges magyar névről — a jelöltek fel vannak sorolva.")
A("")
A("| O\\*NET-SOC | EN cím | jelenlegi HU név | ESCO-jelöltek |")
A("|---|---|---|---|")
for c in catalog:
    if not c["nameConfident"]:
        A(f"| `{c['soc']}` | {c['enTitle']} | {c['huLabel']} | {', '.join(c['huMarketLabels'][:4]) or '—'} |")
A("")
A("## Levezetési mátrix (Work Style → HEXACO)")
A("")
A("| O\\*NET Work Style | HEXACO loading |")
A("|---|---|")
for s, loads in ONET["loadings"].items():
    A(f"| {s} | " + ", ".join(f"{DIM_SHORT[d]} {v:+.2f}" for d, v in loads.items()) + " |")
A("")
A("Az `E` (emocionalitás) fordított skálájú: a stressztolerancia, önbizalom és optimizmus "
  "NEGATÍV loadinggal szerepel benne. Az `aesthetic appreciation` HEXACO-facetnek nincs "
  "O\\*NET Work Style megfelelője — ez a levezetés ismert hiányossága.")
A("")

path = os.path.join(REPO, "docs/product/occupation-catalog-v2.md")
open(path, "w").write("\n".join(lines))
print("catalog entries:", len(catalog))
print("hu label from esco:", sum(1 for c in catalog if c["labelSource"] == "esco"),
      "| from isco:", sum(1 for c in catalog if c["labelSource"] == "isco"))
print("hu description:", sum(1 for c in catalog if c["descSource"] == "esco"))
print("doc bytes:", os.path.getsize(path))
print("isco major distribution:", dict(sorted(Counter((c['isco08'] or '9')[0] for c in catalog).items())))
