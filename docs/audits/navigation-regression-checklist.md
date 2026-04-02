# Navigation Regression Checklist

Rövid release előtti manuális ellenőrzőlista az admin/manager IA tisztítás után.

## 1) Top-level menük elérhetősége

- [ ] `Admin` user: látható `Vezérlő`, `Csapatok`, `Jelöltek`, `Szervezet`, `Analitika`.
- [ ] `Manager` user: látható `Vezérlő`, `Csapatom`, `Jelöltek`, `Riportok`.
- [ ] Minden top-level elem kattintható, nincs nem reagáló menüpont.

## 2) Oldalfejléc koherencia

- [ ] Minden belső oldalon konzisztens `title`/`eyebrow`/`breadcrumb` jelenik meg.
- [ ] A breadcrumb első eleme a központi home handoffot követi.
- [ ] Surface accent (`self`/`team`/`org`) a megfelelő oldalon jelenik meg.

## 3) User menu ellenőrzés

- [ ] User menu trigger minden signed-in oldalon elérhető.
- [ ] `Saját profil` elérhető a user menu-ből (nem top-level menüként).
- [ ] `Nyelv` váltás működik.
- [ ] `Kijelentkezés` működik.

## 4) Role-based láthatóság

- [ ] `Manager` nem lát admin-only `Szervezet` menüpontot.
- [ ] `Manager` nem ér el billing/org-admin funkciókat közvetlen menüből.
- [ ] `Admin` látja az org-admin és analitika teljesebb menüstruktúrát.

## 5) Dead-end és fallback ellenőrzés

- [ ] Nincs dead-end menüpont (minden menü valós oldalt nyit).
- [ ] Tiltott oldalakon central fallback történik (nincs hurok vagy üres nézet).
- [ ] Join/billing/deep-link belépések után a landing konzisztens a journey engine döntéssel.

## 6) Kritikus smoke útvonalak (minimum)

- [ ] Admin: `/dashboard`
- [ ] Manager: `/dashboard`
- [ ] Team detail: `/team/[id]`
- [ ] Org settings: `/org/[id]/settings`
- [ ] Hiring: `/hiring/[orgId]`
- [ ] Analytics/Report: `/assessment-layers` vagy `/team/[id]?tab=profile`
- [ ] Profile user menu-ből: `/profile`

