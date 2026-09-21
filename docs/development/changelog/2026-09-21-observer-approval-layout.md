# Külső értékelő-meghívók jóváhagyása: rendezett kártya

A korábbi, belső térköz nélküli DashboardPanel és a beágyazott keretes sorok helyett egyetlen, tokenes Card jelenik meg. A leírás külön felső blokkot kapott; a meghívók között egyszerű elválasztó vonal van. A név/e-mail és a kampány/dátum tipográfiai hierarchiája egyértelműbb, a műveletek a közös Button primitívet használják.

A kártya rendelkezésre álló szélessége alapján mobilon az adatok alá kerülnek a gombok. Hosszú e-mail-címek is elférnek; a jóváhagyás/elutasítás meglévő működése változatlan.

Ellenőrzés: böngészős megjelenítés 320/390/768/1440 px-en, több sorral és hosszú e-maillel, vízszintes túlcsordulás nélkül; asztali és mobil képernyőkép vizuális ellenőrzése; pnpm check.
