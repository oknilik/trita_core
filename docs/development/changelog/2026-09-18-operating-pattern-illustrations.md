# Operating pattern character illustrations

The operating-pattern explorer now shows the selected pattern's illustration directly below its description, with localized alternative text. Selection and deep links use the existing public pattern code to load the matching asset.

Sixteen individual SVGs live in `public/illustrations/operating-patterns/`, named by code (SECP through IODA). They use a consistent 400 × 224 viewBox, transparent backgrounds and native vector paths; there are no embedded raster images, captions, scripts or external references. They were extracted and traced from the approved eyeless character sheet, with paper grain simplified for compact, scalable assets. The original generation was `exec-1314c484-0a98-451b-9636-4497fc5ff8f4.png`. The illustration palette belongs to the approved artwork; interface colors still use design tokens.

Validation: the catalogue's four client tests pass, including image mapping for all sixteen selections; targeted ESLint and TypeScript pass. Browser checks loaded every SVG, verified the English alternative text, and checked desktop plus 390/320px mobile layouts without horizontal overflow. No report or PDF illustration changes in this update.
