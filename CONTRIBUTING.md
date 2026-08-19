# Contributing to MtaaMap

MtaaMap is currently a two-person project: Tjay leads (this is his idea and he owns the direction/backend), Zipporah leads frontend implementation. This doc exists so we don't step on each other's work as the repo grows.

## Roles

- **Tjay** — project lead, backend (FastAPI, PostgreSQL/PostGIS), data model, deployment, final call on scope/direction.
- **Zipporah** — frontend lead, React/UI implementation, component structure, styling decisions within the established design system.

Anyone else joining later: talk to Tjay before starting on a feature that isn't already tracked in an issue or the README roadmap — this avoids duplicate work on a two-person-turning-into-more team.

## Branching

- `main` is always demo-ready — don't push directly to it.
- Create a branch per feature/fix: `feature/price-dispute-flow`, `fix/map-marker-overlap`, etc.
- Open a PR into `main` even if it's just the two of us — keeps a record of what changed and why, and gives a chance to catch conflicts before they happen (we've hit merge conflicts before on Digital AdBoard, so this is worth the small overhead).

## Before you start work

1. Pull latest `main` first: `git pull origin main`
2. Run `npm install --legacy-peer-deps` if `package.json` changed since you last pulled (the `--legacy-peer-deps` flag is currently required — see README).
3. Confirm `npm run dev` runs clean before you start changing things, so you know any errors you hit later are from your own changes.

## Design system — don't improvise outside it

The app's visual identity is intentional, not default Tailwind styling. Stick to the token system already defined in `src/index.css`:

- Colors: use the theme tokens (`bg-ink`, `bg-surface`, `text-mist`, `text-electric`, `bg-verified`, `bg-flag`, `bg-dispute`, etc.) — don't introduce new hex values inline.
- Layer colors are fixed: blue = Neighborhood, green = Prices, amber = Road issues. Don't reassign these.
- Fonts: `font-display` (Space Grotesk) for headings/brand, `font-body` (Inter) for everything else, `font-data` (JetBrains Mono) for prices, coordinates, and timestamps — data that should read as verified/precise.
- If you think the system needs to change (new color, new component pattern), raise it with Tjay first rather than adding a one-off exception.

## Commit messages

Keep them short and specific: what changed, not how you feel about it.
- Good: `add price dispute submission form`
- Avoid: `fixes` / `updates` / `wip`

## Data model changes

Any change to `src/types.ts` or the mock data shape in `src/data/mockData.ts` should be flagged to Tjay before merging — this shape needs to stay in sync with the real backend schema once that's built, so silent changes here create rework later.

## Questions / scope changes

If a request from Zipporah (or anyone else) or a stakeholder would meaningfully change scope beyond what's in the README roadmap, that's a conversation before it's a PR — Tjay makes the final call on direction since this is his project.