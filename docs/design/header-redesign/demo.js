/* Ikon-készlet a makettekhez.
 *
 * Az ikonok a src/components/layout/nav-header-ui.tsx és a NavBar.tsx
 * meglévő inline SVG-inek másolatai (16-as viewBox, 1.2–1.3 stroke) — a
 * makett így nem vezet be idegen ikon-nyelvet. Egy <symbol>-készletet
 * teszünk a dokumentum elejére, a fejlécek `<use href="#i-…">`-szel hivatkoznak.
 */
document.addEventListener("DOMContentLoaded", function () {
  var sprite = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <g id="g-stroke" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></g>
  </defs>

  <symbol id="i-grid" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
    <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>
  </symbol>

  <symbol id="i-team" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="5" r="2.5"/><path d="M1.5 14a4.5 4.5 0 0 1 9 0"/>
    <circle cx="11.5" cy="6" r="2"/><path d="M11.5 10.5a3.5 3.5 0 0 1 3 3.5"/>
  </symbol>

  <symbol id="i-candidate" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="7" cy="5" r="3"/><path d="M2 14a5 5 0 0 1 10 0"/><path d="M12 5l1.5 1.5L16 4"/>
  </symbol>

  <symbol id="i-org" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="1" width="14" height="14" rx="2"/><path d="M1 5h14M5 1v14M10 1v14M1 10h14"/>
  </symbol>

  <symbol id="i-report" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 13.5h12"/><path d="M4 10V6.5"/><path d="M8 10V3.5"/><path d="M12 10V8"/>
  </symbol>

  <symbol id="i-bell" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 1.8a4 4 0 0 0-4 4v2.6L2.8 11h10.4L12 8.4V5.8a4 4 0 0 0-4-4Z"/><path d="M6.4 13a1.7 1.7 0 0 0 3.2 0"/>
  </symbol>

  <symbol id="i-chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.5 4.5L6 8l3.5-3.5"/>
  </symbol>

  <symbol id="i-chev-r" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 2.5L8 6l-3.5 3.5"/>
  </symbol>

  <symbol id="i-search" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
    <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
  </symbol>

  <symbol id="i-menu" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path d="M2 4h12M2 8h12M2 12h12"/>
  </symbol>

  <symbol id="i-close" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>
  </symbol>

  <symbol id="i-user" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="5" r="3"/><path d="M2.5 14a5.5 5.5 0 0 1 11 0"/>
  </symbol>

  <symbol id="i-home" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.5 7L8 2l5.5 5"/><path d="M4 6.5V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5"/>
  </symbol>

  <symbol id="i-blog" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/><path d="M5 5.5h6M5 8h6M5 10.5h3.5"/>
  </symbol>

  <symbol id="i-exit" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6"/>
  </symbol>

  <symbol id="i-switch" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.5 5.5h9L9 3"/><path d="M13.5 10.5h-9L7 13"/>
  </symbol>

  <symbol id="i-moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z"/>
  </symbol>
</svg>`;
  document.body.insertAdjacentHTML("afterbegin", sprite);
});
