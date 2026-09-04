/**
 * „Közös ritmus” – az Együttműködés oldal saját szerkesztői motívuma.
 * Három eltérő pálya fut össze egy közös mag körül, majd úgy halad tovább,
 * hogy a különálló formák karaktere megmarad.
 */
export function CollaborationRhythmArt({ className }: { className?: string }) {
  return (
    <svg data-collaboration-rhythm-art viewBox="0 0 430 280" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className={className}>
      <path d="M30 65C95 72 113 115 176 137C227 155 270 141 332 102" fill="none" stroke="var(--color-layer-team-badge)" strokeWidth="2.2" strokeLinecap="round" opacity="0.78" />
      <path d="M26 208C88 195 121 163 176 145C231 128 277 144 334 184" fill="none" stroke="var(--color-sage-300)" strokeWidth="2.2" strokeLinecap="round" opacity="0.82" />
      <path d="M64 30C104 89 137 111 180 139C226 169 272 172 338 142" fill="none" stroke="var(--color-text-on-inverse)" strokeWidth="1.8" strokeLinecap="round" opacity="0.58" />
      <path d="M52 43A48 48 0 0 0 52 131A70 70 0 0 1 52 43Z" fill="var(--color-layer-team-glow)" />
      <path d="M22 159v84M70 159v84M22 181h48M22 207h48" fill="none" stroke="var(--color-text-on-inverse)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx="72" cy="43" r="13" fill="var(--color-layer-team-badge)" />
      <g transform="translate(216 142)"><path d="M0-63C38-60 65-28 60 8C55 43 24 65-12 59C-48 53-68 18-56-18C-46-48-26-64 0-63Z" fill="var(--color-sage-300)" /><circle cx="2" cy="-1" r="27" fill="var(--color-layer-team-hero-mid)" /><circle cx="2" cy="-1" r="7" fill="var(--color-layer-team-badge)" /></g>
      <path d="M325 70C368 45 411 73 407 119C404 159 370 189 330 193V164C351 161 369 144 371 121C373 99 354 87 334 98Z" fill="var(--color-layer-team-glow)" />
      <g fill="none" stroke="var(--color-text-on-inverse)" strokeWidth="2" strokeLinecap="round"><path d="M380 21v35M362 39h36M367 26l26 26M393 26l-26 26" /></g>
    </svg>
  );
}
