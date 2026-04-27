# Session protocol

This file codifies how Claude-the-assistant and the human work together across multi-session buildouts. It exists because of a real asymmetry the long-term review flagged: I (Claude) generate code faster than you (the human) can validate it, and over many sessions that compounds into integration debt that brace-balance checks can't catch.

The fix is mechanical, not aspirational. This file documents the mechanics.

---

## The asymmetry, plainly

In a typical session I'll write 500-2000 lines of TypeScript/Rust/SQL across 5-15 files, run brace-balance checks, repackage the zip, and call it done. What I cannot do from this sandbox:

- Run `prisma generate` against the real schema
- Run `npm install` and `tsc --noEmit` against the real lockfile
- Run `cargo build` against the real Cargo.lock
- Run `npx playwright test` (no browser available)
- Hit the real database with the migration SQL I wrote
- Make HTTP requests to the production main app from the worker
- Verify that `flareo run --ephemeral` actually does what the docstring claims

Every one of those gaps is somewhere a real bug can hide. The brace count says "balanced"; the type checker says "no — `as never` was hiding a real type error."

You are the only validation surface that can catch those. So the cadence between sessions matters more than the cadence within them.

---

## Per-session protocol

### What I will do at the end of every session

Every session output ends with an explicit **"What to validate before next session"** block. This block lists, in priority order:

1. **Migrations to run** — every prisma migration SQL file written this session
2. **Builds to attempt** — every package whose code changed this session, with the commands to run (`npm run build`, `cargo build --release`, etc.)
3. **Manual flows to walk** — every UI surface that changed, with the pages to visit and what to click
4. **External dependencies that need configuration** — env vars, OAuth credentials, webhook secrets, etc. that the new code requires

If I forget this block, ask me for it. If I include it but it's vague ("walk through the new admin UI"), push for specifics ("which page exactly, what button, what should happen").

### What I will not do without explicit ask

- **Skip the validation block** because the session feels small. Even one-file changes can break type-checking elsewhere.
- **Mark something "shipped"** when only the brace count was verified. Use "scaffolded" or "wired" for code I haven't seen run.
- **Recommend `as never` casts** as a permanent solution. They're a temporary unblock until `prisma generate` runs locally; flag them as such.

### What you should do between sessions

The bar is honest, not exhaustive:

1. **Open the diff.** Even a 30-second skim catches obvious wrongness — wrong path, wrong package, wrong file extension.
2. **Run at least one of the validation steps from my block.** Pick whichever is cheapest. The point is to break the streak of unvalidated sessions, not to hit 100% coverage.
3. **If something fails, paste the error in the next session.** Don't try to debug it yourself first. I have more context on what I just wrote than you do; getting the error to me before you've muddled with it is the fastest path.

---

## Cross-session protocol

### When to start a new session vs continue

Continue when the work is one feature that needs more context to finish. Start fresh when:

- The feature is shipped (validation block ran clean) and you're moving to a different feature
- A session is over 90 minutes of real-time and starting to feel cluttered
- You've validated the work and want to declare a clean checkpoint

The `compact` summarization is good but loses fidelity. A cleanly-validated checkpoint is worth more than 5 more files of unvalidated additions in the same session.

### When to push back on me

Push back when:

- I propose a session that doesn't end in shippable artifact ("let's design X" — fine occasionally, not as a default)
- I claim something is "done" but I haven't named what to validate
- I cite my training data on Anthropic products instead of searching docs
- I generate >5 files without checking in on direction
- I propose building behind a gate that hasn't fired yet (this is the F0 / per-org failure mode)

When you push back, I should agree fast or argue with specifics. "Just trust me" is not a valid response.

### When to stop and verify instead of continue

The journal pattern from past sessions has flagged "stop and verify" as under-attended. Default to stopping when:

- The current session shipped substantial code (>500 lines, >5 files)
- An external trigger changed (a deploy happened, a customer landed, F0 data came in)
- Two sessions in a row landed without you running the validation block

If unsure whether to continue or stop, default to stop. The cost of an extra "stop and verify" cycle is small. The cost of a 4-session unvalidated chain that doesn't typecheck on deploy is large.

---

## Tool-use specifics

A few things about how I work that affect what gets done:

### What I do well in-sandbox

- Writing greenfield TypeScript/Rust/SQL/MDX in self-contained units
- Cross-file refactors when I can see all the call sites
- Wiring new endpoints into existing schemas/handlers
- Generating migration SQL when the existing schema is in `schema.prisma`
- Reading existing code and explaining what it does
- Brace-balance / paren-balance verification (mechanical only — no semantic)

### What I do poorly in-sandbox

- Anything that needs a real Postgres connection
- Anything that needs a browser
- Any cross-process orchestration (worker + main app + DB)
- Anything where the only verification path is "run it and see"
- Estimating GitHub Actions costs without checking real billing data
- Knowing what your customers are actually saying (vs. what I infer)

### When I should defer to you instead of writing code

- Strategic positioning questions (which of three identities Flareo should have)
- Customer-facing copy decisions where you have customer voice and I don't
- Pricing decisions
- Hiring decisions
- Anything where "I think we should..." would be replacing your judgment with mine on a question I'm worse-equipped to answer

If I'm answering one of those instead of you, push back. The right move is for me to ask the question, not pretend to know the answer.

---

## Update protocol

This file gets updated when:

- A new failure mode appears (one of the protocols failed to prevent something)
- A new tool/capability changes what's in-sandbox vs out-of-sandbox
- The user-side validation pattern changes (e.g. you set up CI that runs migrations automatically, removing one of the manual checks above)

Keep the file short. Anything longer than ~250 lines gets ignored.

---

## Pre-committed: things this file does NOT solve

- **Bus factor.** I don't have memory across sessions; you do. If you stop using me, I don't know.
- **Real customer signal.** Validation between sessions catches my mistakes; it doesn't catch us building the wrong thing. That's a separate problem covered by `docs/decisions.md` gates.
- **Architectural drift.** A multi-session series can each be locally consistent and globally drift. Periodic full-codebase reviews (the long-term review, every 90 days) catch that.

These are real limits. This file is a local fix for a local problem; the global problems need other instruments.
