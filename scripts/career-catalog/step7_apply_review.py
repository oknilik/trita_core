"""A validált Excel visszaolvasása -> végleges katalógus a repóba.

Bemenet:
  - occupations-v2.json (gépi levezetés: HEXACO cél-profil, Holland, belépés)
  - a user által ellenőrzött Excel (döntés + VÉGLEGES NÉV + megjegyzés)

Kimenet (src/lib/career/catalog/):
  - occupations.core.json    scoring-mezők, a kliensnek is elküldhető (kompakt)
  - occupations.content.json leírás, aliasok, FEOR/ISCO nevek (szerver/lazy)
  - occupations.archived.json a kihagyott tételek (adat megőrizve)
"""
import json, os, re, sys, collections
import openpyxl

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "/Users/leinadoknilik/trita/codebase"
XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Downloads/occupationcatalogreview_ellenorzott_2.xlsx")
OUTDIR = os.path.join(REPO, "src/lib/career/catalog")

derived = {c["soc"]: c for c in json.load(open(
    os.path.join(REPO, "docs/product/data/occupations-v2.json")))["occupations"]}
CONTEXT = json.load(open(os.path.join(BASE, "build", "onet_context.json")))
CIP_FIELDS = json.load(open(os.path.join(BASE, "build", "onet_cip_fields.json")))
ESCO = json.load(open(os.path.join(BASE, "build", "esco_hu.json")))["occupations"]

# ESCO-tételek ISCO-csoport szerint, hogy a leírást a VÉGLEGES magyar névhez
# tudjuk párosítani (a gépi, angol cím alapú párosítás sokszor mellényúlt:
# pl. a „Grafikus" a szerencsejáték-tervező leírását kapta).
_ESCO_BY_ISCO: dict[str, list[dict]] = {}
for _entry in ESCO.values():
    _code = str(_entry.get("code") or "")
    if len(_code) >= 4 and _code[:4].isdigit():
        _ESCO_BY_ISCO.setdefault(_code[:4], []).append(_entry)

_HU_STOP = {"és", "vagy", "egyéb", "más", "nem", "sorolható", "máshová", "való"}


def _hu_tokens(text: str) -> set[str]:
    words = re.findall(r"[a-záéíóöőúüű]+", (text or "").lower())
    return {w[:6] for w in words if w not in _HU_STOP and len(w) > 3}


def best_hu_content(final_name: str, isco: str | None, fallback: dict) -> tuple[str, str]:
    """A végleges magyar névhez legjobban illő ESCO-leírás. Visszaad (leírás, forrás)."""
    target = _hu_tokens(final_name)
    if not target or not isco:
        return fallback.get("huDescription", ""), "auto"
    best, best_score = None, 0.0
    for candidate in _ESCO_BY_ISCO.get(isco, []):
        tokens = _hu_tokens(candidate.get("huLabel", ""))
        if not tokens:
            continue
        score = len(target & tokens) / len(target | tokens)
        if score > best_score:
            best, best_score = candidate, score
    if best and best_score >= 0.34 and best.get("huDescription"):
        return best["huDescription"], "name-matched"
    return fallback.get("huDescription", ""), "auto"
AXES = ["people", "variety", "autonomy", "creation", "pace", "structure", "setting"]

# Hiányzó kontextus-adatnál az ISCO-csoport (majd főcsoport) átlaga a fallback.
_by_group: dict[str, list[dict]] = {}
for _soc, _ax in CONTEXT.items():
    _isco = (derived.get(_soc) or {}).get("isco08")
    if _isco:
        _by_group.setdefault(_isco, []).append(_ax)
        _by_group.setdefault(_isco[:2], []).append(_ax)
        _by_group.setdefault(_isco[:1], []).append(_ax)


def axes_for(soc, isco):
    direct = CONTEXT.get(soc)
    if direct:
        return direct, "onet"
    for key in ((isco or ""), (isco or "")[:2], (isco or "")[:1]):
        pool = _by_group.get(key)
        if pool:
            return ({a: round(sum(p[a] for p in pool) / len(pool), 2) for a in AXES},
                    f"isco{len(key)}-átlag")
    return None, "hiányzik"

wb = openpyxl.load_workbook(XLSX, read_only=True)
ws = wb["Katalógus review"]
rows = list(ws.iter_rows(values_only=True))
header = [str(h or "").strip() for h in rows[0]]
idx = {name: i for i, name in enumerate(header)}
required = ["DÖNTÉS (marad/törlés)", "VÉGLEGES NÉV", "MEGJEGYZÉS", "tier", "SOC"]
missing = [c for c in required if c not in idx]
if missing:
    raise SystemExit(f"hiányzó oszlop az Excelben: {missing}")

DIMS = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"]

active, archived, problems = [], [], []
matched_desc = 0
seen_names = collections.Counter()

