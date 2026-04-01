export type AvatarGradient = readonly [string, string];

const AVATAR_GRADIENTS: readonly AvatarGradient[] = [
  ["var(--color-accent-self-strong)", "var(--color-accent-self-deep)"],
  ["var(--color-accent-primary-strong)", "var(--color-accent-earth-strong)"],
  ["var(--color-text-secondary)", "var(--color-text-strong-alt)"],
  [
    "var(--color-visual-gradient-indigo)",
    "var(--color-visual-gradient-indigo-deep)",
  ],
  ["var(--color-visual-cyan)", "var(--color-visual-cyan-deep)"],
  [
    "var(--color-visual-gradient-purple)",
    "var(--color-visual-gradient-purple-deep)",
  ],
];

const AVATAR_SOLID_COLORS: readonly string[] = [
  "var(--color-visual-gradient-indigo)",
  "var(--color-visual-gradient-violet)",
  "var(--color-state-success-strong)",
  "var(--color-state-warning-strong)",
  "var(--color-action-primary-bg)",
  "var(--color-accent-primary)",
];

function normalizeSeed(seed?: string | null): string {
  const trimmed = seed?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  return "trita";
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getAvatarGradient(seed?: string | null): AvatarGradient {
  const normalized = normalizeSeed(seed);
  return AVATAR_GRADIENTS[hashSeed(normalized) % AVATAR_GRADIENTS.length];
}

export function getAvatarGradientCss(seed?: string | null): string {
  const [from, to] = getAvatarGradient(seed);
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function getAvatarSolidColor(seed?: string | null): string {
  const normalized = normalizeSeed(seed);
  return AVATAR_SOLID_COLORS[hashSeed(normalized) % AVATAR_SOLID_COLORS.length];
}

export function getAvatarMonogram(
  displayName?: string | null,
  options?: {
    length?: 1 | 2;
    fallback?: string;
  },
): string {
  const fallback = options?.fallback ?? "?";
  const length = options?.length ?? 1;
  const normalizedName = displayName?.trim() ?? "";
  if (!normalizedName) return fallback;

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;

  if (length === 1) {
    return parts[0]?.charAt(0).toUpperCase() || fallback;
  }

  if (parts.length >= 2) {
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts[parts.length - 1]?.charAt(0) ?? "";
    const initials = `${first}${last}`.toUpperCase();
    return initials || fallback;
  }

  const compact = parts[0] ?? "";
  return compact.slice(0, 2).toUpperCase() || fallback;
}

export function isAvatarImageUrl(value?: string | null): value is string {
  const raw = value?.trim();
  if (!raw) return false;

  if (raw.startsWith("/")) return true;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export interface AvatarPresentation {
  mode: "image" | "fallback";
  imageUrl: string | null;
  monogram: string;
  gradient: AvatarGradient;
  gradientCss: string;
  solidColor: string;
}

export function resolveAvatarPresentation(input: {
  imageUrl?: string | null;
  displayName?: string | null;
  seed?: string | null;
  monogramLength?: 1 | 2;
  fallbackMonogram?: string;
}): AvatarPresentation {
  const seed = input.seed ?? input.displayName ?? "trita";
  const gradient = getAvatarGradient(seed);

  return {
    mode: isAvatarImageUrl(input.imageUrl) ? "image" : "fallback",
    imageUrl: isAvatarImageUrl(input.imageUrl) ? input.imageUrl : null,
    monogram: getAvatarMonogram(input.displayName, {
      length: input.monogramLength,
      fallback: input.fallbackMonogram,
    }),
    gradient,
    gradientCss: getAvatarGradientCss(seed),
    solidColor: getAvatarSolidColor(seed),
  };
}
