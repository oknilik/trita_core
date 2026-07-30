"""Preferencia- és környezet-tengelyek levezetése O*NET Work Context /
Work Activities adatokból (a wizard kérdéseinek foglalkozás-oldali párja).

Tengelyek (-1..1), a mai UI-val azonos jelentéssel:
  people   -1 adat/tárgyak ... 1 emberek
  variety  -1 stabil, ismétlődő ... 1 változatos
  autonomy -1 irányított ... 1 önálló
  creation -1 végrehajtás ... 1 alkotás
  pace     -1 nyugodt ... 1 pörgős/nyomás alatt
  structure -1 laza keretek ... 1 szabályozott
  setting  -1 iroda/képernyő ... 1 terep/mozgás
"""
import json, os, statistics as st

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ONET = os.path.join(BASE, "onet", "v303", "db_30_3_text")
OUT = os.path.join(BASE, "build", "onet_context.json")

CONTEXT = {
    "contact": "4.C.1.a.4",
    "faceToFace": "4.C.1.a.2.l",
    "customers": "4.C.1.b.1.f",
    "repeating": "4.C.3.b.7",
    "freedom": "4.C.3.a.4",
    "automation": "4.C.3.b.2",
    "timePressure": "4.C.3.d.1",
    "equipmentPace": "4.C.3.d.3",
    "outdoorsWeather": "4.C.2.a.1.c",
    "outdoorsCover": "4.C.2.a.1.d",
    "sitting": "4.C.2.d.1.a",
}
ACTIVITY = {"creative": "4.A.2.b.2", "caring": "4.A.4.a.5", "analyzing": "4.A.2.a.4"}


def read(name):
    with open(os.path.join(ONET, name), encoding="utf-8") as fh:
        header = fh.readline().rstrip("\n").split("\t")
        for line in fh:
            yield dict(zip(header, line.rstrip("\n").split("\t")))


raw = {}
wanted_ctx = {v: k for k, v in CONTEXT.items()}
for r in read("Work Context.txt"):
    if r["Scale ID"] != "CX" or r["Element ID"] not in wanted_ctx:
        continue
    try:
        raw.setdefault(r["O*NET-SOC Code"], {})[wanted_ctx[r["Element ID"]]] = float(r["Data Value"])
    except ValueError:
        continue

wanted_act = {v: k for k, v in ACTIVITY.items()}
for r in read("Work Activities.txt"):
    if r["Scale ID"] != "IM" or r["Element ID"] not in wanted_act:
        continue
    try:
        raw.setdefault(r["O*NET-SOC Code"], {})[wanted_act[r["Element ID"]]] = float(r["Data Value"])
    except ValueError:
        continue

keys = list(CONTEXT) + list(ACTIVITY)
complete = {soc: v for soc, v in raw.items() if all(k in v for k in keys)}
stats = {k: (st.fmean(v[k] for v in complete.values()),
             st.pstdev([v[k] for v in complete.values()]) or 1.0) for k in keys}


def clamp(x, lo=-1.0, hi=1.0):
    return max(lo, min(hi, x))


def axes(vals):
    z = {k: (vals[k] - stats[k][0]) / stats[k][1] for k in keys}
    mean = lambda xs: sum(xs) / len(xs)  # noqa: E731
    # 1 SD ~ 0.7 a -1..1 skálán, hogy a szélsőségek ne torlódjanak a végeken
    scale = lambda v: clamp(v / 1.4)     # noqa: E731
    return {
        "people": round(scale(mean([z["contact"], z["faceToFace"], z["customers"], z["caring"]])), 2),
        "variety": round(scale(-z["repeating"]), 2),
        "autonomy": round(scale(z["freedom"]), 2),
        "creation": round(scale(z["creative"]), 2),
        "pace": round(scale(mean([z["timePressure"], z["equipmentPace"]])), 2),
        "structure": round(scale(mean([z["repeating"], -z["freedom"], z["automation"]])), 2),
        "setting": round(scale(mean([z["outdoorsWeather"], z["outdoorsCover"], -z["sitting"]])), 2),
    }


result = {soc: axes(v) for soc, v in complete.items()}
json.dump(result, open(OUT, "w"), ensure_ascii=False)
print("foglalkozás teljes kontextus-adattal:", len(result), "/", len(raw))
for soc in ("15-1252.00", "41-4012.00", "29-1141.00", "47-2111.00"):
    if soc in result:
        print(soc, result[soc])
