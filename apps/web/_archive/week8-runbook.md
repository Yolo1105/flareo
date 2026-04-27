# Week 8 runbook: polish, publish, admission, retrospective

The last planned week. Four independent tracks; each is small enough to close in a morning.

## Monday — Polish (main app)

Apply `flareo-week8-patch.zip` over your main `apps/web/` repo.

**What changed:**

- `next.config.ts` — security headers (HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy)
- `app/robots.ts` — machine-readable robots.txt (allow public, disallow /app, /api)
- `app/sitemap.ts` — dynamic sitemap.xml listing static pages + every public module
- `app/error.tsx` — now forwards errors to Sentry
- `retrospective-w1-8.md` — the honest write-up
- `app/api/v1/submissions/route.ts` — new endpoint for CLI submissions

Deploy. Verify:

```sh
curl -sI https://flareo.dev | grep -Ei 'strict-transport|x-frame|permissions-policy|referrer'
curl -s https://flareo.dev/robots.txt
curl -s https://flareo.dev/sitemap.xml | head -30
```

All four headers should be present. Robots.txt should list `Disallow: /api/` and `/app/`. Sitemap should include every module.

## Tuesday — CLI v0.3.0 (publish + init)

Apply `flareo-cli-week8.zip` (full replacement of `packages/cli/` directory).

**What's new:**

- `src/commands/init.rs` — interactive scaffolding of `flareo.json`
- `src/commands/publish.rs` — reads `flareo.json`, POSTs to `/api/v1/submissions`
- `src/main.rs` — expanded clap definitions, dispatch wired
- `src/commands/mod.rs` — exports init + publish
- `tests/smoke.rs` — smoke test now covers all 9 subcommands
- `Cargo.toml` — version bumped to 0.3.0

Build:

```sh
cd packages/cli
export FLAREO_GITHUB_CLIENT_ID=<your-id>
cargo build --release
```

End-to-end test:

```sh
mkdir /tmp/test-mod && cd /tmp/test-mod
~/flareo-cli/target/release/flareo init
# Follow prompts: slug "test-module", version "0.0.1", etc.
cat flareo.json
~/flareo-cli/target/release/flareo publish
# Should POST and print a submission ID
```

Then on the server side, check that the row landed:

```sh
npx prisma studio
# Browse Submission table, find your row with status=pending
```

Tag and release:

```sh
cd ~/projects/flareo-cli
git tag -a v0.3.0 -m "publish and init"
git push origin v0.3.0
```

## Wednesday — Admission policies

`flareo-admission-week8.zip` contains a fresh repo with three ready-to-apply policies.

Push to a new GitHub repo:

```sh
cd ~/projects
unzip flareo-admission-week8.zip
cd deploy/kubernetes
git init
git add -A
git commit -m "Initial admission policies"
git remote add origin https://github.com/flareo/flareo-admission.git
git push -u origin main
```

The raw URL for `curl | kubectl apply` becomes:
`https://raw.githubusercontent.com/flareo/flareo-admission/main/flareo-admission.yaml`

Test on a throwaway cluster (k3s, kind, minikube — whichever you have):

```sh
# 1. Install Kyverno
kubectl create -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml

# 2. Apply the Flareo policy in Audit mode
kubectl apply -f https://raw.githubusercontent.com/flareo/flareo-admission/main/flareo-admission.yaml

# 3. Try to pull a signed Flareo image
kubectl run vw --image=public.ecr.aws/flareo/vaultwarden:latest
kubectl describe pod vw | grep -i kyverno

# 4. Flip to Enforce for the real test
kubectl patch clusterpolicy require-flareo-signature \
  --type=merge -p '{"spec":{"validationFailureAction":"Enforce"}}'

# 5. Try something unsigned (should be denied)
kubectl run unsigned --image=public.ecr.aws/flareo/does-not-exist:bad
# Expected: pod creation rejected by admission webhook
```

## Thursday — Docs updates

Apply `flareo-docs-week8-patch.zip` — single file change:

- `app/docs/admission/content.mdx` — rewritten to point at the new first-party policies at github.com/flareo/flareo-admission. Removed the "we don't yet ship a first-party admission controller" sentence.

Build locally, push. Cloudflare Pages deploys.

## Friday — Retrospective

`retrospective-w1-8.md` (in the main repo) is the write-up I drafted for you. Read it, argue with it, rewrite the parts you disagree with. It's most useful if you make it yours.

Keep it in the main flareo repo but do NOT push it publicly unless you want it to be public. The honest post-mortem is for you; marketing is for flareo.dev/about.

## Saturday — Final production sanity check

One-pass checklist. If any of these don't resolve cleanly, fix before Sunday:

- [ ] `curl -sI https://flareo.dev/robots.txt` → 200
- [ ] `curl -s https://flareo.dev/sitemap.xml` → 12 modules listed
- [ ] `curl -sI https://flareo.dev` → Strict-Transport-Security present
- [ ] `curl -sf https://flareo.dev/legal/terms` → 200
- [ ] `curl -sf https://flareo.dev/legal/privacy` → 200
- [ ] `curl -sX POST https://flareo.dev/api/v1/verify -H 'content-type: application/json' -d '{"imageRef":"public.ecr.aws/flareo/vaultwarden:latest"}' | jq -r .status` → "verified"
- [ ] `curl -sf https://docs.flareo.dev/docs/install/` → 200
- [ ] `curl -sf https://status.flareo.dev` → 200, all green
- [ ] `curl -sf https://s-vaultwarden-demo.preview.flareo.dev` → 200
- [ ] `flareo --version` on a fresh VM → 0.3.0
- [ ] Sentry dashboard for flareo project shows <10 errors in last 24h
- [ ] Instatus shows 99%+ uptime for last 7 days

## Sunday — What happens after Week 8

Week 8 closes out the planned 8-week MVP. What comes next is operational, not project:

- **Week 9-12**: active triage of user issues and feature requests. Don't commit to a big new feature in this window.
- **Month 3**: review signups and active usage. Decide if Horizon 2 (third-party publishing fully live, k8s admission dashboard) is the right move or if something else has become the bottleneck.
- **Month 4+**: Horizon 3 work — per-user preview sandboxes (Firecracker) — if and only if the demand is actually there.

Don't start paid tier planning until the catalog has settled into daily use patterns. The 30-day period after launch will tell you way more than any pre-launch planning.

## What DIDN'T ship in the 8-week plan (accepted)

- Paid tier and billing infrastructure
- Per-user isolated preview sandboxes (Firecracker)
- SLSA L3 (build-time isolation)
- Reproducible-build verification (diffoscope-based CI)
- Algolia DocSearch on docs.flareo.dev
- Shell completions for the CLI
- Native Windows binary for the CLI
- Admin dashboard for the submission review queue
- Email verification on signup
- i18n / localization
- SOC 2 / ISO 27001 posture documents

All of these are legitimate future work. None of them blocked shipping a closed-beta Flareo that a real user can benefit from on day 1.

## Close-out

If every box on the Saturday checklist passes, you're done with the 8-week plan. Congratulations — Flareo is live.
