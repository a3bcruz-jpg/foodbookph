# FoodBookPH Brand & UI System

## Brand anchor

The approved FoodBookPH logo is the single source of truth for brand identity. The interface must not replace, redraw, recolor, stretch, or reinterpret the approved mark.

## Semantic palette

| Token | Value | Intended use |
|---|---|---|
| Brand Red | `#F0182F` | Primary actions, active navigation, key emphasis |
| Brand Orange | `#FF5A1F` | Primary-action gradient partner, warm discovery accents |
| Brand Yellow | `#FFB51B` | Ratings, highlights, celebratory states |
| Brand Blue | `#168BD4` | Informational states and secondary accents |
| Brand Green | `#31B95D` | Success, verified, healthy/positive states |
| Ink | `#1D2429` | Primary text |
| Muted | `#66717A` | Secondary text |
| Background | `#FFFDF9` | Application background |
| Surface | `#FFFFFF` | Cards and elevated surfaces |
| Soft surface | `#FFF6F1` | Branded secondary surfaces |
| Line | `#E9E3DE` | Borders and dividers |

Saturated logo colors are intentionally used as accents rather than as full-page backgrounds. Neutral surfaces preserve readability and make food photography remain the visual focus.

## Shape language

Use friendly rounded geometry without making the product look playful or childish:

- Small radius: 10px
- Medium radius: 16px
- Large radius: 22px
- Pill controls: 999px
- Soft elevation: low-opacity neutral shadows

## UX principles

1. Customer and Restaurant Owner navigation remain separate.
2. Discovery surfaces prioritize photography, search, ratings, and clear actions.
3. Social features use the same components as restaurant discovery rather than a separate visual language.
4. Owner tools use the same brand but calmer surfaces and denser information hierarchy.
5. Mobile uses bottom navigation and touch targets of at least approximately 44px where practical.
6. High-saturation colors are reserved for actions, status, and meaningful emphasis.
7. Existing business logic, APIs, authentication, authorization, and data behavior must remain intact.

## Implementation

`app/foodbookph-brand.css` is the brand-layer stylesheet. It is loaded last in `app/layout.tsx` so the new visual system can refine the existing UI without requiring a risky page-by-page rewrite.

The official logo asset itself must be stored in the repository before replacing any remaining legacy text/mark treatment. Recommended paths are `public/brand/foodbookph-logo.svg` for the full logo and `public/brand/foodbookph-mark.svg` for the standalone mark. Do not create substitute artwork when the approved asset is available.
