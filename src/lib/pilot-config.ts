/**
 * A pilotprogram kapacitás-számai — EGY helyen, mert több felületen
 * jelennek meg (/pilot ténysáv, hero-badge, űrlap-jegyzet, /how-we-work
 * teaser). Ahogy telnek a helyek, CSAK a PILOT_SPOTS_LEFT értékét kell
 * csökkenteni; 0-nál a szabad helyek sora magától eltűnik.
 *
 * Keretmentes modul (nincs "use client"): szerver- és kliens-komponens is
 * importálhatja.
 */
export const PILOT_TOTAL_TEAMS = 10;
export const PILOT_SPOTS_LEFT = 7;