for raw in rows[1:]:
    soc = str(raw[idx["SOC"]] or "").strip()
    if not soc:
        continue
    d = derived.get(soc)
    if not d:
        problems.append(f"{soc}: nincs levezetett adat")
        continue
    decision = str(raw[idx["DÖNTÉS (marad/törlés)"]] or "").strip().lower()
    keep = decision.startswith("marad")
    name = str(raw[idx["VÉGLEGES NÉV"]] or "").strip()
    if not name:
        name = str(raw[idx["HU név (auto)"]] or "").strip()
        problems.append(f"{soc}: nincs végleges név, az automatikus marad")
    note = str(raw[idx["MEGJEGYZÉS"]] or "").strip()
    tier = int(str(raw[idx["tier"]] or d["huTier"]).strip())

    core = {
        "id": soc,
        "hu": name,
        "feor": (d["feor08"] or [None])[0],
        "isco": d["isco08"],
        "tier": tier,
        "entry": d["entryLevel"],
        "jobZone": d["jobZone"],
        "riasec": {k: round(v) for k, v in (d["riasec"] or {}).items()},
        "demand": [
            {"dim": e["dim"], "target": e["target"], "tol": e["tolerance"], "w": e["weight"]}
            for e in d["demand"] if e["weight"] >= 0.05
        ],
        "abs": {dim: d["absolute"][dim]["level"] for dim in DIMS},
        # preferencia- és környezet-tengelyek (O*NET Work Context/Activities)
        "axes": None,
        # képzési területek, amikből út vezet ide (O*NET CIP-crosswalk)
        "eduFields": CIP_FIELDS.get(soc, []),
    }
    core["axes"], axes_src = axes_for(soc, d["isco08"])
    if axes_src != "onet":
        core["axesSource"] = axes_src
        problems.append(f"{soc}: kontextus-adat pótolva ({axes_src})")
    hu_desc, desc_source = best_hu_content(name, d["isco08"], d)
    if desc_source == "name-matched":
        matched_desc += 1
    content = {
        "id": soc,
        "desc": hu_desc or d["enDescription"],
        "descLang": "hu" if hu_desc else "en",
        "descSource": desc_source,
        "aliases": [a for a in d["huMarketLabels"] if a.lower() != name.lower()][:6],
        "eduHu": d["eduMinHu"],
        "eduShare": d["eduModalShare"],
        "feorAll": d["feor08"],
        "feorName": d["feorLabel"],
        "iscoName": d["iscoNameHu"],
        "en": d["enTitle"],
        "reviewNote": note,
    }
    if keep:
        active.append((core, content))
        seen_names[name.lower()] += 1
    else:
        archived.append({**core, "en": d["enTitle"], "reviewNote": note})

dupes = {n: c for n, c in seen_names.items() if c > 1}

os.makedirs(OUTDIR, exist_ok=True)
meta = {
    "version": "2026-07-30",
    "reviewedBy": "user (teljes kézi ellenőrzés, 890 tétel)",
    "activeCount": len(active),
    "archivedCount": len(archived),
    "sources": {
        "psychometrics": "O*NET 30.3 Database (U.S. DOL/ETA), CC BY 4.0",
        "labels": "ESCO v1.2 (European Commission) + kézi magyar véglegesítés",
        "codes": "ISCO-08 (ILO) / FEOR-08 (KSH fordítókulcs)",
    },
}
json.dump({"meta": meta, "occupations": [c for c, _ in active]},
          open(os.path.join(OUTDIR, "occupations.core.json"), "w"),
          ensure_ascii=False, separators=(",", ":"))
json.dump({"meta": {"version": meta["version"]}, "content": [c for _, c in active]},
          open(os.path.join(OUTDIR, "occupations.content.json"), "w"),
          ensure_ascii=False, separators=(",", ":"))
json.dump({"meta": {"version": meta["version"], "note": "review-ban kihagyott tételek"},
           "occupations": archived},
          open(os.path.join(OUTDIR, "occupations.archived.json"), "w"),
          ensure_ascii=False, separators=(",", ":"))

for f in ("occupations.core.json", "occupations.content.json", "occupations.archived.json"):
    p = os.path.join(OUTDIR, f)
    print(f"{f}: {os.path.getsize(p)/1024:.0f} KB")
print("aktív:", len(active), "| archivált:", len(archived))
print("végleges névhez illesztett leírás:", matched_desc)
print("tier-megoszlás (aktív):", dict(collections.Counter(c["tier"] for c, _ in active)))
print("belépési szint (aktív):", dict(collections.Counter(c["entry"] for c, _ in active)))
if dupes:
    print("AZONOS NEVEK (összevonandók?):", dict(list(dupes.items())[:20]), "össz:", len(dupes))
if problems:
    print("PROBLÉMÁK:", problems[:10], "össz:", len(problems))
