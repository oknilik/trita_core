"""ESCO magyar adatok lekérése: ISCO-csoport HU neve + a csoport ESCO-foglalkozásai
(HU megnevezés, HU leírás, alternatív nevek, ESCO-kód). Cache-elve lemezre."""
import json, os, urllib.parse, urllib.request, concurrent.futures as cf

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CW = json.load(open(os.path.join(BASE, "build", "crosswalk.json")))
CACHE = os.path.join(BASE, "build", "esco_cache")
os.makedirs(CACHE, exist_ok=True)
API = "https://ec.europa.eu/esco/api/resource/"


def fetch(url, cache_key):
    path = os.path.join(CACHE, cache_key + ".json")
    if os.path.exists(path) and os.path.getsize(path) > 20:
        return json.load(open(path))
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                data = json.loads(r.read().decode("utf-8"))
            json.dump(data, open(path, "w"), ensure_ascii=False)
            return data
        except Exception as exc:  # noqa: BLE001
            if attempt == 2:
                print("FAIL", cache_key, exc, flush=True)
                return None
    return None


def group_url(code):
    uri = urllib.parse.quote(f"http://data.europa.eu/esco/isco/C{code}", safe="")
    return f"{API}concept?uri={uri}&language=hu"


def occ_url(uri):
    return f"{API}occupation?uri={urllib.parse.quote(uri, safe='')}&language=hu"


groups = CW["iscoGroups"]
print("groups to fetch:", len(groups), flush=True)

group_data = {}
with cf.ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(fetch, group_url(g), f"isco_{g}"): g for g in groups}
    for i, fut in enumerate(cf.as_completed(futs)):
        g = futs[fut]
        d = fut.result()
        if d:
            group_data[g] = d
        if i % 50 == 0:
            print("group", i, flush=True)

occ_uris = {}
for g, d in group_data.items():
    for n in (d.get("_links", {}) or {}).get("narrowerOccupation", []) or []:
        occ_uris[n["uri"]] = g
print("occupations to fetch:", len(occ_uris), flush=True)

occ_data = {}
with cf.ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(fetch, occ_url(u), "occ_" + u.rsplit("/", 1)[-1]): u for u in occ_uris}
    for i, fut in enumerate(cf.as_completed(futs)):
        d = fut.result()
        if d and d.get("code"):
            occ_data[d["code"]] = {
                "code": d["code"],
                "huLabel": d.get("title") or "",
                "huDescription": (((d.get("description") or {}).get("hu") or {}).get("literal") or ""),
                "huAlt": ((d.get("alternativeLabel") or {}).get("hu") or [])[:6],
                "uri": d.get("uri", ""),
            }
        if i % 250 == 0:
            print("occ", i, flush=True)

out = {
    "iscoGroups": {
        g: {
            "huLabel": d.get("title") or "",
            "enDescription": (((d.get("description") or {}).get("en") or {}).get("literal") or "")[:1200],
        }
        for g, d in group_data.items()
    },
    "occupations": occ_data,
}
json.dump(out, open(os.path.join(BASE, "build", "esco_hu.json"), "w"), ensure_ascii=False)
print("DONE groups", len(out["iscoGroups"]), "occupations", len(out["occupations"]), flush=True)
