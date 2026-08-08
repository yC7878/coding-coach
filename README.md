# NeetCode Coach

NeetCode Coach is a browser-first study tracker for the NeetCode 150. Phase 1 is a focused MVP: browse the list, mark work complete, record optional confidence, and see progress update everywhere immediately.

## Phase 1 features

- Polished responsive dashboard with live overall, category, recent-activity, and next-problem views
- Complete NeetCode 150 dataset across all 18 categories
- Search plus category, difficulty, and status filters
- Problem detail pages with NeetCode/LeetCode links and optional 1–5 confidence rating
- Browser persistence via `localStorage`; no account, server, or database required
- Versioned JSON export, validated import, and confirmed reset

## Tech stack

React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, and Vitest.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (normally `http://localhost:5173`).

To make a production build or run the logic tests:

```bash
npm run build
npm test
```

## Project structure

```text
src/
├── components/       # Layout, dashboard, problem, and small UI components
├── data/             # Immutable `problems.json` and category order
├── hooks/            # Progress context and reusable `useProgress` API
├── pages/            # Dashboard, problems, details, and settings routes
├── services/         # The only place that reads/writes localStorage
├── types/            # Extensible domain types
└── utils/            # Pure analytics and basic recommendation logic
```

## Data and persistence

`src/data/problems.json` contains immutable problem metadata. It is never changed when studying. User data is held separately under the `neetcode-coach-progress` browser-storage key. The dataset follows the current official NeetCode 150 category organization (150 problems in 18 categories); LeetCode URLs are included where a public corresponding problem exists. A few NeetCode list items do not have a public LeetCode link, so those are intentionally omitted rather than guessed.

The `ProblemProgress` type already reserves optional fields for attempts, solve time, hints, independent solutions, and review dates. That keeps the upcoming coaching features additive.

## Planned Phase 2

Add attempt history, solve-time and hint tracking, confidence history, and weakness analytics. Those signals can then power a Phase 3 adaptive study plan and Phase 4 AI coaching without mixing static problem data with personal progress.
