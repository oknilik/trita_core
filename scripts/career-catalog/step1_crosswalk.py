"""ESCO <-> O*NET-SOC crosswalk beolvasása."""
import json, os, openpyxl

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "src", "ESCO_to_ONET-SOC.xlsx")
OUT = os.path.join(BASE, "build", "crosswalk.json")

wb = openpyxl.load_workbook(SRC, read_only=True)
ws = wb.worksheets[0]
rows = []
header_seen = False
for row in ws.iter_rows(values_only=True):
    cells = [str(c).strip() if c is not None else "" for c in row]
    if not header_seen:
        if cells[0] == "ESCO/ISCO Code":
            header_seen = True
        continue
    esco_code, esco_title, soc, soc_title = cells[0], cells[1], cells[2], cells[3]
    if not esco_code or not soc:
        continue
    rows.append({"escoCode": esco_code, "escoTitle": esco_title, "soc": soc, "socTitle": soc_title})

groups = sorted({r["escoCode"].split(".")[0].zfill(4) for r in rows if r["escoCode"][:1].isdigit()})
json.dump({"rows": rows, "iscoGroups": groups}, open(OUT, "w"), ensure_ascii=False)
print("rows", len(rows), "distinct soc", len({r['soc'] for r in rows}), "isco groups", len(groups))
print("sample", rows[0])
