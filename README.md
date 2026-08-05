# transit-fare-service — Agentic SDLC Reference Implementation

A small zone-based transit fare service used as the target for an **agentic AI software
development lifecycle**: AI agents perform code review and QA test generation directly
in the CI pipeline.

## What the AI agents do

| Agent | Trigger | What it does |
|---|---|---|
| **AI Code Reviewer** | Every pull request | Reviews the diff for bugs, edge cases, and security issues; posts inline review comments |
| **AI Test Engineer** | Manual dispatch / nightly schedule | Scans for untested code, writes Jest tests, runs them, and opens a pull request with passing tests |
| **Interactive agent** | `@claude` mention on issues/PRs | Implements requested changes and opens a PR |

Both pipeline agents are built on [Claude Code](https://claude.com/claude-code) via the
official [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action),
with tool permissions scoped per workflow (the reviewer can only comment; the test
engineer can write test files and open PRs, but never modify `src/`).

## The application

A deliberately compact TypeScript/Express service:

- `src/fares.ts` — zone-based fare calculation, free transfers, daily fare cap
- `src/promocodes.ts` — promo code validation and redemption
- `src/server.ts` — HTTP API

The service ships with **no tests** and a handful of latent defects — that's the point:
it gives the agents authentic work, and gives a human reviewer a way to evaluate agent
precision and recall against a known bug inventory.

## Running locally

```bash
npm install
npm run dev     # start the API on :3000
npm test        # run the (agent-generated) test suite
```

## Design notes

- **Least-privilege agents.** Each workflow grants only the tools that job needs.
- **Human-in-the-loop.** Agents open PRs; humans merge. No agent has push access to `main`.
- **Measurable.** The seeded-defect inventory (maintained privately) lets us score the
  review agent's precision/recall over time.
