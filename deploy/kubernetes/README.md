# flareo-admission

Kubernetes admission policies that require valid [Flareo](https://flareo.dev) Sigstore signatures on any image pulled from `public.ecr.aws/flareo/*`.

Three policies, for different controllers and strictness levels:

| File                                    | Controller                | Strictness                              |
|-----------------------------------------|---------------------------|-----------------------------------------|
| `flareo-admission.yaml`                 | Kyverno 1.10+             | Require valid signature                 |
| `flareo-admission-strict.yaml`          | Kyverno 1.11+             | Signature + live catalog status check   |
| `flareo-admission-sigstore.yaml`        | sigstore/policy-controller | Require valid signature                 |

## Quick start (Kyverno)

Install Kyverno if you haven't:

```sh
kubectl create -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml
```

Apply the basic policy:

```sh
kubectl apply -f flareo-admission.yaml
```

Test with a signed image (should admit):

```sh
kubectl run vw --image=public.ecr.aws/flareo/vaultwarden:latest
```

## Audit vs enforce

All policies ship with `validationFailureAction: Audit` by default. This **logs** violations without blocking admission, so you can observe what would be rejected without breaking production.

When you're confident every production image is signed:

```sh
kubectl patch clusterpolicy require-flareo-signature \
  --type=merge \
  -p '{"spec":{"validationFailureAction":"Enforce"}}'
```

## Strict mode caveats

`flareo-admission-strict.yaml` adds a live call to `flareo.dev/api/v1/verify` at admission time. This ensures the module's current status in the Flareo catalog is `verified` (not `pending` or `failing`). Two tradeoffs:

1. **Latency.** Adds ~200-500ms per pod creation. Usually negligible for Deployments; may matter for Jobs that churn pods rapidly.
2. **Availability.** If `flareo.dev` is unreachable, admission fails closed. Configure `failurePolicy: Ignore` on the webhook if you prefer fail-open.

Most clusters should start with the basic policy.

## Scope

These policies ONLY apply to images matching `public.ecr.aws/flareo/*`. Other images (Docker Hub, your own registry, GHCR, etc.) are completely unaffected. The policies add a gate for the Flareo namespace; they don't change how other images are handled.

## License

AGPL-3.0-or-later, same as the rest of Flareo.
