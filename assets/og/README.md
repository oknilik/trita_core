# OG-fontok (satori)

A `next/og` (satori) **nem renderel variable TTF-et**, ezért ide statikus
példányok kerülnek a `public/fonts/` alatti variable fájlokból. A weben a
`next/font/google` Fraunces/DM Sans variable-t tölt; itt ugyanazokat a
tengelyeket rögzítjük, amiket a felület ténylegesen használ.

| Fájl | Forrás | Tengelyek | Használat |
|---|---|---|---|
| `Fraunces-400.ttf` | Fraunces variable | wght 400 · opsz 72 | share-OG cím, blog-borító |
| `Fraunces-500.ttf` | Fraunces variable | wght 500 · opsz 72 | hero-címsor (`font-medium`) |
| `Fraunces-500-Italic.ttf` | Fraunces Italic variable | wght 500 · opsz 72 | hero-kiemelés (`<em>`), archetípus |
| `Fraunces-900.ttf` | Fraunces variable | wght 900 · opsz 72 | **szójel** (`TritaWordmark` = `font-black`) |
| `DMSans-400.ttf` | DM Sans variable | wght 400 · opsz 14 | szövegtörzs |
| `DMSans-500.ttf` | DM Sans variable | wght 500 · opsz 14 | chip, lábléc |
| `DMSans-600.ttf` | DM Sans variable | wght 600 · opsz 14 | eyebrow, CTA, címkék |

Újragenerálás (fonttools, Python):

```bash
pip install fonttools
python3 - <<'EOF'
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
jobs = [
  ("public/fonts/Fraunces-Regular.ttf", {"wght": 500, "opsz": 72, "SOFT": 0, "WONK": 1}, "assets/og/Fraunces-500.ttf"),
  ("public/fonts/Fraunces-Regular.ttf", {"wght": 900, "opsz": 72, "SOFT": 0, "WONK": 1}, "assets/og/Fraunces-900.ttf"),
  ("public/fonts/Fraunces-Italic.ttf",  {"wght": 500, "opsz": 72, "SOFT": 0, "WONK": 1}, "assets/og/Fraunces-500-Italic.ttf"),
  ("public/fonts/DMSans-Regular.ttf",   {"wght": 500, "opsz": 14}, "assets/og/DMSans-500.ttf"),
  ("public/fonts/DMSans-Regular.ttf",   {"wght": 600, "opsz": 14}, "assets/og/DMSans-600.ttf"),
]
for src, loc, dst in jobs:
    font = TTFont(src)
    inst = instancer.instantiateVariableFont(font, loc, inplace=False, updateFontNames=False)
    inst["OS/2"].usWeightClass = loc["wght"]
    inst.save(dst)
EOF
```

Az `updateFontNames=False` szándékos: a Fraunces STAT-táblájában nincs
500-as nevesített fok, a névfrissítés ezért hibát dobna. A satori a
`fonts[]` tömb `weight`/`style` mezője alapján párosít, nem a name-tábla
alapján — a `usWeightClass` beállítása csak a fájl önleírását teszi rendbe.
