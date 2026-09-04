/**
 * „Jel és válasz” – a Kapcsolat oldal saját, tisztán szerkesztői motívuma.
 * A két nyitott forma közti pontsor az elküldött megkeresés, a visszahajló
 * tintaív a személyes választ jelöli. Nem használ mérési eredmény-formákat.
 */
export function ContactSignalArt({ className }: { className?: string }) {
  return (
    <svg data-contact-signal-art viewBox="0 0 430 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className={className}>
      <path d="M22 132C22 87 53 56 95 57C137 58 163 91 159 135H128C131 111 117 91 95 90C72 89 55 107 55 132Z" fill="var(--color-accent-primary)" />
      <circle cx="95" cy="125" r="10" fill="var(--color-surface-canvas)" />
      <path d="M113 125C160 90 202 89 244 116" fill="none" stroke="var(--color-text-primary)" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      <circle cx="166" cy="98" r="4" fill="var(--color-accent-primary-soft)" />
      <circle cx="188" cy="95" r="6" fill="var(--color-accent-primary-soft)" />
      <circle cx="213" cy="101" r="8" fill="var(--color-accent-primary-soft)" />
      <path d="M332 56C368 61 394 91 390 128C386 164 355 187 318 180C284 173 266 140 277 106C286 76 305 52 332 56ZM328 88C310 88 299 104 302 124C305 143 321 153 339 147C355 142 364 127 359 110C355 96 344 88 328 88Z" fill="var(--color-action-primary-bg)" fillRule="evenodd" />
      <path d="M244 116C271 136 281 151 311 153M122 151C173 183 227 179 279 143" fill="none" stroke="var(--color-layer-team-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <g fill="none" stroke="var(--color-text-primary)" strokeWidth="1.9" strokeLinecap="round"><path d="M246 54v38M227 73h38M233 60l26 26M259 60l-26 26" /></g>
      <circle cx="405" cy="79" r="9" fill="var(--color-accent-primary-soft)" />
    </svg>
  );
}
