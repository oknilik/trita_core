# Jelölti csapatösszevetés: az egyéni radar vizuális nyelve

A korábbi módosítás csak a Profilkép fület érintette. Most a Csapatok összevetése központi radarja és a mobil csapatválasztó bélyegképei is a közös RadarChart komponenst használják: színes dimenziópontok, színátmenetes jelölti profil és bronz, szaggatott csapatátlag.

A jelmagyarázat, a mérési bizonytalanság szövege, az értéktáblázat és az érvénytelen adatok ellenőrzése megmarad. Minden példány egyedi SVG-azonosítókat kap, hogy a csapatválasztó több ábrája ne ütközzön. A radar hozzáférhető neve a jelöltet és a kiválasztott csapatot nevezi meg.

Ellenőrzés: candidate kliens- és böngészős folyamatellenőrzések, desktop/mobil képernyőképek, pnpm check.
