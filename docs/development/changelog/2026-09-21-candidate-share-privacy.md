# Jelölti visszajelzés: kijelölt vezető és személyiségkép

- Tanácsadó: a meglévő, jogosultsággal védett munkatérben marad a teljes radar, a dimenzióérték és a csapat-összevetés.
- Vezető: a tanácsadó aktív ORG_ADMIN / ORG_MANAGER címzettet választ. A link csak ennek a bejelentkezett felhasználónak működik, amíg a vezetői tagsága aktív; más vezető, tag vagy anonim látogató nem kap hozzáférést.
- Jelölti és vezetői kivonat: jóváhagyott szöveg és a meglévő TypeGlyph illusztráció. Az új, v2 JSON-pillanatképek sem radart, sem dimenzióértékeket, sem pontszámból származó ábraintenzitást nem tárolnak. A címzett azonosítója sem kerül a megjelenítési adatmodellbe.
- A régi jelölti linkek szerveroldali whitelist-projekcióval működnek; a régi, címzett nélküli vezetői linkek lezárulnak. Utóbbiak helyett új, konkrét vezetőnek címzett megosztást kell készíteni. Adatbázis-migráció nem szükséges; a korábban tárolt numerikus snapshotokat ez a változás nem törli.
- A tanácsadói jelöltlista és a profil fejléce ugyanennek a személyiségképnek a bélyegképét használja.
- Meglévő PlatformPageShell, Card, SelectField, TextareaField, TypeGlyph és tipográfiai/szín tokenek; nincs új betűcsalád vagy saját színpaletta.
- A jóváhagyás kézi tartalmi felelősség is: a szerkesztő jelzi, hogy pontszámot és belső jegyzetet nem szabad a megosztott szabad szövegbe másolni.

Ellenőrzés: célzott kliens-, adatbázis-integrációs és böngészős tesztek (címzettválasztás, anonim/tag hozzáférés tiltása, tagságvesztés, régi snapshotok numerikus adatainak eltávolítása), pnpm check és production build.
