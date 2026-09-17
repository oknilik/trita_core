# Pattern artwork in web reports and PDF

Shortened the catalogue heading to “A közös munkánk mintázatai” (English: “Patterns of our shared work”).

The shared team report block now shows the selected descriptive operating pattern's eyeless illustration, covering both leader and member reports. Existing current catalogue names, measured axes, personality layers and uncertainty messages remain in place. Tentative classifications retain their neutral geometric mark; mixed or unavailable results do not receive a definitive character.

The PDF uses the same illustration below the description as native vector paths, without fetching images or rasterizing them. `scripts/sync-operating-pattern-vectors.mjs` regenerates the PDF vector data from the sixteen canonical SVGs in `public/illustrations/operating-patterns/`; run it after artwork updates. PDF data is imported only by the PDF module.

Validated the HU/EN PDF smoke renders, all six pages of the full HU sample, empty/mixed reports, desktop and 390/320px web layouts, and catalogue heading. Client regression coverage includes descriptive report artwork and PDF pagination.
