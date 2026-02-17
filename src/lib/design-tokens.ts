/**
 * TRITA DESIGN SYSTEM - Single Source of Truth
 *
 * Minden design érték központilag itt van definiálva.
 * NE használj hard-coded értékeket a komponensekben!
 */

// ============================================================================
// SZÍNEK
// ============================================================================

export const colors = {
  // Primary palette
  primary: {
    indigo: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
    },
    purple: {
      50: '#F5F3FF',
      500: '#8B5CF6',
      600: '#7C3AED',
    },
    pink: {
      50: '#FCE7F3',
      500: '#D946EF',
    },
  },

  // Semantic colors
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
  },

  teal: {
    50: '#F0FDFA',
    600: '#14B8A6',
  },

  amber: {
    50: '#FEF3C7',
    100: '#FDE68A',
    200: '#FCD34D',
    500: '#F59E0B',
    600: '#D97706',
  },

  rose: {
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
  },

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    900: '#111827',
  },

  white: '#FFFFFF',
} as const

// ============================================================================
// GRADIENSEK - Szemantikus jelentéssel
// ============================================================================

export const gradients = {
  // Action buttons
  primaryAction: 'from-indigo-600 to-purple-600',

  // Hero & major headers
  heroHeader: 'from-indigo-500 via-purple-500 to-pink-500',

  // Progress & state indicators
  progress: 'from-indigo-500 to-purple-500',

  // Page backgrounds
  pageBackground: 'from-indigo-50/70 via-white to-white',
  authBackground: 'from-indigo-50 via-purple-50 to-pink-50',

  // Card backgrounds - glass effect
  glassIndigo: 'from-indigo-50/80 via-white to-white',
  glassAmber: 'from-amber-50/80 via-white to-white',

  // Stat badges
  badgeEmerald: 'from-emerald-50 to-teal-50',
  badgeAmber: 'from-amber-50 to-orange-50',
  badgeIndigo: 'from-indigo-50 to-purple-50',

  // Text gradients
  textHeading: 'from-gray-900 to-gray-600',

  // Decorative bars
  decorativeBar: 'from-indigo-500 to-purple-500',
} as const

// ============================================================================
// GOMB MÉRETEK
// ============================================================================

export const buttonSizes = {
  // Primary & Secondary buttons
  primary: 'min-h-[48px]',

  // Tertiary & Mobile optimized
  tertiary: 'min-h-[44px]',

  // Small actions (close, icon buttons)
  small: 'min-h-[40px]',

  // Compact (picker buttons)
  compact: 'min-h-[38px]',
} as const

export const buttonPadding = {
  primary: 'px-8',      // Emphasized CTAs
  secondary: 'px-6',    // Standard buttons
  tertiary: 'px-4',     // Smaller contexts
  compact: 'px-3',      // Pickers/selectors
} as const

// ============================================================================
// BORDER COLORS & OPACITY
// ============================================================================

export const borders = {
  // Standard borders
  default: 'border-gray-100',
  subtle: 'border-gray-100/50',
  divider: 'border-gray-200',

  // Glass effect borders
  glassIndigo: 'border-indigo-100/50',
  glassEmphasis: 'border-indigo-100',
  glassAmber: 'border-amber-200/50',

  // State borders
  success: 'border-emerald-200',
  warning: 'border-amber-200',
  error: 'border-rose-200',
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  // Component hierarchy
  container: 'rounded-2xl',    // 16px - Major sections, modals
  card: 'rounded-xl',          // 12px - Nested cards
  button: 'rounded-lg',        // 8px - Buttons, inputs
  badge: 'rounded-full',       // Pills, avatars

  // Specific overrides
  hero: 'rounded-3xl',         // 24px - Hero containers only
} as const

// ============================================================================
// SPACING & GAPS
// ============================================================================

