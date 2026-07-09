import type { Locale } from '@/lib/i18n'
import type { SiteMode } from '@/types/mode'

export const modeCopy: Record<SiteMode, Record<Locale, {
  eyebrow: string
  heading: string
  headingEm: string
  headingEmPosition: 'start' | 'middle' | 'end'
  sub: string
  cta: string
  ctaSecondary: string
  trust: string[]
  statsLabel: string
}>> = {
  self: {
    hu: {
      eyebrow: 'HEXACO Karrierprofil',
      heading: 'Fedezd fel, milyen karrierre',
      headingEm: 'vagy teremtve.',
      headingEmPosition: 'end',
      sub: 'Tudományosan validált személyiségprofil, amely konkrét karrierirányokat és fejlesztési utat mutat — nem általánosságokat.',
      cta: 'Ingyenes teszt indítása →',
      ctaSecondary: 'Van már fiókom',
      trust: ['⏱ ~15 perc', '🔬 Tudományos', '🆓 Ingyenes start'],
      statsLabel: 'Egyéni karrierprofil',
    },
    en: {
      eyebrow: 'HEXACO Career Profile',
      heading: 'Discover the career',
      headingEm: "you're made for.",
      headingEmPosition: 'end',
      sub: 'A scientifically validated personality profile that shows concrete career directions and a development path — not generalities.',
      cta: 'Start free test →',
      ctaSecondary: 'I already have an account',
      trust: ['⏱ ~15 min', '🔬 Scientific', '🆓 Free start'],
      statsLabel: 'Individual career profile',
    },
  },
  team: {
    hu: {
      eyebrow: 'Csapatintelligencia platform',
      heading: 'Lásd tisztábban a',
      headingEm: 'csapatod működését.',
      headingEmPosition: 'end',
      sub: 'A trita megmutatja, ami eddig láthatatlan volt — a csapatod valódi dinamikáját. Mielőtt a feszültség konfliktussá, a konfliktus pedig költséggé válik.',
      cta: 'Megnézem a csapatomat →',
      ctaSecondary: 'Van már fiókom',
      trust: ['✓ 18 csapat elemezve', '⚡ 48h az első képig', '🔬 Tudományos'],
      statsLabel: 'Csapatdinamika',
    },
    en: {
      eyebrow: 'Team Intelligence Platform',
      heading: 'See your team dynamics',
      headingEm: 'more clearly.',
      headingEmPosition: 'end',
      sub: "trita shows what's been invisible — your team's real dynamics. Before tension becomes conflict, and conflict becomes cost.",
      cta: 'See my team →',
      ctaSecondary: 'Already have an account? Sign in',
      trust: ['✓ 18 teams analyzed', '⚡ 48h to first profile', '🔬 Scientific'],
      statsLabel: 'Team dynamics',
    },
  },
}

export const modeTabCopy: Record<SiteMode, Record<Locale, {
  label: string
  sub: string
  icon: string
}>> = {
  self: {
    hu: { label: 'Egyéneknek', sub: 'Karrierprofilod és fejlődésed', icon: '👤' },
    en: { label: 'For individuals', sub: 'Your career profile and growth', icon: '👤' },
  },
  team: {
    hu: { label: 'Csapatoknak', sub: 'Csapatdinamika és HR döntések', icon: '👥' },
    en: { label: 'For teams', sub: 'Team dynamics and HR decisions', icon: '👥' },
  },
}
