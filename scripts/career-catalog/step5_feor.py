"""KSH ISCO-08 -> FEOR-08 fordítókulcs (PDF -> pdftotext -layout) beolvasása.

A PDF két oszlopos, és a hosszú megnevezések tördelve folytatódnak a következő
sorban, ezért oszlop-pozíció alapján bontunk: 3+ szóköz = oszlophatár, és az
oszlopban a 4 jegyű kód nyitja az új tételt.
"""
import json, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TXT = os.path.join(BASE, "src", "isco_feor.txt")
OUT = os.path.join(BASE, "build", "isco_feor.json")

CODE = re.compile(r"^(\d{4})\s+(.*)$")
mapping = {}
isco_names = {}
last_isco = None

for raw in open(TXT, encoding="utf-8"):
    line = raw.rstrip("\n")
    if not line.strip() or "fordítókulcs" in line or "Sárgával" in line or "Kékkel" in line:
        continue
    if re.match(r"^\s*ISCO-08\s+FEOR-08\s*$", line.strip()) or line.strip() in {"ISCO-08", "FEOR-08"}:
        continue
    # oszlopokra bontás: 3+ szóköz a határ
    cells = [c.strip() for c in re.split(r"\s{3,}", line) if c.strip()]
    if not cells:
        continue
    coded = [(i, CODE.match(c)) for i, c in enumerate(cells)]
    coded = [(i, m) for i, m in coded if m]
    if not coded:
        # folytatás-sor: az indent dönti el, melyik oszlop nevéhez tartozik
        indent = len(raw) - len(raw.lstrip())
        cont = re.sub(r"\s+", " ", " ".join(cells)).strip()
        if last_isco and cont:
            if indent < 55:
                isco_names[last_isco] = (isco_names.get(last_isco, "") + " " + cont).strip()
            elif mapping.get(last_isco):
                mapping[last_isco][-1]["feorName"] = (
                    mapping[last_isco][-1]["feorName"] + " " + cont
                ).strip()
        continue
    # az első kódos cella az ISCO, egy későbbi kódos cella a FEOR
    i_isco, m_isco = coded[0]
    isco = m_isco.group(1)
    isco_name = re.sub(r"\s+", " ", m_isco.group(2)).strip()
    if isco_name:
        isco_names.setdefault(isco, isco_name)
    last_isco = isco
    for i, m in coded[1:]:
        feor = m.group(1)
        feor_name = re.sub(r"\s+", " ", m.group(2)).strip()
        entry = mapping.setdefault(isco, [])
        if not any(e["feor"] == feor for e in entry):
            entry.append({"feor": feor, "feorName": feor_name})

json.dump({"iscoNames": isco_names, "iscoToFeor": mapping}, open(OUT, "w"), ensure_ascii=False)
print("isco codes with feor mapping:", len(mapping), "| isco names:", len(isco_names))
print("multi-mapped:", sum(1 for v in mapping.values() if len(v) > 1))
for code in ("2512", "2519", "2221", "7411", "8332"):
    print(code, isco_names.get(code), "->", mapping.get(code))