export const spacing = {
  // Section padding
  section: {
    mobile: 'p-6',
    desktop: 'md:p-8',
    large: 'p-8 md:p-12',
  },

  // Card padding
  card: {
    standard: 'p-4',
    medium: 'p-5',
    large: 'p-6',
  },

  // Gaps
  gap: {
    tight: 'gap-2',       // Form labels, inline elements
    standard: 'gap-4',    // Form fields, card grids
    medium: 'gap-6',      // Card grids
    large: 'gap-8 md:gap-12',  // Major sections
  },
} as const

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  // Standard elevation
  sm: 'shadow-sm',       // Minimal shadow (nav, small cards)
  md: 'shadow-md',       // Medium shadow (buttons, cards)
  lg: 'shadow-lg',       // Standard elevation (sections)
  xl: 'shadow-xl',       // Emphasized (CTAs, hero)
  '2xl': 'shadow-2xl',   // Maximum depth (modals)

  // Colored shadows (use sparingly for emphasis)
  indigoLg: 'shadow-lg shadow-indigo-200',
  indigoXl: 'shadow-xl shadow-indigo-100/40',
} as const

// ============================================================================
// ANIMÁCIÓK
// ============================================================================

export const animations = {
  // Transition durations
  duration: {
    quick: 'duration-200',      // 0.2s - Quick interactions
    standard: 'duration-300',   // 0.3s - Standard transitions
    heavy: 'duration-500',      // 0.5s - Heavy animations
    special: 'duration-700',    // 0.7-1s - Special effects
  },

  // Hover scales
  scale: {
    subtle: 'hover:scale-[1.02]',      // Subtle feedback
    emphasized: 'hover:scale-105',      // Emphasized actions
    interactive: 'hover:scale-110',     // Interactive elements
  },

  // Common easing
  ease: 'ease-out',
  easeInOut: 'ease-in-out',
} as const

// ============================================================================
// TIPOGRÁFIA
// ============================================================================

export const typography = {
  // Section headings (modern with decorative bar)
  sectionHeading: {
    size: 'text-3xl font-bold',
    gradient: 'bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent',
  },

  // Standard headings
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',

  // Body text
  body: 'text-sm text-gray-600',
  bodyLarge: 'text-base text-gray-600',
  bodySmall: 'text-xs text-gray-500',

  // Labels
  label: 'text-sm font-medium text-gray-700',
  labelSmall: 'text-xs font-semibold text-gray-600',

  // Tags & badges
  tag: 'text-xs font-semibold uppercase tracking-[0.2em]',
} as const

// ============================================================================
// KOMPONENS KOMBINÁCIÓK (Gyakran használt minták)
// ============================================================================

export const patterns = {
  // Glass effect card
  glassCard: {
    base: `${borderRadius.container} ${borders.glassIndigo} bg-gradient-to-br ${gradients.glassIndigo} glass-effect`,
    padding: spacing.section.large,
    shadow: shadows.lg,
  },

  // Plain white card
  whiteCard: {
    base: `${borderRadius.container} ${borders.subtle} bg-white`,
    padding: spacing.section.large,
    shadow: shadows.lg,
  },

  // Primary CTA button
  primaryButton: {
    base: `${buttonSizes.primary} ${buttonPadding.primary} ${borderRadius.button} bg-gradient-to-r ${gradients.primaryAction} text-sm font-semibold text-white`,
    shadow: shadows.lg,
    hover: `${shadows.xl} ${animations.scale.emphasized} ${animations.duration.standard}`,
  },

  // Modern section header with decorative bar
  modernHeader: {
    bar: `h-1 w-12 bg-gradient-to-r ${gradients.decorativeBar} rounded-full`,
    heading: `${typography.sectionHeading.size} ${typography.sectionHeading.gradient}`,
  },

  // Stat badge
  statBadge: {
    base: `${borderRadius.card} bg-gradient-to-br ${buttonPadding.tertiary} py-3`,
    border: borders.default,
  },
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Kombinál több class stringet biztonságosan
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Gyors hozzáférés a primary button stylinghoz
 */
export function getPrimaryButtonClasses(size: keyof typeof buttonSizes = 'primary'): string {
  return cn(
    buttonSizes[size],
    buttonPadding.primary,
    borderRadius.button,
    `bg-gradient-to-r ${gradients.primaryAction}`,
    'text-sm font-semibold text-white',
    shadows.lg,
    `hover:${shadows.xl}`,
    animations.scale.emphasized,
    animations.duration.standard,
    'transition-all'
  )
}

/**
 * Gyors hozzáférés a section header stylinghoz
 */
export function getSectionHeaderClasses(): {
  container: string
  bar: string
  heading: string
} {
  return {
    container: 'flex items-center gap-3 mb-6',
    bar: patterns.modernHeader.bar,
    heading: patterns.modernHeader.heading,
  }
}
