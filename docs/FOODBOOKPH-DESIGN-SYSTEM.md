# FoodBookPH Design System

## Brand direction
FoodBookPH is a warm, community-first food discovery product for the Philippines. The visual language combines editorial food culture with approachable utility: evergreen for trust, warm cream for appetite and comfort, saffron for highlights, and terracotta for human moments and important accents.

## Logo
The primary mark is a compact evergreen monogram inspired by a bowl/plate and the letterform of FoodBookPH. It is intentionally simple so it remains recognizable as a favicon, avatar, navigation mark, and app icon. The production favicon is `app/icon.svg`. The shared React brand component is `components/Brand.tsx`.

## Color tokens
- `--fb-forest`: primary brand / navigation / primary actions
- `--fb-forest-2`: secondary brand tone
- `--fb-moss`: supporting green / links / focus accents
- `--fb-sage`: selected surfaces and soft brand backgrounds
- `--fb-cream`: application background
- `--fb-surface`: cards and elevated surfaces
- `--fb-ink`: primary text
- `--fb-muted`: secondary text
- `--fb-line`: borders and dividers
- `--fb-gold`: ratings, highlights, pending states
- `--fb-coral`: human/action accent and destructive emphasis
- `--fb-success`, `--fb-danger`, `--fb-info`: semantic feedback

## Typography
- Display/editorial: Newsreader
- Interface/body: DM Sans
- Display scale: 34–82px, responsive and used sparingly
- Section scale: 28–42px
- Body: 13–14px
- Supporting labels: 10–12px
- Use strong weight for actions and labels; avoid all-caps for long copy.

## Spacing
Use the 4px base scale: 4, 8, 12, 16, 20, 24, 32, 40px. Prefer existing layout primitives and component padding over one-off margins.

## Shape and elevation
- Small controls: 8px
- Standard controls/cards: 14px
- Hero/elevated surfaces: 18–20px
- Pills: 999px
- Small elevation: `--fb-shadow-sm`
- Interactive elevation: `--fb-shadow-md`
- Modal/major elevation: `--fb-shadow-lg`

## Interaction rules
- Minimum touch target: 40px for icon controls and 44px for primary form controls.
- Every interactive element needs a visible hover/focus/disabled state.
- Focus uses the shared gold focus ring.
- Destructive actions use terracotta/red and require clear confirmation where irreversible.
- Empty states explain what happened and provide one useful next action.
- Loading states must preserve layout to avoid content jumping.

## Navigation architecture
### Customer
Home → Discover → Restaurants → Food feed → My profile
Community is reached through the customer profile/community entry points and remains customer-only.

### Restaurant Owner
Overview → Restaurant Profile → Menu → Photos → Posts → Reviews → Notifications → Settings
Owner navigation remains isolated from customer navigation and uses the Restaurant Studio visual treatment.

## Responsive rules
- Mobile first for touch and reading flow.
- Desktop may expose persistent side navigation and supporting rails.
- Mobile uses bottom navigation for the core customer shell and a slide-in owner navigation.
- Cards collapse to one column below 700–760px.
- Search controls remain full-width and touch friendly on mobile.

## Accessibility
Use semantic headings, labels, `aria-label` for icon-only controls, visible focus rings, sufficient contrast, and never rely on color alone to communicate state.
