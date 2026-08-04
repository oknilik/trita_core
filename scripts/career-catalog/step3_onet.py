"""O*NET 30.3 kinyerés + HEXACO cél-profil származtatás a Work Styles impact-értékekből.

Módszer:
 1) WI (Work Styles Impact, -3..3) 21 stílusra foglalkozásonként.
 2) Foglalkozáson BELÜLI centrálás (mínusz a foglalkozás 21-stílus átlaga) — így a
    "minden fontos" elevation kiesik, a profil ALAKJA marad.
 3) Stílusonkénti standardizálás az összes foglalkozás felett (z).
 4) HEXACO-aggregálás dokumentált loading-mátrixszal (előjeles).
 5) z -> cél-érték (0-100), tolerancia és súly a jel erősségéből.
"""
import json, os, math, statistics as st

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ONET = os.path.join(BASE, "onet", "v303", "db_30_3_text")
OUT = os.path.join(BASE, "build", "onet_derived.json")

# ── HEXACO loading-mátrix (belső dimenziókódok; RESO = emocionalitás, magasabb =
# érzelmesebb, ezért a stressztolerancia NEGATÍV loadinggal szerepel) ──────────
LOADINGS = {
    "Integrity":               {"INTE": 1.0},
    "Sincerity":               {"INTE": 1.0},
    "Humility":                {"INTE": 1.0},
    "Empathy":                 {"ADAP": 0.5, "RESO": 0.5},
    "Cooperation":             {"ADAP": 1.0},
    "Self-Control":            {"ADAP": 0.6, "THOR": 0.4},
    "Adaptability":            {"ADAP": 0.6, "RESO": -0.4},
    "Stress Tolerance":        {"RESO": -1.0},
    "Optimism":                {"RESO": -0.5, "TEMP": 0.5},
    "Self-Confidence":         {"TEMP": 0.6, "RESO": -0.4},
    "Social Orientation":      {"TEMP": 1.0},
    "Leadership Orientation":  {"TEMP": 1.0},
    "Initiative":              {"TEMP": 0.5, "THOR": 0.5},
    "Perseverance":            {"THOR": 1.0},
    "Achievement Orientation": {"THOR": 1.0},
    "Dependability":           {"THOR": 1.0},
    "Attention to Detail":     {"THOR": 1.0},
    "Cautiousness":            {"THOR": 1.0},
    "Innovation":              {"OPEN": 1.0},
    "Intellectual Curiosity":  {"OPEN": 1.0},
    "Tolerance for Ambiguity": {"OPEN": 0.7, "RESO": -0.3},
}
DIMS = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"]
RIASEC = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]
RIASEC_LETTER = {"Realistic": "R", "Investigative": "I", "Artistic": "A",
                 "Social": "S", "Enterprising": "E", "Conventional": "C"}

# Job Zone -> belépési szint (a mi EduReq skálánk)
JOB_ZONE_EDU = {1: "open", 2: "course", 3: "vocational", 4: "higher", 5: "specialized"}
# O*NET Required Level of Education kategória -> magyar minimum megnevezés
RL_HU = {
    1: "8 általános alatt / nincs formális követelmény",
    2: "érettségi (vagy azzal egyenértékű)",
    3: "érettségi utáni szakképzés / OKJ-utód szakma",
    4: "megkezdett felsőfokú tanulmányok",
    5: "felsőfokú szakképzés / kétéves diploma",
    6: "alapszak (BA/BSc)",
    7: "posztgraduális szakirányú továbbképzés",
    8: "mesterszak (MA/MSc)",
    9: "mesterszak utáni szakirányú képzés",
    10: "osztatlan szakmai diploma (pl. orvos, jogász)",
    11: "doktori fokozat (PhD)",
    12: "posztdoktori képzés",
}


def read(name):
    path = os.path.join(ONET, name)
    with open(path, encoding="utf-8") as fh:
        header = fh.readline().rstrip("\n").split("\t")
        for line in fh:
            yield dict(zip(header, line.rstrip("\n").split("\t")))


occupations = {r["O*NET-SOC Code"]: {"soc": r["O*NET-SOC Code"], "enTitle": r["Title"],
                                     "enDescription": r["Description"]}
               for r in read("Occupation Data.txt")}

styles = {}
for r in read("Work Styles.txt"):
    if r["Scale ID"] != "WI":
        continue
    styles.setdefault(r["O*NET-SOC Code"], {})[r["Element Name"]] = float(r["Data Value"])

interests = {}
for r in read("Career Interest Types.txt"):
    if r["Scale ID"] != "OI":
        continue
    interests.setdefault(r["O*NET-SOC Code"], {})[r["Element Name"]] = float(r["Data Value"])

zones = {r["O*NET-SOC Code"]: int(r["Job Zone"]) for r in read("Job Zones.txt")}

edu_dist = {}
for r in read("Education.txt"):
    if r["Scale ID"] != "RL":
        continue
    try:
        edu_dist.setdefault(r["O*NET-SOC Code"], {})[int(r["Category"])] = float(r["Data Value"])
    except ValueError:
        continue

