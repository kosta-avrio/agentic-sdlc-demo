# Setup — get the agents live tonight (~20 min)

## 1. Push to your GitHub

```bash
cd ~/repos/modaxo/agentic-sdlc-demo
gh repo create agentic-sdlc-demo --public --source=. --push
# (or --private; public is nicer for sharing in the interview)
```

## 2. Install the Claude GitHub App (required — the action fails without it)

https://github.com/apps/claude → Install → select the `agentic-sdlc-demo` repo.

## 3. Add your Anthropic API key as a repo secret

```bash
gh secret set ANTHROPIC_API_KEY --repo <your-username>/agentic-sdlc-demo
# paste your key when prompted (console.anthropic.com → API keys)
```

## 4. Trigger the AI code review (the money demo)

Open a PR with a small change so the reviewer has a diff that pulls in the buggy code:

```bash
git checkout -b feature/peak-pricing
# make any small edit to src/fares.ts (e.g. add a peakMultiplier field to FareConfig)
git commit -am "Add peak pricing multiplier"
git push -u origin feature/peak-pricing
gh pr create --fill
```

Watch the Actions tab — the review agent will post inline comments. The seeded bugs it
should find (your private answer key for measuring precision/recall):

1. **`zonesTouched`** — off-by-one: `abs(dest - origin)` should be `abs(dest - origin) + 1`.
   A same-zone trip returns 0 zones → fare comes out *below* base fare.
2. **`isFreeTransfer`** — compares elapsed **milliseconds** to `transferWindowMinutes`
   (minutes). Effectively no transfer is ever free beyond ~90ms.
3. **`validatePromo`** — `onDate >= expiry` rejects codes **on** their expiry day, but
   `expiresOn` is documented as inclusive; also `new Date("YYYY-MM-DD")` parses as UTC
   midnight → timezone-dependent behavior.
4. **`applyPromo`** — single-use redemption is never recorded: the Set is created but the
   riderId is never added, so "single use" codes are infinitely reusable.
5. **Promo lookup is case-sensitive** — `WELCOME10` works, `welcome10` silently fails.
6. **`applyPromo`** — no clamping of `discountPercent` (>100 yields negative fares).
7. **`server.ts`** — no input validation: missing/garbage zones → `NaN` fares;
   `req.body.trips` unchecked → crash; `riderId` may be undefined.
8. **`dailyTotal`** — once the cap is hit, later fares can't push total above cap, but a
   capped day followed by a free-transfer `continue` ordering means transfer checks apply
   only to consecutive array entries, not paid boardings (subtle; partial credit).

## 5. Trigger the AI test-generation agent

Actions tab → **AI Test Generation** → **Run workflow**. It will measure coverage, write
Jest tests for the least-tested module, run them, and push a branch with a PR link.
(It also runs on a weekday schedule.)

## 6. Optional: interactive agent

Comment `@claude fix the transfer window bug in fares.ts and open a PR` on any issue/PR.

## Notes for the interview

- The reviewer workflow is deliberately **read-only + comment-only** (`--allowedTools`
  restricted); the test agent can write only via branch + PR. Talk about this.
- The action cannot edit `.github/workflows/**` (sandbox) — agents can't grant
  themselves permissions. Good governance talking point.
- Cost control: `--max-turns` caps per run; each review run on a repo this size costs
  cents.
