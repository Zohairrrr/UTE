# Design

## Theme
URBAN TIFFIN AND EVENTS uses a solid tactile editorial system derived from the logo. The body surface is warm cream, the primary ink is deep forest green, the accent is muted ochre, and grouping surfaces use darker cream. No pure white is used.

## Color Tokens
- `brand-green`: `#233426`
- `brand-ochre`: `#A07A4B`
- `brand-cream`: `#F9F7F2`
- `brand-cream-dark`: `#F1EDE2`
- `ink-soft`: `rgba(35, 52, 38, 0.72)`
- `line-green`: `rgba(35, 52, 38, 0.10)`
- `line-ochre`: `rgba(160, 122, 75, 0.38)`

## Typography
- Display: high-contrast serif for logo lockups and editorial headings.
- Interface: geometric sans for navigation, labels, forms, tables, and data.
- Display headings use restrained wide tracking for brand resemblance. UI text uses clear weight contrast and compact line-height.

## Layout
- Solid flat surfaces only.
- Sharp 1px rules separate content.
- Cards are functional frames, not decorative containers.
- Asymmetry is used in hero and events sections, while admin screens use dense aligned matrices.
- Radius stays minimal: 0 to 8px for most surfaces.

## Motion
- Framer Motion springs use `stiffness: 280` and `damping: 25`.
- `layoutId` is used for tab/tier indicators and admin row expansion.
- Scroll reveals are fast, short, and staggered.
- Reduced motion disables layout choreography and keeps content immediately visible.