# ── 2) centrálás, 3) standardizálás ─────────────────────────────────────────
style_names = sorted(LOADINGS)
centered = {}
for soc, vals in styles.items():
    if len(vals) < len(style_names):
        continue
    mean = st.fmean(vals[s] for s in style_names)
    centered[soc] = {s: vals[s] - mean for s in style_names}

stats = {}
for s in style_names:
    series = [centered[soc][s] for soc in centered]
    stats[s] = (st.fmean(series), st.pstdev(series) or 1.0)

# Az ABSZOLÚT réteg: a nyers (nem centrált) impact standardizálva — ez hordozza
# a "mennyi kell belőle egyáltalán" információt (a differenciál réteg csak az
# alakot). A motor mindkettőt használja: general (absolute) + differential.
abs_stats = {}
for s in style_names:
    series = [styles[soc][s] for soc in centered]
    abs_stats[s] = (st.fmean(series), st.pstdev(series) or 1.0)

Z_TO_POINTS = 12.0  # 1 SD = 12 pont a 0-100 skálán


def aggregate(z):
    """Stílus-z -> dimenzió-z a loading-mátrixszal."""
    dim_z = {d: 0.0 for d in DIMS}
    dim_w = {d: 0.0 for d in DIMS}
    for s, loads in LOADINGS.items():
        for d, load in loads.items():
            dim_z[d] += z[s] * load
            dim_w[d] += abs(load)
    return {d: dim_z[d] / (dim_w[d] or 1.0) for d in DIMS}


def absolute_profile(soc):
    z = {s: (styles[soc][s] - abs_stats[s][0]) / abs_stats[s][1] for s in style_names}
    dz = aggregate(z)
    return {d: {"level": round(max(5.0, min(95.0, 50 + Z_TO_POINTS * dz[d])), 1),
                "z": round(dz[d], 3)} for d in DIMS}


def hexaco_profile(soc):
    z = {}
    for s in style_names:
        m, sd = stats[s]
        z[s] = (centered[soc][s] - m) / sd
    dim_z = {d: 0.0 for d in DIMS}
    dim_w = {d: 0.0 for d in DIMS}
    for s, loads in LOADINGS.items():
        for d, load in loads.items():
            dim_z[d] += z[s] * load
            dim_w[d] += abs(load)
    for d in DIMS:
        dim_z[d] = dim_z[d] / (dim_w[d] or 1.0)
    total = sum(abs(v) for v in dim_z.values()) or 1.0
    demand = []
    for d in DIMS:
        strength = abs(dim_z[d])
        weight = strength / total
        demand.append({
            "dim": d,
            "target": round(max(5.0, min(95.0, 50 + Z_TO_POINTS * dim_z[d])), 1),
            "tolerance": round(max(12.0, min(30.0, 30 - 8 * strength)), 1),
            "weight": round(weight, 3),
            "z": round(dim_z[d], 3),
        })
    demand.sort(key=lambda e: -e["weight"])
    return demand


result = {}
for soc, occ in occupations.items():
    if soc not in centered:
        continue
    ri = interests.get(soc)
    riasec = ({RIASEC_LETTER[k]: round((ri[k] - 1) / 6 * 100, 1) for k in RIASEC if k in ri}
              if ri else None)
    zone = zones.get(soc)
    dist = edu_dist.get(soc, {})
    modal = max(dist, key=dist.get) if dist else None
    result[soc] = {
        **occ,
        "jobZone": zone,
        "entryLevel": JOB_ZONE_EDU.get(zone) if zone else None,
        "eduModalCategory": modal,
        "eduMinHu": RL_HU.get(modal) if modal else None,
        "eduModalShare": round(dist[modal], 1) if modal else None,
        "riasec": riasec,
        "riasecTop": ("".join(sorted(riasec, key=lambda k: -riasec[k])[:3]) if riasec else None),
        "demand": hexaco_profile(soc),
        "absolute": absolute_profile(soc),
    }

json.dump({"loadings": LOADINGS, "occupations": result}, open(OUT, "w"), ensure_ascii=False)
print("occupations with full profile:", len(result))
print("with riasec:", sum(1 for v in result.values() if v["riasec"]))
print("with job zone:", sum(1 for v in result.values() if v["jobZone"]))
sample = result.get("15-1252.00")
if sample:
    print("\nSample — Software Developers")
    print(" riasecTop", sample["riasecTop"], sample["riasec"])
    print(" entry", sample["entryLevel"], "|", sample["eduMinHu"])
    for e in sample["demand"]:
        print(f"  {e['dim']} target={e['target']:5.1f} tol={e['tolerance']:4.1f} w={e['weight']:.2f} z={e['z']:+.2f}")
sample = result.get("41-4012.00")
if sample:
    print("\nSample — Sales Representatives")
    for e in sample["demand"]:
        print(f"  {e['dim']} target={e['target']:5.1f} tol={e['tolerance']:4.1f} w={e['weight']:.2f} z={e['z']:+.2f}")
