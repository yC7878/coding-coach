# NeetCode Coach

NeetCode Coach is a browser-first study tracker for the NeetCode 150. It keeps the focused Phase 1 study workflow and adds Phase 2 GitHub submission sync, deterministic Java analysis, editable performance records, and explainable adaptive recommendations.

## Features

- Polished responsive dashboard with a prominent next-problem recommendation, live progress, category, and recent-session views
- Complete NeetCode 150 dataset across all 18 categories
- Search plus category, difficulty, and status filters
- A single persisted study timer with start, pause, resume, finish, and explicit session-result flow
- Append-only study-session history per problem, with optional 1–5 confidence ratings and time analytics
- Java Syntax & Recall tracking: record the exact API call you expected and what you typed, then practice a frequency-prioritized queue with multiple choice, fill-in-the-blank, or free recall
- Browser persistence via `localStorage`; no account, server, or database required
- Public GitHub submission sync for `yC7878/neetcode-submissions`, with a 12-hour cache, manual sync, visible errors, and explicit repository-slug mappings
- Read-only in-app submission history and source viewer; submission code is never executed or sent to an external AI
- Deterministic Java API detection and conservative adjacent-submission comparisons. Normal API usage is recorded as usage, never automatically as a weakness.
- Editable per-problem Performance Details: solve time, result, confidence, algorithm understanding, pattern, exact syntax issues, and notes. User overrides retain provenance and never alter original session or GitHub data.
- Separate, explainable Algorithm Understanding, Syntax Recall, Solve Speed, and Confidence profiles; low sample sizes show as insufficient data rather than a misleading score
- Deterministic recommendation factors that prioritize evidenced weak categories, suitable difficulty, recency, and curated study order
- Version 4 JSON export/import, backward-compatible with prior Phase 1 exports, including optional GitHub cache and performance overrides

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
├── config/           # Documented Phase 2 scoring-weight heuristics
├── data/             # Immutable problems, Java syntax references, and repo mappings
├── hooks/            # Progress context and reusable `useProgress` API
├── pages/            # Dashboard, problems, details, and settings routes
├── services/         # Persistence, GitHub sync, analysis, scoring, recommendations
├── types/            # Extensible domain types and provenance records
└── utils/            # Phase 1 analytics and formatting helpers
```

## Data and persistence

`src/data/problems.json` and `src/data/syntax.json` contain immutable problem and Java API reference data. They are never changed when studying. `src/data/repositoryMappings.json` is the explicit link between a local NeetCode problem ID and a repository folder slug; add entries there when Settings reports an unmapped repository folder.

User progress is held under `neetcode-coach-progress`, the active timer under `neetcode-coach-active-session`, and the GitHub cache under `neetcode-coach-github-cache`. Each completed study block is appended to a problem’s `sessions` array—practice never replaces earlier history. Performance overrides are stored separately on that problem and use provenance (`user`, `github`, `analysis`, or `user_override`) so they can take precedence without erasing source data. A syntax mistake stores its reference ID, expected Java expression, and entered expression.

The GitHub client is isolated in `src/services/githubSubmissionService.ts`. It uses unauthenticated GitHub REST `contents` endpoints today, accepts an optional token at the service boundary for a future authenticated flow, caches results for 12 hours, coalesces concurrent syncs, and keeps prior cached data whenever GitHub is unavailable. GitHub's unauthenticated request limits and repository availability still apply; the Settings panel shows these failures rather than interrupting studying.

## Analysis and recommendations

`submissionAnalyzer.ts` recognizes Java APIs from the existing syntax reference dataset and compares adjacent submissions for the same mapped problem. A possible syntax correction is created only for a conservative, directly evidenced change such as `Arrays.equal(` becoming `Arrays.equals(`. It is displayed as a possible correction with confidence—not as a confirmed mistake.

`weaknessService.ts` evaluates four independent heuristic scores. Algorithm scoring considers result/help level; syntax scoring uses manual recall/help outcomes and exact reported mistakes; speed uses difficulty-specific target times; confidence uses the user's 1–5 rating. The initial weights live in `src/config/weaknessWeights.ts`, are documented as heuristics, and every score includes its contributing factors. GitHub API usage alone does not affect a syntax score.

`recommendationService.ts` is deterministic and testable. It excludes completed problems, then scores the remaining problems using an evidenced category weakness (only when data confidence is sufficient), recency, difficulty fit, and curated order. The dashboard’s “Why was this recommended?” dialog renders those exact factors.

## Testing GitHub sync

Open **Settings → GitHub Integration** and choose **Sync Now**. Mapped Java files appear on the corresponding Problem Details page after a successful sync. The test suite uses mocked GitHub responses to cover repository traversal, mappings, multiple submissions, malformed responses, unavailable GitHub, and TTL cache behavior—so it does not require network access.

## Recommended Phase 2.1

- Add an authenticated GitHub option for higher rate limits and private repositories.
- Add mapping-management UI instead of editing the bundled mapping JSON during development.
- Use GitHub commit metadata when reliable submission timestamps become available.
- Add user-controlled review scheduling and richer Syntax & Recall practice performance signals.
