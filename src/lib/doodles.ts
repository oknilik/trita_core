export const DOODLE_SOURCES = [
  '/doodles/chilling.svg',
  '/doodles/coffee.svg',
  '/doodles/float.svg',
  '/doodles/groovy.svg',
  '/doodles/jumping.svg',
  '/doodles/laying.svg',
  '/doodles/loving.svg',
  '/doodles/meditating.svg',
  '/doodles/plant.svg',
  '/doodles/reading-side.svg',
  '/doodles/roller-skating.svg',
  '/doodles/running.svg',
  '/doodles/selfie.svg',
  '/doodles/sitting-reading.svg',
  '/doodles/sleek.svg',
  '/doodles/strolling.svg',
  '/doodles/swinging.svg',
  '/doodles/unboxing.svg',
] as const

export function pickRandomDoodle(current?: string): string {
  const pool = current
    ? DOODLE_SOURCES.filter((src) => src !== current)
    : DOODLE_SOURCES
  return pool[Math.floor(Math.random() * pool.length)] ?? DOODLE_SOURCES[0]
}
