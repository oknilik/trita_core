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
      eyebrow: 'trita személyiségprofil',
      heading: 'Ismerd meg jobban,',
      headingEm: 'mire építhetsz.',
      headingEmPosition: 'end',
      sub: 'Hat szempontból ismerheted meg a személyiségedet. A riport segít végiggondolni az erősségeidet és a hozzád közel álló csapatszerepeket.',
      cta: 'Ingyenes teszt indítása',
      ctaSecondary: 'Van már fiókom',
      trust: ['⏱ ~10 perc', '🔬 Tudományos', '🆓 Ingyenes indulás'],
      statsLabel: 'Egyéni személyiségprofil',
    },
    en: {
      eyebrow: 'trita personality profile',
      heading: 'Get to know',
      headingEm: "your strengths.",
      headingEmPosition: 'end',
      sub: 'Explore six dimensions of your personality. Your report helps you reflect on your strengths and the team roles that may suit you.',
      cta: 'Start free test',
      ctaSecondary: 'I already have an account',
      trust: ['⏱ ~10 min', '🔬 Scientific', '🆓 Free start'],
      statsLabel: 'Individual personality profile',
    },
  },
  team: {
    hu: {
      eyebrow: 'Csapatintelligencia platform',
      heading: 'Ismerd meg jobban a',
      headingEm: 'csapatod együttműködését.',
      headingEmPosition: 'end',
      sub: 'A trita segít megérteni, hogyan dolgoztok együtt, mi támogatja a közös munkát, és hol alakulhatnak ki feszültségek.',
      cta: 'Beszéljünk a csapatodról',
      ctaSecondary: 'Van már fiókom',
      trust: ['✓ Személyes bevezetés', '⚡ Néhány nap az első képig', '🔬 Tudományos'],
      statsLabel: 'Csapatdinamika',
    },
    en: {
      eyebrow: 'Team Intelligence Platform',
      heading: 'See your team dynamics',
      headingEm: 'more clearly.',
      headingEmPosition: 'end',
      sub: "trita shows what's been invisible – your team's real dynamics. Before tension becomes conflict, and conflict becomes cost.",
      cta: "Let's talk about your team",
      ctaSecondary: 'Already have an account? Sign in',
      trust: ['✓ Personal onboarding', '⚡ First picture in days', '🔬 Scientific'],
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
    hu: { label: 'Egyéneknek', sub: 'Személyiségprofilod és erősségeid', icon: '👤' },
    en: { label: 'For individuals', sub: 'Your personality profile and strengths', icon: '👤' },
  },
  team: {
    hu: { label: 'Csapatoknak', sub: 'Csapatdinamika és HR-döntések', icon: '👥' },
    en: { label: 'For teams', sub: 'Team dynamics and HR decisions', icon: '👥' },
  },
}
