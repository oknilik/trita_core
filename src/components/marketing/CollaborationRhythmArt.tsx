/** Három eltérő ritmus egy közös ponton találkozik, majd összehangoltan halad tovább. */
export function CollaborationRhythmArt({ className }: { className?: string }) {
  return (
    <svg data-collaboration-rhythm-art viewBox="0 0 430 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className={className}>
      <circle cx="218" cy="150" r="76" fill="var(--color-sage-300)" opacity="0.12" />
      <path d="M22 71C64 30 98 115 140 75C171 46 189 101 216 138C248 181 283 198 412 190" fill="none" stroke="var(--color-layer-team-badge)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 146C64 108 94 181 138 146C172 119 192 120 217 143C250 173 284 164 412 146" fill="none" stroke="var(--color-text-on-inverse)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.78" />
      <path d="M22 226C64 274 100 187 143 226C174 254 193 191 218 151C246 107 282 94 412 104" fill="none" stroke="var(--color-sage-300)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M218 105L229 135L259 147L229 158L218 188L206 158L177 147L206 135Z" fill="var(--color-text-on-inverse)" />
      <circle cx="381" cy="54" r="13" fill="var(--color-layer-team-glow)" />
      <circle cx="48" cy="31" r="7" fill="var(--color-sage-300)" />
    </svg>
  );
}
