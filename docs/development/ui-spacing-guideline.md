# UI Spacing Guideline

## Cél

Egységes spacing használat a primitive és feature komponensekben, hogy ne ad hoc `px/py/gap` értékekből álljon össze a layout.

## Központi skála (forrás)

Tokenek: `src/app/globals.css` (`@theme inline`)

- `--ui-space-1` = 4px
- `--ui-space-2` = 8px
- `--ui-space-3` = 12px
- `--ui-space-4` = 16px
- `--ui-space-5` = 20px
- `--ui-space-6` = 24px
- `--ui-space-7` = 28px
- `--ui-space-8` = 32px
- `--ui-space-10` = 40px
- `--ui-space-12` = 48px

Kiegészítő finom lépcsők:

- `--ui-space-0_5` = 2px
- `--ui-space-1_5` = 6px
- `--ui-space-2_5` = 10px

## Semantic spacing aliasok

- `--ui-space-field-gap`
- `--ui-space-card-padding-sm`
- `--ui-space-card-padding-md`
- `--ui-space-card-padding-lg`
- `--ui-space-stack-gap`

## Használati szabályok

1. Új komponensben először semantic alias-t használj, ne nyers spacing tokent.
2. Ha nincs megfelelő alias, átmenetileg használható nyers token (`--ui-space-*`), de a következő körben legyen alias.
3. Arbitrary pixel érték (`px-[13px]`, `gap-[7px]`) csak kivételként maradhat.
4. A primitive-ek spacing API-ja legyen preferált:
 - `Card` -> `spacing` prop
 - `TextField` / `SelectField` / `TextareaField` -> beépített `field-gap`
 - `Button` -> size alapú padding

## Primitive mapping (jelenlegi)

- `Button`: `--ui-space-4/5/6` vízszintes padding
- `Card`: `--ui-space-card-padding-sm/md/lg`
- `TextField`/`SelectField`/`TextareaField`: `--ui-space-field-gap`, `--ui-space-3`
- `InlineBanner`: `--ui-space-4` + `--ui-space-3`
- `EmptyState`: `--ui-space-6` + `--ui-space-7`
- `StatusChip`: `--ui-space-2_5` + `--ui-space-1`

## Rövid checklist PR-hoz

- Van új `px-[...]` vagy `gap-[...]`? Ha igen, indokolt?
- Tudtunk semantic alias-t használni?
- A komponens vissza tud állni primitive API-ra?
