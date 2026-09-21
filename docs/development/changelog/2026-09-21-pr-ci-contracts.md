# PR #98: CI szerződések karbantartása

- A dimenziópaletta őre a kiemelt PersonalityOverview komponenst ellenőrzi, és külön igazolja, hogy az egyéni és jelölti profil is ezt használja.
- A csapatminta-végpont kikerült a személyiség-score JSON-t olvasó felületek listájából. Új ellenőrzés igazolja a publikált működésmérés használatát és tiltja a személyiségadatból történő visszaszármaztatást.
- A publikus navigáció tesztje tartalmazza a működésiminta-katalógust. A landing-előnézet a személyiség-összetételt és a tanácsadói értékelést ellenőrzi, a kivezetett típusnevet kizárja.
- A riport olvasási tesztje külön ellenőrzi a négy mért tengelyt és az illusztrációt, nem az eltérő rendeltetésű képek összesített számát.

A tesztek nem kerültek kihagyásra; a jelenlegi felületek és adatforrások szerződéseit ellenőrzik.
