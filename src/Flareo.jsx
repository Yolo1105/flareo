import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// FLAREO — ENTERPRISE EDITION
//
// Shell: Grafana-pattern left sidebar + top bar + content area
// Orange discipline — identical rules, applied more strictly:
//   ONLY: active sidebar indicator, live pulse dot, scan progress bar (running),
//          docs callout left border, active doc sidebar item, H1 gradient text
//   NEVER: buttons, module names, filter labels, icons, card borders
//
// Enterprise changes vs previous version:
//   1. Horizontal nav tabs → persistent 200px left sidebar (the #1 signal)
//   2. Marketplace chips → split-pane: left filter panel + right grid
//   3. Hero stays but only as a full-landing marketing strip (not app chrome)
//   4. All panels use consistent PanelHeader (label + sub + action) pattern
//   5. Detail page integrated as a view state (click card → full detail)
//   6. Spacing tightened: 4px grid, Grafana-level information density
//   7. Tables: sortable column headers, tighter rows
// ─────────────────────────────────────────────────────────────────────────────

const G = {
  canvas:    "#090807",
  primary:   "#111010",
  secondary: "#1A1918",
  elevated:  "#232120",
  border:    "#2D2B29",
  borderWk:  "#1F1D1B",
  orange:      "#FF780A",
  orangeFaded: "rgba(255,120,10,0.06)",
  gradient:  "linear-gradient(90deg, #FF8833 0%, #F53E4C 100%)",
  success:   "#3D9966",
  error:     "#B84F59",
  warn:      "#B8843A",
  textPrimary:   "#D9D9D9",
  textSecondary: "#9A9A9A",
  textDisabled:  "#505050",
};

const MONO = "'Geist Mono', monospace";
const SANS = "'Geist', system-ui, -apple-system, sans-serif";

// ─── DATA ────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id:1, name:"nginx-proxy-manager", ver:"2.11.3", author:"jc21", category:"proxy",
    desc:"Full GUI for Nginx with automatic Let's Encrypt SSL. The definitive self-hosted reverse proxy.",
    tags:["proxy","ssl","networking"], stars:"4.8k", deploys:"12k", verified:true, slsa:2,
    c:0,h:1,m:3,l:8, size:"148MB", upd:"2d", pulls:"284k", license:"MIT",
    previewable:true, trustScore:84,
    trustBreakdown:{ vulns:{score:80,label:"1 HIGH"}, sbom:{score:100,label:"SPDX 2.3"}, provenance:{score:90,label:"Verified"}, recency:{score:95,label:"2 days"} },
    ports:["80:80","81:81","443:443"],
    digest:"sha256:a3f9d2c1b4e5f6a7",
    provenance:[
      {step:"Source Upload",   status:"done", hash:"sha256:a3f9d2"},
      {step:"BuildKit Build",  status:"done", hash:"sha256:b4c5d6"},
      {step:"Trivy Scan",      status:"done", hash:"sha256:c7d8e9"},
      {step:"cosign Sign",     status:"done", hash:"sha256:d0e1f2"},
      {step:"SLSA Attest",     status:"done", hash:"sha256:e3f4a5"},
    ],
    sbom:{ format:"SPDX 2.3", size:"1.4 MB", packages:312 },
    envExample:"DISABLE_IPV6=true\nDB_SQLITE_FILE=/data/database.sqlite",
  },
  {
    id:2, name:"uptime-kuma", ver:"1.23.11", author:"louislam", category:"monitoring",
    desc:"Self-hosted monitoring with beautiful status pages and 90+ notification providers.",
    tags:["monitoring","alerting"], stars:"3.2k", deploys:"9.8k", verified:true, slsa:2,
    c:0,h:0,m:1,l:4, size:"394MB", upd:"5d", pulls:"156k", license:"MIT",
    previewable:true, trustScore:96,
    trustBreakdown:{ vulns:{score:98,label:"Clean"}, sbom:{score:100,label:"CycloneDX 1.4"}, provenance:{score:100,label:"Verified"}, recency:{score:90,label:"5 days"} },
    ports:["3001:3001"],
    digest:"sha256:f1e2d3c4b5a6",
    provenance:[
      {step:"Source Upload",  status:"done", hash:"sha256:f1e2d3"},
      {step:"BuildKit Build", status:"done", hash:"sha256:a4b5c6"},
      {step:"Trivy Scan",     status:"done", hash:"sha256:d7e8f9"},
      {step:"cosign Sign",    status:"done", hash:"sha256:0a1b2c"},
      {step:"SLSA Attest",    status:"done", hash:"sha256:3d4e5f"},
    ],
    sbom:{ format:"CycloneDX 1.4", size:"820 KB", packages:187 },
    envExample:"UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN=false",
  },
  {
    id:3, name:"vaultwarden", ver:"1.30.5", author:"dani-garcia", category:"security",
    desc:"Memory-safe Bitwarden-compatible server in Rust. Zero CRITICAL findings across 847 scans.",
    tags:["security","passwords"], stars:"5.7k", deploys:"21k", verified:true, slsa:3,
    c:0,h:0,m:0,l:2, size:"62MB", upd:"1d", pulls:"847k", license:"AGPL-3.0",
    previewable:true, trustScore:99,
    trustBreakdown:{ vulns:{score:100,label:"Clean"}, sbom:{score:100,label:"CycloneDX 1.4"}, provenance:{score:100,label:"SLSA L3"}, recency:{score:98,label:"1 day"} },
    ports:["80:80"],
    digest:"sha256:9a8b7c6d5e4f",
    provenance:[
      {step:"Source Upload",  status:"done", hash:"sha256:9a8b7c"},
      {step:"BuildKit Build", status:"done", hash:"sha256:6d5e4f"},
      {step:"Trivy Scan",     status:"done", hash:"sha256:3c2b1a"},
      {step:"cosign Sign",    status:"done", hash:"sha256:0f9e8d"},
      {step:"SLSA Attest",    status:"done", hash:"sha256:7c6b5a"},
    ],
    sbom:{ format:"CycloneDX 1.4", size:"210 KB", packages:48 },
    envExample:"WEBSOCKET_ENABLED=true\nDOMAIN=https://vault.example.com",
  },
  {
    id:4, name:"gitea", ver:"1.21.4", author:"go-gitea", category:"devops",
    desc:"Lightweight, cross-platform self-hosted Git service with a full DevOps feature set.",
    tags:["git","devops"], stars:"2.9k", deploys:"7.4k", verified:true, slsa:2,
    c:0,h:2,m:5,l:14, size:"214MB", upd:"3d", pulls:"98k", license:"MIT",
    previewable:false, trustScore:71,
    trustBreakdown:{ vulns:{score:60,label:"2 HIGH"}, sbom:{score:100,label:"SPDX 2.3"}, provenance:{score:90,label:"Verified"}, recency:{score:92,label:"3 days"} },
    ports:["3000:3000","22:22"],
    digest:"sha256:1b2c3d4e5f6a",
    provenance:[
      {step:"Source Upload",  status:"done", hash:"sha256:1b2c3d"},
      {step:"BuildKit Build", status:"done", hash:"sha256:4e5f6a"},
      {step:"Trivy Scan",     status:"done", hash:"sha256:7b8c9d"},
      {step:"cosign Sign",    status:"done", hash:"sha256:0e1f2a"},
      {step:"SLSA Attest",    status:"done", hash:"sha256:3b4c5d"},
    ],
    sbom:{ format:"SPDX 2.3", size:"2.1 MB", packages:524 },
    envExample:"GITEA__database__DB_TYPE=sqlite3\nGITEA__server__DOMAIN=git.example.com",
  },
  {
    id:5, name:"authentik", ver:"2024.2.1", author:"goauthentik", category:"auth",
    desc:"The open-source identity provider that unifies SSO, MFA, and RBAC under one roof.",
    tags:["auth","sso","identity"], stars:"1.9k", deploys:"4.3k", verified:true, slsa:2,
    c:0,h:0,m:2,l:6, size:"521MB", upd:"1w", pulls:"62k", license:"MIT",
    previewable:false, trustScore:91,
    trustBreakdown:{ vulns:{score:94,label:"2 MEDIUM"}, sbom:{score:100,label:"CycloneDX 1.4"}, provenance:{score:90,label:"Verified"}, recency:{score:82,label:"1 week"} },
    ports:["9000:9000","9443:9443"],
    digest:"sha256:e2f3a4b5c6d7",
    provenance:[
      {step:"Source Upload",  status:"done", hash:"sha256:e2f3a4"},
      {step:"BuildKit Build", status:"done", hash:"sha256:b5c6d7"},
      {step:"Trivy Scan",     status:"done", hash:"sha256:e8f9a0"},
      {step:"cosign Sign",    status:"done", hash:"sha256:b1c2d3"},
      {step:"SLSA Attest",    status:"done", hash:"sha256:e4f5a6"},
    ],
    sbom:{ format:"CycloneDX 1.4", size:"3.8 MB", packages:891 },
    envExample:"AUTHENTIK_SECRET_KEY=changeme\nAUTHENTIK_POSTGRESQL__PASSWORD=changeme",
  },
  {
    id:6, name:"immich", ver:"1.94.1", author:"immich-app", category:"media",
    desc:"High-performance self-hosted Google Photos alternative. 1 CRITICAL CVE — patch pending upstream.",
    tags:["photos","media"], stars:"6.1k", deploys:"15k", verified:false, slsa:1,
    c:1,h:3,m:8,l:22, size:"1.2GB", upd:"6h", pulls:"412k", license:"AGPL-3.0",
    previewable:false, trustScore:42,
    trustBreakdown:{ vulns:{score:20,label:"1 CRITICAL"}, sbom:{score:80,label:"SPDX 2.3"}, provenance:{score:50,label:"Partial"}, recency:{score:99,label:"6 hours"} },
    ports:["2283:3001"],
    digest:"sha256:c4d5e6f7a8b9",
    provenance:[
      {step:"Source Upload",  status:"done", hash:"sha256:c4d5e6"},
      {step:"BuildKit Build", status:"done", hash:"sha256:f7a8b9"},
      {step:"Trivy Scan",     status:"done", hash:"sha256:c0d1e2"},
      {step:"cosign Sign",    status:"wait", hash:""},
      {step:"SLSA Attest",    status:"wait", hash:""},
    ],
    sbom:{ format:"SPDX 2.3", size:"4.2 MB", packages:1204 },
    envExample:"DB_PASSWORD=postgres\nREDIS_HOSTNAME=immich_redis",
  },
];

const CATEGORIES = ["All","proxy","monitoring","security","auth","devops","media"];

const STAGES = [
  { id:1, label:"Source Upload",    status:"done",   time:"0.2s"  },
  { id:2, label:"BuildKit Build",   status:"done",   time:"42.1s" },
  { id:3, label:"ECR Push",         status:"done",   time:"8.3s"  },
  { id:4, label:"Trivy Scan",       status:"active", time:"..."   },
  { id:5, label:"cosign Sign",      status:"wait",   time:""      },
  { id:6, label:"SLSA Attestation", status:"wait",   time:""      },
  { id:7, label:"Admin Review",     status:"wait",   time:""      },
];

const LOG_INIT = [
  { t:"$ flareo publish --source ./nginx-proxy-manager", c:"#505050" },
  { t:"[00:00.2] Source validated  →  Cloudflare R2",   c:G.success  },
  { t:"[00:42.3] sha256:a3f9d2c1  →  Build complete",   c:G.success  },
  { t:"[00:50.6] Image pushed  →  ECR us-east-1",       c:G.success  },
  { t:"[00:50.7] trivy image sha256:a3f9d2c1 …",        c:"#9A9A9A"  },
  { t:"[00:52.1]   Scanning OS packages …",             c:"#505050"  },
];

const LOGOS = ["Uber","Dell","ASOS","Atlassian","Optum","Sky","Roblox","DHL","Cloudflare","Stripe","HashiCorp","MongoDB"];

const COMPOSE_YAML = `version: "3.8"
services:
  vaultwarden:
    image: 123456789.dkr.ecr.us-east-1.amazonaws.com/flareo/vaultwarden:1.30.5
    container_name: vaultwarden
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - vw-data:/data
    environment:
      WEBSOCKET_ENABLED: "true"
      SIGNUPS_ALLOWED: "true"
      DOMAIN: "https://vault.example.com"
    labels:
      - "flareo.verified=true"
      - "flareo.slsa-level=3"
      - "flareo.digest=sha256:a3f9d2c1"

volumes:
  vw-data:`;

// ─── EXTENDED DATA FROM REAL CODEBASE ────────────────────────────────────────

// Star ratings, pricing, review counts enriched on top of modules
const MODULE_EXTRAS = {
  "nginx-proxy-manager": {
    ratingStars: 4.7, reviewCount: 342, installCount: 28400,
    pricingTiers: [
      { id:"free",  name:"Free",       price:0,   desc:"Self-hosted, community support",   features:["Docker image","SLSA L2","Community Q&A"] },
      { id:"pro",   name:"Pro",        price:12,  desc:"Priority builds and scan reports", features:["All Free","Priority pipeline","CVE alerts","Email support"] },
      { id:"ent",   name:"Enterprise", price:49,  desc:"SLA + air-gap support",           features:["All Pro","Air-gap bundle","SLA 99.9%","Slack support"] },
    ],
    changelog: [
      { version:"2.11.3", date:"2024-03-15", changes:[
        { type:"fix",     desc:"Resolved certificate renewal race condition on multi-domain setup" },
        { type:"feature", desc:"Added HTTP/3 QUIC support via nginx 1.25.4 upstream" },
      ]},
      { version:"2.11.2", date:"2024-02-08", changes:[
        { type:"improvement", desc:"Reduced image size by 18% via multi-stage build optimization" },
        { type:"fix",         desc:"Fixed upstream proxy timeout not being applied on reload" },
      ]},
    ],
  },
  "uptime-kuma": {
    ratingStars: 4.9, reviewCount: 891, installCount: 61200,
    pricingTiers: [
      { id:"free", name:"Free",   price:0,  desc:"Full monitoring, self-hosted",          features:["All monitors","Docker image","Status page"] },
      { id:"pro",  name:"Pro",    price:9,  desc:"Managed updates + priority scans",       features:["All Free","Auto-update","CVE watch","Webhook alerts"] },
    ],
    changelog: [
      { version:"1.23.13", date:"2024-03-20", changes:[
        { type:"feature",     desc:"Added Telegram notification provider" },
        { type:"improvement", desc:"Status page now supports custom CSS theming" },
      ]},
    ],
  },
  "vaultwarden": {
    ratingStars: 4.8, reviewCount: 527, installCount: 42100,
    pricingTiers: [
      { id:"free", name:"Free",       price:0,  desc:"Full Bitwarden-compatible vault", features:["Unlimited secrets","TOTP","Docker image"] },
      { id:"pro",  name:"Pro",        price:15, desc:"Hardened build + compliance",     features:["All Free","FIPS 140-2 build","Audit export","Cosign verify"] },
      { id:"ent",  name:"Enterprise", price:59, desc:"Air-gap + HSM support",           features:["All Pro","HSM integration","Air-gap bundle","Dedicated support"] },
    ],
    changelog: [
      { version:"1.30.5", date:"2024-03-18", changes:[
        { type:"fix",     desc:"Patched emergency access invitation bug affecting orgs with >50 members" },
        { type:"feature", desc:"WebAuthn passkey support added (FIDO2 Level 2)" },
      ]},
    ],
  },
  "gitea": {
    ratingStars: 4.6, reviewCount: 412, installCount: 33700,
    pricingTiers: [
      { id:"free", name:"Free",   price:0,  desc:"Full self-hosted Git service",       features:["Unlimited repos","Actions CI","Docker image"] },
      { id:"pro",  name:"Pro",    price:14, desc:"Managed builds + signed releases",   features:["All Free","Signed releases","CVE monitoring","Email support"] },
    ],
    changelog: [
      { version:"1.21.11", date:"2024-03-10", changes:[
        { type:"feature",     desc:"Added code review AI suggestions via optional LLM endpoint" },
        { type:"improvement", desc:"Pull request diffs now support syntax highlighting for 40 more languages" },
      ]},
    ],
  },
  "authentik": {
    ratingStars: 4.5, reviewCount: 289, installCount: 19800,
    pricingTiers: [
      { id:"free", name:"Free",       price:0,  desc:"Full SSO / IdP, self-hosted",    features:["OIDC","SAML","Docker image","Community support"] },
      { id:"pro",  name:"Pro",        price:22, desc:"Compliance package + SLA",       features:["All Free","SOC2 export","SCIM sync","Priority support"] },
      { id:"ent",  name:"Enterprise", price:79, desc:"Air-gap + federation",           features:["All Pro","Air-gap bundle","AD federation","SLA 99.95%"] },
    ],
    changelog: [
      { version:"2024.2.4", date:"2024-03-05", changes:[
        { type:"fix",     desc:"Fixed SAML assertion time drift causing login failures for Okta federation" },
        { type:"feature", desc:"Added passkey (WebAuthn) enrollment flow to self-service portal" },
      ]},
    ],
  },
  "immich": {
    ratingStars: 4.8, reviewCount: 634, installCount: 37900,
    pricingTiers: [
      { id:"free", name:"Free",   price:0,  desc:"Full self-hosted photo library",     features:["Unlimited photos","ML face recognition","Docker image"] },
      { id:"pro",  name:"Pro",    price:11, desc:"Managed ML model updates + CVE",     features:["All Free","Auto ML updates","CVE watch","Email support"] },
    ],
    changelog: [
      { version:"1.98.0", date:"2024-03-22", changes:[
        { type:"feature",     desc:"New map view with clustered location markers for geo-tagged photos" },
        { type:"improvement", desc:"Face recognition model updated to improve accuracy in low-light" },
        { type:"fix",         desc:"Fixed duplicate detection missing photos with HEIF sidecar files" },
      ]},
    ],
  },
};

const MOCK_REVIEWS = [
  { id:"r1", author:"tomasz.k", rating:5, date:"2024-03-14", content:"Flawless deployment — spun up in 4 minutes on my Hetzner box. The SLSA L3 provenance gave our security team confidence to approve it same-day.", reply:null },
  { id:"r2", author:"sarah.devops", rating:4, date:"2024-02-28", content:"Great module. The cosign signature verification is a real differentiator vs pulling straight from Docker Hub. Knocked one star because the Helm values could use more inline comments.", reply:{ author:"flareo-team", date:"2024-03-01", content:"Thanks! We're updating the Helm chart docs in the next release — watch v2.12 for annotated values." } },
  { id:"r3", author:"mika.infra", rating:5, date:"2024-02-10", content:"Exactly what I needed. The SBOM export made our SOC2 audit trivial — compliance team just downloaded it and attached to the evidence folder.", reply:null },
  { id:"r4", author:"alex.sre", rating:3, date:"2024-01-30", content:"Works well but the sandbox preview timed out twice before I got it running. Not a blocker but worth noting for time-sensitive evals.", reply:{ author:"flareo-team", date:"2024-02-01", content:"Sandbox TTL has been extended to 45 minutes in v1.30.5. Let us know if you see further issues." } },
];

const MOCK_QA = [
  { id:"q1", author:"devops.wu", date:"2024-03-12",
    title:"Can I pin to a specific digest instead of a tag?",
    content:"I want to reference the exact sha256 rather than a floating tag for reproducibility.",
    answers:[
      { id:"a1", author:"flareo-team", isDeveloper:true, date:"2024-03-12",
        content:"Yes — the Deploy Config tab shows the full digest URI. Every published release pins to an immutable digest. You can copy it from the Image URI panel and use it directly in docker-compose or Kubernetes." },
    ],
  },
  { id:"q2", author:"sec.reviewer", date:"2024-03-05",
    title:"How do I verify the cosign signature offline?",
    content:"Our airgapped environment can't reach Rekor. Is there a way to verify the signature without network access?",
    answers:[
      { id:"a2", author:"flareo-team", isDeveloper:true, date:"2024-03-05",
        content:"Use the `--insecure-ignore-tlog` flag with cosign verify and supply the public key directly. The key bundle is included in the module's attestation zip downloadable from the Trust Chain panel." },
      { id:"a3", author:"mika.infra", isDeveloper:false, date:"2024-03-06",
        content:"I did exactly this for our air-gap setup — works perfectly. The key bundle download link is in the Provenance panel on the detail page." },
    ],
  },
];

const BOUNTIES = [
  { id:"b1", title:"Build a Prometheus scrape target auto-discoverer module", desc:"Need a module that watches a Kubernetes namespace for annotated services and auto-generates a Prometheus scrape config, exporting it as a ConfigMap.", tags:["kubernetes","prometheus","monitoring"], budget:"$3,000–5,000", deadline:"30 days", status:"open", poster:"k8s.ops", posterRating:5 },
  { id:"b2", title:"Traefik v3 module with automatic Let's Encrypt wildcard certs", desc:"Replace nginx-proxy-manager with a Traefik v3 variant. Must support wildcard cert via DNS-01 challenge (Cloudflare provider), OIDC forward auth, and SLSA L3 provenance.", tags:["proxy","traefik","ssl","devops"], budget:"$5,000–8,000", deadline:"45 days", status:"open", poster:"infra.lead", posterRating:4 },
  { id:"b3", title:"Immich mobile-optimized companion sidecar", desc:"A sidecar module that transcodes HEVC and ProRAW files to web-compatible formats before Immich ingests them, reducing client-side load and improving gallery performance.", tags:["media","immich","ffmpeg"], budget:"$2,500–4,000", deadline:"60 days", status:"in-progress", poster:"photo.nerd", posterRating:5 },
  { id:"b4", title:"Portainer CE module with pre-configured stacks", desc:"Portainer CE module bundled with opinionated default stacks for common self-hosting scenarios (media, monitoring, identity). One-click import on first boot.", tags:["portainer","docker","devops"], budget:"$1,500–2,500", deadline:"20 days", status:"open", poster:"homelab.dev", posterRating:3 },
  { id:"b5", title:"Wazuh SIEM community edition module", desc:"Fully signed Wazuh manager + indexer + dashboard stack. Must include a Flareo-compatible compose that mounts agent enrollment keys as secrets.", tags:["security","siem","wazuh"], budget:"$6,000–9,000", deadline:"60 days", status:"completed", poster:"soc.analyst", posterRating:5 },
];

const POSTS = [
  { id:"p1", type:"question", title:"My compose.yml digest pins break after a re-pull — is that expected?", excerpt:"I pinned the sha256 digest in my compose file. Two weeks later docker compose pull printed a different digest warning. Is Flareo rotating digests on patch releases?", tags:["deploy","digest","versioning"], author:"ops.tomas", timeAgo:"2h ago", likes:18, comments:6 },
  { id:"p2", type:"tutorial", title:"How I automated Flareo module updates with Renovate Bot", excerpt:"Step-by-step guide to wiring up Renovate's docker datasource to track Flareo module digest updates in your GitOps repo, including a custom regex manager for the Image URI format.", tags:["renovate","gitops","automation","tutorial"], author:"devops.wu", timeAgo:"1d ago", likes:94, comments:31 },
  { id:"p3", type:"suggestion", title:"Feature request: diff view between module versions in the Scan Report tab", excerpt:"It would be incredibly useful to see which packages changed between two versions alongside their CVE delta. Right now I have to compare two scan reports manually.", tags:["scan","ux","feature-request"], author:"sec.reviewer", timeAgo:"3d ago", likes:47, comments:14 },
  { id:"p4", type:"question", title:"Best practice for SLSA L3 builds behind a corporate proxy?", excerpt:"Our build environment routes outbound traffic through a Squid proxy. BuildKit pulls are failing on certificate errors. Anyone solved this with Flareo's pipeline?", tags:["buildkit","proxy","slsa","enterprise"], author:"platform.eng", timeAgo:"5d ago", likes:22, comments:9 },
  { id:"p5", type:"tutorial", title:"Air-gap deployment walkthrough: Authentik + Vaultwarden on an isolated network", excerpt:"Full write-up of how I deployed an identity + secrets stack on a network with zero internet access, using Flareo's attestation bundles for offline cosign verification.", tags:["airgap","authentik","vaultwarden","security","tutorial"], author:"mika.infra", timeAgo:"1w ago", likes:136, comments:42 },
];

const CONTESTS = [
  { id:"c1", title:"Self-Hosting Security Sprint", desc:"Build a module that meaningfully reduces the attack surface of a common self-hosted service. Judged on SLSA level, CVE count, and provenance completeness.", status:"active", start:"2025-03-01", end:"2025-04-15", participants:84, prizes:["$15,000","$7,500","$3,000","$1,000 ×5"] },
  { id:"c2", title:"Observability Stack Challenge", desc:"Assemble a pre-configured Grafana + Prometheus + Loki + Tempo stack that deploys in under 5 minutes with a single compose command. Scored on time-to-dashboard and dashboard quality.", status:"active", start:"2025-02-15", end:"2025-04-01", participants:112, prizes:["$12,000","$6,000","$2,500"] },
  { id:"c3", title:"AI-Assisted Runbook Generator", desc:"Build a module that reads a running container's environment and generates a plain-English runbook, including backup procedures, upgrade notes, and rollback instructions.", status:"upcoming", start:"2025-05-01", end:"2025-06-30", participants:0, prizes:["$20,000","$10,000","$5,000"] },
  { id:"c4", title:"Inaugural Container Hardening Cup", desc:"Flareo's first community hackathon. Participants raced to publish the most hardened version of five target modules. 256 entries, 3 achieved SLSA L3.", status:"ended", start:"2024-10-01", end:"2024-11-30", participants:256, prizes:["$25,000","$12,000","$6,000"] },
];

const TOPIC_TAGS = [
  { name:"deploy",       count:87 },
  { name:"security",     count:64 },
  { name:"buildkit",     count:48 },
  { name:"slsa",         count:41 },
  { name:"cosign",       count:35 },
  { name:"kubernetes",   count:29 },
  { name:"proxmox",      count:24 },
  { name:"homelab",      count:21 },
  { name:"automation",   count:18 },
];



// ─── ADMIN MOCK DATA ─────────────────────────────────────────────────────────
const PENDING_SUBMISSIONS = [
  {
    id:"sub-001", name:"redis-stack-server", author:"devops.wu", ver:"7.2.0-v9",
    submittedAt:"2h ago", submittedFull:"Mar 10, 2026 · 10:14 AM",
    imageRef:"devops.wu/redis-stack-server:7.2.0-v9",
    digest:"sha256:a1b2c3d4e5f6...",
    buildTime:"1m 42s", imageSize:"148MB",
    slsa:2, c:0, h:1, m:3, l:4,
    sbomPackages:312, license:"MIT",
    tags:["database","cache","redis"],
    desc:"Redis Stack Server bundles Redis with RedisSearch, RedisJSON, RedisGraph, and RedisTimeSeries. Supports RediSearch queries and vector similarity search out of the box.",
    trustScore:76,
    riskFlags:[
      { level:"warn", msg:"1 HIGH CVE in openssl 3.0.11 — fixed in 3.0.13" },
      { level:"info", msg:"3 MEDIUM CVEs — all have patches available" },
    ],
    buildLog:[
      "[00:00.1] Source verified — sha256:a1b2c3d4",
      "[00:02.3] BuildKit build started",
      "[01:12.4] Image built — 148MB",
      "[01:13.0] Pushed to ECR: 123456789.dkr.ecr.us-east-1.amazonaws.com/flareo/redis-stack-server",
      "[01:18.4] Trivy scan complete — 0C · 1H · 3M",
      "[01:18.5] cosign signed — keyless via Sigstore",
      "[01:19.0] SLSA L2 provenance attached",
      "[01:19.1] Submitted for admin review",
    ],
  },
  {
    id:"sub-002", name:"plausible-analytics", author:"pri.vaas", ver:"2.1.4",
    submittedAt:"5h ago", submittedFull:"Mar 10, 2026 · 7:08 AM",
    imageRef:"pri.vaas/plausible-analytics:2.1.4",
    digest:"sha256:b9e7f2a1c8d3...",
    buildTime:"2m 11s", imageSize:"214MB",
    slsa:2, c:0, h:0, m:1, l:2,
    sbomPackages:487, license:"AGPL-3.0",
    tags:["analytics","privacy","monitoring"],
    desc:"Privacy-friendly, open-source web analytics. No cookies, no cross-site tracking, fully GDPR compliant. Lightweight script (< 1KB) and easy self-hosting.",
    trustScore:88,
    riskFlags:[
      { level:"info", msg:"AGPL-3.0 license — requires downstream source disclosure" },
      { level:"info", msg:"1 MEDIUM CVE in node-fetch — low severity, no exploit known" },
    ],
    buildLog:[
      "[00:00.2] Source verified",
      "[00:03.1] BuildKit build started",
      "[02:01.3] Image built — 214MB",
      "[02:05.0] Pushed to ECR",
      "[02:10.2] Trivy scan — 0C · 0H · 1M",
      "[02:10.3] cosign signed",
      "[02:10.8] SLSA L2 provenance attached",
    ],
  },
  {
    id:"sub-003", name:"minio-distributed", author:"s3.compat", ver:"RELEASE.2024-03",
    submittedAt:"1d ago", submittedFull:"Mar 9, 2026 · 3:45 PM",
    imageRef:"s3.compat/minio-distributed:RELEASE.2024-03",
    digest:"sha256:c4d2e9b1f7a6...",
    buildTime:"3m 04s", imageSize:"394MB",
    slsa:1, c:2, h:4, m:7, l:12,
    sbomPackages:891, license:"AGPL-3.0",
    tags:["storage","s3","devops"],
    desc:"MinIO distributed object storage — S3-compatible, high performance. Suitable for AI/ML workloads, data lakes, and backup targets.",
    trustScore:31,
    riskFlags:[
      { level:"error", msg:"2 CRITICAL CVEs — CVE-2024-7890 (RCE), CVE-2024-7891 (auth bypass)" },
      { level:"error", msg:"4 HIGH CVEs in base image golang:1.21 — upgrade required" },
      { level:"warn",  msg:"SLSA L1 only — no hermetic build, no provenance chain" },
      { level:"warn",  msg:"Image size 394MB exceeds recommended 300MB threshold" },
    ],
    buildLog:[
      "[00:00.3] Source verified",
      "[00:04.0] BuildKit build started",
      "[02:58.2] Image built — 394MB",
      "[03:02.0] Pushed to ECR",
      "[03:03.8] Trivy scan — 2C · 4H · 7M · 12L",
      "[03:04.1] cosign signed",
      "[03:04.2] SLSA L1 only — provenance incomplete",
    ],
  },
];


// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────

const Badge = ({ children, color, mono = false }) => {
  const c = color || G.textDisabled;
  const isNeutral = !color;
  return (
    <span style={{
      fontFamily: mono ? MONO : SANS, fontSize:"11px", padding:"2px 7px",
      borderRadius:"3px", fontWeight:500, letterSpacing:"0.01em", whiteSpace:"nowrap",
      background: isNeutral ? G.elevated : `${c}0d`,
      border: `1px solid ${isNeutral ? G.border : c + "25"}`,
      color: isNeutral ? G.textSecondary : c,
    }}>{children}</span>
  );
};

// TerminalBlock — reusable code/command block with copy button
const TerminalBlock = ({ children, label, lang = "bash" }) => {
  const [copied, setCopied] = React.useState(false);
  const text = typeof children === "string" ? children : "";
  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ background:"#0A0A0A", border:`1px solid ${G.border}`, borderTop:`1px solid rgba(255,255,255,0.06)`, borderRadius:"5px", overflow:"hidden" }}>
      {/* titlebar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", height:"34px", background:"#0F0F0F", borderBottom:`1px solid ${G.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke={G.textDisabled} strokeWidth="1.2"/><path d="M4 6l2 2-2 2M8 10h4" stroke={G.textDisabled} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{label || lang}</span>
        </div>
        <button onClick={copy} style={{ display:"flex", alignItems:"center", gap:"5px", background:"none", border:"none", cursor:"pointer", color: copied ? G.success : G.textDisabled, fontFamily:SANS, fontSize:"11px", padding:"3px 6px", borderRadius:"3px", transition:"color .15s" }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.color = G.textSecondary; }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.color = G.textDisabled; }}
        >
          {copied
            ? <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> copied</>
            : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> copy</>
          }
        </button>
      </div>
      {/* body */}
      <div style={{ padding:"16px 18px", fontFamily:MONO, fontSize:"12px", lineHeight:1.9, color:G.textSecondary, overflowX:"auto" }}>
        {text.trim().split("\n").map((line, i) => {
          const isComment = line.trim().startsWith("#");
          const isPrompt = line.trim().startsWith("$") || line.trim().startsWith("▸");
          return (
            <div key={i} style={{ display:"flex", gap:"0", whiteSpace:"pre" }}>
              <span style={{ color: isComment ? G.textDisabled : isPrompt ? G.orange : G.textSecondary }}>{line || " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScanResult = ({ c, h, m }) => {
  if (c > 0) return <Badge color={G.error}>{c}C · {h}H · {m}M</Badge>;
  if (h > 0) return <Badge color={G.error}>{h}H · {m}M</Badge>;
  if (m > 0) return <Badge color={G.textSecondary}>{m}M</Badge>;
  return <Badge color={G.success}>✓ Clean</Badge>;
};

// Accent — the ONE button per screen that commits an action. White on black — Linear/Vercel authority.
const BtnAccent = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{
    background: "#FFFFFF", color:"#0C0C0C",
    border:"1px solid transparent", borderRadius:"5px",
    padding:"8px 18px", fontFamily:SANS, fontSize:"13px", fontWeight:600,
    cursor:"pointer", letterSpacing:"-0.01em",
    transition:"background .12s, box-shadow .12s",
    ...style,
  }}
    onMouseEnter={e => { e.currentTarget.style.background="#E8E8E8"; }}
    onMouseLeave={e => { e.currentTarget.style.background="#FFFFFF"; }}
  >{children}</button>
);

const BtnPrimary = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{
    background:G.elevated, color:G.textPrimary,
    border:`1px solid #3E434B`, borderRadius:"5px",
    padding:"8px 16px", fontFamily:SANS, fontSize:"13px", fontWeight:500,
    cursor:"pointer", letterSpacing:"-0.01em",
    transition:"background .12s, border-color .12s, box-shadow .12s", ...style,
  }}
    onMouseEnter={e => { e.currentTarget.style.background="#2D2B29"; e.currentTarget.style.borderColor="#403D3A"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.3)"; }}
    onMouseLeave={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.borderColor="#353535"; e.currentTarget.style.boxShadow="none"; }}
  >{children}</button>
);

const BtnGhost = ({ children, style, onClick }) => (
  <button onClick={onClick} style={{
    background:"transparent", color:G.textSecondary,
    border:`1px solid ${G.border}`, borderRadius:"5px",
    padding:"8px 16px", fontFamily:SANS, fontSize:"13px", fontWeight:400,
    cursor:"pointer", letterSpacing:"-0.01em",
    transition:"color .12s, border-color .12s, background .12s", ...style,
  }}
    onMouseEnter={e => { e.currentTarget.style.color=G.textPrimary; e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
    onMouseLeave={e => { e.currentTarget.style.color=G.textSecondary; e.currentTarget.style.borderColor=G.border; e.currentTarget.style.background="transparent"; }}
  >{children}</button>
);

// Grafana-pattern panel — bordered, elevated top edge, consistent header
const Panel = ({ children, style }) => (
  <div style={{
    background:G.primary, border:`1px solid ${G.border}`,
    borderTop:"1px solid rgba(255,255,255,0.055)",
    borderRadius:"4px", overflow:"hidden", ...style,
  }}>{children}</div>
);

// Grafana panel header: 36px, label + optional sub on left, action + kebab on right
const PanelHeader = ({ label, sub, action, menu, style }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItems = menu || ["Refresh","Copy link","Export CSV"];
  return (
    <div className="nx" style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 16px", height:"36px",
      borderBottom:`1px solid ${G.border}`,
      background: G.secondary, position:"relative", ...style,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>{label}</span>
        {sub && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{sub}</span>}
      </div>
      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
        {action && <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>{action}</div>}
        {/* Kebab ... menu */}
        <div style={{ position:"relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            background:"none", border:"none", cursor:"pointer", padding:"3px 6px", borderRadius:"2px",
            color:G.textDisabled, display:"flex", alignItems:"center", transition:"all .1s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textSecondary; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textDisabled; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="8" cy="13" r="1.3"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position:"absolute", right:0, top:"100%", zIndex:100, minWidth:"140px",
              background:G.elevated, border:`1px solid ${G.border}`,
              borderTop:"1px solid rgba(255,255,255,0.07)", borderRadius:"4px",
              boxShadow:"0 8px 28px rgba(0,0,0,.6)", overflow:"hidden",
            }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              {menuItems.map((item, _mi) => (
                <button key={item} onClick={() => setMenuOpen(false)} style={{
                  display:"block", width:"100%", padding:"8px 14px", textAlign:"left",
                  background:"none", border:"none", cursor:"pointer",
                  fontFamily:SANS, fontSize:"12px", color:G.textSecondary, transition:"all .08s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background=G.secondary; e.currentTarget.style.color=G.textPrimary; }}
                  onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textSecondary; }}
                >{item}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Code block: gutter + syntax + copy/download
const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const lines = code.trim().split("\n");
  const highlight = (line) => {
    if (line.trimStart().startsWith("#")) return <span style={{color:G.textDisabled}}>{line}</span>;
    if (/^\s*\w[\w-]*:/.test(line) && !line.trimStart().startsWith("-")) {
      const m = line.match(/^(\s*)([\w-]+)(:.*)/);
      if (m) return <><span style={{color:G.textSecondary}}>{m[1]}{m[2]}</span><span style={{color:G.textSecondary}}>{m[3]}</span></>;
    }
    return <span style={{color:G.textSecondary}}>{line}</span>;
  };
  return (
    <div style={{ background:"#080808", border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 14px", height:"34px", background:G.elevated, borderBottom:`1px solid ${G.border}` }}>
        <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>{lang}</span>
        <div style={{ display:"flex", gap:"6px" }}>
          {["copy","download"].map(a => (
            <span key={a} onClick={() => a==="copy" && (navigator.clipboard && navigator.clipboard.writeText(code), setCopied(true), setTimeout(()=>setCopied(false),1500))}
              style={{ fontFamily:SANS, fontSize:"11px", color: a==="copy"&&copied ? G.success : G.textDisabled, cursor:"pointer", padding:"3px 8px", borderRadius:"2px", border:`1px solid ${G.border}` }}>
              {a==="copy" && copied ? "copied" : a}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", maxHeight:"280px", overflowY:"auto" }}>
        <div style={{ flexShrink:0, padding:"12px 0", background:"#060606", borderRight:`1px solid #201E1C`, minWidth:"38px", userSelect:"none" }}>
          {lines.map((_,i) => <div key={i} style={{ fontFamily:MONO, fontSize:"11px", color:"#252525", lineHeight:"1.75", textAlign:"right", padding:"0 10px" }}>{i+1}</div>)}
        </div>
        <div style={{ padding:"12px 16px", flex:1 }}>
          {lines.map((l,i) => <div key={i} style={{ fontFamily:MONO, fontSize:"11px", lineHeight:"1.75", whiteSpace:"pre" }}>{highlight(l)}</div>)}
        </div>
      </div>
    </div>
  );
};

// ─── LOGO SVG ────────────────────────────────────────────────────────────────
const _logoIdCounter = { n: 0 };
const Logo = ({ size = 22 }) => {
  const [gid] = React.useState(() => "flg" + (_logoIdCounter.n++));
  return (
  <svg width={size} height={size} viewBox="5.5 2.5 13 19.5" fill="none">
    <defs>
      <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#F53E4C"/>
        <stop offset="100%" stopColor="#FF8833"/>
      </linearGradient>
    </defs>
    {/* Flame: rises from base, tapers to point, inner notch at bottom */}
    <path
      d="M12 3 C12 3 17.5 8.5 17.5 13.5 C17.5 16.5 15.5 19.5 12 21 C8.5 19.5 6.5 16.5 6.5 13.5 C6.5 8.5 12 3 12 3Z"
      fill={`url(#${gid})`}
      fillOpacity="0.15"
    />
    <path
      d="M12 5.5 C12 5.5 16 10 16 13.5 C16 16 14.2 18.5 12 19.5 C9.8 18.5 8 16 8 13.5 C8 10 12 5.5 12 5.5Z"
      fill={`url(#${gid})`}
    />
    {/* Inner highlight — cool core of flame */}
    <path
      d="M12 10 C12 10 14 12.5 14 14.5 C14 15.8 13.1 17 12 17.5 C10.9 17 10 15.8 10 14.5 C10 12.5 12 10 12 10Z"
      fill="white"
      fillOpacity="0.18"
    />
  </svg>
  );
};

// ─── SIGN-IN MODAL ────────────────────────────────────────────────────────────
// Overlay shown when user clicks "Sign In" from the landing page.
const SignInModal = ({ onLogin, onClose }) => (
  <div style={{
    position:"fixed", inset:0, zIndex:1000,
    background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)",
    display:"flex", alignItems:"center", justifyContent:"center",
    animation:"fadeUp .15s ease",
  }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{
      width:"100%", maxWidth:"400px", margin:"0 24px",
      background:G.primary, border:`1px solid ${G.border}`,
      borderTop:"1px solid rgba(255,255,255,0.09)",
      borderRadius:"8px", padding:"32px",
      position:"relative", animation:"fadeUp .2s ease",
    }}>
      {/* Close */}
      <button onClick={onClose} style={{ position:"absolute", top:"14px", right:"14px", background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"4px", borderRadius:"4px", lineHeight:1 }}
        onMouseEnter={e => e.currentTarget.style.color=G.textPrimary}
        onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px", justifyContent:"center", marginBottom:"24px" }}>
        <Logo size={20}/>
        <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Flareo</span>
      </div>

      <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"15px", color:G.textPrimary, marginBottom:"4px", textAlign:"center" }}>Sign in to continue</div>
      <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, textAlign:"center", marginBottom:"24px" }}>Access your dashboard, publish modules, and more.</div>

      {/* GitHub */}
      <button onClick={onLogin} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
        padding:"10px 20px", borderRadius:"4px",
        background:G.elevated, border:`1px solid ${G.border}`,
        color:G.textPrimary, fontFamily:SANS, fontSize:"13px", fontWeight:600,
        cursor:"pointer", transition:"background .15s, border-color .15s",
        marginBottom:"12px",
      }}
        onMouseEnter={e => { e.currentTarget.style.background="#2D2B29"; e.currentTarget.style.borderColor="#3D3B38"; }}
        onMouseLeave={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.borderColor=G.border; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={G.textPrimary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        Continue with GitHub
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
        <div style={{ flex:1, height:"1px", background:G.borderWk }}/>
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>or</span>
        <div style={{ flex:1, height:"1px", background:G.borderWk }}/>
      </div>

      <input placeholder="you@example.com" aria-label="Email address" type="email" style={{
        width:"100%", background:G.secondary, border:`1px solid ${G.border}`,
        borderRadius:"4px", color:G.textPrimary, fontFamily:SANS, fontSize:"13px",
        padding:"8px 12px", outline:"none", marginBottom:"8px", boxSizing:"border-box",
      }}/>
      <button onClick={onLogin} style={{
        width:"100%", padding:"8px", borderRadius:"4px",
        background:G.elevated, border:`1px solid ${G.border}`,
        color:G.textPrimary, fontFamily:SANS, fontSize:"13px", fontWeight:600,
        cursor:"pointer", transition:"background .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background="#2D2B29"}
        onMouseLeave={e => e.currentTarget.style.background=G.elevated}
      >Sign in with email</button>

      <p style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textAlign:"center", lineHeight:1.6, marginTop:"16px" }}>
        By signing in you agree to our Terms of Service.<br/>No credit card required.
      </p>
    </div>
  </div>
);

// ─── HERO TERMINAL — animated typewriter ─────────────────────────────────────
const TERM_SCRIPT = [
  { type:"prompt", text:"flareo pull vaultwarden:v1.30.5",  delay:400  },
  { type:"dim",    text:"  Resolving sha256:a8f2c1d4e6b9…", delay:700  },
  { type:"dim",    text:"  Fetching image layers (3/3)",     delay:500  },
  { type:"ok",     text:"  ✓ verified  Sigstore · keyless",  delay:420  },
  { type:"ok",     text:"  ✓ provenance SLSA L3 attached",   delay:320  },
  { type:"ok",     text:"  ✓ score 99/100 · 0 critical CVEs",delay:360  },
  { type:"gap",                                               delay:600  },
  { type:"prompt", text:"flareo deploy vaultwarden:v1.30.5", delay:480  },
  { type:"dim",    text:"  Writing docker-compose.yml",       delay:560  },
  { type:"ok",     text:"  ✓ ready  docker compose up -d",   delay:400  },
  { type:"done",                                              delay:200  },
];

const HeroTerminal = () => {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (shown >= TERM_SCRIPT.length) { setTyping(false); return; }
    const t = setTimeout(() => setShown(n => n + 1), TERM_SCRIPT[shown].delay);
    return () => clearTimeout(t);
  }, [shown]);

  // restart loop after pause
  useEffect(() => {
    if (!typing && shown >= TERM_SCRIPT.length) {
      const t = setTimeout(() => { setShown(0); setTyping(true); }, 3200);
      return () => clearTimeout(t);
    }
  }, [typing, shown]);

  const colorMap = { prompt:G.textPrimary, dim:G.textDisabled, ok:"#5DBF87", muted:G.textSecondary };
  const visibleLines = TERM_SCRIPT.slice(0, shown);
  const isDone = shown >= TERM_SCRIPT.length;

  return (
    <div style={{ position:"relative" }}>
      {/* Subtle neutral glow — no orange */}
      <div style={{ position:"absolute", inset:"-20px", background:"radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.025) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"relative", zIndex:1, background:"#0A0908", border:`1px solid ${G.border}`, borderTop:`1px solid rgba(255,255,255,0.07)`, borderRadius:"6px", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>

        {/* Title bar — macOS-style with traffic lights */}
        <div style={{ display:"flex", alignItems:"center", height:"38px", background:"#0F0E0D", borderBottom:`1px solid ${G.border}`, padding:"0 14px", gap:0, position:"relative" }}>
          {/* Centered title */}
          <div style={{ position:"absolute", left:0, right:0, display:"flex", justifyContent:"center", alignItems:"center", gap:"6px", pointerEvents:"none" }}>
            {/* Terminal icon — clean chevron-prompt style */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline points="2,3 6,6 2,9" stroke={G.textDisabled} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="6.5" y1="9" x2="10" y2="9" stroke={G.textDisabled} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily:SANS, fontSize:"11.5px", color:G.textDisabled, letterSpacing:"0.01em" }}>terminal</span>
          </div>
          <div style={{ flex:1 }}/>
          {/* Status — subtle, no orange */}
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ width:"5px", height:"5px", borderRadius:"50%", background: isDone ? G.textDisabled : G.success, transition:"background .6s", animation: isDone ? "none" : "pulse 2s infinite", opacity: isDone ? 0.4 : 0.9 }}/>
            <span style={{ fontFamily:MONO, fontSize:"10px", color:G.textDisabled, letterSpacing:"0.01em" }}>{isDone ? "idle" : "running"}</span>
          </div>
        </div>

        {/* Terminal body */}
        <div style={{ padding:"18px 22px 22px", fontFamily:MONO, fontSize:"12.5px", lineHeight:1.9, minHeight:"222px" }}>
          {visibleLines.map((line, i) => {
            if (line.type === "gap") return <div key={i} style={{ height:"8px" }}/>;
            if (line.type === "done") return null;
            const isPrompt = line.type === "prompt";
            const isLast = i === visibleLines.length - 1;
            return (
              <div key={i} style={{ display:"flex", gap:"10px", animation:"fadeUp .12s ease" }}>
                {isPrompt
                  ? <span style={{ color:G.textSecondary, userSelect:"none", flexShrink:0, marginTop:"1px", opacity:0.7 }}>$</span>
                  : <span style={{ width:"14px", flexShrink:0 }}/>}
                <span style={{ color: colorMap[line.type] || G.textSecondary, fontWeight: isPrompt ? 500 : 400 }}>
                  {line.text}
                  {isLast && !isDone && line.type !== "gap" && (
                    <span style={{ display:"inline-block", width:"7px", height:"13px", background:G.textSecondary, opacity:0.45, animation:"pulse 1s steps(1) infinite", verticalAlign:"text-bottom", marginLeft:"2px" }}/>
                  )}
                </span>
              </div>
            );
          })}
          {isDone && (
            <div style={{ display:"flex", gap:"10px", marginTop:"2px" }}>
              <span style={{ color:G.textSecondary, userSelect:"none", flexShrink:0, opacity:0.7 }}>$</span>
              <span style={{ display:"inline-block", width:"7px", height:"13px", background:G.textSecondary, opacity:0.4, animation:"pulse 1.2s steps(1) infinite", verticalAlign:"text-bottom" }}/>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 16px", background:"#0C0B0A", borderTop:`1px solid ${G.borderWk}` }}>
          <span style={{ fontFamily:MONO, fontSize:"10px", color:G.textDisabled, opacity:0.6 }}>flareo-cli v0.1.0</span>
          <span style={{ fontFamily:MONO, fontSize:"10px", color: isDone ? G.success : G.textDisabled, transition:"color .6s", opacity: isDone ? 0.8 : 0.5 }}>{isDone ? "✓ done" : "● running…"}</span>
        </div>
      </div>
    </div>
  );
};

// ─── PUBLIC MARKETPLACE (full landing page) ───────────────────────────────────
const PublicMarketplace = ({ onSignIn, onNavigate }) => {
  const setPageFromMarketplace = onNavigate || (() => {});
  const [filter, setFilter] = useState("All");
  const chips = ["All", ...CATEGORIES.filter(c => c !== "All")];
  const shown = MODULES.filter(m => filter === "All" || m.category === filter || m.tags.includes(filter));

  return (
    <div>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <div className="nx-hero" style={{ position:"relative", overflow:"hidden", background:"linear-gradient(180deg, #080604 0%, #090807 100%)", borderBottom:`1px solid ${G.border}` }}>
        {/* Top gradient bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient, zIndex:2 }}/>
        {/* Dot grid — fine, high-contrast, masked to center zone only */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize:"20px 20px", maskImage:"radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)", WebkitMaskImage:"radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)" }}/>
        {/* Faint orange glow behind headline */}
        <div style={{ position:"absolute", top:"-20%", left:"25%", width:"700px", height:"420px", borderRadius:"50%", background:`radial-gradient(ellipse, rgba(255,120,10,0.05) 0%, transparent 65%)`, pointerEvents:"none" }}/>

        <div style={{ maxWidth:"1240px", margin:"0 auto", padding:"90px 40px 84px", position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"60px", alignItems:"center" }}>

          {/* LEFT — copy */}
          <div>
            {/* eyebrow badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"4px 12px", borderRadius:"20px", marginBottom:"26px", background:G.canvas, border:`1px solid ${G.border}` }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.textSecondary, animation:"pulse 2.5s infinite", flexShrink:0 }}/>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>1,089 verified modules · SLSA L1–L3</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginLeft:"4px" }}>NEW →</span>
            </div>

            <h1 style={{ fontFamily:SANS, fontWeight:700, letterSpacing:"-0.02em", fontSize:"clamp(34px, 4vw, 54px)", lineHeight:1.08, marginBottom:"24px" }}>
              <span style={{ background:G.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Plug and Ship.</span>
              <br/>
              <span style={{ color:G.textPrimary }}>Container modules</span>
              <br/>
              <span style={{ color:G.textSecondary, fontWeight:500 }}>you can actually trust.</span>
            </h1>

            <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.85, maxWidth:"480px", marginBottom:"32px" }}>
              Every module is automatically built with BuildKit, scanned by Trivy,
              signed with cosign via Sigstore, and SLSA-attested — before it reaches
              your infrastructure. No black boxes. No vendor lock-in.
            </p>

            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"44px" }}>
              <button onClick={onSignIn} style={{ background:"#FFFFFF", border:"none", borderRadius:"5px", padding:"12px 28px", cursor:"pointer", color:"#0C0C0C", fontFamily:SANS, fontSize:"13px", fontWeight:600, transition:"background .15s", letterSpacing:"-0.01em" }}
                onMouseEnter={e => { e.currentTarget.style.background="#E8E8E8"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#FFFFFF"; }}
              >Get started free</button>
              <button style={{ background:"transparent", border:`1px solid ${G.border}`, borderRadius:"5px", padding:"12px 22px", cursor:"pointer", color:G.textSecondary, fontFamily:SANS, fontSize:"13px", transition:"all .12s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; e.currentTarget.style.background="transparent"; }}
              >
                <span style={{ fontFamily:MONO, fontSize:"13px" }}>$ flareo publish</span>
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display:"flex", gap:"0" }}>
              {[{ v:"1,247", l:"Total modules" },{ v:"1,089", l:"Verified" },{ v:"342", l:"SLSA Level 3" },{ v:"2.4M", l:"Total deploys" }].map((s, i) => (
                <div key={s.l} style={{ display:"flex", alignItems:"center" }}>
                  <div style={{ paddingRight:"24px", paddingLeft: i===0 ? 0 : "24px", borderLeft: i>0 ? `1px solid ${G.border}` : "none" }}>
                    <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.015em", lineHeight:1 }}>{s.v}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"3px", whiteSpace:"nowrap" }}>{s.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — animated terminal */}
          <HeroTerminal />

        </div>
      </div>

      {/* ══ 2. TRUSTED BY MARQUEE ════════════════════════════════════════════ */}
      <div style={{ background:G.canvas, borderBottom:`1px solid ${G.border}`, overflow:"hidden", height:"36px", display:"flex", alignItems:"center" }}>
        <div style={{ flexShrink:0, height:"100%", display:"flex", alignItems:"center", padding:"0 20px", borderRight:`1px solid ${G.border}`, fontFamily:SANS, fontSize:"11px", color:G.textDisabled, whiteSpace:"nowrap" }}>Trusted by</div>
        <div style={{ flex:1, overflow:"hidden", maskImage:"linear-gradient(90deg, transparent, black 5%, black 95%, transparent)" }}>
          <div style={{ display:"flex", animation:"marquee 28s linear infinite", width:"max-content" }}>
            {[...LOGOS,...LOGOS].map((name, i) => (
              <div key={i} style={{ padding:"0 24px", height:"36px", display:"flex", alignItems:"center", fontFamily:SANS, fontWeight:600, fontSize:"11px", color:"#505050", borderRight:`1px solid ${G.borderWk}`, whiteSpace:"nowrap" }}>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 3. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"72px 40px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"52px" }}>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"10px" }}>How it works</div>
            <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"10px" }}>From source to signed in minutes</h2>
            <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, maxWidth:"480px", margin:"0 auto", lineHeight:1.75 }}>Submit an image reference or Dockerfile. Flareo handles the entire build, scan, sign, and attestation pipeline automatically.</p>
          </div>

          {/* Pipeline steps */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:"0", position:"relative" }}>
            {[
              { n:"01", title:"Submit", desc:"Push a Dockerfile or paste an image reference. Flareo pulls and validates the source.",        icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { n:"02", title:"Build",  desc:"BuildKit compiles your image in an isolated sandbox — reproducible, hermetic, cache-friendly.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 21h8M12 17v4M6 8l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { n:"03", title:"Scan",   desc:"Trivy audits every layer for CVEs. SBOM generated. A trust score is computed from the results.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { n:"04", title:"Sign",   desc:"cosign signs the image keylessly via Sigstore. SLSA provenance is attached as an attestation.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { n:"05", title:"Ship",   desc:"After admin review the module goes live. Users get a one-click docker-compose.yml or Helm chart.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            ].map((step, i, arr) => (
              <div key={step.n} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
                {/* connector line — sits behind the circle */}
                {i < arr.length - 1 && (
                  <div style={{ position:"absolute", top:"20px", left:"50%", width:"100%", height:"1px", background:G.border, zIndex:0 }}/>
                )}
                {/* step circle */}
                <div style={{
                  width:"40px", height:"40px", borderRadius:"50%",
                  background:G.secondary, border:`1px solid ${G.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  marginBottom:"20px", position:"relative", zIndex:1,
                  color:G.textSecondary,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontFamily:SANS, fontSize:"10px", color:G.textDisabled, marginBottom:"5px", letterSpacing:".08em", textTransform:"uppercase" }}>Step {step.n}</div>
                <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"8px", textAlign:"center" }}>{step.title}</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textAlign:"center", lineHeight:1.7, maxWidth:"160px" }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 4. SECURITY FEATURES ═════════════════════════════════════════════ */}
      <div style={{ background:G.canvas, borderBottom:`1px solid ${G.border}`, padding:"72px 40px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"60px", alignItems:"center" }}>
            {/* Left: text */}
            <div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"10px" }}>Security-first</div>
              <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"16px", lineHeight:1.2 }}>Every module is scanned,<br/>signed, and attested.</h2>
              <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8, marginBottom:"32px" }}>
                We never ship untrusted code. Flareo runs Trivy on every layer, generates a CycloneDX SBOM, signs with cosign via Sigstore, and produces SLSA provenance — all before it hits the marketplace.
              </p>
              {[
                { label:"Trivy vulnerability scanning", desc:"Every CVE catalogued. CRITICAL blocks listing." },
                { label:"cosign keyless signing", desc:"Sigstore-backed — no private key management." },
                { label:"SLSA L1–L3 provenance", desc:"Build chain recorded and verifiable by anyone." },
                { label:"CycloneDX SBOM", desc:"Full dependency graph, exportable as JSON." },
              ].map(f => (
                <div key={f.label} style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
                  <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:`${G.success}18`, border:`1px solid ${G.success}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={G.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color:G.textPrimary, marginBottom:"1px" }}>{f.label}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: trust score card mock */}
            <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:`1px solid rgba(255,255,255,0.06)`, borderRadius:"6px", overflow:"hidden" }}>
              {/* card header */}
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, fontWeight:500 }}>vaultwarden · v1.30.5</span>
                <div style={{ display:"flex", alignItems:"center", gap:"5px", background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"3px", padding:"3px 8px" }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3" stroke={G.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, fontWeight:500 }}>Verified</span>
                </div>
              </div>
              {/* score row */}
              <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:"20px" }}>
                {/* SVG ring — thin, precise */}
                <div style={{ position:"relative", width:"60px", height:"60px", flexShrink:0 }}>
                  <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform:"rotate(-90deg)" }}>
                    <circle cx="30" cy="30" r="24" fill="none" stroke={G.elevated} strokeWidth="3"/>
                    <circle cx="30" cy="30" r="24" fill="none" stroke={G.success} strokeWidth="3"
                      strokeDasharray={`${(90/100)*150.8} 150.8`} strokeLinecap="round" opacity="0.85"/>
                  </svg>
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary }}>90</span>
                </div>
                <div>
                  <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"6px" }}>Trust Score</div>
                  <div style={{ display:"flex", gap:"5px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"10px", fontWeight:500, color:G.textDisabled, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"3px", padding:"2px 6px", letterSpacing:".02em" }}>SLSA L3</span>
                    <span style={{ fontFamily:SANS, fontSize:"10px", fontWeight:500, color:G.textDisabled, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"3px", padding:"2px 6px", letterSpacing:".02em" }}>cosign</span>
                  </div>
                </div>
              </div>
              {/* CVE data rows */}
              <div style={{ padding:"0 18px" }}>
                {[
                  { l:"Critical", v:0 },
                  { l:"High",     v:0 },
                  { l:"Medium",   v:2 },
                  { l:"Low",      v:5 },
                ].map((r, i, arr) => (
                  <div key={r.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i < arr.length-1 ? `1px solid ${G.borderWk}` : "none" }}>
                    <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>{r.l}</span>
                    <span style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color: r.v === 0 ? G.textDisabled : r.l === "Medium" ? G.textSecondary : G.textDisabled }}>{r.v}</span>
                  </div>
                ))}
              </div>
              {/* footer tags */}
              <div style={{ padding:"14px 18px", borderTop:`1px solid ${G.border}`, display:"flex", gap:"6px" }}>
                {["SBOM attached", "Sigstore"].map(tag => (
                  <span key={tag} style={{ fontFamily:SANS, fontSize:"10px", fontWeight:500, color:G.textDisabled, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"3px", padding:"2px 7px" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ 5. FEATURE GRID ══════════════════════════════════════════════════ */}
      <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"72px 40px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"52px" }}>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"10px" }}>Platform</div>
            <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Everything you need to publish and deploy</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"16px" }}>
            {[
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke={G.textSecondary} strokeWidth="1.5"/><path d="M6 8l3 3-3 3M11 14h6" stroke={G.textSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>, color:G.textSecondary, title:"Automated Build Pipeline", desc:"Paste a Dockerfile or image ref. BuildKit handles multi-stage builds, layer caching, and pushes to ECR automatically." },
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6L12 2z" stroke={G.textSecondary} strokeWidth="1.5"/></svg>, color:G.textSecondary, title:"CVE Scanning with Trivy", desc:"Full vulnerability audit on every image layer. CRITICAL findings block publication. Full report available in detail view." },
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={G.success} strokeWidth="1.5"/><path d="M8 12l3 3 5-5" stroke={G.success} strokeWidth="1.5" strokeLinecap="round"/></svg>, color:G.success, title:"SLSA Provenance", desc:"Cryptographic build provenance attached to every image. Verify the full build chain with cosign and the Sigstore transparency log." },
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={G.textSecondary} strokeWidth="1.5"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke={G.textSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>, color:G.textSecondary, title:"One-click Deploy Config", desc:"Click Deploy to get a ready-made docker-compose.yml or Helm chart. Inject your secrets and run — nothing else needed." },
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={G.textSecondary} strokeWidth="1.5"/><path d="M6 20v-1a6 6 0 0112 0v1" stroke={G.textSecondary} strokeWidth="1.5" strokeLinecap="round"/></svg>, color:G.textSecondary, title:"Try Before You Deploy", desc:"Spin up a sandboxed preview session directly in the browser. No infrastructure required — 30-minute TTL, zero setup." },
              { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={G.textSecondary} strokeWidth="1.5" strokeLinejoin="round"/></svg>, color:G.textSecondary, title:"Trust Score System", desc:"Composite score (0–100) across CVE severity, SLSA level, SBOM completeness, and signature validity. Know what you're deploying." },
            ].map(f => (
              <div key={f.title} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"8px", padding:"24px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"8px", background:`${f.color}14`, border:`1px solid ${f.color}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>{f.icon}</div>
                <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"8px" }}>{f.title}</div>
                <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 6. MODULE BROWSER ════════════════════════════════════════════════ */}
      <div style={{ background:G.canvas, borderBottom:`1px solid ${G.border}`, padding:"72px 40px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:"32px" }}>
            <div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"8px" }}>Marketplace</div>
              <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Browse verified modules</h2>
            </div>
            <button onClick={onSignIn} style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"7px 18px", cursor:"pointer", color:G.textSecondary, fontFamily:SANS, fontSize:"12px", transition:"all .12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; }}
            >View all modules →</button>
          </div>

          {/* Pill chips */}
          <div style={{ display:"flex", gap:"8px", marginBottom:"24px", flexWrap:"wrap" }}>
            {chips.map(f => (
              <button key={f} className={`fchip${filter===f ? " on" : ""}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          {/* Cards grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"12px" }}>
            {shown.map((m, i) => {
              const tsColor = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : m.trustScore >= 50 ? G.textSecondary : G.error;
              return (
                <div key={m.id} className="modcard" style={{ animation:`fadeUp .2s ease ${i*.03}s both`, cursor:"pointer" }} onClick={onSignIn}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                    <div>
                      <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"3px" }}>{m.name}</div>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.author} · v{m.ver}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"flex-end" }}>
                      {m.verified && <Badge color={G.success}>✓ Verified</Badge>}
                      <Badge color={m.slsa === 3 ? G.success : undefined}>SLSA L{m.slsa}</Badge>
                    </div>
                  </div>
                  <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.6, marginBottom:"12px" }}>{m.desc}</p>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"12px" }}>
                    {m.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}` }}>
                    <div style={{ display:"flex", gap:"8px" }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.stars} ★</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys} deploys</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.size}</span>
                    </div>
                    <ScanResult c={m.c} h={m.h} m={m.m}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ 7. PRICING ═══════════════════════════════════════════════════════ */}
      <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"72px 40px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:"52px" }}>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".12em", marginBottom:"10px" }}>Pricing</div>
            <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"8px" }}>Start free. Scale as you grow.</h2>
            <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled }}>No credit card required. Payments launch in V1.1.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"16px", alignItems:"start" }}>
            {[
              { name:"Free", price:"$0", period:"forever", highlight:false, features:["3 published modules","Public marketplace listing","Trivy scan + SBOM","SLSA L1 provenance","Community support"] },
              { name:"Pro", price:"$19", period:"/ month", highlight:true, features:["Unlimited modules","Priority review queue","SLSA L2–L3 provenance","Analytics dashboard","Email support","Sandbox preview sessions"] },
              { name:"Enterprise", price:"$99", period:"/ month", highlight:false, features:["Everything in Pro","Custom registry domain","Private modules","SLA 48h admin review","Dedicated support","Audit log export"] },
            ].map(tier => (
              <div key={tier.name} style={{
                background: tier.highlight ? "#171717" : G.secondary,
                border: tier.highlight ? "1px solid #383838" : `1px solid ${G.border}`,
                borderRadius:"8px", padding: tier.highlight ? "32px 24px" : "28px 24px",
                position:"relative", overflow:"hidden",
                boxShadow: tier.highlight ? "0 0 0 1px rgba(255,120,10,0.15), 0 8px 40px rgba(0,0,0,0.5)" : "none",
                marginTop: tier.highlight ? "-8px" : "0",
              }}>
                {/* Pro: glowing orange border gradient at top */}
                {tier.highlight && (
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg, transparent 0%, rgba(255,120,10,0.6) 30%, rgba(255,120,10,1) 50%, rgba(255,120,10,0.6) 70%, transparent 100%)" }}/>
                )}
                {/* Pro: very faint orange radial glow behind content */}
                {tier.highlight && (
                  <div style={{ position:"absolute", top:"-40px", left:"50%", transform:"translateX(-50%)", width:"200px", height:"120px", background:"radial-gradient(ellipse, rgba(255,120,10,0.07) 0%, transparent 70%)", pointerEvents:"none" }}/>
                )}
                <div style={{ position:"relative" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                    <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color: tier.highlight ? G.textPrimary : G.textSecondary, textTransform:"uppercase", letterSpacing:".04em" }}>{tier.name}</div>
                    {tier.highlight && <div style={{ fontFamily:SANS, fontSize:"10px", fontWeight:600, color:G.orange, background:`${G.orange}12`, border:`1px solid ${G.orange}30`, borderRadius:"20px", padding:"2px 8px", letterSpacing:".04em", textTransform:"uppercase" }}>Most popular</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:"4px", marginBottom:"20px" }}>
                    <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"32px", color:G.textPrimary, letterSpacing:"-0.015em" }}>{tier.price}</span>
                    <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>{tier.period}</span>
                  </div>
                  <div style={{ height:"1px", background: tier.highlight ? "rgba(255,120,10,0.15)" : G.border, marginBottom:"20px" }}/>
                  {tier.features.map(f => (
                    <div key={f} style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ marginTop:"1px", flexShrink:0 }}><path d="M3 8l3.5 3.5L13 4" stroke={tier.highlight ? G.orange : G.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>{f}</span>
                    </div>
                  ))}
                  <button onClick={onSignIn} style={{
                    width:"100%", marginTop:"20px", padding:"9px", borderRadius:"5px",
                    background: tier.highlight ? "#FFFFFF" : "transparent",
                    border: tier.highlight ? "none" : `1px solid ${G.border}`,
                    color: tier.highlight ? "#0C0C0C" : G.textSecondary,
                    fontFamily:SANS, fontSize:"13px", fontWeight:600, cursor:"pointer",
                    transition:"background .12s",
                  }}
                    onMouseEnter={e => { if(tier.highlight){ e.currentTarget.style.background="#E8E8E8"; } else { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; } }}
                    onMouseLeave={e => { if(tier.highlight){ e.currentTarget.style.background="#FFFFFF"; } else { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; } }}
                  >{tier.name === "Enterprise" ? "Contact us" : "Get started"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 8. FOOTER ════════════════════════════════════════════════════════ */}
      <PublicFooter onNavigate={setPageFromMarketplace} onSignIn={onSignIn}/>

    </div>
  );
};

// ─── SHARED PUBLIC FOOTER ─────────────────────────────────────────────────────
const PublicFooter = ({ onNavigate, onSignIn }) => (
  <div style={{ background:G.primary, borderTop:`1px solid ${G.border}`, position:"relative", overflow:"hidden" }}>
    {/* Top gradient bar */}
    <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
    {/* Faint corner warmth */}
    <div style={{ position:"absolute", bottom:"-60px", left:"-40px", width:"400px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>

    {/* Main columns */}
    <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"56px 40px 40px", position:"relative", zIndex:1 }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"48px", alignItems:"flex-start" }}>

        {/* Brand column */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"16px", cursor:"pointer" }} onClick={() => onNavigate(null)}>
            <Logo size={26}/>
            <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.025em" }}>Flareo</span>
          </div>
          <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled, lineHeight:1.8, marginBottom:"24px", maxWidth:"280px" }}>
            The open container marketplace for verified, signed, and attested software modules. Every image is scanned, cosign-signed, and SLSA-attested before it ships.
          </p>
          {/* Trust badges */}
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {["SLSA L1–L3", "cosign", "Trivy", "CycloneDX"].map(b => (
              <span key={b} style={{ fontFamily:MONO, fontSize:"10px", color:G.textDisabled, background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"3px", padding:"2px 7px" }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {[
          { heading:"Product",    links:[["Marketplace","marketplace"],["Pricing","pricing"],["Changelog",null],["Status",null],["Roadmap",null]] },
          { heading:"Developers", links:[["Docs","docs"],["How it works","how-it-works"],["Security","security"],["API Reference","docs"],["GitHub",null]] },
          { heading:"Company",    links:[["Blog","blog"],["About",null],["Privacy",null],["Terms",null],["Contact",null]] },
        ].map(col => (
          <div key={col.heading}>
            <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"20px" }}>{col.heading}</div>
            {col.links.map(([label, page]) => (
              <div key={label} style={{ fontFamily:SANS, fontSize:"14px", color:G.textDisabled, marginBottom:"12px", cursor:"pointer", transition:"color .1s" }}
                onClick={() => page && onNavigate(page)}
                onMouseEnter={e => e.currentTarget.style.color=G.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
              >{label}</div>
            ))}
          </div>
        ))}
      </div>
    </div>

    {/* Bottom bar */}
    <div style={{ borderTop:`1px solid ${G.borderWk}`, position:"relative", zIndex:1 }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"16px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>© 2026 Flareo, Inc.</span>
          {["Privacy", "Terms"].map(l => (
            <span key={l} style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, cursor:"pointer", transition:"color .1s" }}
              onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
              onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
            >{l}</span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          {/* Status indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.success, display:"inline-block" }}/>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>All systems operational</span>
          </div>
          <span style={{ width:"1px", height:"12px", background:G.border, display:"inline-block" }}/>
          <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>v0.1.0-beta</span>
          {/* GitHub icon */}
          <a href="https://github.com/flareo" target="_blank" rel="noopener noreferrer" style={{ color:G.textDisabled, display:"flex", transition:"color .1s" }}
            onMouseEnter={e => e.currentTarget.style.color=G.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </div>
);

// ─── PUBLIC PAGE: MARKETPLACE BROWSE ─────────────────────────────────────────
const PublicBrowsePage = ({ onSignIn, onNavigate }) => {
  const [query, setQuery]     = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort]       = useState("deploys");
  const chips = ["All", ...CATEGORIES.filter(c => c !== "All")];
  const shown = MODULES
    .filter(m =>
      (category === "All" || m.category === category || m.tags.includes(category)) &&
      (!query || m.name.toLowerCase().includes(query.toLowerCase()) || m.desc.toLowerCase().includes(query.toLowerCase()))
    )
    .sort((a,b) => sort === "stars" ? parseFloat(b.stars) - parseFloat(a.stars) : parseInt(b.deploys) - parseInt(a.deploys));

  return (
    <div style={{ animation:"fadeUp .18s ease" }}>
      {/* Page header */}
      <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"52px 40px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
        <div style={{ position:"absolute", top:"-60px", right:"-80px", width:"420px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:"1100px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>Browse</div>
          <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"30px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"8px" }}>Module Marketplace</h1>
          <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, marginBottom:"28px" }}>
            {MODULES.length} verified container modules — scanned, signed, and ready to deploy.
          </p>
          {/* Search */}
          <div style={{ position:"relative", maxWidth:"520px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:G.textDisabled, pointerEvents:"none" }}>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input className="srch" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules…" aria-label="Search modules"
              style={{ width:"100%", paddingLeft:"36px" }}/>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background:G.canvas, borderBottom:`1px solid ${G.border}`, padding:"0 40px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", alignItems:"center", gap:"8px", height:"48px" }}>
          {chips.map(c => (
            <button key={c} className={`fchip${category===c ? " on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", gap:"4px" }}>
            {[["deploys","Most deployed"],["stars","Most starred"]].map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)} style={{
                background: sort===val ? G.elevated : "transparent",
                border:`1px solid ${sort===val ? G.border : "transparent"}`,
                borderRadius:"4px", padding:"4px 10px", cursor:"pointer",
                fontFamily:SANS, fontSize:"12px",
                color: sort===val ? G.textPrimary : G.textDisabled,
                transition:"all .1s",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ background:G.canvas, padding:"32px 40px 64px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto" }}>
          {shown.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textSecondary, marginBottom:"4px" }}>No modules found</div>
              <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Try a different search or category.</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"12px" }}>
              {shown.map((m, i) => {
                const tsColor = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : G.error;
                return (
                  <div key={m.id} className="modcard" style={{ animation:`fadeUp .18s ease ${i*.025}s both` }} onClick={onSignIn}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                      <div>
                        <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"3px" }}>{m.name}</div>
                        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.author} · v{m.ver}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"flex-end" }}>
                        {m.verified && <Badge color={G.success}>✓ Verified</Badge>}
                        <Badge color={m.slsa === 3 ? G.success : undefined}>SLSA L{m.slsa}</Badge>
                      </div>
                    </div>
                    <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.6, marginBottom:"12px" }}>{m.desc}</p>
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"12px" }}>
                      {m.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}` }}>
                      <div style={{ display:"flex", gap:"12px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.stars} ★</span>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys} deploys</span>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.size}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:tsColor }}>{m.trustScore}</span>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>/ 100</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Sign-in nudge */}
          <div style={{ marginTop:"40px", padding:"24px", background:G.primary, border:`1px solid ${G.border}`, borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>Want to deploy a module?</div>
              <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Sign in to get one-click docker-compose.yml and Helm chart generation.</div>
            </div>
            <button onClick={onSignIn} style={{ background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px 20px", cursor:"pointer", color:G.textPrimary, fontFamily:SANS, fontSize:"13px", fontWeight:600, flexShrink:0, marginLeft:"24px", transition:"opacity .12s" }}
              onMouseEnter={e => e.currentTarget.style.opacity=".8"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}
             aria-label="Get started with Flareo for free">Get started free →</button>
          </div>
        </div>
      </div>
      <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn}/>
    </div>
  );
};

// ─── PUBLIC PAGE: HOW IT WORKS ────────────────────────────────────────────────
const PublicHowItWorksPage = ({ onSignIn, onNavigate }) => (
  <div style={{ animation:"fadeUp .18s ease" }}>
    {/* Hero */}
    <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"52px 40px 48px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
      <div style={{ position:"absolute", top:"-60px", right:"-80px", width:"420px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>
      <div style={{ maxWidth:"700px", margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>How it works</div>
        <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"30px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"12px" }}>From source to signed in <span style={{ background:G.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>minutes</span></h1>
        <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8 }}>
          Submit a Dockerfile or image reference. Flareo runs a fully automated build, scan, sign, and attestation pipeline before anything reaches the marketplace.
        </p>
      </div>
    </div>

    {/* Pipeline steps — vertical, detailed */}
    <div style={{ background:G.canvas, padding:"64px 40px" }}>
      <div style={{ maxWidth:"760px", margin:"0 auto" }}>
        {[
          {
            n:"01", title:"Submit your source",
            desc:"Push a public or private Git repository URL, a Dockerfile, or paste an existing image reference. Flareo validates the source, checks for a valid Dockerfile, and queues the build.",
            detail:"Supports GitHub, GitLab, Bitbucket, and any public Git remote. Private repos via deploy key.",
            cmd:"flareo publish --source ./Dockerfile --tag myapp:v1.0.0",
            color:G.textSecondary,
          },
          {
            n:"02", title:"BuildKit build",
            desc:"Your image is compiled in an isolated BuildKit sandbox on Flareo infrastructure. The build is hermetic — no network access, reproducible layer cache, and full provenance metadata recorded.",
            detail:"Multi-stage builds, build args, and .dockerignore are fully supported. Build logs stream live.",
            cmd:"# Flareo runs: buildkitd + buildctl build --frontend dockerfile.v0",
            color:G.textSecondary,
          },
          {
            n:"03", title:"Trivy vulnerability scan",
            desc:"Every image layer is scanned with Trivy against the latest CVE databases. A CRITICAL CVE blocks listing automatically. A CycloneDX SBOM is generated and attached as an OCI artifact.",
            detail:"Databases updated every 6h. MEDIUM and HIGH are flagged but don't block — you choose the risk threshold on deploy.",
            cmd:"trivy image --format cyclonedx --output sbom.json <digest>",
            color:G.textSecondary,
          },
          {
            n:"04", title:"cosign keyless signing",
            desc:"The image digest is signed keylessly using cosign and the Sigstore infrastructure. No private key management required — your GitHub identity is bound to the signature via OIDC.",
            detail:"Signatures are published to the Sigstore transparency log (Rekor). Anyone can verify with: cosign verify",
            cmd:"cosign sign --yes ghcr.io/flareo/<digest>",
            color:G.textSecondary,
          },
          {
            n:"05", title:"SLSA provenance attestation",
            desc:"SLSA Level 1–3 provenance is generated and attached as an OCI attestation. L3 requires isolated build environment and hermetic build — which Flareo's BuildKit sandbox provides by default.",
            detail:"Provenance documents: build inputs, builder identity, build steps, and output digest. Immutable and verifiable.",
            cmd:"cosign attest --predicate slsa.json --type slsaprovenance <digest>",
            color:G.textSecondary,
          },
          {
            n:"06", title:"Admin review and listing",
            desc:"A Flareo reviewer checks the module for policy compliance — name uniqueness, description quality, no malicious payloads. Once approved, the module goes live with a Verified badge.",
            detail:"Review SLA: 24h for Free, 6h for Pro, 2h for Enterprise. You get notified by email on approval or rejection.",
            cmd:"# Module status: PENDING_REVIEW → APPROVED → LISTED",
            color:G.textSecondary,
          },
        ].map((step, i) => (
          <div key={step.n} style={{ display:"flex", gap:"32px", marginBottom: i < 5 ? "0" : "0" }}>
            {/* Left: step number + connector */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:"48px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`${step.color}18`, border:`1px solid ${step.color}50`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:step.color }}>{step.n}</span>
              </div>
              {i < 5 && <div style={{ width:"1px", flex:1, background:G.border, margin:"8px 0", minHeight:"60px" }}/>}
            </div>
            {/* Right: content */}
            <div style={{ flex:1, paddingBottom: i < 5 ? "40px" : "0" }}>
              <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.02em", marginBottom:"8px" }}>{step.title}</div>
              <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.75, marginBottom:"8px" }}>{step.desc}</p>
              <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, lineHeight:1.65, marginBottom:"12px" }}>{step.detail}</p>
              <div style={{ marginTop:"12px" }}>
                <TerminalBlock>{step.cmd}</TerminalBlock>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn}/>
  </div>
);

// ─── PUBLIC PAGE: SECURITY ────────────────────────────────────────────────────
const PublicSecurityPage = ({ onSignIn, onNavigate }) => (
  <div style={{ animation:"fadeUp .18s ease" }}>
    {/* Hero */}
    <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"52px 40px 48px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
      <div style={{ position:"absolute", top:"-60px", right:"-80px", width:"420px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>
      <div style={{ maxWidth:"700px", margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>Security</div>
        <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"30px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"12px" }}>Every module scanned, signed, and <span style={{ background:G.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>attested.</span></h1>
        <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8 }}>
          Flareo's supply chain security model is built on open standards — Trivy, cosign, Sigstore, SLSA, and CycloneDX — with no vendor lock-in and full public verifiability.
        </p>
      </div>
    </div>

    {/* 4 security pillars */}
    <div style={{ background:G.canvas, padding:"64px 40px" }}>
      <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", marginBottom:"48px" }}>
          {[
            {
              title:"Trivy Vulnerability Scanning",
              sub:"CVE detection · SBOM generation · layer-by-layer audit",
              color:G.textSecondary,
              body:"Every image is scanned by Trivy against the NVD, GitHub Advisory Database, and OS package advisories. A CRITICAL CVE blocks listing. MEDIUM and HIGH are surfaced in the module's trust card. A CycloneDX SBOM is generated and stored as an OCI artifact alongside the image.",
              verify:"trivy image --sbom-sources oci ghcr.io/flareo/<name>:<tag>",
            },
            {
              title:"cosign Keyless Signing",
              sub:"Sigstore · OIDC · Rekor transparency log",
              color:G.success,
              body:"Images are signed keylessly using cosign with GitHub Actions OIDC tokens. No private key escrow — the signer identity is bound cryptographically via Fulcio. Every signature is timestamped and published to the Rekor immutable transparency log.",
              verify:"cosign verify --certificate-identity-regexp '.*' --certificate-oidc-issuer https://token.actions.githubusercontent.com ghcr.io/flareo/<name>@<digest>",
            },
            {
              title:"SLSA Provenance Attestation",
              sub:"L1–L3 · build inputs · builder identity",
              color:G.success,
              body:"SLSA provenance is generated for every build, documenting build inputs, builder identity, build steps, and output digest. Flareo's hermetic BuildKit sandbox enables SLSA L3 — isolated environment, no network access during build, reproducible output.",
              verify:"cosign verify-attestation --type slsaprovenance ghcr.io/flareo/<name>@<digest>",
            },
            {
              title:"CycloneDX SBOM",
              sub:"Full dependency graph · JSON export · OCI attached",
              color:G.textSecondary,
              body:"A complete Software Bill of Materials in CycloneDX JSON format is generated for every image. It lists all OS packages, language dependencies, and transitive dependencies with version and license data. SBOMs are attached as OCI artifacts and downloadable from the module detail page.",
              verify:"cosign download attestation --predicate-type cyclonedx ghcr.io/flareo/<name>@<digest>",
            },
          ].map(p => (
            <div key={p.title} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:p.color, flexShrink:0 }}/>
                <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary }}>{p.title}</div>
              </div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"16px", paddingLeft:"14px" }}>{p.sub}</div>
              <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.75, marginBottom:"16px" }}>{p.body}</p>
              <div style={{ background:G.canvas, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"10px 14px" }}>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"4px", textTransform:"uppercase", letterSpacing:".02em" }}>Verify</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, wordBreak:"break-all", lineHeight:1.6 }}>{p.verify}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust score explanation */}
        <div style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"28px 32px" }}>
          <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.02em", marginBottom:"8px" }}>How the Trust Score is calculated</div>
          <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.75, marginBottom:"24px" }}>
            Every module receives a composite Trust Score (0–100) computed from four weighted signals. The score is recalculated on every new version push.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"16px" }}>
            {[
              { label:"CVE severity",    weight:"40%", desc:"CRITICAL = 0, HIGH deductions, MEDIUM small deductions" },
              { label:"SLSA level",      weight:"25%", desc:"L3 = full score, L2 = 80%, L1 = 50%" },
              { label:"Signature valid", weight:"20%", desc:"cosign verify passes = full score" },
              { label:"SBOM quality",    weight:"15%", desc:"Complete CycloneDX SBOM present" },
            ].map(s => (
              <div key={s.label} style={{ background:G.secondary, borderRadius:"4px", border:`1px solid ${G.border}`, padding:"16px" }}>
                <div style={{ fontFamily:SANS, fontSize:"18px", fontWeight:700, color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"4px" }}>{s.weight}</div>
                <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color:G.textSecondary, marginBottom:"6px" }}>{s.label}</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Responsible disclosure */}
    <div style={{ background:G.secondary, borderTop:`1px solid ${G.border}`, padding:"48px 40px" }}>
      <div style={{ maxWidth:"640px", margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>Responsible Disclosure</div>
        <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.02em", marginBottom:"8px" }}>Found a vulnerability?</h2>
        <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.75, marginBottom:"20px" }}>
          Email security@flareo.dev with a description and reproduction steps. We follow a 90-day coordinated disclosure policy and acknowledge all valid reports.
        </p>
        <div style={{ display:"inline-flex", background:G.primary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"10px 24px" }}>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>security@flareo.dev</span>
        </div>
      </div>
    </div>
    <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn}/>
  </div>
);

// ─── PUBLIC PAGE: PRICING ─────────────────────────────────────────────────────
const PublicPricingPage = ({ onSignIn, onNavigate }) => (
  <div style={{ animation:"fadeUp .18s ease" }}>
    {/* Hero */}
    <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"52px 40px 48px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
      <div style={{ position:"absolute", top:"-60px", right:"-80px", width:"420px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>
      <div style={{ maxWidth:"600px", margin:"0 auto", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>Pricing</div>
        <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"30px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"8px" }}>Start <span style={{ background:G.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>free.</span> Scale as you grow.</h1>
        <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled }}>No credit card required. Payments launch in V1.1 — all plans are free during beta.</p>
      </div>
    </div>

    {/* Tier cards */}
    <div style={{ background:G.canvas, padding:"56px 40px" }}>
      <div style={{ maxWidth:"960px", margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"16px", marginBottom:"56px" }}>
          {[
            { name:"Free", price:"$0", period:"forever", features:[
                ["3 published modules",true],["Public marketplace listing",true],
                ["Trivy scan + SBOM",true],["SLSA L1 provenance",true],
                ["Community support",true],["Private modules",false],
                ["Priority review",false],["Analytics dashboard",false],
              ], highlight:false },
            { name:"Pro", price:"$19", period:"/ month", features:[
                ["Unlimited modules",true],["Public marketplace listing",true],
                ["Trivy scan + SBOM",true],["SLSA L2–L3 provenance",true],
                ["Priority review queue",true],["Analytics dashboard",true],
                ["Sandbox preview sessions",true],["Email support",true],
              ], highlight:true },
            { name:"Enterprise", price:"$99", period:"/ month", features:[
                ["Everything in Pro",true],["Custom registry domain",true],
                ["Private modules",true],["SLA 2h admin review",true],
                ["Audit log export",true],["Dedicated support",true],
                ["SSO / SAML",true],["Invoice billing",true],
              ], highlight:false },
          ].map(tier => (
            <div key={tier.name} style={{
              background: tier.highlight ? G.primary : G.secondary,
              border: tier.highlight ? `1px solid ${G.orange}50` : `1px solid ${G.border}`,
              borderTop: tier.highlight ? `2px solid ${G.orange}` : "1px solid rgba(255,255,255,0.055)",
              borderRadius:"4px", padding:"28px 24px",
            }}>
              <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"11px", color: tier.highlight ? G.orange : G.textDisabled, marginBottom:"12px", textTransform:"uppercase", letterSpacing:".04em" }}>{tier.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"4px", marginBottom:"24px" }}>
                <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"32px", color:G.textPrimary, letterSpacing:"-0.015em" }}>{tier.price}</span>
                <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>{tier.period}</span>
              </div>
              <div style={{ height:"1px", background:G.border, marginBottom:"20px" }}/>
              {tier.features.map(([feat, on]) => (
                <div key={feat} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                  {on
                    ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={tier.highlight ? G.orange : G.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke={G.textDisabled} strokeWidth="1.3" strokeLinecap="round"/></svg>
                  }
                  <span style={{ fontFamily:SANS, fontSize:"12px", color: on ? G.textSecondary : G.textDisabled }}>{feat}</span>
                </div>
              ))}
              <button onClick={onSignIn} style={{
                width:"100%", marginTop:"20px", padding:"9px", borderRadius:"4px",
                background: tier.highlight ? "rgba(255,120,10,0.12)" : "transparent",
                border: tier.highlight ? `1px solid ${G.orange}60` : `1px solid ${G.border}`,
                color: tier.highlight ? G.orange : G.textSecondary,
                fontFamily:SANS, fontSize:"13px", fontWeight:600, cursor:"pointer", transition:"opacity .12s",
              }}
                onMouseEnter={e => e.currentTarget.style.opacity=".75"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
              >{tier.name === "Enterprise" ? "Contact us" : "Get started free"}</button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:"680px", margin:"0 auto" }}>
          <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.02em", marginBottom:"24px" }}>Frequently asked questions</div>
          {[
            ["When do I need to pay?","Payments aren't live yet. During the beta all features are free. Billing launches in v1.1 — you'll get 30 days notice before any charges."],
            ["Can I self-host Flareo?","The platform is open source (AGPLv3). You can run your own instance. The cloud version adds managed build infrastructure, Sigstore integration, and admin review SLAs."],
            ["What counts as a 'module' on Free?","Any published image with a live listing on the marketplace. Draft, rejected, or archived modules don't count toward the limit."],
            ["Is my private registry data secure?","Private modules are stored in a dedicated ECR namespace with customer-managed access tokens. Flareo staff cannot pull private images."],
            ["Do you support team accounts?","Pro and Enterprise plans support organizations with shared modules, team permissions, and audit logs."],
          ].map(([q, a], i) => (
            <div key={q} style={{ borderTop:`1px solid ${G.border}`, padding:"20px 0" }}>
              <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"8px" }}>{q}</div>
              <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.75 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn}/>
  </div>
);

// ─── PUBLIC PAGE: DOCS ────────────────────────────────────────────────────────
const PublicDocsPage = ({ onSignIn, onNavigate }) => {
  const [section, setSection] = useState("Introduction");
  const sections = {
    "Introduction": {
      title:"Introduction",
      body:[
        { type:"p", text:"Flareo is an open container module marketplace. Modules are OCI images that have been automatically built, scanned, signed, and SLSA-attested before listing. Consumers get full supply chain provenance; publishers get a frictionless path to a trusted distribution channel." },
        { type:"h","text":"What is a module?" },
        { type:"p", text:"A module is any OCI image published through Flareo. It can be a database, a proxy, a monitoring agent, a game server — anything you'd normally deploy as a container. Every module gets a Flareo-managed trust score, SBOM, and cosign signature." },
        { type:"h","text":"Who is Flareo for?" },
        { type:"p", text:"Developers who want to distribute self-hosted software with provenance guarantees. DevOps teams who want a curated, verified catalog of containers to deploy. Security teams who need SLSA and SBOM data for compliance." },
      ]
    },
    "Quick Start": {
      title:"Quick Start",
      body:[
        { type:"p", text:"The fastest way to publish a module is with the Flareo CLI." },
        { type:"h","text":"1. Install the CLI" },
        { type:"code","text":"npm install -g @flareo/cli\nflareo --version" },
        { type:"h","text":"2. Authenticate" },
        { type:"code","text":"flareo login\n# Opens browser → GitHub OAuth → token saved to ~/.flareo/config.json" },
        { type:"h","text":"3. Publish a module" },
        { type:"code","text":"flareo publish \\\n  --source ./Dockerfile \\\n  --tag myapp:v1.0.0 \\\n  --name \"myapp\" \\\n  --description \"My first module\"" },
        { type:"p", text:"Flareo queues a build, scans the image, signs it, and submits for admin review. You'll get an email when it goes live." },
      ]
    },
    "Submit a Module": {
      title:"Submit a Module",
      body:[
        { type:"p", text:"Modules can be submitted by image reference or Dockerfile source. Image references must point to an accessible public or credentialed private registry." },
        { type:"h","text":"By Dockerfile" },
        { type:"code","text":"flareo publish --source ./Dockerfile --tag myapp:v1.0.0" },
        { type:"h","text":"By image reference" },
        { type:"code","text":"flareo publish --image ghcr.io/myorg/myapp:v1.0.0" },
        { type:"h","text":"Module metadata" },
        { type:"p", text:"A flareo.json in the repo root can provide default metadata: name, description, homepage, license, and categories. All fields can be overridden at publish time with CLI flags." },
        { type:"code","text":"{\n  \"name\": \"myapp\",\n  \"description\": \"A great module\",\n  \"categories\": [\"Utilities\"],\n  \"homepage\": \"https://github.com/myorg/myapp\"\n}" },
      ]
    },
    "Security Model": {
      title:"Security Model",
      body:[
        { type:"p", text:"Flareo applies four security controls to every published module. All are enforced automatically — publishers do not need to configure anything." },
        { type:"h","text":"1. Trivy CVE scan" },
        { type:"p", text:"Trivy scans every image layer against the NVD, GitHub Advisory Database, and Alpine/Debian/Ubuntu OS advisories. CRITICAL severity blocks listing. MEDIUM and HIGH are shown on the module card with the 'View CVEs' link." },
        { type:"h","text":"2. cosign keyless signing" },
        { type:"p", text:"Images are signed using cosign's keyless mode with GitHub Actions OIDC. Signatures are published to the Sigstore Rekor transparency log at rekor.sigstore.dev." },
        { type:"h","text":"3. SLSA provenance" },
        { type:"p", text:"SLSA L1 provenance is generated for all modules. L2 and L3 require isolated build environments — Flareo's BuildKit sandbox qualifies for L3 by default." },
        { type:"h","text":"4. CycloneDX SBOM" },
        { type:"p", text:"A full Software Bill of Materials is generated and attached as an OCI artifact. Download it from any module's detail page, or with: cosign download attestation --predicate-type cyclonedx <image>" },
      ]
    },
    "Deploy Anywhere": {
      title:"Deploy Anywhere",
      body:[
        { type:"p", text:"Flareo modules are standard OCI images — they run anywhere Docker or any OCI-compatible runtime runs. Flareo provides one-click generation of deploy configs for the most common setups." },
        { type:"h","text":"Docker Compose" },
        { type:"code","text":"flareo deploy myapp:v1.0.0 --format compose > docker-compose.yml\ndocker compose up -d" },
        { type:"h","text":"Helm chart" },
        { type:"code","text":"flareo deploy myapp:v1.0.0 --format helm > myapp-chart.tgz\nhelm install myapp ./myapp-chart.tgz" },
        { type:"h","text":"Raw pull" },
        { type:"code","text":"# Flareo verifies signature before pulling\nflareo pull myapp:v1.0.0\n\n# Or use Docker directly (no verification)\ndocker pull ghcr.io/flareo/myapp:v1.0.0" },
      ]
    },
  };
  const sectionKeys = Object.keys(sections);
  const current = sections[section];

  return (
    <div style={{ display:"flex", flex:1, height:"100%", position:"relative" }}>
      {/* Gradient bar across top */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient, zIndex:10 }}/>
      {/* Left nav */}
      <aside style={{ width:"220px", flexShrink:0, borderRight:`1px solid ${G.border}`, background:G.canvas, overflowY:"auto", padding:"32px 0" }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 20px", marginBottom:"8px" }}>Documentation</div>
        {sectionKeys.map(key => (
          <button key={key} onClick={() => setSection(key)} style={{
            display:"block", width:"100%", textAlign:"left",
            padding:"7px 20px", background:"none", border:"none",
            borderLeft:`2px solid ${section===key ? G.orange : "transparent"}`,
            fontFamily:SANS, fontSize:"12px", fontWeight: section===key ? 600 : 400,
            color: section===key ? G.textPrimary : G.textSecondary,
            cursor:"pointer", transition:"all .1s",
          }}
            onMouseEnter={e => { if (section!==key) e.currentTarget.style.color=G.textPrimary; }}
            onMouseLeave={e => { if (section!==key) e.currentTarget.style.color=G.textSecondary; }}
          >{key}</button>
        ))}
        <div style={{ height:"1px", background:G.border, margin:"20px 0" }}/>
        <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 20px", marginBottom:"8px" }}>Reference</div>
        {["CLI reference","API","Webhooks","SLSA Levels","FAQ"].map(key => (
          <button key={key} onClick={onSignIn} style={{
            display:"block", width:"100%", textAlign:"left",
            padding:"7px 20px", background:"none", border:"none",
            borderLeft:"2px solid transparent",
            fontFamily:SANS, fontSize:"12px", color:G.textDisabled,
            cursor:"pointer", transition:"color .1s",
          }}
            onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
            onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
          >{key}</button>
        ))}
      </aside>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"40px 56px 80px", maxWidth:"760px", scrollbarGutter:"stable" }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"8px" }}>docs / {section.toLowerCase().replace(/ /g,"-")}</div>
        <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"24px" }}>{current.title}</h1>
        {current.body.map((block, i) => {
          if (block.type === "p") return <p key={i} style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8, marginBottom:"16px" }}>{block.text}</p>;
          if (block.type === "h") return <h2 key={i} style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.02em", marginTop:"32px", marginBottom:"8px" }}>{block.text}</h2>;
          if (block.type === "code") return (
            <div key={i} style={{ marginBottom:"16px" }}>
              <TerminalBlock>{block.text}</TerminalBlock>
            </div>
          );
          return null;
        })}
        <div style={{ marginTop:"48px", paddingTop:"24px", borderTop:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Want full API access and CLI integration?</span>
          <button onClick={onSignIn} style={{ background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"7px 18px", cursor:"pointer", color:G.textPrimary, fontFamily:SANS, fontSize:"12px", fontWeight:600, transition:"opacity .12s" }}
            onMouseEnter={e => e.currentTarget.style.opacity=".8"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}
          >Sign in →</button>
        </div>
      </div>
    </div>
  );
};

// ─── PUBLIC PAGE: BLOG ────────────────────────────────────────────────────────
const BLOG_POSTS = [
  { slug:"slsa-l3-deep-dive", title:"Inside Flareo's SLSA Level 3 Pipeline", date:"Mar 5, 2026", tag:"Engineering", min:8, excerpt:"How we achieve hermetic builds with BuildKit DinD, and why that matters for SLSA L3 compliance — including a full provenance walkthrough.", featured:true },
  { slug:"trivy-sbom-release", title:"CycloneDX SBOMs Now Attached to Every Module", date:"Feb 28, 2026", tag:"Product", min:4, excerpt:"Starting today every published module ships with a CycloneDX SBOM attached as an OCI artifact. Here's how to download and use it." },
  { slug:"sigstore-keyless", title:"Why We Chose Keyless Signing with Sigstore", date:"Feb 12, 2026", tag:"Security", min:6, excerpt:"Private key management is a solved problem — and the solution is to not have private keys. A deep dive into Sigstore's OIDC-based signing model." },
  { slug:"trust-score-algorithm", title:"How the Flareo Trust Score is Computed", date:"Jan 31, 2026", tag:"Engineering", min:5, excerpt:"Breaking down the four signals — CVE severity, SLSA level, signature validity, and SBOM completeness — and their weights." },
  { slug:"buildkit-dind", title:"Docker-in-Docker Done Right: BuildKit DinD in 2026", date:"Jan 18, 2026", tag:"Engineering", min:10, excerpt:"Running BuildKit inside containers without --privileged is tricky. Here's the rootless setup we use in production and why it matters for security." },
  { slug:"marketplace-launch", title:"Flareo Beta is Live", date:"Jan 3, 2026", tag:"Product", min:3, excerpt:"After six months of internal testing, the Flareo marketplace is open to the public. Here's what we built and what's coming next." },
];
const TAG_COLORS = { Engineering:G.textSecondary, Product:G.textSecondary, Security:G.success };

const PublicBlogPage = ({ onSignIn, onNavigate }) => {
  const [tag, setTag] = useState("All");
  const tags = ["All","Engineering","Product","Security"];
  const shown = tag === "All" ? BLOG_POSTS : BLOG_POSTS.filter(p => p.tag === tag);
  const featured = shown.find(p => p.featured);
  const rest = shown.filter(p => !p.featured || tag !== "All");

  return (
    <div style={{ animation:"fadeUp .18s ease" }}>
      {/* Header */}
      <div style={{ background:G.primary, borderBottom:`1px solid ${G.border}`, padding:"52px 40px 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:G.gradient }}/>
        <div style={{ position:"absolute", top:"-60px", right:"-80px", width:"420px", height:"300px", background:"radial-gradient(ellipse, rgba(255,120,10,0.04) 0%, transparent 65%)", pointerEvents:"none" }}/>
        <div style={{ maxWidth:"1000px", margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>Blog</div>
          <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"30px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"24px" }}>Engineering &amp; Product</h1>
          <div style={{ display:"flex", gap:"4px" }}>
            {tags.map(t => (
              <button key={t} className={`fchip${tag===t?" on":""}`} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:G.canvas, padding:"40px 40px 64px" }}>
        <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
          {/* Featured post */}
          {featured && tag === "All" && (
            <div style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"32px", marginBottom:"24px", cursor:"pointer", transition:"border-color .12s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#404040"}
              onMouseLeave={e => e.currentTarget.style.borderColor=G.border}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:TAG_COLORS[featured.tag] || G.textDisabled }}>{featured.tag}</span>
                <span style={{ color:G.textDisabled, fontSize:"11px" }}>·</span>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{featured.date}</span>
                <span style={{ color:G.textDisabled, fontSize:"11px" }}>·</span>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{featured.min} min read</span>
              </div>
              <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.025em", marginBottom:"8px" }}>{featured.title}</h2>
              <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.75 }}>{featured.excerpt}</p>
            </div>
          )}

          {/* Post grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"12px" }}>
            {(tag === "All" ? rest : shown).map(post => (
              <div key={post.slug} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"24px", cursor:"pointer", transition:"border-color .12s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="#404040"}
                onMouseLeave={e => e.currentTarget.style.borderColor=G.border}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:TAG_COLORS[post.tag] || G.textDisabled }}>{post.tag}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>· {post.date}</span>
                </div>
                <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, letterSpacing:"-0.02em", marginBottom:"8px", lineHeight:1.4 }}>{post.title}</h3>
                <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, lineHeight:1.7, marginBottom:"16px" }}>{post.excerpt}</p>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{post.min} min read →</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PublicFooter onNavigate={onNavigate} onSignIn={onSignIn}/>
    </div>
  );
};

// ─── LANDING SHELL ────────────────────────────────────────────────────────────
// Pre-auth wrapper: topnav + routed public pages. No sidebar, no workspace tabs.
const LandingShell = ({ onRequestLogin }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [page, setPage] = React.useState(null); // null = homepage

  React.useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 12);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Scroll to top on page change
  React.useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (el) el.scrollTop = 0;
    setScrolled(false);
  }, [page]);

  const NAV = [
    { label:"Marketplace",    page:"marketplace"   },
    { label:"How it works",   page:"how-it-works"  },
    { label:"Security",       page:"security"      },
    { label:"Pricing",        page:"pricing"       },
    { label:"Docs",           page:"docs"          },
    { label:"Blog",           page:"blog"          },
  ];

  return (
    <div id="fr-root" style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:G.canvas, color:G.textPrimary, fontFamily:SANS }}>

      {/* ── TOPNAV ─────────────────────────────────────────────────────────── */}
      <div className="nx" style={{
        flexShrink:0, position:"relative", zIndex:100,
        height:"58px", display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 36px",
        borderBottom: `1px solid ${scrolled || page !== null ? G.border : "transparent"}`,
        background: scrolled || page !== null
          ? "rgba(12,12,12,0.88)"
          : "transparent",
        backdropFilter: scrolled || page !== null ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled || page !== null ? "blur(20px)" : "none",
        transition:"border-color .25s, background .25s",
      }}>

        {/* Logo */}
        <div onClick={() => setPage(null)} role="button" aria-label="Go to Flareo home" tabIndex={0} style={{ display:"flex", alignItems:"center", gap:"4px", cursor:"pointer", flexShrink:0 }}>
          <Logo size={21}/>
          <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"16px", color:G.textPrimary, letterSpacing:"-0.025em" }}>Flareo</span>
        </div>

        {/* Center nav links — plain text, no background states */}
        <div style={{ display:"flex", alignItems:"center", gap:"0", position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
          {NAV.map(({ label, page: p }) => {
            const active = page === p;
            return (
              <button key={label} onClick={() => setPage(p)} style={{
                background:"none", border:"none", cursor:"pointer",
                fontFamily:SANS, fontSize:"13px",
                fontWeight: active ? 600 : 400,
                color: active ? G.textPrimary : G.textSecondary,
                padding:"6px 14px",
                transition:"color .12s",
                letterSpacing: active ? "-0.01em" : "0",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color=G.textPrimary; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color=G.textSecondary; }}
              >{label}</button>
            );
          })}
        </div>

        {/* Right actions — Sign in only; hero has the primary CTA */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
          <button onClick={onRequestLogin} style={{
            background:"none", border:`1px solid ${G.border}`, borderRadius:"5px", cursor:"pointer",
            color:G.textSecondary, fontFamily:SANS, fontSize:"13px",
            fontWeight:500, padding:"6px 16px", transition:"all .12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color=G.textPrimary; e.currentTarget.style.borderColor="#3D3B38"; }}
            onMouseLeave={e => { e.currentTarget.style.color=G.textSecondary; e.currentTarget.style.borderColor=G.border; }}
          >Sign in</button>
        </div>
      </div>

      {/* ── PAGE BODY ────────────────────────────────────────────────────────── */}
      <div id="landing-scroll" style={{ flex:1, overflowY: page === "docs" ? "hidden" : "auto", display: page === "docs" ? "flex" : "block", flexDirection:"column" }}>
        {page === null         && <PublicMarketplace onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "marketplace"&& <PublicBrowsePage onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "how-it-works"&&<PublicHowItWorksPage onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "security"   && <PublicSecurityPage onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "pricing"    && <PublicPricingPage onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "docs"       && <PublicDocsPage onSignIn={onRequestLogin} onNavigate={setPage}/>}
        {page === "blog"       && <PublicBlogPage onSignIn={onRequestLogin} onNavigate={setPage}/>}
      </div>

    </div>
  );
};

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
// First view after login: personal stats, recent activity, my modules table.
const DEPLOY_DATA = [
  { day:"Mon", deploys:42 },{ day:"Tue", deploys:67 },{ day:"Wed", deploys:53 },
  { day:"Thu", deploys:91 },{ day:"Fri", deploys:78 },{ day:"Sat", deploys:34 },
  { day:"Sun", deploys:58 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px 12px" }}>
        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"2px" }}>{label}</div>
        <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textSecondary }}>{payload[0].value} deploys</div>
      </div>
    );
  }
  return null;
};

// ─── VIEW HEADER ─────────────────────────────────────────────────────────────
// 52px full-width header used once at the top of major view areas.
// Distinct from PanelHeader (36px, data panels) — this is the view title bar.
const ViewHeader = ({ title, subtitle, actions, border = true }) => (
  <div style={{
    padding:"0 24px", height:"56px", flexShrink:0,
    display:"flex", alignItems:"center", justifyContent:"space-between",
    borderBottom: border ? `1px solid ${G.border}` : "none",
    background: G.canvas,
  }}>
    <div>
      <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"16px", color:G.textPrimary, letterSpacing:"-0.025em", lineHeight:1.2 }}>{title}</div>
      {subtitle && <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginTop:"2px" }}>{subtitle}</div>}
    </div>
    {actions && <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>{actions}</div>}
  </div>
);

const DashboardView = ({ onNavigate }) => (
  <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", animation:"fadeUp .2s ease" }}>
    <ViewHeader title="Dashboard" subtitle="Overview of your modules, builds, and activity."/>
    <div style={{ padding:"20px 24px 40px" }}>

    {/* Stats bar — horizontal row, no tiles */}
    <div style={{
      display:"flex", alignItems:"stretch",
      background:G.primary, border:`1px solid ${G.border}`,
      borderTop:"1px solid rgba(255,255,255,0.055)",
      borderRadius:"6px", marginBottom:"16px", overflow:"hidden",
    }}>
      {[
        { label:"Modules Published", value:"3",     sub:"2 verified",        ok:true  },
        { label:"Total Deploys",     value:"16.1k", sub:"+340 this week",     ok:null  },
        { label:"Active Builds",     value:"1",     sub:"Build #847 · 52s",   ok:null  },
        { label:"Open CVEs",         value:"4",     sub:"1 HIGH · 3 MEDIUM",  ok:false },
      ].map(({ label, value, sub, ok }, i, arr) => (
        <div key={label} style={{
          flex:1, padding:"16px",
          borderRight: i < arr.length - 1 ? `1px solid ${G.border}` : "none",
        }}>
          <div style={{ fontFamily:SANS, fontSize:"10px", color:G.textDisabled, marginBottom:"8px", letterSpacing:".03em", textTransform:"uppercase" }}>{label}</div>
          <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color: ok === false ? G.error : ok === true ? G.success : G.textPrimary, letterSpacing:"-0.015em", lineHeight:1, marginBottom:"4px" }}>{value}</div>
          <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{sub}</div>
        </div>
      ))}
    </div>

    {/* Deploy frequency chart */}
    <div style={{
      background:G.primary, border:`1px solid ${G.border}`,
      borderTop:"1px solid rgba(255,255,255,0.055)",
      borderRadius:"6px", overflow:"hidden", marginBottom:"16px",
    }}>
      <div className="nx" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:"36px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
        <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>Deploy Frequency</span>
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>last 7 days</span>
      </div>
      <div style={{ padding:"16px 16px 8px", height:"140px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEPLOY_DATA} barSize={22}>
            <CartesianGrid vertical={false} stroke={G.borderWk} strokeDasharray="3 3"/>
            <XAxis dataKey="day" tick={{ fontFamily:SANS, fontSize:10, fill:G.textDisabled }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontFamily:SANS, fontSize:10, fill:G.textDisabled }} axisLine={false} tickLine={false} width={28}/>
            <Tooltip content={<CustomTooltip/>} cursor={{ fill:"rgba(255,255,255,0.03)" }}/>
            <Bar dataKey="deploys" fill={G.textSecondary} radius={[3,3,0,0]} opacity={0.85}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    {/* Two columns: activity feed + my modules */}
    <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:"16px", alignItems:"start" }}>

      {/* Recent activity */}
      <div style={{
        background:G.primary, border:`1px solid ${G.border}`,
        borderTop:"1px solid rgba(255,255,255,0.055)",
        borderRadius:"4px", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 16px", height:"36px", background:G.secondary, borderBottom:`1px solid ${G.border}`,
        }}>
          <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>Recent Activity</span>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>last 24h</span>
        </div>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{
            display:"flex", gap:"12px", padding:"11px 16px",
            borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${G.borderWk}` : "none",
            alignItems:"flex-start",
          }}>
            <div style={{
              width:"7px", height:"7px", borderRadius:"50%", background:a.color,
              flexShrink:0, marginTop:"4px",
            }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textPrimary, fontWeight:500, marginBottom:"2px" }}>{a.text}</div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.sub}</div>
            </div>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, flexShrink:0, paddingTop:"2px" }}>{a.time}</span>
          </div>
        ))}
      </div>

      {/* My modules table */}
      <div style={{
        background:G.primary, border:`1px solid ${G.border}`,
        borderTop:"1px solid rgba(255,255,255,0.055)",
        borderRadius:"4px", overflow:"hidden",
      }}>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 16px", height:"36px", background:G.secondary, borderBottom:`1px solid ${G.border}`,
        }}>
          <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>My Modules</span>
          <button onClick={() => onNavigate("marketplace")} style={{
            fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:"none", border:"none", cursor:"pointer", padding:0,
          }}>Browse marketplace</button>
        </div>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 80px 80px 100px 80px 80px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
          {["Module","Version","Deploys","Scan","Status","Updated"].map(h => (
            <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
          ))}
        </div>

        {MY_MODULES.map((m, i) => (
          <div key={i} className="trow" style={{
            display:"grid", gridTemplateColumns:"1.6fr 80px 80px 100px 80px 80px",
            padding:"8px 16px",
            borderBottom: i < MY_MODULES.length - 1 ? `1px solid ${G.borderWk}` : "none",
            alignItems:"center", transition:"background .1s",
          }}>
            <span style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary }}>{m.name}</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.ver}</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys}</span>
            <span>
              <Badge color={m.scanColor}>{m.scan}</Badge>
            </span>
            <span>
              {m.status === "verified"
                ? <Badge color={G.success}>Verified</Badge>
                : <Badge color={G.orange}>Pending</Badge>
              }
            </span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.upd}</span>
          </div>
        ))}

        {/* Quick actions row */}
        <div style={{
          padding:"12px 16px", borderTop:`1px solid ${G.border}`,
          display:"flex", gap:"8px", background:G.secondary,
        }}>
          <BtnAccent style={{ padding:"4px 12px", fontSize:"12px" }}>
            + Publish Module
          </BtnAccent>
          <BtnGhost onClick={() => onNavigate("pipeline")} style={{ padding:"4px 12px", fontSize:"12px" }}>
            View Pipeline
          </BtnGhost>
        </div>
      </div>
    </div>
    </div>
  </div>
);

// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────
// Only shown after login. Grafana-pattern: logo top, nav, user + sign-out bottom.
const Sidebar = ({ view, setView, onLogout, onHome, collapsed, onToggleCollapse, pipelineRunning, unreadLogs, savedModules, onPinOpen, toast }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navItems = [
    {
      id:"dashboard", label:"Dashboard",
      icon:<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M9 9h6M9 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    },
    {
      id:"marketplace", label:"Marketplace",
      icon:<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
    },
    {
      id:"pipeline", label:"Pipeline",
      icon:<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="13" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5.5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    },
    {
      id:"docs", label:"Docs",
      icon:<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2v3h3M6 7h4M6 10h4M6 13h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
    },
  ];

  const NavBtn = ({ id, label, icon, dot, dotColor }) => {
    const isActive = view === id
      || (view === "detail"   && id === "marketplace")
      || (view === "preview"  && id === "marketplace")
      || (view === "deploy"   && id === "marketplace")
      || (view === "earnings" && id === "my-modules")
      || (view === "analytics"&& id === "my-modules");
    if (collapsed) return (
      <button onClick={() => setView(id)} title={label} style={{
        display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
        width:"36px", height:"36px", borderRadius:"4px", margin:"0 auto 2px", flexShrink:0,
        background: isActive ? G.orangeFaded : "transparent",
        border:"none", color: isActive ? G.orange : G.textDisabled,
        cursor:"pointer", transition:"all .12s",
      }}
        onMouseEnter={e => { if(!isActive){ e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}}
        onMouseLeave={e => { if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=G.textDisabled; }}}
      >
        {icon}
        {dot && <span style={{ position:"absolute", top:"4px", right:"4px", width:"6px", height:"6px", borderRadius:"50%", background:dotColor || G.orange, animation:"pulse 2s infinite" }}/>}
      </button>
    );
    return (
      <button onClick={() => setView(id)} style={{
        display:"flex", alignItems:"center", gap:"8px", position:"relative",
        width:"100%", padding:"7px 10px", borderRadius:"4px",
        background: isActive ? G.orangeFaded : "transparent",
        borderLeft:`2px solid ${isActive ? G.orange : "transparent"}`,
        border:"none",
        color: isActive ? G.textPrimary : G.textSecondary,
        fontFamily:SANS, fontSize:"13px", fontWeight: isActive ? 600 : 400,
        cursor:"pointer", transition:"all .12s", textAlign:"left",
      }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=G.textSecondary; }}}
      >
        <span style={{ color: isActive ? G.orange : G.textDisabled, flexShrink:0, display:"flex" }}>{icon}</span>
        <span style={{ flex:1 }}>{label}</span>
        {dot && <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:dotColor || G.orange, animation:"pulse 2s infinite", flexShrink:0 }}/>}
      </button>
    );
  };

  return (
    <aside className="nx" style={{
      width: collapsed ? "52px" : "220px", flexShrink:0, background:G.primary,
      borderRight:`1px solid ${G.border}`,
      display:"flex", flexDirection:"column",
      height:"100vh", position:"sticky", top:0,
      transition:"width .18s cubic-bezier(.4,0,.2,1)",
      overflow:"hidden",
    }}>
      {/* Brand + collapse toggle */}
      <div style={{ height:"52px", display:"flex", alignItems:"center", borderBottom:`1px solid ${G.border}`, flexShrink:0, justifyContent: collapsed ? "center" : "space-between", padding: collapsed ? "0" : "0 8px 0 16px" }}>
        {!collapsed && (
          <div onClick={onHome} style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", flex:1 }}>
            <Logo size={22}/>
            <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Flareo</span>
            <Badge>beta</Badge>
          </div>
        )}
        <button onClick={onToggleCollapse} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{
          background:"none", border:"none", cursor:"pointer", padding:"6px", borderRadius:"4px",
          color:G.textDisabled, display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .1s", flexShrink:0,
        }}
          onMouseEnter={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textDisabled; }}
        >
          {collapsed
            ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          }
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: collapsed ? "12px 8px" : "12px 8px", flex:1, overflowY:"auto" }}>

        {/* ── PINNED MODULES ── */}
        {savedModules && savedModules.length > 0 && (
          <>
            {!collapsed && <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 8px", marginBottom:"6px" }}>Pinned</div>}
            {MODULES.filter(m => savedModules.includes(m.id)).slice(0, 5).map(m => (
              <button key={m.id} onClick={() => onPinOpen && onPinOpen(m)} title={m.name} style={{
                display:"flex", alignItems:"center", gap:"8px",
                width:"100%", padding:"4px 8px", borderRadius:"4px",
                background:"none", border:"none", cursor:"pointer",
                textAlign:"left", transition:"background .1s",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
                onMouseEnter={e => e.currentTarget.style.background=G.elevated}
                onMouseLeave={e => e.currentTarget.style.background="none"}
              >
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.textDisabled, flexShrink:0 }}/>
                {!collapsed && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>}
              </button>
            ))}
            <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"12px 0 12px" }}/>
          </>
        )}

        {!collapsed && <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 8px", marginBottom:"6px" }}>Platform</div>}
        {collapsed && <div style={{ height:"6px" }}/>}
        <NavBtn id="dashboard"   label="Dashboard"   icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 9h6M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <NavBtn id="marketplace" label="Marketplace" icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>}/>
        <NavBtn id="pipeline"    label="Pipeline"    dot={pipelineRunning} dotColor={G.orange}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="13" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <NavBtn id="docs"        label="Docs"        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v3h3M6 7h4M6 10h4M6 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>

        <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"16px 0 12px" }}/>
        {!collapsed && <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 8px", marginBottom:"6px" }}>Community</div>}
        <NavBtn id="community" label="Community"   icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 13c0-2.5 2-4 4.5-4S10 10.5 10 13M11 8c1.5 0 3 1 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <NavBtn id="arena"     label="Arena"       icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10l-3 2 .5-3.5L3 6l3.5-.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>}/>
        <NavBtn id="bounty"    label="Bounty Board" icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>

        <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"16px 0 12px" }}/>
        {!collapsed && <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 8px", marginBottom:"6px" }}>Developer</div>}
        <NavBtn id="my-modules" label="My Modules" icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <NavBtn id="earnings"   label="Earnings"   icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v1.5M8 9.5V11M6.5 7c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1-1.5 1-1.5.7-1.5 1.5.7 1.5 1.5 1.5 1.5-.7 1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}/>
        <NavBtn id="analytics"  label="Analytics"  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}/>
        <NavBtn id="api-keys"   label="API Keys"   icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M9 8h5M12 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <NavBtn id="settings"   label="Settings"   icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}/>
        <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"16px 0 12px" }}/>
        {!collapsed && <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", padding:"0 8px", marginBottom:"6px" }}>Admin</div>}
        <NavBtn id="admin" label="Review Queue" dot={true} dotColor={G.orange}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V5L8 2z" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}/>
      </nav>

      {/* ── USER BLOCK with avatar dropdown ── */}
      <div style={{ padding:"10px 8px", borderTop:`1px solid ${G.border}`, flexShrink:0, position:"relative" }}>
        {/* Avatar dropdown menu */}
        {userMenuOpen && !collapsed && (
          <>
            <div style={{ position:"fixed", inset:0, zIndex:198 }} onClick={() => setUserMenuOpen(false)}/>
            <div style={{
              position:"absolute", bottom:"calc(100% + 4px)", left:"8px", right:"8px", zIndex:199,
              background:G.elevated, border:`1px solid ${G.border}`,
              borderTop:"1px solid rgba(255,255,255,0.07)", borderRadius:"8px",
              boxShadow:"0 -8px 32px rgba(0,0,0,.5)", overflow:"hidden",
            }}>
              {/* Identity header */}
              <div style={{ padding:"12px 14px", borderBottom:`1px solid ${G.borderWk}` }}>
                <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color:G.textPrimary }}>jdoe</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"1px" }}>john.doe@acme.com</div>
                <div style={{ marginTop:"8px", display:"flex", gap:"6px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success, background:`${G.success}18`, border:`1px solid ${G.success}35`, borderRadius:"4px", padding:"1px 6px" }}>Free tier</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"1px 6px" }}>Admin</span>
                </div>
              </div>
              {/* Workspace switcher */}
              <div style={{ padding:"8px 14px", borderBottom:`1px solid ${G.borderWk}` }}>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"6px" }}>Workspace</div>
                {["personal","acme-org","flareo-dev"].map((ws, i) => (
                  <button key={ws} onClick={() => { setUserMenuOpen(false); toast("Switched to "+ws,"info"); }} style={{
                    display:"flex", alignItems:"center", gap:"8px",
                    width:"100%", padding:"5px 6px", borderRadius:"2px",
                    background:"none", border:"none", cursor:"pointer", textAlign:"left",
                    transition:"background .08s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background=G.secondary}
                    onMouseLeave={e => e.currentTarget.style.background="none"}
                  >
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: i===0 ? G.success : G.textDisabled, flexShrink:0 }}/>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color: i===0 ? G.textPrimary : G.textSecondary }}>{ws}</span>
                    {i === 0 && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success, marginLeft:"auto" }}>active</span>}
                  </button>
                ))}
              </div>
              {/* Menu items */}
              {[
                { label:"Profile", icon:<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M2 13c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, action:() => { setView("profile"); setUserMenuOpen(false); } },
                { label:"Settings", icon:<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>, action:() => { setView("settings"); setUserMenuOpen(false); } },
                { label:"Sign out", icon:<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, action:onLogout, danger:true },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  display:"flex", alignItems:"center", gap:"8px",
                  width:"100%", padding:"8px 14px", background:"none", border:"none",
                  cursor:"pointer", textAlign:"left", transition:"background .08s",
                  color: item.danger ? G.error : G.textSecondary, fontFamily:SANS, fontSize:"12px",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background=G.secondary; }}
                  onMouseLeave={e => { e.currentTarget.style.background="none"; }}
                >
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ flexShrink:0, borderTop:`1px solid ${G.border}`, padding: collapsed ? "8px 0" : "8px" }}>
          {collapsed ? (
            <button onClick={() => setView("profile")} title="Profile" style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"36px", height:"36px", borderRadius:"50%", background:G.elevated, border:`1px solid ${G.border}`, cursor:"pointer", margin:"0 auto" }}>
              <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textSecondary }}>JD</span>
            </button>
          ) : (
            <button onClick={() => setUserMenuOpen(o => !o)} style={{
              display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px",
              borderRadius:"4px", width:"100%",
              background: userMenuOpen ? G.elevated : "none", border: userMenuOpen ? `1px solid ${G.border}` : "1px solid transparent",
              cursor:"pointer", textAlign:"left", transition:"all .12s",
            }}
              onMouseEnter={e => { if (!userMenuOpen) { e.currentTarget.style.background=G.elevated; e.currentTarget.style.borderColor=G.border; } }}
              onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background="none"; e.currentTarget.style.borderColor="transparent"; } }}
            >
              <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:G.elevated, border:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textSecondary }}>JD</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, lineHeight:1.2 }}>jdoe</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>personal · Free tier</div>
              </div>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform .15s", color:G.textDisabled }}><path d="M2 4.5l4-3 4 3M2 7.5l4 3 4-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
const TopBar = ({ view, selectedModule, setView, onOpenCmd, onPublish, unreadLogs, onOpenConsole, activeTabTitle, notifCount, onOpenNotif, onOpenShortcuts }) => {
  const crumbs = {
    dashboard:    ["Dashboard"],
    marketplace:  ["Marketplace"],
    detail:       ["Marketplace", selectedModule && selectedModule.name],
    preview:      ["Marketplace", selectedModule && selectedModule.name, "Sandbox"],
    deploy:       ["Marketplace", selectedModule && selectedModule.name, "Deploy Wizard"],
    pipeline:     ["Pipeline"],
    docs:         ["Docs"],
    community:    ["Community"],
    arena:        ["Community", "Arena"],
    bounty:       ["Community", "Bounty Board"],
    "my-modules": ["Developer", "My Modules"],
    earnings:     ["Developer", "Earnings"],
    analytics:    ["Developer", "Analytics"],
    "api-keys":   ["Developer", "API Keys"],
    settings:     ["Settings"],
    admin:        ["Admin", "Review Queue"],
    profile:      ["Profile"],
    publish:      ["Publish Image"],
    job:          ["Pipeline", activeTabTitle],
  };
  const trail = (crumbs[view] || [view]).filter(Boolean);

  return (
    <div className="nx" style={{
      height:"48px", flexShrink:0,
      background:`${G.primary}f0`, backdropFilter:"blur(10px)",
      borderBottom:`1px solid ${G.border}`,
      display:"flex", alignItems:"center",
      padding:"0 20px", gap:"16px",
      position:"sticky", top:0, zIndex:20,
    }}>
      {/* Breadcrumbs */}
      <div style={{ display:"flex", alignItems:"center", gap:"6px", flex:1 }}>
        {trail.map((crumb, i) => (
          <span key={i} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            {i < trail.length - 1
              ? <span onClick={() => setView(i === 0 ? "dashboard" : "marketplace")} style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled, cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
                  onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
                >{crumb}</span>
              : <span style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textPrimary }}>{crumb}</span>
            }
            {i < trail.length - 1 && <span style={{ color:G.textDisabled, fontSize:"11px" }}>/</span>}
          </span>
        ))}
      </div>

      {/* Cmd+K search trigger */}
      <button onClick={onOpenCmd} style={{
        display:"flex", alignItems:"center", gap:"8px",
        background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px",
        padding:"5px 12px", cursor:"pointer", transition:"border-color .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor="#404040"}
        onMouseLeave={e => e.currentTarget.style.borderColor=G.border}
      >
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke={G.textDisabled} strokeWidth="1.3"/>
          <path d="M8.5 8.5L11.5 11.5" stroke={G.textDisabled} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Search…</span>
        <kbd style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"1px 5px", marginLeft:"8px" }}>⌘K</kbd>
      </button>

      {/* Contextual right-side actions */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
        {/* Pipeline context: build status */}
        {view === "pipeline" && (
          <div style={{ display:"flex", alignItems:"center", gap:"8px", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"4px 12px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.orange, animation:"pulse 1.5s infinite", flexShrink:0 }}/>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.orange }}>Build #847 running</span>
            <button style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:"2px", padding:"2px 8px", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, cursor:"pointer", marginLeft:"4px" }}>Cancel</button>
          </div>
        )}
        {/* Dashboard context: last refresh */}
        {view === "dashboard" && (
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Refreshed 12s ago</span>
            <button style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"4px 8px", cursor:"pointer", color:G.textDisabled, display:"flex" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textDisabled; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 113 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 4v4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        {/* Console badge button */}
        <button onClick={onOpenConsole} style={{ position:"relative", background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", cursor:"pointer", color:G.textSecondary, padding:"4px 10px", display:"flex", alignItems:"center", gap:"4px", transition:"all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6l3 2-3 2M8 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily:SANS, fontSize:"11px" }}>Console</span>
          {unreadLogs > 0 && (
            <span style={{ position:"absolute", top:"-5px", right:"-5px", minWidth:"16px", height:"16px", borderRadius:"8px", background:G.orange, color:"#000", fontFamily:SANS, fontSize:"11px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", lineHeight:1 }}>{unreadLogs}</span>
          )}
        </button>

        {/* Notification bell */}
        <button onClick={onOpenNotif} style={{ position:"relative", background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", cursor:"pointer", color:G.textSecondary, padding:"4px 8px", display:"flex", alignItems:"center", transition:"all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; }}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6c0 3.5-1.5 5-1.5 5h15S16 11.5 16 8a6 6 0 00-6-6zM8.5 17a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {notifCount > 0 && (
            <span style={{ position:"absolute", top:"-4px", right:"-4px", minWidth:"15px", height:"15px", borderRadius:"8px", background:G.error, color:"#fff", fontFamily:SANS, fontSize:"11px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", lineHeight:1 }}>{notifCount}</span>
          )}
        </button>

        {/* Keyboard shortcuts hint */}
        <button onClick={onOpenShortcuts} title="Keyboard shortcuts (?)" style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", cursor:"pointer", color:G.textDisabled, padding:"4px 8px", display:"flex", alignItems:"center", transition:"all .12s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textSecondary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textDisabled; }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M4 7h1M7 7h1M10 7h1M4 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>

        {view !== "detail" && view !== "preview" && view !== "pipeline" && (
          <BtnAccent onClick={onPublish} style={{ padding:"5px 14px", fontSize:"12px" }}>+ Publish</BtnAccent>
        )}
      </div>
    </div>
  );
};

// ─── MARKETPLACE VIEW ─────────────────────────────────────────────────────────
// Enterprise pattern: left filter panel (fixed) + right content (scrollable grid)
const MarketplaceView = ({ onSelectModule }) => {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("deploys");
  const [query, setQuery] = useState("");
  const [listView, setListView] = useState(false);

  const shown = MODULES
    .filter(m => (category === "All" || m.category === category || m.tags.includes(category))
              && (!query || m.name.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => {
      if (sort === "deploys") return parseInt(b.deploys) - parseInt(a.deploys);
      if (sort === "stars")   return parseFloat(b.stars) - parseFloat(a.stars);
      if (sort === "updated") return a.upd.localeCompare(b.upd);
      return 0;
    });

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden", flexDirection:"column" }}>
      <ViewHeader title="Marketplace" subtitle="Browse verified, signed container modules."/>
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

      {/* ── LEFT FILTER PANEL ── */}
      <aside style={{
        width:"196px", flexShrink:0,
        borderRight:`1px solid ${G.border}`,
        background:G.canvas,
        overflowY:"auto", padding:"16px 0",
      }}>
        <div style={{ padding:"0 16px", marginBottom:"4px" }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>
            Category
          </div>
          {CATEGORIES.map(cat => {
            const isActive = category === cat;
            const count = cat === "All" ? MODULES.length : MODULES.filter(m => m.category === cat || m.tags.includes(cat)).length;
            return (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                width:"100%", padding:"6px 8px", borderRadius:"4px",
                // Orange left border only for active filter
                borderLeft:`2px solid ${isActive ? G.orange : "transparent"}`,
                background: isActive ? G.orangeFaded : "transparent",
                border:"none",
                color: isActive ? G.textPrimary : G.textSecondary,
                fontFamily:SANS, fontSize:"12px", fontWeight: isActive ? 600 : 400,
                cursor:"pointer", textAlign:"left", transition:"all .12s",
                marginBottom:"2px",
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background=G.elevated; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background="transparent"; }}}
              >
                <span>{cat}</span>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"16px 0" }}/>

        <div style={{ padding:"0 16px" }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>
            Trust
          </div>
          {[
            { label:"Verified only",  val:"verified" },
            { label:"SLSA Level 3",   val:"slsa3"    },
            { label:"Zero CRITICAL",  val:"clean"    },
          ].map(({ label }) => (
            <label key={label} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 0", cursor:"pointer" }}>
              <div style={{ width:"14px", height:"14px", borderRadius:"2px", border:`1px solid ${G.border}`, background:G.elevated, flexShrink:0 }}/>
              <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ borderTop:`1px solid ${G.borderWk}`, margin:"16px 0" }}/>

        <div style={{ padding:"0 16px" }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"8px" }}>
            Sort by
          </div>
          {[["deploys","Most deployed"],["stars","Most starred"],["updated","Recently updated"]].map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)} style={{
              display:"flex", alignItems:"center", gap:"8px",
              width:"100%", padding:"5px 0",
              background:"none", border:"none", cursor:"pointer",
            }}>
              <div style={{ width:"14px", height:"14px", borderRadius:"50%", border:`1px solid ${sort===val ? G.textSecondary : G.border}`, background: sort===val ? G.textSecondary : "transparent", flexShrink:0, transition:"all .12s" }}/>
              <span style={{ fontFamily:SANS, fontSize:"12px", color: sort===val ? G.textPrimary : G.textSecondary }}>{label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── GRID CONTENT (right of filter panel) ── */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

        {/* Toolbar: count + sort + view toggle */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 20px", borderBottom:`1px solid ${G.borderWk}`,
          background:G.canvas, flexShrink:0, gap:"12px",
        }}>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>
            Showing <span style={{ color:G.textSecondary }}>{shown.length}</span> modules{category !== "All" ? ` in "${category}"` : ""}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginLeft:"auto" }}>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Sort:</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, fontWeight:600 }}>
              {sort === "deploys" ? "Most deployed" : sort === "stars" ? "Most starred" : "Recently updated"}
            </span>
          </div>
          {/* Grid / List toggle */}
          <div style={{ display:"flex", border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden", flexShrink:0 }}>
            {[
              { mode:false, icon:<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg> },
              { mode:true,  icon:<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.5" rx="1"/><rect x="1" y="6.75" width="14" height="2.5" rx="1"/><rect x="1" y="11.5" width="14" height="2.5" rx="1"/></svg> },
            ].map(({ mode, icon }) => (
              <button key={mode ? "list":"grid"} onClick={() => setListView(mode)} style={{
                padding:"5px 9px", background: listView===mode ? G.elevated : "transparent",
                border:"none", cursor:"pointer", color: listView===mode ? G.textPrimary : G.textDisabled,
                display:"flex", alignItems:"center", transition:"all .1s",
              }}>{icon}</button>
            ))}
          </div>
        </div>

        {/* Module grid or list */}
        {listView ? (
          <div style={{ flex:1, overflowY:"auto" }}>
            {/* List header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 90px 80px 90px 1fr 80px", padding:"6px 20px", borderBottom:`1px solid ${G.border}`, background:G.secondary, position:"sticky", top:0 }}>
              {["Module","Version","Trust","Scan","Tags",""].map(h => (
                <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
              ))}
            </div>
            {shown.map((m, i) => {
              const tsColor = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : m.trustScore >= 50 ? G.textSecondary : G.error;
              return (
                <div key={m.id} className="trow" style={{ display:"grid", gridTemplateColumns:"2fr 90px 80px 90px 1fr 80px", padding:"9px 20px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center", animation:`fadeUp .12s ease ${i*.02}s both`, cursor:"pointer" }}
                  onClick={() => onSelectModule(m)}>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary, marginBottom:"2px" }}>{m.name}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.author}</div>
                  </div>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>v{m.ver}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:tsColor }}>{m.trustScore}</span>
                    <div style={{ flex:1, height:"3px", background:G.elevated, borderRadius:"2px", overflow:"hidden" }}>
                      <div style={{ width:`${m.trustScore}%`, height:"100%", background:tsColor, opacity:.7 }}/>
                    </div>
                  </div>
                  <ScanResult c={m.c} h={m.h} m={m.m}/>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                    {m.tags.slice(0,2).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <button onClick={e => { e.stopPropagation(); onSelectModule(m); }} style={{ background:"transparent", color:G.textSecondary, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"3px 10px", fontFamily:SANS, fontSize:"11px", cursor:"pointer" }}>Open →</button>
                </div>
              );
            })}
          </div>
        ) : (
        <div style={{ padding:"16px 20px 40px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:"12px", flex:1, overflowY:"auto" }}>
          {shown.length === 0 ? (
            <div style={{ gridColumn:"1/-1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color:G.textDisabled, marginBottom:"16px" }}>
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textSecondary, marginBottom:"4px" }}>No modules found</div>
              <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Try adjusting your filters or search query.</div>
            </div>
          ) : shown.map((m, i) => {
            const tsColor = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : m.trustScore >= 50 ? G.textSecondary : G.error;
            return (
              <div key={m.id} className="modcard" style={{ animation:`fadeUp .2s ease ${i*.04}s both` }}
                onClick={() => onSelectModule(m)}>

                {/* Card header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                  <div style={{ minWidth:0, flex:1, marginRight:"12px" }}>
                    <div style={{ fontFamily:SANS, fontSize:"13px", fontWeight:700, color:G.textPrimary, marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {m.name}
                    </div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
                      {m.author} · v{m.ver}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
                    {/* Trust score arc ring */}
                    <div style={{ position:"relative", width:"40px", height:"40px", flexShrink:0 }}>
                      {(() => {
                        const circ = 100.5; // 2π×16
                        const arc = (m.trustScore / 100) * circ;
                        const ringCol = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? "#D4A017" : m.trustScore >= 50 ? "#C07A30" : G.error;
                        return (
                          <>
                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
                              <circle cx="20" cy="20" r="16" fill="none" stroke={G.elevated} strokeWidth="3"/>
                              <circle cx="20" cy="20" r="16" fill="none" stroke={ringCol} strokeWidth="3"
                                strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
                                style={{ filter:`drop-shadow(0 0 3px ${ringCol}50)` }}/>
                            </svg>
                            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontFamily:SANS, fontSize:"10px", fontWeight:700, color:ringCol, lineHeight:1 }}>{m.trustScore}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"flex-end" }}>
                      {m.verified && <Badge color={G.success}>✓ Verified</Badge>}
                      <Badge color={m.slsa === 3 ? G.success : undefined}>SLSA L{m.slsa}</Badge>
                    </div>
                  </div>
                </div>

                <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.65, marginBottom:"12px" }}>{m.desc}</p>

                <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"12px" }}>
                  {m.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}` }}>
                  <div style={{ display:"flex", gap:"12px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.stars} ★</span>
                    <span style={{ width:"1px", height:"10px", background:G.borderWk, alignSelf:"center" }}/>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys} deploys</span>
                    <span style={{ width:"1px", height:"10px", background:G.borderWk, alignSelf:"center" }}/>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.size}</span>
                  </div>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    <ScanResult c={m.c} h={m.h} m={m.m}/>
                    {m.previewable && (
                      <Badge color={G.textSecondary}>sandbox</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
      </div>
    </div>
  );
};

// ─── MODULE DETAIL VIEW ───────────────────────────────────────────────────────
// Full detail page: 3-tab content + metadata sidebar
const DetailView = ({ module: m, onBack, savedModules, onToggleSave, onOpenPreview, onDeploy }) => {
  const [mainTab, setMainTab] = useState("overview");
  const [envText, setEnvText] = useState(m.envExample || "# No environment variables defined.");
  const [copied, setCopied] = useState(null);
  const isSaved = savedModules && savedModules.includes(m.id);

  const copyText = (text, key) => {
    navigator.clipboard && navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const MOCK_LOGS = [
    { n:"001", level:"INFO", msg:"Starting container " + m.name + "..." },
    { n:"002", level:"INFO", msg:"Loading configuration from environment variables..." },
    { n:"003", level:"INFO", msg:"Initializing database connection pool..." },
    { n:"004", level:"OK",   msg:"Connected to database successfully." },
    { n:"005", level:"INFO", msg:"Running database migrations..." },
    { n:"006", level:"OK",   msg:"Migrations up to date." },
    { n:"007", level:"INFO", msg:"Starting HTTP server on port " + ((m.ports && m.ports[0]) || "8080") + "..." },
    { n:"008", level:"OK",   msg:"Server listening on 0.0.0.0:" + ((m.ports && m.ports[0]) || "8080") },
    { n:"009", level:"INFO", msg:"Module " + m.name + " v" + m.ver + " is ready." },
  ];

  const API_ENDPOINTS = [
    {
      method:"GET", path:"/api/health",
      desc:"Returns the health status of the module.",
      response: true,
      responseLabel:"RESPONSE",
      responseBody:'{\n  "status": "ok",\n  "uptime": 3600\n}',
    },
    {
      method:"POST", path:"/api/process",
      desc:"Process a payload using the module's core logic.",
      response: false,
      responseLabel:"REQUEST BODY",
      responseBody:'{\n  "input": "string",\n  "options": {\n    "timeout": 30\n  }\n}',
    },
  ];

  const TABS = [
    { id:"overview",      label:"OVERVIEW"      },
    { id:"configuration", label:"CONFIGURATION" },
    { id:"logs",          label:"LOGS"          },
    { id:"api",           label:"API REFERENCE" },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", background:G.canvas }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding:"24px 28px 0", background:G.canvas, borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>

        {/* Back link */}
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:"4px", background:"none", border:"none", color:G.textDisabled, fontFamily:SANS, fontSize:"11px", cursor:"pointer", marginBottom:"16px", padding:0 }}
          onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
          onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Marketplace
        </button>

        {/* Title row */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em" }}>{m.name}</span>
            <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"2px 8px" }}>{m.ver}</span>
            {/* Bookmark */}
            <button onClick={() => onToggleSave(m.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:"2px", color: isSaved ? G.success : G.textDisabled, display:"flex" }}
              onMouseEnter={e => e.currentTarget.style.color=G.success}
              onMouseLeave={e => e.currentTarget.style.color= isSaved ? G.success : G.textDisabled}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
                <path d="M3 2h10v13L8 11.5 3 15V2z" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:"8px" }}>
            <button style={{ background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"5px", padding:"8px 18px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:"2px", transition:"border-color .12s, background .12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.background=G.elevated; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.background=G.secondary; }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke={G.textPrimary} strokeWidth="1.5" strokeLinecap="round"/><path d="M2 13h12" stroke={G.textPrimary} strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary }}>Export Runbook</span>
              </div>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, paddingLeft:"20px" }}>Run locally with docker compose</span>
            </button>
            <button onClick={() => onDeploy && onDeploy(m)} style={{
              background: "#FFFFFF", border:"none", borderRadius:"5px",
              padding:"8px 20px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:"2px",
              transition:"background .12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background="#E8E8E8"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#FFFFFF"; }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><polygon points="4,2 14,8 4,14" fill="#0C0C0C"/></svg>
                <span style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:"#0C0C0C" }}>Deploy Module</span>
              </div>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:"rgba(0,0,0,0.45)", paddingLeft:"18px" }}>Generate compose · Helm · raw pull</span>
            </button>
          </div>
        </div>

        {/* Subtitle: digest + updated */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"16px" }}>
          <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>{m.digest ? m.digest.slice(0,22)+"..." : "sha256:a1b2c3d4e5f6..."}</span>
          <span style={{ color:G.borderWk, fontSize:"13px" }}>•</span>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Updated {m.upd} ago</span>
        </div>

        {/* Tab bar — UPPERCASE with green underline */}
        <div style={{ display:"flex", gap:"0", borderBottom:"none" }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setMainTab(id)} style={{
              background:"none", border:"none", cursor:"pointer",
              fontFamily:SANS, fontSize:"12px", fontWeight: mainTab===id ? 600 : 400,
              color: mainTab===id ? G.textPrimary : G.textDisabled,
              padding:"0 0 12px 0", marginRight:"28px",
              letterSpacing:".04em",
              borderBottom: mainTab===id ? `2px solid ${G.success}` : "2px solid transparent",
              transition:"color .12s, border-color .12s",
            }}
              onMouseEnter={e => { if(mainTab!==id) e.currentTarget.style.color=G.textSecondary; }}
              onMouseLeave={e => { if(mainTab!==id) e.currentTarget.style.color=G.textDisabled; }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, padding:"28px 28px 60px" }}>

        {/* ── OVERVIEW ── */}
        {mainTab === "overview" && (
          <div style={{ animation:"fadeUp .18s ease", display:"flex", gap:"20px", alignItems:"flex-start" }}>
            {/* Main column */}
            <div style={{ flex:1, minWidth:0 }}>
              <Panel style={{ marginBottom:"12px" }}>
                <PanelHeader label="About"/>
                <div style={{ padding:"16px" }}>
                  <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8, marginBottom:"16px" }}>{m.desc}</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
                    {[
                      { dot:G.textSecondary, title:"Try Before Deploy",   body:"Sandbox preview any module before committing." },
                      { dot:G.success,  title:"SLSA Level " + m.slsa, body:"Hermetic build with full provenance attestation." },
                      { dot:G.textSecondary,     title:"Your Infrastructure", body:"Runs on your servers. Zero lock-in." },
                    ].map(({ dot, title, body }) => (
                      <div key={title} style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"16px" }}>
                        <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:dot, marginBottom:"8px", opacity:.85 }}/>
                        <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color:G.textPrimary, marginBottom:"4px" }}>{title}</div>
                        <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, lineHeight:1.6 }}>{body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
              <Panel>
                <PanelHeader label="Quick Deploy" sub="one-liner"/>
                <div style={{ padding:"16px" }}>
                  <div style={{ background:"#080808", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px 16px", fontFamily:SANS, fontSize:"11px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>
                      <span style={{ color:G.textDisabled }}>curl -sL </span>
                      <span style={{ color:G.success }}>https://flareo.dev/d/{m.name}</span>
                      <span style={{ color:G.textDisabled }}> | docker compose -f - up -d</span>
                    </span>
                    <span onClick={() => copyText("curl -sL https://flareo.dev/d/"+m.name+" | docker compose -f - up -d","quick")} style={{ fontFamily:SANS, fontSize:"11px", color: copied==="quick" ? G.success : G.textDisabled, cursor:"pointer", padding:"3px 8px", borderRadius:"2px", border:`1px solid ${G.border}`, flexShrink:0, marginLeft:"12px" }}>{copied==="quick" ? "copied!" : "copy"}</span>
                  </div>
                </div>
              </Panel>
            </div>
            {/* Sidebar */}
            <div style={{ width:"216px", flexShrink:0, display:"flex", flexDirection:"column", gap:"12px" }}>
              <TrustScorePanel m={m}/>
              <ProvenancePanel m={m}/>
              <Panel>
                <PanelHeader label="Stats"/>
                <div style={{ padding:"8px 16px" }}>
                  {[
                    { label:"Deploys",  value:m.deploys },
                    { label:"Stars",    value:m.stars   },
                    { label:"Size",     value:m.size, mono:true },
                    { label:"Updated",  value:m.upd+" ago" },
                    { label:"License",  value:m.license },
                    { label:"Packages", value:m.sbom && m.sbom.packages, mono:true },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.label}</span>
                      <span style={{ fontFamily: r.mono ? MONO : SANS, fontSize:"11px", color:G.textSecondary }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ── CONFIGURATION ── */}
        {mainTab === "configuration" && (
          <div style={{ animation:"fadeUp .18s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
              <div>
                <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, marginBottom:"4px" }}>Environment Variables</h2>
                <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled }}>Configure the module's runtime environment.</p>
              </div>
              <button style={{ display:"flex", alignItems:"center", gap:"8px", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px 16px", cursor:"pointer", fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, transition:"border-color .12s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="#404040"}
                onMouseLeave={e => e.currentTarget.style.borderColor=G.border}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                Save Configuration
              </button>
            </div>

            {/* .env editor */}
            <div style={{ border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
              {/* File tab header */}
              <div style={{ background:G.secondary, borderBottom:`1px solid ${G.border}`, padding:"8px 14px", display:"flex", alignItems:"center", gap:"8px" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke={G.textDisabled} strokeWidth="1.2"/><path d="M4 6l2 2-2 2M8 10h4" stroke={G.textDisabled} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>.env</span>
              </div>
              {/* Editable textarea */}
              <div style={{ background:"#080808", padding:"16px 20px" }}>
                <textarea
                  value={envText}
                  onChange={e => setEnvText(e.target.value)}
                  spellCheck={false}
                  style={{
                    width:"100%", minHeight:"420px", background:"transparent", border:"none", outline:"none", resize:"vertical",
                    fontFamily:MONO, fontSize:"13px", color:"#7EC8A0", lineHeight:1.7,
                    caretColor:G.textPrimary,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {mainTab === "logs" && (
          <div style={{ animation:"fadeUp .18s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary }}>System Logs</h2>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:G.success, animation:"pulse 2s infinite", display:"inline-block" }}/>
                <span style={{ fontFamily:SANS, fontSize:"12px", color:G.success, fontWeight:500 }}>Live</span>
              </div>
            </div>

            <div style={{ background:"#0A0A0A", border:`1px solid ${G.border}`, borderTop:`1px solid rgba(255,255,255,0.06)`, borderRadius:"5px", overflow:"hidden" }}>
              {/* log header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", height:"34px", background:"#0F0F0F", borderBottom:`1px solid ${G.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke={G.textDisabled} strokeWidth="1.2"/><path d="M4 6l2 2-2 2M8 10h4" stroke={G.textDisabled} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>stdout</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.success, display:"inline-block", animation:"pulse 2s infinite" }}/>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>live</span>
                </div>
              </div>
              {MOCK_LOGS.map((line, i) => (
                <div key={i} style={{ display:"flex", gap:"0", padding:"2px 0", fontFamily:MONO, fontSize:"11px", lineHeight:1.8 }}>
                  <span style={{ color:"#2D2B29", padding:"0 14px 0 16px", minWidth:"60px", textAlign:"right", flexShrink:0, userSelect:"none", borderRight:`1px solid #1A1A1A` }}>{line.n}</span>
                  <span style={{ padding:"0 16px", color: line.level==="OK" ? "#6bcf8f" : G.textDisabled }}>
                    <span style={{ color: line.level==="OK" ? "#6bcf8f44" : "#2D2B29", marginRight:"12px" }}>[{line.level}]</span>
                    <span style={{ color: line.level==="OK" ? "#6bcf8f" : G.textSecondary }}>{line.msg}</span>
                  </span>
                </div>
              ))}
              <div style={{ padding:"6px 16px", borderTop:`1px solid #1A1A1A`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:MONO, fontSize:"10px", color:G.border }}>{MOCK_LOGS.length} lines · utf-8</span>
                <span style={{ fontFamily:MONO, fontSize:"10px", color:G.border }}>ANSI</span>
              </div>
            </div>
          </div>
        )}

        {/* ── API REFERENCE ── */}
        {mainTab === "api" && (
          <div style={{ animation:"fadeUp .18s ease" }}>
            <div style={{ marginBottom:"24px" }}>
              <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, marginBottom:"4px" }}>API Reference</h2>
              <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled }}>Endpoints exposed by this module.</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {API_ENDPOINTS.map((ep, ei) => (
                <div key={ei} style={{ border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
                  {/* Endpoint header */}
                  <div style={{ background:G.secondary, padding:"16px", display:"flex", alignItems:"center", gap:"12px" }}>
                    <span style={{
                      fontFamily:SANS, fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"2px",
                      background: ep.method==="GET" ? `${G.success}22` : `${G.textSecondary}22`,
                      color: ep.method==="GET" ? G.success : G.textSecondary,
                      border:`1px solid ${ep.method==="GET" ? G.success+"55" : G.textSecondary+"55"}`,
                    }}>{ep.method}</span>
                    <span style={{ fontFamily:MONO, fontSize:"13px", color:G.textPrimary }}>{ep.path}</span>
                  </div>

                  {/* Body */}
                  <div style={{ padding:"18px 18px 20px" }}>
                    <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, marginBottom:"16px", lineHeight:1.7 }}>{ep.desc}</p>

                    <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"10px" }}>
                      {ep.responseLabel}
                    </div>

                    {/* Code block */}
                    <div style={{ border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
                      <div style={{ background:G.elevated, padding:"7px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${G.border}` }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>JSON</span>
                        <button onClick={() => copyText(ep.responseBody, "api"+ei)} style={{ background:"none", border:"none", cursor:"pointer", color: copied==="api"+ei ? G.success : G.textDisabled, display:"flex", alignItems:"center", gap:"4px", padding:0 }}
                          onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
                          onMouseLeave={e => e.currentTarget.style.color= copied==="api"+ei ? G.success : G.textDisabled}
                        >
                          {copied==="api"+ei
                            ? <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke={G.success} strokeWidth="1.3" strokeLinecap="round"/></svg>
                            : <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M11 5V3H3v8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          }
                        </button>
                      </div>
                      <pre style={{ background:"#080808", margin:0, padding:"16px 18px", fontFamily:MONO, fontSize:"12px", color:"#7EC8A0", lineHeight:1.7, overflowX:"auto" }}>{ep.responseBody}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


// ─── PIPELINE VIEW ────────────────────────────────────────────────────────────
const PipelineView = ({ pct, log, logRef }) => {
  const done = Math.min(100, Math.round(pct));
  const [activePanel, setActivePanel] = useState("scan");

  // Derive per-stage status from pct
  const getStageStatus = (idx) => {
    const thresholds = [0, 5, 48, 60, 75, 88, 95]; // % at which each stage starts
    if (done >= (thresholds[idx+1] || 100)) return "done";
    if (done >= thresholds[idx]) return "active";
    return "wait";
  };

  const stages = [
    { id:1, label:"Source Upload",    sub:"Cloudflare R2",         time:"0.2s",  icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { id:2, label:"BuildKit Build",   sub:"Docker BuildKit + DinD", time:"42.1s", icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { id:3, label:"ECR Push",         sub:"AWS us-east-1",          time:"8.3s",  icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { id:4, label:"Trivy Scan",       sub:"Vuln + SBOM",            time:done >= 75 ? "12.4s" : "...", icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V5L8 2z" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { id:5, label:"Policy Gate",      sub:"admission-policy.json",  time:done >= 88 ? "0.1s" : "",   icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { id:6, label:"cosign Sign",      sub:"Sigstore keyless",       time:done >= 95 ? "2.1s" : "",   icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id:7, label:"SLSA Attestation", sub:"in-toto L1 provenance",  time:done >= 98 ? "1.3s" : "",   icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { id:8, label:"Admin Review",     sub:"Awaiting approval",      time:"",                         icon:<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  ];

  const trustScore = Math.round(
    (done >= 60  ? 20 : 0) + // scan clean
    (done >= 75  ? 15 : 0) + // SBOM
    (done >= 88  ? 15 : 0) + // policy gate
    (done >= 95  ? 20 : 0) + // cosign
    (done >= 98  ? 15 : 0) + // provenance
    15                         // base (image exists)
  );

  const panelTabs = [
    { id:"scan",        label:"Scan"        },
    { id:"sbom",        label:"SBOM"        },
    { id:"provenance",  label:"Provenance"  },
    { id:"signature",   label:"Signature"   },
    { id:"policy",      label:"Policy Gate" },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px" }}>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
        <div>
          <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"3px" }}>Build Pipeline</h2>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>nginx-proxy-manager · run #847 · triggered by publish</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {/* Live trust score */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"6px 12px" }}>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>Trust</span>
            <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color: trustScore >= 80 ? G.success : trustScore >= 50 ? G.textSecondary : G.error, letterSpacing:"-0.015em" }}>{trustScore}</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>/100</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.orange, animation:"pulse 1.5s infinite", display:"block" }}/>
            <span style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textSecondary }}>Running</span>
          </div>
          <BtnGhost style={{ padding:"5px 12px", fontSize:"12px" }}>Cancel</BtnGhost>
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Overall progress</span>
          <span style={{ fontFamily:SANS, fontSize:"11px", color: done === 100 ? G.success : G.orange }}>{done}%</span>
        </div>
        <div style={{ background:G.elevated, borderRadius:"2px", height:"3px", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:"2px", background: done === 100 ? G.success : G.orange, width:`${done}%`, transition:"width .12s linear" }}/>
        </div>
      </div>

      {/* Two-column */}
      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:"16px", alignItems:"start" }}>

        {/* LEFT: Vertical stepper */}
        <Panel>
          <PanelHeader label="Stages" sub={`${stages.filter(s => getStageStatus(s.id-1)==="done").length} / ${stages.length} complete`}/>
          <div style={{ padding:"16px 14px" }}>
            {stages.map((st, i) => {
              const status = getStageStatus(i);
              const isLast = i === stages.length - 1;
              return (
                <div key={st.id} style={{ display:"flex", gap:"12px" }}>
                  {/* Connector column */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:"22px" }}>
                    {/* Circle */}
                    {status === "done" && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:`${G.success}18`, border:`1.5px solid ${G.success}60`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={G.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {status === "active" && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:`${G.orange}10`, border:`1.5px solid ${G.orange}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:G.orange, animation:"pulse 1.5s infinite", display:"block" }}/>
                      </div>
                    )}
                    {status === "wait" && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:G.elevated, border:`1.5px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{st.id}</span>
                      </div>
                    )}
                    {/* Connector line */}
                    {!isLast && (
                      <div style={{
                        width:"1.5px", flex:1, minHeight:"20px",
                        background: status === "done" ? `${G.success}40` : `${G.border}`,
                        margin:"2px 0",
                      }}/>
                    )}
                  </div>

                  {/* Stage info */}
                  <div style={{ paddingBottom: isLast ? "0" : "16px", flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1px" }}>
                      <span style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color: status === "wait" ? G.textDisabled : G.textPrimary }}>{st.label}</span>
                      {st.time && status !== "wait" && (
                        <span style={{ fontFamily:SANS, fontSize:"11px", color: status === "active" ? G.orange : G.textDisabled }}>{st.time}</span>
                      )}
                    </div>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color: status === "active" ? `${G.orange}90` : G.textDisabled }}>{st.sub}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* RIGHT: artifact panels + terminal + CVE table */}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

          {/* Artifact panel tabs */}
          <Panel>
            <div style={{ display:"flex", borderBottom:`1px solid ${G.border}` }}>
              {panelTabs.map(pt => (
                <button key={pt.id} className={`dtab ${activePanel===pt.id?"on":""}`} onClick={() => setActivePanel(pt.id)} style={{ fontSize:"12px", padding:"8px 14px" }}>{pt.label}</button>
              ))}
            </div>

            {/* Scan tab */}
            {activePanel === "scan" && (
              <div style={{ padding:"16px", animation:"fadeUp .12s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Trivy vulnerability scan</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    {done < 75 && <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:G.orange, animation:"pulse 1.5s infinite", display:"block" }}/>}
                    <span style={{ fontFamily:SANS, fontSize:"11px", color: done >= 75 ? G.success : G.orange }}>{done >= 75 ? "Complete" : `${done}%`}</span>
                  </div>
                </div>
                <div style={{ background:G.elevated, borderRadius:"2px", height:"3px", marginBottom:"16px", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:"2px", background: done >= 75 ? G.success : G.orange, width:`${Math.min(100, (done/75)*100)}%`, transition:"width .1s linear" }}/>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
                  {[
                    { label:"CRITICAL", val:"0",  color:G.error   },
                    { label:"HIGH",     val:"1",  color:G.error },
                    { label:"MEDIUM",   val:"3",  color:G.textSecondary    },
                    { label:"LOW",      val:"12", color:G.textDisabled },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background:G.secondary, border:`1px solid ${G.borderWk}`, borderRadius:"4px", padding:"10px 8px", textAlign:"center" }}>
                      <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color, lineHeight:1, letterSpacing:"-0.015em" }}>{done >= 60 ? val : "—"}</div>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"3px", textTransform:"uppercase", letterSpacing:".03em" }}>{label}</div>
                    </div>
                  ))}
                </div>
                {done >= 75 && (
                  <div style={{ marginTop:"10px", background:`${G.success}07`, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.success}`, borderRadius:"0 4px 4px 0", padding:"8px 12px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>No CRITICAL vulnerabilities. Policy gate: PASS. Eligible for Verified badge.</span>
                  </div>
                )}
              </div>
            )}

            {/* SBOM tab */}
            {activePanel === "sbom" && (
              <div style={{ padding:"16px", animation:"fadeUp .12s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Software Bill of Materials · CycloneDX v1.4</span>
                  {done >= 75
                    ? <Badge color={G.success}>Generated</Badge>
                    : <Badge color={G.textDisabled}>Pending</Badge>
                  }
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                  {[
                    { label:"Format",     val:"CycloneDX 1.4" },
                    { label:"Serialized", val:"JSON"          },
                    { label:"Packages",   val:done >= 75 ? "214" : "—" },
                    { label:"Size",       val:done >= 75 ? "48 KB" : "—" },
                  ].map(r => (
                    <div key={r.label} style={{ background:G.secondary, border:`1px solid ${G.borderWk}`, borderRadius:"4px", padding:"10px 12px" }}>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"3px", textTransform:"uppercase", letterSpacing:".03em" }}>{r.label}</div>
                      <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textPrimary }}>{r.val}</div>
                    </div>
                  ))}
                </div>
                {done >= 75 && (
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em", marginBottom:"6px" }}>Top Components</div>
                    {[
                      { name:"openssl",  ver:"3.0.11", license:"Apache-2.0" },
                      { name:"libexpat", ver:"2.5.0",  license:"MIT"        },
                      { name:"zlib",     ver:"1.2.13", license:"Zlib"       },
                      { name:"curl",     ver:"8.4.0",  license:"MIT"        },
                    ].map(pkg => (
                      <div key={pkg.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{pkg.name}</span>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>{pkg.ver}</span>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{pkg.license}</span>
                      </div>
                    ))}
                    <BtnGhost style={{ width:"100%", padding:"4px", fontSize:"11px", textAlign:"center", marginTop:"10px" }}>Download sbom.cyclonedx.json</BtnGhost>
                  </div>
                )}
                {done < 75 && <div style={{ textAlign:"center", padding:"20px 0", fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Waiting for Trivy scan to complete...</div>}
              </div>
            )}

            {/* Provenance tab */}
            {activePanel === "provenance" && (
              <div style={{ padding:"16px", animation:"fadeUp .12s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>SLSA L1 · in-toto attestation</span>
                  {done >= 98
                    ? <Badge color={G.success}>Attested</Badge>
                    : <Badge color={G.textDisabled}>Pending</Badge>
                  }
                </div>
                {done >= 98 ? (
                  <div>
                    {[
                      { label:"Build Type",     val:"flareo.dev/buildkit/v1"         },
                      { label:"Builder ID",      val:"flareo.dev/builders/buildkit"   },
                      { label:"Source URI",      val:"r2://flareo/src/nginx-pm.zip"   },
                      { label:"Source Digest",   val:"sha256:b4e8f2c1…"              },
                      { label:"Build Started",   val:"2025-03-09T10:32:00Z"          },
                      { label:"Build Finished",  val:"2025-03-09T10:32:42Z"          },
                      { label:"Image Digest",    val:"sha256:a3f9d2c1…"              },
                    ].map(r => (
                      <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"6px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, flexShrink:0, width:"110px" }}>{r.label}</span>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary, textAlign:"right", wordBreak:"break-all" }}>{r.val}</span>
                      </div>
                    ))}
                    <BtnGhost style={{ width:"100%", padding:"4px", fontSize:"11px", textAlign:"center", marginTop:"10px" }}>Download provenance.intoto.json</BtnGhost>
                  </div>
                ) : (
                  <div style={{ textAlign:"center", padding:"20px 0", fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Waiting for cosign signing to complete...</div>
                )}
              </div>
            )}

            {/* Signature tab */}
            {activePanel === "signature" && (
              <div style={{ padding:"16px", animation:"fadeUp .12s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>cosign · Sigstore keyless</span>
                  {done >= 95
                    ? <Badge color={G.success}>Signed</Badge>
                    : <Badge color={G.textDisabled}>Pending</Badge>
                  }
                </div>
                {done >= 95 ? (
                  <div>
                    {[
                      { label:"Signer Identity",   val:"pipeline@flareo.dev"                      },
                      { label:"OIDC Issuer",        val:"https://accounts.google.com"              },
                      { label:"Rekor Log Index",    val:"#142857932"                               },
                      { label:"Rekor Entry Hash",   val:"sha256:7f3a9b2e…"                        },
                      { label:"Transparency Log",   val:"https://rekor.sigstore.dev"              },
                      { label:"Certificate Chain",  val:"Fulcio intermediate CA"                  },
                    ].map(r => (
                      <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"6px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, flexShrink:0, width:"130px" }}>{r.label}</span>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary, textAlign:"right", wordBreak:"break-all" }}>{r.val}</span>
                      </div>
                    ))}
                    <div style={{ marginTop:"10px", background:`${G.textSecondary}08`, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.textSecondary}`, borderRadius:"0 4px 4px 0", padding:"8px 12px" }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>Signature recorded in Rekor transparency log. Verifiable with <span style={{ fontFamily:MONO, color:G.textSecondary }}>cosign verify</span>.</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign:"center", padding:"20px 0", fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Waiting for Trivy scan to complete...</div>
                )}
              </div>
            )}

            {/* Policy Gate tab */}
            {activePanel === "policy" && (
              <div style={{ padding:"16px", animation:"fadeUp .12s ease" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>admission-policy.json</span>
                  {done >= 88
                    ? <Badge color={G.success}>PASS</Badge>
                    : <Badge color={G.textDisabled}>Pending</Badge>
                  }
                </div>
                <div style={{ background:"#080808", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px 16px", fontFamily:MONO, fontSize:"11px", color:G.textSecondary, lineHeight:1.8, marginBottom:"12px" }}>
                  <div><span style={{ color:G.textDisabled }}>{"{"}</span></div>
                  <div><span style={{ color:G.textSecondary }}>  "maxCritical"</span><span style={{ color:G.textDisabled }}>: </span><span style={{ color:G.orange }}>0</span><span style={{ color:G.textDisabled }}>,</span></div>
                  <div><span style={{ color:G.textSecondary }}>  "maxHigh"</span><span style={{ color:G.textDisabled }}>: </span><span style={{ color:G.orange }}>5</span><span style={{ color:G.textDisabled }}>,</span></div>
                  <div><span style={{ color:G.textSecondary }}>  "requireSBOM"</span><span style={{ color:G.textDisabled }}>: </span><span style={{ color:G.success }}>true</span><span style={{ color:G.textDisabled }}>,</span></div>
                  <div><span style={{ color:G.textSecondary }}>  "requireSignature"</span><span style={{ color:G.textDisabled }}>: </span><span style={{ color:G.success }}>true</span><span style={{ color:G.textDisabled }}>,</span></div>
                  <div><span style={{ color:G.textSecondary }}>  "requireProvenance"</span><span style={{ color:G.textDisabled }}>: </span><span style={{ color:G.success }}>true</span></div>
                  <div><span style={{ color:G.textDisabled }}>{"}"}</span></div>
                </div>
                {done >= 88 && (
                  <div>
                    {[
                      { rule:"maxCritical: 0",      actual:"0 CRITICAL",     pass:true  },
                      { rule:"maxHigh: 5",           actual:"1 HIGH",         pass:true  },
                      { rule:"requireSBOM",          actual:"CycloneDX 1.4",  pass:true  },
                      { rule:"requireSignature",     actual:"cosign verified", pass:true  },
                      { rule:"requireProvenance",    actual:"SLSA L1",        pass:true  },
                    ].map(r => (
                      <div key={r.rule} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.rule}</span>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{r.actual}</span>
                        <span style={{ fontFamily:SANS, fontSize:"11px", color: r.pass ? G.success : G.error }}>{r.pass ? "PASS" : "FAIL"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {done < 88 && (
                  <div style={{ textAlign:"center", padding:"20px 0", fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Evaluation pending scan completion...</div>
                )}
              </div>
            )}
          </Panel>

          {/* Terminal output */}
          <div style={{ background:"#0A0A0A", border:`1px solid ${G.border}`, borderTop:`1px solid rgba(255,255,255,0.06)`, borderRadius:"5px", overflow:"hidden" }}>
            <div className="nx" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", background:"#0F0F0F", borderBottom:`1px solid ${G.border}`, height:"34px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke={G.textDisabled} strokeWidth="1.2"/><path d="M4 6l2 2-2 2M8 10h4" stroke={G.textDisabled} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>output</span>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:"#2D2B29" }}>nginx-proxy-manager · run #847</span>
              </div>
              <button onClick={() => { const text = log.map(l=>l.t).join("\n"); if(navigator.clipboard) navigator.clipboard.writeText(text); }} style={{ display:"flex", alignItems:"center", gap:"5px", background:"none", border:"none", cursor:"pointer", color:G.textDisabled, fontFamily:SANS, fontSize:"11px", padding:"3px 6px", borderRadius:"3px" }}
                onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
                onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                copy
              </button>
            </div>
            <div ref={logRef} style={{ maxHeight:"160px", overflowY:"auto", display:"flex", flexDirection:"column" }}>
              {log.map((l, i) => {
                const parts = l.t.match(/^(\[[\d:.]+\]|\$.*)?\s*(.*)/s) || [null,"",l.t];
                const ts = l.t.startsWith("$") ? "  cmd" : (parts[1] || "");
                const msg = l.t.startsWith("$") ? l.t : (parts[2] || l.t);
                return (
                  <div key={i} style={{ display:"flex", lineHeight:1.7 }}>
                    <span style={{ fontFamily:MONO, fontSize:"11px", color:"#252525", padding:"1px 12px 1px 14px", minWidth:"72px", textAlign:"right", flexShrink:0, borderRight:`1px solid #1A1A1A`, lineHeight:1.7, userSelect:"none" }}>{ts}</span>
                    <span style={{ fontFamily:MONO, fontSize:"11px", color:l.c, padding:"1px 14px 1px 12px", lineHeight:1.7 }}>{msg}</span>
                  </div>
                );
              })}
              <div style={{ display:"flex" }}>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:"#1E1E1E", padding:"1px 12px 1px 14px", minWidth:"72px", textAlign:"right", flexShrink:0, borderRight:`1px solid #1A1A1A`, lineHeight:1.7, userSelect:"none" }}>now</span>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:"#1E1E1E", padding:"1px 14px 1px 12px", lineHeight:1.7 }}>▍</span>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 14px", background:"#0E0C0B", borderTop:`1px solid #1F1D1B` }}>
              <span style={{ fontFamily:MONO, fontSize:"10px", color:G.border }}>{log.length} lines</span>
              <div style={{ display:"flex", gap:"16px" }}>
                <span style={{ fontFamily:MONO, fontSize:"10px", color:G.border }}>utf-8</span>
                <span style={{ fontFamily:MONO, fontSize:"10px", color:G.border }}>ANSI</span>
              </div>
            </div>
          </div>

          {/* CVE findings */}
          <Panel>
            <PanelHeader label="Findings" action={<><Badge color={G.error}>1 HIGH</Badge><Badge color={G.textSecondary}>3 MEDIUM</Badge></>}/>
            <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 90px 80px 70px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
              {["CVE ID","Package","Severity","Fixed In","Score"].map(h => (
                <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
              ))}
            </div>
            {[
              { id:"CVE-2024-1234", pkg:"openssl 3.0.11", sev:"HIGH",   col:G.error, fix:"3.0.13", score:"7.5" },
              { id:"CVE-2024-5678", pkg:"libexpat 2.5.0", sev:"MEDIUM", col:G.textSecondary,    fix:"2.6.0",  score:"5.3" },
              { id:"CVE-2023-9012", pkg:"zlib 1.2.13",    sev:"MEDIUM", col:G.textSecondary,    fix:"1.3.0",  score:"4.8" },
              { id:"CVE-2023-3456", pkg:"curl 8.4.0",     sev:"MEDIUM", col:G.textSecondary,    fix:"8.5.0",  score:"5.9" },
            ].map((r,i,a) => (
              <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 90px 80px 70px", padding:"8px 16px", borderBottom:i<a.length-1?`1px solid ${G.borderWk}`:"none", alignItems:"center" }}>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:r.col }}>{r.id}</span>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{r.pkg}</span>
                <span><Badge color={r.col}>{r.sev}</Badge></span>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:G.success }}>{r.fix}</span>
                <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>{r.score}</span>
              </div>
            ))}
          </Panel>

        </div>
      </div>
    </div>
  );
};


// ─── DOCS VIEW ────────────────────────────────────────────────────────────────
const DocsView = () => (
  <div style={{ flex:1, display:"grid", gridTemplateColumns:"200px 1fr 160px", overflow:"hidden" }}>
    {/* Doc sidebar */}
    <aside style={{ borderRight:`1px solid ${G.border}`, overflowY:"auto", padding:"16px 8px", background:G.canvas }}>
      {[
        { sec:"Getting Started", items:["Introduction","Quick Start","Submit a Module","Deploy Anywhere","Security Model"] },
        { sec:"Pipeline",        items:["BuildKit","Trivy Scanning","cosign Signing","SLSA Attestation","Admin Review"] },
        { sec:"API Reference",   items:["Authentication","Modules API","Pipeline API","Webhooks"] },
      ].map(({ sec, items }) => (
        <div key={sec} style={{ marginBottom:"20px" }}>
          <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"6px", padding:"0 10px" }}>{sec}</div>
          {items.map((item, i) => (
            <div key={item} className={`dnav ${sec==="Getting Started"&&i===0?"on":""}`}>{item}</div>
          ))}
        </div>
      ))}
    </aside>

    {/* Doc content */}
    <main style={{ overflowY:"auto", padding:"28px 32px" }}>
      <div style={{ display:"flex", borderBottom:`1px solid ${G.border}`, marginBottom:"24px" }}>
        {["README.md","pipeline.md","security.md"].map((f,i) => (
          <div key={f} style={{
            padding:"7px 14px", fontFamily:SANS, fontSize:"11px", cursor:"pointer",
            color: i===0 ? G.textPrimary : G.textDisabled,
            borderBottom: i===0 ? `2px solid ${G.orange}` : "2px solid transparent",
            marginBottom:"-1px",
          }}>{f}</div>
        ))}
      </div>
      <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"12px" }}>
        Introduction to Flareo
      </h1>
      <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8, marginBottom:"20px" }}>
        Flareo is a containerized module marketplace with a built-in security pipeline. Every module passes a full chain of trust — build, scan, sign, and SLSA attestation — before appearing in the marketplace.
      </p>
      <div style={{ background:G.orangeFaded, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.orange}`, borderRadius:"0 4px 4px 0", padding:"11px 14px", marginBottom:"20px" }}>
        <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"11px", color:G.textSecondary, marginBottom:"4px", textTransform:"uppercase", letterSpacing:".03em" }}>Note</div>
        <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.7 }}>
          SLSA Level 3 provides the strongest supply-chain guarantees. To reach L3, host source on a supported VCS with hermetic, reproducible builds.
        </div>
      </div>
      <div style={{ background:"#0C0B0A", border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden", marginBottom:"24px" }}>
        <div style={{ padding:"0 14px", background:G.elevated, borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", height:"34px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>Shell</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>deploy.sh</span>
          </div>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, cursor:"pointer", padding:"3px 8px", borderRadius:"2px", border:`1px solid ${G.border}` }}>copy</span>
        </div>
        <div style={{ padding:"16px", fontFamily:MONO, fontSize:"12px", lineHeight:2 }}>
          <div style={{ color:G.textDisabled }}># one-command deploy</div>
          <div>
            <span style={{ color:G.textSecondary }}>curl</span>
            <span style={{ color:G.textSecondary }}> -sL </span>
            <span style={{ color:G.success }}>https://flareo.dev/d/uptime-kuma</span>
            <span style={{ color:G.textDisabled }}> | </span>
            <span style={{ color:G.textSecondary }}>docker compose</span>
            <span style={{ color:G.textSecondary }}> -f - up -d</span>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
        {[
          { stroke:G.textSecondary, d:"M1 7h12M8 2v3h3M10 2v3H7", title:"Try Before Deploy", body:"Sandbox preview before committing." },
          { stroke:G.success, d:"M7 1.5L2 3.5v3.5c0 2.8 2 5.3 5 6 3-.7 5-3.2 5-6V3.5L7 1.5Z", title:"SLSA Verified",      body:"Full provenance on every image." },
          { stroke:G.textSecondary,    d:"M1.5 4.5h11v8H1.5z M4.5 4.5V3a2.5 2.5 0 015 0v1.5",         title:"Your Infrastructure", body:"Modules run on your servers." },
        ].map(({ stroke, d, title, body }) => (
          <div key={title} style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"16px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginBottom:"10px" }}><path d={d} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color:G.textPrimary, marginBottom:"4px" }}>{title}</div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, lineHeight:1.6 }}>{body}</div>
          </div>
        ))}
      </div>
    </main>

    {/* On this page */}
    <aside style={{ borderLeft:`1px solid ${G.border}`, padding:"16px", overflowY:"auto" }}>
      <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"10px" }}>On this page</div>
      {["Introduction","Pipeline Stages","Quick Start","Security Model","SLSA Levels","FAQ"].map((item, i) => (
        <div key={item} style={{
          fontFamily:SANS, fontSize:"11px", padding:"4px 0 4px 10px", marginBottom:"2px",
          borderLeft:`2px solid ${i===0 ? G.orange : "transparent"}`,
          color: i===0 ? G.textPrimary : G.textDisabled, cursor:"pointer",
        }}>{item}</div>
      ))}
    </aside>
  </div>
);

// ─── 1. TOAST SYSTEM ─────────────────────────────────────────────────────────
// Non-blocking feedback — fixed bottom-right, slide-in, auto-dismiss 3.5s
const ToastStack = ({ toasts, onDismiss }) => (
  <div style={{
    position:"fixed", bottom:"24px", right:"24px",
    zIndex:9999, display:"flex", flexDirection:"column", gap:"8px",
    pointerEvents:"none",
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display:"flex", alignItems:"center", gap:"12px",
        background:G.elevated, border:`1px solid ${G.border}`,
        borderLeft:`3px solid ${t.type === "success" ? G.success : t.type === "error" ? G.error : t.type === "warn" ? G.orange : G.textSecondary}`,
        borderRadius:"4px", padding:"8px 16px",
        boxShadow:"0 8px 32px rgba(0,0,0,.6)",
        fontFamily:SANS, fontSize:"12px", color:G.textPrimary,
        minWidth:"280px", maxWidth:"360px",
        animation:"toastIn .2s ease",
        pointerEvents:"all",
      }}>
        {/* icon */}
        {t.type === "success" && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={G.success+"25"} stroke={G.success} strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke={G.success} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        {t.type === "error"   && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={G.error+"25"} stroke={G.error} strokeWidth="1.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={G.error} strokeWidth="1.4" strokeLinecap="round"/></svg>}
        {t.type === "warn"    && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L14.5 13H1.5L8 2z" fill={G.orange+"20"} stroke={G.textSecondary} strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke={G.textSecondary} strokeWidth="1.4" strokeLinecap="round"/></svg>}
        {(t.type === "info" || !t.type) && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={G.textSecondary+"25"} stroke={G.textSecondary} strokeWidth="1.2"/><path d="M8 7v5M8 5v.5" stroke={G.textSecondary} strokeWidth="1.4" strokeLinecap="round"/></svg>}
        <span style={{ flex:1, lineHeight:1.5 }}>{t.msg}</span>
        <button onClick={() => onDismiss(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"0 2px", flexShrink:0, transition:"color .1s" }}
          onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
          onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
    ))}
  </div>
);

// ─── 2. STATUS BAR ────────────────────────────────────────────────────────────
// 28px strip at very top of shell — green=healthy, orange=building, red=incident
const StatusBar = ({ pipelineRunning, criticalInQueue }) => {
  const status = criticalInQueue ? "critical" : pipelineRunning ? "building" : "healthy";
  const cfg = {
    healthy:  { color:G.success,  dot:G.success,  msg:"All systems operational",                        bg:"rgba(108,207,142,0.06)" },
    building: { color:G.orange,   dot:G.orange,   msg:"Build #847 in progress — vaultwarden:v1.30.5",   bg:"rgba(255,120,10,0.06)"  },
    critical: { color:G.error,    dot:G.error,    msg:"1 CRITICAL CVE pending admin review — minio-distributed", bg:"rgba(242,73,92,0.07)" },
  };
  const c = cfg[status];
  return (
    <div style={{
      height:"28px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
      background:c.bg, borderBottom:`1px solid ${c.color}28`,
      flexShrink:0, position:"relative", zIndex:200,
    }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:c.dot, animation: status === "healthy" ? "none" : "pulse 1.5s infinite", flexShrink:0 }}/>
      <span style={{ fontFamily:MONO, fontSize:"11px", color:c.color }}>{c.msg}</span>
      {status !== "healthy" && (
        <span style={{ fontFamily:MONO, fontSize:"11px", color:c.color, opacity:.6, marginLeft:"8px" }}>
          {status === "building" ? "· 62% complete" : "· Action required"}
        </span>
      )}
    </div>
  );
};

// ─── 3. NOTIFICATION DRAWER ──────────────────────────────────────────────────
const NOTIF_DATA = [
  { id:1, type:"success", title:"Module approved", body:"vaultwarden v1.30.5 is now live on the marketplace.", time:"2m ago",  read:false },
  { id:2, type:"error",   title:"Scan failed",     body:"minio-distributed: 2 CRITICAL CVEs found. Build blocked.", time:"14m ago", read:false },
  { id:3, type:"info",    title:"Build complete",  body:"redis-stack-server v7.2.0 passed all pipeline stages.", time:"1h ago",  read:true  },
  { id:4, type:"warn",    title:"Review pending",  body:"plausible-analytics has been waiting for review 6 hours.", time:"6h ago",  read:true  },
  { id:5, type:"success", title:"Deploy recorded", body:"uptime-kuma v1.23.11 deployed by louisiam to eu-west-1.", time:"1d ago",  read:true  },
];

const NotificationDrawer = ({ open, onClose, onMarkAllRead }) => {
  const [notifs, setNotifs] = useState(NOTIF_DATA);
  const unread = notifs.filter(n => !n.read).length;
  const iconFor = (type) => {
    if (type === "success") return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke={G.success} strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke={G.success} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (type === "error")   return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke={G.error} strokeWidth="1.2"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={G.error} strokeWidth="1.4" strokeLinecap="round"/></svg>;
    if (type === "warn")    return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2z" stroke={G.textSecondary} strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 6v3M8 11v.5" stroke={G.textSecondary} strokeWidth="1.3" strokeLinecap="round"/></svg>;
    return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke={G.textSecondary} strokeWidth="1.2"/><path d="M8 7v5M8 5v.5" stroke={G.textSecondary} strokeWidth="1.3" strokeLinecap="round"/></svg>;
  };
  const colorFor = (type) => ({ success:G.success, error:G.error, warn:G.orange, info:G.textSecondary }[type] || G.textSecondary);
  return (
    <>
      {open && <div style={{ position:"fixed", inset:0, zIndex:299 }} onClick={onClose}/>}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, width:"340px", zIndex:300,
        background:G.primary, borderLeft:`1px solid ${G.border}`,
        display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition:"transform .22s cubic-bezier(.4,0,.2,1)",
        boxShadow: open ? "-8px 0 40px rgba(0,0,0,.6)" : "none",
      }}>
        {/* Header */}
        <div className="nx" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", height:"52px", borderBottom:`1px solid ${G.border}`, background:G.secondary, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary }}>Notifications</span>
            {unread > 0 && <span style={{ background:G.orange, color:"#fff", fontFamily:SANS, fontSize:"11px", fontWeight:700, borderRadius:"8px", padding:"1px 6px" }}>{unread}</span>}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            {unread > 0 && (
              <button onClick={() => setNotifs(n => n.map(x => ({ ...x, read:true })))} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, transition:"color .1s" }}
                onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
                onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
              >Mark all read</button>
            )}
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, display:"flex", padding:"4px" }}
              onMouseEnter={e => e.currentTarget.style.color=G.textSecondary}
              onMouseLeave={e => e.currentTarget.style.color=G.textDisabled}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        {/* Feed */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {notifs.map((n, i) => (
            <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read:true } : x))} style={{
              display:"flex", gap:"12px", padding:"16px",
              borderBottom:`1px solid ${G.borderWk}`,
              background: n.read ? "transparent" : `${colorFor(n.type)}06`,
              cursor:"pointer", transition:"background .1s",
              borderLeft:`3px solid ${n.read ? "transparent" : colorFor(n.type)}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background=G.elevated}
              onMouseLeave={e => e.currentTarget.style.background=n.read ? "transparent" : `${colorFor(n.type)}06`}
            >
              <div style={{ marginTop:"2px", flexShrink:0 }}>{iconFor(n.type)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"4px" }}>
                  <span style={{ fontFamily:SANS, fontWeight:600, fontSize:"12px", color: n.read ? G.textSecondary : G.textPrimary }}>{n.title}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginLeft:"8px", whiteSpace:"nowrap", flexShrink:0 }}>{n.time}</span>
                </div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, lineHeight:1.6 }}>{n.body}</div>
              </div>
              {!n.read && <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:colorFor(n.type), flexShrink:0, marginTop:"4px" }}/>}
            </div>
          ))}
        </div>
        <div style={{ padding:"16px", borderTop:`1px solid ${G.border}`, flexShrink:0 }}>
          <button style={{ width:"100%", background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"8px", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, cursor:"pointer", transition:"all .1s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textSecondary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textDisabled; }}
          >View all notifications</button>
        </div>
      </div>
    </>
  );
};

// ─── 4. KEYBOARD SHORTCUT OVERLAY ────────────────────────────────────────────
const ShortcutOverlay = ({ open, onClose }) => {
  if (!open) return null;
  const SHORTCUTS = [
    { section:"Navigation", items:[
      { keys:["G","H"], desc:"Go to Dashboard" },
      { keys:["G","M"], desc:"Go to Marketplace" },
      { keys:["G","P"], desc:"Go to Pipeline" },
      { keys:["G","D"], desc:"Go to Docs" },
      { keys:["G","A"], desc:"Go to Admin queue" },
    ]},
    { section:"Modules", items:[
      { keys:["⌘","K"],    desc:"Open command palette" },
      { keys:["⌘","P"],    desc:"Publish a module" },
      { keys:["⌘","B"],    desc:"Open module browser" },
      { keys:["S"],        desc:"Save / pin current module" },
    ]},
    { section:"Workspace", items:[
      { keys:["⌘","W"],    desc:"Close current tab" },
      { keys:["⌘","⇧","["],desc:"Previous tab" },
      { keys:["⌘","⇧","]"],desc:"Next tab" },
      { keys:["`"],        desc:"Toggle console drawer" },
    ]},
    { section:"General", items:[
      { keys:["?"],        desc:"Show this shortcut guide" },
      { keys:["Esc"],      desc:"Close overlay / modal" },
    ]},
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }} onClick={onClose}>
      <div style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"24px", width:"540px", maxHeight:"80vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,.8)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
          <div>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, marginBottom:"2px" }}>Keyboard shortcuts</div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Press <kbd style={{ fontFamily:MONO, fontSize:"11px", background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"1px 5px", color:G.textSecondary }}>?</kbd> to toggle this overlay</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"4px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
          {SHORTCUTS.map(section => (
            <div key={section.section}>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"10px" }}>{section.section}</div>
              {section.items.map(item => (
                <div key={item.desc} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                  <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>{item.desc}</span>
                  <div style={{ display:"flex", gap:"3px" }}>
                    {item.keys.map((k, i) => (
                      <kbd key={i} style={{ fontFamily:MONO, fontSize:"11px", background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"2px 6px", color:G.textPrimary, boxShadow:"0 1px 0 rgba(255,255,255,0.04)" }}>{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── 5. DASHBOARD VARIABLE BAR ────────────────────────────────────────────────
// Grafana's signature pattern — environment/time/cluster selectors below topbar
const VarBar = ({ show }) => {
  const [env,     setEnv]     = useState("Production");
  const [range,   setRange]   = useState("Last 7 days");
  const [cluster, setCluster] = useState("eu-west-1");
  const [openPop, setOpenPop] = useState(null);
  if (!show) return null;

  const Picker = ({ id, label, value, setValue, opts }) => (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpenPop(openPop === id ? null : id)} style={{
        display:"flex", alignItems:"center", gap:"8px",
        background:"none", border:`1px solid ${G.border}`, borderRadius:"4px",
        padding:"4px 10px", cursor:"pointer", transition:"all .1s",
        color:G.textSecondary, fontFamily:SANS, fontSize:"12px",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
        onMouseLeave={e => { if (openPop !== id) { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; } }}
      >
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{label}</span>
        <span style={{ color:G.textSecondary, fontWeight:600, fontSize:"12px" }}>{value}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </button>
      {openPop === id && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:500,
          background:G.elevated, border:`1px solid ${G.border}`,
          borderTop:"1px solid rgba(255,255,255,0.06)", borderRadius:"4px",
          boxShadow:"0 8px 28px rgba(0,0,0,.6)", minWidth:"160px", overflow:"hidden",
        }}>
          {opts.map(opt => (
            <button key={opt} onClick={() => { setValue(opt); setOpenPop(null); }} style={{
              display:"block", width:"100%", textAlign:"left", padding:"8px 14px",
              background: value === opt ? G.secondary : "none", border:"none", cursor:"pointer",
              fontFamily:SANS, fontSize:"12px",
              color: value === opt ? G.textSecondary : G.textSecondary,
              transition:"background .08s",
            }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background=G.secondary; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background="none"; }}
            >
              {value === opt && <span style={{ marginRight:"6px", color:G.textSecondary }}>✓</span>}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="nx" style={{
      height:"36px", display:"flex", alignItems:"center", gap:"6px",
      padding:"0 20px", borderBottom:`1px solid ${G.border}`,
      background:G.canvas, flexShrink:0,
    }}
      onClick={() => setOpenPop(null)}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color:G.textDisabled, flexShrink:0 }}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 8h6M8 5l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginRight:"4px" }}>Variables:</span>
      <Picker id="env"     label="env ="     value={env}     setValue={setEnv}     opts={["Production","Staging","Development","Preview"]}/>
      <Picker id="range"   label="range ="   value={range}   setValue={setRange}   opts={["Last 1h","Last 6h","Last 24h","Last 7 days","Last 30 days","Custom"]}/>
      <Picker id="cluster" label="cluster =" value={cluster} setValue={setCluster} opts={["eu-west-1","us-east-1","ap-southeast-1","us-west-2"]}/>
      <div style={{ marginLeft:"auto", display:"flex", gap:"6px" }}>
        <button style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"3px 10px", cursor:"pointer", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, transition:"all .1s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textSecondary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textDisabled; }}
        >Refresh</button>
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, alignSelf:"center" }}>Last refreshed 12s ago</span>
      </div>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
// ─── MY MODULES (mock data for dashboard) ────────────────────────────────────
const MY_MODULES = [
  { name:"nginx-proxy-manager", ver:"2.11.3", deploys:"12k", scan:"1H·3M", scanColor:G.error, status:"verified", upd:"2d ago" },
  { name:"redis-sentinel",      ver:"7.2.4",  deploys:"3.1k", scan:"Clean", scanColor:G.success, status:"verified", upd:"4d ago" },
  { name:"traefik-tls",         ver:"3.0.1",  deploys:"890",  scan:"Scanning…", scanColor:"#FF780A", status:"pending",  upd:"just now" },
];

const ACTIVITY = [
  { icon:"build", text:"Build #847 completed",              sub:"nginx-proxy-manager · 52.6s",          time:"2m ago",  color:G.success },
  { icon:"scan",  text:"Trivy scan — 1 HIGH found",         sub:"nginx-proxy-manager · CVE-2024-1234",  time:"3m ago",  color:G.error },
  { icon:"sign",  text:"cosign signature attached",         sub:"nginx-proxy-manager · sha256:a3f9d2c1", time:"3m ago",  color:G.success },
  { icon:"build", text:"Build #846 failed — Dockerfile err",sub:"redis-sentinel · exit code 1",          time:"1h ago",  color:G.error },
  { icon:"scan",  text:"Trivy scan — Clean",                sub:"redis-sentinel · 183 packages",         time:"6h ago",  color:G.success },
  { icon:"pub",   text:"traefik-tls v3.0.1 submitted",      sub:"Source upload · awaiting build",        time:"just now",color:G.textSecondary },
];

// ─── TRUST SCORE PANEL ───────────────────────────────────────────────────────
const TrustScorePanel = ({ m }) => {
  const s = m.trustScore;
  const col = s >= 90 ? G.success : s >= 70 ? "#D4A017" : s >= 50 ? "#C07A30" : G.error;
  const bd = m.trustBreakdown;
  // SVG ring: circumference of r=28 circle = 2*π*28 ≈ 175.9
  const circ = 175.9;
  const arc = (s / 100) * circ;
  return (
    <Panel>
      <PanelHeader label="Trust Score"/>
      <div style={{ padding:"16px" }}>
        {/* Arc ring */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
          <div style={{ position:"relative", flexShrink:0, width:"72px", height:"72px" }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform:"rotate(-90deg)" }}>
              {/* Track */}
              <circle cx="36" cy="36" r="28" fill="none" stroke={G.elevated} strokeWidth="5"/>
              {/* Fill — animated */}
              <circle cx="36" cy="36" r="28" fill="none" stroke={col} strokeWidth="5"
                strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
                style={{ transition:"stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)", filter:`drop-shadow(0 0 4px ${col}60)` }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
              <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:col, letterSpacing:"-0.015em", lineHeight:1 }}>{s}</span>
              <span style={{ fontFamily:SANS, fontSize:"9px", color:G.textDisabled, marginTop:"1px" }}>/100</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"2px" }}>
              {s >= 90 ? "Excellent" : s >= 70 ? "Good" : s >= 50 ? "Fair" : "Poor"}
            </div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, lineHeight:1.6 }}>
              {s >= 90 ? "Meets enterprise security bar" : s >= 70 ? "Review before production" : "Remediation recommended"}
            </div>
          </div>
        </div>
        {bd && Object.entries(bd).map(([k, v]) => {
          const vc = v.score >= 90 ? G.success : v.score >= 70 ? "#D4A017" : v.score >= 50 ? "#C07A30" : G.error;
          return (
            <div key={k} style={{ marginBottom:"9px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
                  {k === "vulns" ? "Vulnerabilities" : k === "sbom" ? "SBOM" : k === "provenance" ? "Provenance" : "Recency"}
                </span>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <span style={{ fontFamily:SANS, fontSize:"10px", color:G.textDisabled }}>{v.label}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:vc }}>{v.score}</span>
                </div>
              </div>
              <div style={{ height:"3px", borderRadius:"2px", background:G.elevated, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${v.score}%`, background:vc, borderRadius:"2px", transition:"width 0.6s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ─── PROVENANCE PANEL ─────────────────────────────────────────────────────────
const ProvenancePanel = ({ m }) => (
  <Panel>
    <PanelHeader label="Provenance" sub={`SLSA L${m.slsa}`}/>
    <div style={{ padding:"8px 16px" }}>
      {m.provenance.map((step, i) => {
        const done = step.status === "done";
        const wait = step.status === "wait";
        return (
          <div key={step.step} style={{ display:"flex", gap:"8px", position:"relative", paddingBottom: i < m.provenance.length - 1 ? "6px" : 0 }}>
            {i < m.provenance.length - 1 && (
              <div style={{ position:"absolute", left:"6px", top:"16px", bottom:0, width:"1px", background: done ? `${G.success}40` : G.borderWk }}/>
            )}
            <div style={{
              width:"13px", height:"13px", borderRadius:"50%", flexShrink:0, marginTop:"2px", zIndex:1,
              background: done ? `${G.success}20` : G.elevated,
              border: `1px solid ${done ? G.success + "60" : G.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {done && <span style={{ fontSize:"11px", color:G.success }}>✓</span>}
              {wait && <span style={{ fontSize:"11px", color:G.textDisabled }}>·</span>}
            </div>
            <div style={{ flex:1, paddingBottom:"8px" }}>
              <div style={{ fontFamily:SANS, fontSize:"11px", color: done ? G.textPrimary : G.textDisabled, fontWeight: done ? 600 : 400, lineHeight:1.3 }}>
                {step.step}
              </div>
              {step.hash && (
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"2px" }}>
                  {step.hash.substring(0,18)}…
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>SBOM · {m.sbom.format}</span>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.sbom.packages} pkgs · {m.sbom.size}</span>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, cursor:"pointer" }}>↓</span>
        </div>
      </div>
    </div>
  </Panel>
);

// ─── PREVIEW VIEW ─────────────────────────────────────────────────────────────
const PreviewView = ({ module: m, onOpenConsole, addLog }) => {
  const [status, setStatus] = useState("starting");
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    addLog({ t:`[PREVIEW] Initializing sandbox for ${m.name}…`, c:G.textDisabled });
    const t1 = setTimeout(() => addLog({ t:`[PREVIEW] Pulling ${m.digest.substring(0,22)}…`, c:G.textSecondary }), 900);
    const t2 = setTimeout(() => {
      setStatus("ready");
      addLog({ t:`[PREVIEW] Container ready · port ${m.ports[0]}`, c:G.success });
      onOpenConsole();
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const iv = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { setStatus("expired"); clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [status]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const statusColor = { starting:G.orange, ready:G.success, expired:G.textDisabled, failed:G.error }[status];
  const port = m.ports && m.ports[0] ? m.ports[0].split(":")[0] : "8080";

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", animation:"fadeUp .2s ease" }}>

      {/* HUD bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"44px", flexShrink:0, background:G.primary, borderBottom:`1px solid ${G.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:statusColor, display:"block", animation: status === "starting" ? "pulse 1s infinite" : "none" }}/>
            <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:statusColor, textTransform:"uppercase", letterSpacing:".04em" }}>{status}</span>
          </div>
          <div style={{ width:"1px", height:"14px", background:G.borderWk }}/>
          <div style={{ display:"flex", gap:"16px" }}>
            {[
              { label:"TTL", value: status === "ready" ? fmt(timeLeft) : "--:--", warn: timeLeft < 300 },
              { label:"CPU", value:"0.5 vCPU" },
              { label:"MEM", value:"512 MB" },
              { label:"PORT", value: port },
            ].map(({ label, value, warn }) => (
              <span key={label} style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
                {label}: <span style={{ color: warn ? G.orange : G.textSecondary }}>{value}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <BtnGhost onClick={onOpenConsole} style={{ padding:"4px 12px", fontSize:"11px" }}>Console</BtnGhost>
          <BtnGhost style={{ padding:"4px 12px", fontSize:"11px" }}>Export Runbook</BtnGhost>
          {status === "ready" && (
            <BtnPrimary style={{ padding:"4px 12px", fontSize:"11px" }}>Open in Browser →</BtnPrimary>
          )}
        </div>
      </div>

      {/* Frame area */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:G.canvas }}>
        {status === "starting" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:`2px solid ${G.border}`, borderTop:`2px solid ${G.orange}`, animation:"spin .8s linear infinite", margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, marginBottom:"6px" }}>Launching sandbox…</div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.name}:{m.ver}</div>
          </div>
        )}
        {status === "ready" && (
          <div style={{ textAlign:"center", animation:"fadeUp .2s ease" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"8px", background:G.secondary, border:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke={G.textSecondary} strokeWidth="1.5"/>
                <path d="M8 21h8M12 17v4" stroke={G.textSecondary} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textPrimary, marginBottom:"8px" }}>Sandbox Ready</div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"20px" }}>
              localhost:{port} — expires in {fmt(timeLeft)}
            </div>
            <BtnPrimary style={{ padding:"8px 24px", fontSize:"13px" }}>Open UI →</BtnPrimary>
          </div>
        )}
        {status === "expired" && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:SANS, fontSize:"13px", color:G.textDisabled, marginBottom:"12px" }}>Session expired</div>
            <BtnGhost style={{ fontSize:"12px" }} onClick={() => { setStatus("starting"); setTimeLeft(30*60); }}>Start new session</BtnGhost>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
// Cmd+K global search — modules + navigation
const CommandPalette = ({ open, onClose, openTab }) => {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    const handler = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const filteredMods = MODULES.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) || m.category.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 5);

  const navItems = [
    { label:"Go to Dashboard",   type:"dashboard",   title:"Dashboard"   },
    { label:"Go to Marketplace", type:"marketplace", title:"Marketplace" },
    { label:"Go to Pipeline",    type:"pipeline",    title:"Pipeline"    },
    { label:"Go to Docs",        type:"docs",        title:"Docs"        },
  ].filter(n => n.label.toLowerCase().includes(q.toLowerCase()));

  const SectionLabel = ({ text }) => (
    <div style={{ padding:"8px 14px 4px", fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em" }}>{text}</div>
  );

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"18vh", background:"rgba(13,14,19,0.8)", backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"540px", background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)", animation:"fadeUp .12s ease" }}>

        {/* Input */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 14px", borderBottom:`1px solid ${G.border}` }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, color:G.textDisabled }}>
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search modules or navigate…"
            style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:SANS, fontSize:"13px", color:G.textPrimary }}
          />
          <kbd style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"2px 5px", flexShrink:0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:"340px", overflowY:"auto" }}>
          {filteredMods.length > 0 && (
            <div>
              <SectionLabel text="Modules"/>
              {filteredMods.map(m => (
                <button key={m.id} className="cmd-row" onClick={() => { openTab({ id:`detail-${m.id}`, type:"detail", title:m.name, data:m }); onClose(); }}
                  style={{ display:"flex", alignItems:"center", gap:"12px", width:"100%", padding:"8px 14px", background:"none", border:"none", textAlign:"left" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, color:G.textDisabled }}>
                    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary }}>{m.name}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.category} · v{m.ver}</div>
                  </div>
                  {m.verified && <Badge color={G.success}>Verified</Badge>}
                  <span style={{ fontFamily:SANS, fontSize:"11px", color: m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : G.textDisabled }}>{m.trustScore}</span>
                </button>
              ))}
            </div>
          )}
          {navItems.length > 0 && (
            <div>
              <SectionLabel text="Navigation"/>
              {navItems.map(n => (
                <button key={n.type} className="cmd-row" onClick={() => { openTab({ id:n.type, type:n.type, title:n.title }); onClose(); }}
                  style={{ display:"flex", alignItems:"center", gap:"12px", width:"100%", padding:"8px 14px", background:"none", border:"none", textAlign:"left" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, color:G.textDisabled }}>
                    <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontFamily:SANS, fontSize:"13px", color:G.textPrimary }}>{n.label}</span>
                </button>
              ))}
            </div>
          )}
          {filteredMods.length === 0 && navItems.length === 0 && q && (
            <div style={{ padding:"32px 14px", textAlign:"center" }}>
              <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>No results for "{q}"</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", gap:"16px", padding:"7px 14px", borderTop:`1px solid ${G.border}`, background:G.secondary }}>
          {[["↑↓","navigate"],["↵","select"],["ESC","close"]].map(([k,v]) => (
            <span key={k} style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
              <kbd style={{ fontFamily:MONO, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"1px 4px", marginRight:"4px" }}>{k}</kbd>{v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── CONSOLE DRAWER ───────────────────────────────────────────────────────────
// Slide-up bottom panel for pipeline / preview logs
const ConsoleDrawer = ({ open, logs, onClose, onClear, sidebarWidth = 220 }) => {
  const [expanded, setExpanded] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 99999;
  }, [logs]);

  if (!open) return null;

  return (
    <div style={{ position:"fixed", bottom:0, left:`${sidebarWidth}px`, right:0, height: expanded ? "50vh" : "190px", background:G.primary, border:`1px solid ${G.border}`, borderBottom:"none", zIndex:30, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div className="nx" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px", height:"30px", background:G.secondary, borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color:G.textSecondary }}>
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6l3 2-3 2M8 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, textTransform:"uppercase", letterSpacing:".04em" }}>Console</span>
          <Badge>{logs.length} lines</Badge>
        </div>
        <div style={{ display:"flex", gap:"2px", alignItems:"center" }}>
          {onClear && <button onClick={onClear} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"4px 6px", borderRadius:"2px", fontFamily:SANS, fontSize:"11px", letterSpacing:".02em" }}
            onMouseEnter={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textDisabled; }}
          >clear</button>}
          <button onClick={() => setExpanded(e => !e)} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"4px 6px", borderRadius:"2px", lineHeight:1 }}
            onMouseEnter={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textDisabled; }}
          >
            {expanded
              ? <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 11l4-4 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              : <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 5l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            }
          </button>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:G.textDisabled, padding:"4px 6px", borderRadius:"2px", lineHeight:1 }}
            onMouseEnter={e => { e.currentTarget.style.background=G.elevated; e.currentTarget.style.color=G.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=G.textDisabled; }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>
      {/* Log lines */}
      <div ref={logRef} style={{ flex:1, overflowY:"auto", padding:"6px 14px", fontFamily:MONO, fontSize:"11px", lineHeight:1.8 }}>
        {logs.map((l, i) => (
          <div key={i} className="clog" style={{ display:"flex", gap:"16px", padding:"0 2px" }}>
            <span style={{ color:G.textDisabled, flexShrink:0, userSelect:"none", minWidth:"22px", textAlign:"right" }}>{i+1}</span>
            <span style={{ color: l.c || G.textSecondary }}>{l.t}</span>
          </div>
        ))}
        <div style={{ display:"inline-block", width:"7px", height:"12px", background:G.textDisabled, animation:"pulse 1.2s infinite", verticalAlign:"middle", marginLeft:"4px" }}/>
      </div>
    </div>
  );
};


// ─── MY MODULES VIEW ─────────────────────────────────────────────────────────
const MY_MODULES_FULL = [
  {
    id:"mm1", name:"nginx-proxy-manager", ver:"2.11.3", status:"verified",
    deploys:"12k", pulls:"284k", stars:"4.8k", size:"148MB",
    scan:{ c:0,h:1,m:3 }, slsa:2, published:"Jan 14, 2024",
    lastBuild:"Build #847 · 2h ago", trustScore:84, license:"MIT",
    category:"proxy",
  },
  {
    id:"mm2", name:"redis-sentinel", ver:"7.2.4", status:"verified",
    deploys:"3.1k", pulls:"41k", stars:"1.2k", size:"92MB",
    scan:{ c:0,h:0,m:0 }, slsa:2, published:"Mar 2, 2024",
    lastBuild:"Build #23 · 4d ago", trustScore:96, license:"BSD-3",
    category:"database",
  },
  {
    id:"mm3", name:"traefik-tls", ver:"3.0.1", status:"pending",
    deploys:"890", pulls:"12k", stars:"341", size:"74MB",
    scan:{ c:0,h:0,m:1 }, slsa:1, published:"—",
    lastBuild:"Build #1 · scanning…", trustScore:null, license:"MIT",
    category:"proxy",
  },
];

// ─── MY MODULES VIEW ─────────────────────────────────────────────────────────
const MyModulesView = ({ onOpenDetail }) => {
  const [confirmUnpublish, setConfirmUnpublish] = useState(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1); // 1=asc, -1=desc

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };

  const SortTh = ({ label, k, style }) => (
    <th className="sortable-th" onClick={() => toggleSort(k)} style={{
      padding:"8px 12px", textAlign:"left", fontFamily:SANS, fontSize:"11px",
      fontWeight:600, color: sortKey===k ? G.textPrimary : G.textDisabled,
      textTransform:"uppercase", letterSpacing:".03em", cursor:"pointer",
      whiteSpace:"nowrap", userSelect:"none", ...style,
    }}>
      {label}
      <span style={{ marginLeft:"4px", color:G.textDisabled, fontSize:"11px" }}>
        {sortKey === k ? (sortDir === 1 ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );

  const rawModules = [
    { name:"nginx-proxy-manager", ver:"2.11.3", status:"verified", deploys:"12k", pulls:"284k", stars:"4.8k", scan:"1H·3M", scanColor:G.error, slsa:2, upd:"2d ago",   size:"148MB", visibility:"public",  deploysNum:12000 },
    { name:"redis-sentinel",      ver:"7.2.4",  status:"verified", deploys:"3.1k", pulls:"44k",  stars:"890",  scan:"Clean",     scanColor:G.success, slsa:2, upd:"4d ago",   size:"62MB",  visibility:"public",  deploysNum:3100 },
    { name:"traefik-tls",         ver:"3.0.1",  status:"pending",  deploys:"—",    pulls:"—",    stars:"—",    scan:"Scanning…", scanColor:G.orange,  slsa:1, upd:"just now", size:"211MB", visibility:"private", deploysNum:0 },
  ];

  const modules = [...rawModules].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === "deploys") { av = a.deploysNum; bv = b.deploysNum; }
    if (typeof av === "string") return av.localeCompare(bv) * sortDir;
    return (av - bv) * sortDir;
  });

  const totalDeploys = "15.1k";
  const totalPulls   = "328k";

  const SettingsRow = ({ label, value, badge }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${G.borderWk}` }}>
      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{label}</span>
      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
        {badge && <Badge color={badge.color}>{badge.text}</Badge>}
        <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{value}</span>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 32px 64px", animation:"fadeUp .18s ease" }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"20px" }}>
        <div>
          <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"3px" }}>My Modules</h2>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Manage your published container modules</span>
        </div>
        <BtnPrimary style={{ padding:"6px 16px", fontSize:"12px" }}>+ Publish New</BtnPrimary>
      </div>

      {/* Summary tiles */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"20px" }}>
        {[
          { label:"Published",    value:"2",          sub:"1 pending review", color:G.success },
          { label:"Total Deploys",value:totalDeploys,  sub:"across all modules", color:G.textSecondary },
          { label:"Total Pulls",  value:totalPulls,    sub:"all-time",            color:G.textSecondary },
          { label:"Open CVEs",    value:"4",          sub:"1 HIGH · 3 MEDIUM",   color:G.error },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", padding:"16px" }}>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"8px" }}>{label}</div>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", lineHeight:1, marginBottom:"4px" }}>{value}</div>
            <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
              <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:color }}/>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modules table */}
      <Panel>
        <PanelHeader label="Published Modules" sub={`${modules.length} total`}/>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 80px 80px 80px 90px 80px 70px 100px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
          {["Module","Version","Status","SLSA","Deploys","Pulls","CVEs",""].map(h => (
            <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
          ))}
        </div>
        {modules.map((m, i) => (
          <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"2fr 80px 80px 80px 90px 80px 70px 100px", padding:"11px 16px", borderBottom: i < modules.length - 1 ? `1px solid ${G.borderWk}` : "none", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary, marginBottom:"2px" }}>{m.name}</div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.size} · updated {m.upd}</div>
            </div>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>v{m.ver}</span>
            <span>
              {m.status === "verified"
                ? <Badge color={G.success}>Verified</Badge>
                : <Badge color={G.orange}>Pending</Badge>}
            </span>
            <span><Badge color={m.slsa === 3 ? G.success : undefined}>L{m.slsa}</Badge></span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys}</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.pulls}</span>
            <span><Badge color={m.scanColor}>{m.scan}</Badge></span>
            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={() => onOpenDetail(MODULES.find(x => x.name === m.name) || MODULES[0])}
                style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:"none", cursor:"pointer", padding:"3px 8px", borderRadius:"2px", border:`1px solid ${G.borderWk}`, transition:"all .1s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=G.textSecondary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=G.borderWk; }}
              >View</button>
              <button onClick={() => setConfirmUnpublish(m.name)}
                style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", cursor:"pointer", padding:"3px 8px", borderRadius:"2px", border:`1px solid ${G.borderWk}`, transition:"all .1s" }}
                onMouseEnter={e => { e.currentTarget.style.color=G.error; e.currentTarget.style.borderColor=G.error; }}
                onMouseLeave={e => { e.currentTarget.style.color=G.textDisabled; e.currentTarget.style.borderColor=G.borderWk; }}
              >Remove</button>
            </div>
          </div>
        ))}
      </Panel>

      {/* Publish quota */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginTop:"16px" }}>
        <Panel>
          <PanelHeader label="Publish Quota" sub="Free tier"/>
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
              <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>Modules used</span>
              <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textPrimary, fontWeight:700 }}>3 / 5</span>
            </div>
            <div style={{ height:"6px", borderRadius:"2px", background:G.elevated, overflow:"hidden", marginBottom:"12px" }}>
              <div style={{ height:"100%", width:"60%", background:`linear-gradient(90deg, ${G.textSecondary}, ${G.success})`, borderRadius:"2px" }}/>
            </div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, lineHeight:1.7 }}>
              Free tier includes 5 modules, 1 GB total image storage, and community support.
              <br/>
              <span style={{ color:G.textSecondary, cursor:"pointer" }}>Upgrade to Pro →</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader label="Storage Usage"/>
          <div style={{ padding:"16px" }}>
            {[
              { name:"nginx-proxy-manager", size:148, max:500 },
              { name:"redis-sentinel",      size:62,  max:500 },
              { name:"traefik-tls",         size:211, max:500 },
            ].map(({ name, size, max }) => (
              <div key={name} style={{ marginBottom:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"160px" }}>{name}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{size} MB</span>
                </div>
                <div style={{ height:"3px", borderRadius:"2px", background:G.elevated, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(size/max)*100}%`, background:G.textSecondary }}/>
                </div>
              </div>
            ))}
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, paddingTop:"8px", borderTop:`1px solid ${G.borderWk}` }}>
              421 MB used of 1 GB
            </div>
          </div>
        </Panel>
      </div>

      {/* Unpublish confirmation modal */}
      {confirmUnpublish && (
        <div onClick={() => setConfirmUnpublish(null)} style={{ position:"fixed", inset:0, background:"rgba(13,14,19,0.7)", backdropFilter:"blur(4px)", zIndex:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"32px", maxWidth:"360px", width:"100%", animation:"fadeUp .12s ease" }}>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"8px" }}>Remove module?</div>
            <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.7, marginBottom:"20px" }}>
              <span style={{ fontFamily:SANS, color:G.textPrimary }}>{confirmUnpublish}</span> will be unpublished and removed from the marketplace. Existing deployments are unaffected.
            </div>
            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <BtnGhost onClick={() => setConfirmUnpublish(null)} style={{ padding:"6px 16px", fontSize:"12px" }}>Cancel</BtnGhost>
              <button onClick={() => setConfirmUnpublish(null)} style={{ padding:"6px 16px", fontSize:"12px", fontFamily:SANS, fontWeight:600, borderRadius:"4px", background:`${G.error}18`, border:`1px solid ${G.error}40`, color:G.error, cursor:"pointer" }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── ANALYTICS DASH VIEW ─────────────────────────────────────────────────────
const AnalyticsDashView = () => {
  const stats = [
    { label:"Total Revenue",    value:"$12,345", change:"+12.5%", pos:true  },
    { label:"Module Downloads", value:"8,432",   change:"+8.2%",  pos:true  },
    { label:"Active Deploys",   value:"1,234",   change:"-2.1%",  pos:false },
    { label:"Conversion Rate",  value:"3.2%",    change:"+0.5%",  pos:true  },
  ];
  const months = ["Jan","Feb","Mar","Apr","May","Jun"];
  const revenues = [2400,1398,9800,3908,4800,3800];
  const maxR = Math.max(...revenues);
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px", animation:"fadeUp .2s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"16px" }}>
        {stats.map(s => (
          <Panel key={s.label}>
            <div style={{ padding:"16px" }}>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"6px" }}>{s.label}</div>
              <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color: s.pos ? G.success : G.error, marginTop:"4px" }}>{s.change}</div>
            </div>
          </Panel>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <Panel>
          <PanelHeader label="Revenue Trend" sub="last 6 months"/>
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:"8px", height:"120px" }}>
              {revenues.map((r, i) => (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <div style={{ width:"100%", background:`${G.textSecondary}20`, borderRadius:"4px 4px 0 0", height:`${(r/maxR)*100}px`, position:"relative" }}>
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${(r/maxR)*80}px`, background:`${G.orange}80`, borderRadius:"4px 4px 0 0" }}/>
                  </div>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{months[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel>
          <PanelHeader label="Module Performance" sub="installs by module"/>
          <div style={{ padding:"12px 14px" }}>
            {[
              { name:"nginx-proxy-manager", pct:38, val:"28.4k" },
              { name:"uptime-kuma",         pct:29, val:"21.7k" },
              { name:"vaultwarden",         pct:18, val:"13.5k" },
              { name:"gitea",               pct:11, val:"8.2k"  },
              { name:"authentik",           pct:4,  val:"3.0k"  },
            ].map(r => (
              <div key={r.name} style={{ marginBottom:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{r.name}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.val}</span>
                </div>
                <div style={{ height:"4px", background:G.elevated, borderRadius:"2px" }}>
                  <div style={{ height:"100%", width:`${r.pct}%`, background:G.orange, borderRadius:"2px", opacity:.7 }}/>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

// ─── EARNINGS VIEW ────────────────────────────────────────────────────────────
const EarningsView = () => {
  const txns = [
    { id:"1", type:"payout",  amount:150,  desc:"nginx-proxy-manager monthly",   date:"2025-03-20", status:"completed" },
    { id:"2", type:"earning", amount:50,   desc:"Bounty reward: traefik build",   date:"2025-03-18", status:"completed" },
    { id:"3", type:"payout",  amount:220,  desc:"uptime-kuma monthly",           date:"2025-03-10", status:"completed" },
    { id:"4", type:"earning", amount:30,   desc:"Arena contest: 3rd place",       date:"2025-03-05", status:"completed" },
    { id:"5", type:"payout",  amount:95,   desc:"vaultwarden monthly",            date:"2025-02-20", status:"pending"   },
  ];
  const total = txns.filter(t => t.status==="completed").reduce((s,t) => s+t.amount, 0);
  const statusColor = { completed:G.success, pending:G.orange };
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px", animation:"fadeUp .2s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"16px" }}>
        {[
          { label:"Total Earned",   value:"$"+total  },
          { label:"Pending",        value:"$95"       },
          { label:"This Month",     value:"$545"      },
        ].map(s => (
          <Panel key={s.label}><div style={{ padding:"16px" }}>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"6px" }}>{s.label}</div>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color:G.textPrimary, letterSpacing:"-0.015em" }}>{s.value}</div>
          </div></Panel>
        ))}
      </div>
      <Panel>
        <PanelHeader label="Transaction History" action={<BtnGhost style={{ padding:"3px 10px", fontSize:"11px" }}>Export CSV</BtnGhost>}/>
        <div style={{ overflowX:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 100px 80px 80px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
            {["Type","Description","Date","Amount","Status"].map(h => (
              <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
            ))}
          </div>
          {txns.map(t => (
            <div key={t.id} className="trow" style={{ display:"grid", gridTemplateColumns:"80px 1fr 100px 80px 80px", padding:"9px 16px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center" }}>
              <span style={{ fontFamily:SANS, fontSize:"11px", color: t.type==="payout" ? G.textSecondary : G.success }}>{t.type}</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{t.desc}</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{t.date}</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textPrimary }}>${t.amount}</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:statusColor[t.status] || G.textDisabled }}>{t.status}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

// ─── API KEYS VIEW ────────────────────────────────────────────────────────────
const APIKeysView = () => {
  const [keys, setKeys] = useState([
    { id:1, name:"Production deploy",  prefix:"frk_prod_a3f9", created:"Jan 12, 2025", lastUsed:"2 hours ago",  scopes:["publish","deploy","read"],  active:true  },
    { id:2, name:"CI pipeline",        prefix:"frk_ci_b7e2",   created:"Feb 4, 2025",  lastUsed:"14 min ago",   scopes:["publish","read"],           active:true  },
    { id:3, name:"Local dev",          prefix:"frk_dev_c1d8",  created:"Mar 1, 2025",  lastUsed:"5 days ago",   scopes:["read"],                     active:true  },
    { id:4, name:"Old staging key",    prefix:"frk_stg_d4f1",  created:"Oct 3, 2024",  lastUsed:"2 months ago", scopes:["publish","deploy","read"],  active:false },
  ]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState(["read"]);
  const [revealKey, setRevealKey] = useState(null);
  const [justCreated, setJustCreated] = useState(null);

  const toggleScope = (s) => setNewScopes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const fakeKey = `frk_${newName.toLowerCase().replace(/\s+/g,"_").slice(0,6)}_${Math.random().toString(36).slice(2,10)}`;
    setJustCreated(fakeKey);
    setKeys(p => [...p, { id:Date.now(), name:newName, prefix:fakeKey.slice(0,16), created:"Today", lastUsed:"Never", scopes:newScopes, active:true }]);
    setShowNew(false); setNewName(""); setNewScopes(["read"]);
  };

  const SCOPE_INFO = {
    read:    { label:"Read",    desc:"Browse marketplace, download runbooks" },
    publish: { label:"Publish", desc:"Upload and manage your modules"        },
    deploy:  { label:"Deploy",  desc:"Trigger deployments via API"           },
    admin:   { label:"Admin",   desc:"Manage org members and billing"        },
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 32px 64px", animation:"fadeUp .18s ease" }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"20px" }}>
        <div>
          <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"3px" }}>API Keys</h2>
          <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Authenticate programmatic access to the Flareo API</span>
        </div>
        <BtnPrimary onClick={() => setShowNew(true)} style={{ padding:"6px 16px", fontSize:"12px" }}>+ New Key</BtnPrimary>
      </div>

      {/* New key created banner */}
      {justCreated && (
        <div style={{ background:`${G.success}08`, border:`1px solid ${G.success}30`, borderLeft:`3px solid ${G.success}`, borderRadius:"0 4px 4px 0", padding:"12px 16px", marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.success, marginBottom:"4px" }}>Key created — save it now, it won't be shown again</div>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textPrimary, userSelect:"all" }}>{justCreated}</div>
          </div>
          <button onClick={() => setJustCreated(null)} style={{ background:"none", border:"none", color:G.textDisabled, cursor:"pointer", fontSize:"15px", padding:"4px 8px" }}>×</button>
        </div>
      )}

      {/* Keys table */}
      <Panel style={{ marginBottom:"16px" }}>
        <PanelHeader label="Active Keys" sub={`${keys.filter(k => k.active).length} active · ${keys.filter(k => !k.active).length} revoked`}/>
        <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1.4fr 120px 120px 1fr 80px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
          {["Name","Token","Created","Last used","Scopes",""].map(h => (
            <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
          ))}
        </div>
        {keys.map((k, i) => (
          <div key={k.id} className="trow" style={{ display:"grid", gridTemplateColumns:"1.8fr 1.4fr 120px 120px 1fr 80px", padding:"11px 16px", borderBottom: i < keys.length - 1 ? `1px solid ${G.borderWk}` : "none", alignItems:"center", opacity: k.active ? 1 : 0.45 }}>
            <div>
              <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color: k.active ? G.textPrimary : G.textSecondary, marginBottom:"2px" }}>{k.name}</div>
              {!k.active && <Badge color={G.error}>Revoked</Badge>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
                {revealKey === k.id ? k.prefix + "••••••••" : k.prefix.slice(0,12) + "••••"}
              </span>
              {k.active && (
                <button onClick={() => setRevealKey(revealKey === k.id ? null : k.id)}
                  style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", border:`1px solid ${G.borderWk}`, borderRadius:"2px", cursor:"pointer", padding:"1px 5px" }}>
                  {revealKey === k.id ? "hide" : "show"}
                </button>
              )}
            </div>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{k.created}</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{k.lastUsed}</span>
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {k.scopes.map(s => <Badge key={s}>{s}</Badge>)}
            </div>
            {k.active ? (
              <button onClick={() => setKeys(p => p.map(x => x.id === k.id ? {...x, active:false} : x))}
                style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", border:`1px solid ${G.borderWk}`, borderRadius:"2px", cursor:"pointer", padding:"4px 10px", transition:"all .1s" }}
                onMouseEnter={e => { e.currentTarget.style.color=G.error; e.currentTarget.style.borderColor=G.error; }}
                onMouseLeave={e => { e.currentTarget.style.color=G.textDisabled; e.currentTarget.style.borderColor=G.borderWk; }}
              >Revoke</button>
            ) : (
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>—</span>
            )}
          </div>
        ))}
      </Panel>

      {/* Usage example */}
      <Panel style={{ marginBottom:"16px" }}>
        <PanelHeader label="Usage" sub="REST API"/>
        <div style={{ padding:"16px" }}>
          <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, marginBottom:"12px" }}>
            Pass your key in the <span style={{ fontFamily:SANS, color:G.textPrimary }}>Authorization</span> header for all API requests.
          </div>
          <div style={{ background:"#080808", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"12px 16px", fontFamily:MONO, fontSize:"11px", lineHeight:1.9 }}>
            <div><span style={{ color:G.textDisabled }}>curl </span><span style={{ color:G.success }}>https://api.flareo.dev/v1/modules</span> \</div>
            <div><span style={{ color:G.textDisabled }}>  -H </span><span style={{ color:G.textSecondary }}>"Authorization: Bearer frk_prod_a3f9••••"</span> \</div>
            <div><span style={{ color:G.textDisabled }}>  -H </span><span style={{ color:G.textSecondary }}>"Content-Type: application/json"</span></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginTop:"16px" }}>
            {[
              { label:"Base URL",    value:"https://api.flareo.dev/v1" },
              { label:"Rate limit",  value:"1,000 req / hour"          },
              { label:"Auth scheme", value:"Bearer token"              },
            ].map(({ label, value }) => (
              <div key={label} style={{ background:G.secondary, border:`1px solid ${G.borderWk}`, borderRadius:"4px", padding:"10px 12px" }}>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"4px" }}>{label}</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Create key modal */}
      {showNew && (
        <div onClick={() => setShowNew(false)} style={{ position:"fixed", inset:0, background:"rgba(13,14,19,0.75)", backdropFilter:"blur(4px)", zIndex:40, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"32px", maxWidth:"420px", width:"100%", animation:"fadeUp .12s ease" }}>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"20px" }}>Create new API key</div>
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, display:"block", marginBottom:"6px" }}>Key name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Production deploy"
                style={{ width:"100%", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", color:G.textPrimary, fontFamily:SANS, fontSize:"13px", padding:"8px 12px", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div style={{ marginBottom:"20px" }}>
              <label style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, display:"block", marginBottom:"8px" }}>Permissions</label>
              {Object.entries(SCOPE_INFO).map(([scope, { label, desc }]) => (
                <button key={scope} onClick={() => toggleScope(scope)} style={{
                  display:"flex", alignItems:"flex-start", gap:"8px", width:"100%",
                  padding:"10px 12px", marginBottom:"6px", borderRadius:"4px", cursor:"pointer", textAlign:"left",
                  background: newScopes.includes(scope) ? G.orangeFaded : G.secondary,
                  border:`1px solid ${newScopes.includes(scope) ? G.orange + "50" : G.border}`,
                  transition:"all .12s",
                }}>
                  <div style={{ width:"14px", height:"14px", borderRadius:"2px", border:`1.5px solid ${newScopes.includes(scope) ? G.orange : G.border}`, background: newScopes.includes(scope) ? G.orange : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                    {newScopes.includes(scope) && <span style={{ fontSize:"11px", color:"#000", fontWeight:700, lineHeight:1 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, marginBottom:"2px" }}>{label}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <BtnGhost onClick={() => setShowNew(false)} style={{ padding:"6px 16px", fontSize:"12px" }}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleCreate} style={{ padding:"6px 16px", fontSize:"12px" }}>Generate key</BtnPrimary>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
const SettingsView = () => {
  const [tab, setTab] = useState("account");
  const [saved, setSaved] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [notifications, setNotifications] = useState({
    buildComplete:true, scanAlert:true, deployAlert:false, weeklyDigest:true, marketingEmails:false,
  });
  const [plan] = useState("free");

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Toggle = ({ checked, onChange }) => (
    <button onClick={onChange} style={{
      width:"34px", height:"18px", borderRadius:"8px", border:"none", cursor:"pointer", position:"relative", flexShrink:0,
      background: checked ? G.success : G.elevated, transition:"background .2s",
    }}>
      <span style={{ position:"absolute", top:"3px", left: checked ? "17px" : "3px", width:"12px", height:"12px", borderRadius:"50%", background: checked ? "#fff" : G.textDisabled, transition:"left .2s" }}/>
    </button>
  );

  const SectionTitle = ({ children }) => (
    <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"12px", marginTop:"24px" }}>{children}</div>
  );

  const FieldRow = ({ label, sub, children }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${G.borderWk}` }}>
      <div>
        <div style={{ fontFamily:SANS, fontSize:"13px", color:G.textPrimary, marginBottom: sub ? "2px" : 0 }}>{label}</div>
        {sub && <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const tabs = [
    { id:"account",       label:"Account"       },
    { id:"notifications", label:"Notifications" },
    { id:"security",      label:"Security"      },
    { id:"billing",       label:"Billing"       },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Tab bar */}
      <div style={{ borderBottom:`1px solid ${G.border}`, padding:"0 28px", flexShrink:0, background:G.primary }}>
        <div style={{ display:"flex", gap:"0", marginBottom:"-1px" }}>
          {tabs.map(t => (
            <button key={t.id} className={`dtab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 60px", animation:"fadeUp .18s ease" }}>
        <div style={{ maxWidth:"560px" }}>

          {/* ── Account ── */}
          {tab === "account" && (
            <div>
              <SectionTitle>Profile</SectionTitle>
              {/* Avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:"16px", padding:"16px", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", marginBottom:"16px" }}>
                <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:G.elevated, border:`2px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontFamily:SANS, fontSize:"18px", fontWeight:700, color:G.orange }}>JD</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textPrimary, marginBottom:"3px" }}>jdoe</div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Free tier · joined Jan 2025</div>
                </div>
                <BtnGhost style={{ padding:"4px 12px", fontSize:"11px" }}>Change avatar</BtnGhost>
              </div>

              {[
                { label:"Display name", placeholder:"John Doe",          defaultVal:"John Doe"            },
                { label:"Username",     placeholder:"jdoe",              defaultVal:"jdoe"                },
                { label:"Email",        placeholder:"john@example.com",  defaultVal:"john@example.com"    },
                { label:"Bio",          placeholder:"What do you build?",defaultVal:"Building infra tools.", area:true },
                { label:"Website",      placeholder:"https://",          defaultVal:""                    },
              ].map(({ label, placeholder, defaultVal, area }) => (
                <div key={label} style={{ marginBottom:"16px" }}>
                  <label style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, display:"block", marginBottom:"6px" }}>{label}</label>
                  {area
                    ? <textarea defaultValue={defaultVal} rows={3} placeholder={placeholder} style={{ width:"100%", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", color:G.textPrimary, fontFamily:SANS, fontSize:"13px", padding:"8px 12px", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                    : <input defaultValue={defaultVal} placeholder={placeholder} style={{ width:"100%", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", color:G.textPrimary, fontFamily:SANS, fontSize:"13px", padding:"8px 12px", outline:"none", boxSizing:"border-box" }}/>
                  }
                </div>
              ))}

              <SectionTitle>Danger zone</SectionTitle>
              <div style={{ border:`1px solid ${G.error}30`, borderRadius:"4px", padding:"16px", background:`${G.error}05` }}>
                <FieldRow label="Delete account" sub="Permanently remove your account and all modules.">
                  <button style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.error, background:`${G.error}15`, border:`1px solid ${G.error}40`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer" }}>
                    Delete
                  </button>
                </FieldRow>
              </div>

              <div style={{ marginTop:"20px", display:"flex", justifyContent:"flex-end", alignItems:"center", gap:"12px" }}>
                {saved && <span style={{ fontFamily:SANS, fontSize:"12px", color:G.success }}>✓ Saved</span>}
                <BtnPrimary onClick={handleSave} style={{ padding:"8px 20px", fontSize:"13px" }}>Save changes</BtnPrimary>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div>
              <SectionTitle>Build & CI</SectionTitle>
              {[
                { key:"buildComplete", label:"Build completed",        sub:"Get notified when a build finishes, pass or fail"      },
                { key:"scanAlert",     label:"Scan alerts",            sub:"CVE findings above your configured severity threshold" },
                { key:"deployAlert",   label:"Deploy events",          sub:"When someone deploys one of your modules"              },
              ].map(({ key, label, sub }) => (
                <FieldRow key={key} label={label} sub={sub}>
                  <Toggle checked={notifications[key]} onChange={() => setNotifications(p => ({...p, [key]:!p[key]}))}/>
                </FieldRow>
              ))}

              <SectionTitle>Email</SectionTitle>
              {[
                { key:"weeklyDigest",    label:"Weekly digest",    sub:"Summary of deploys, scans, and marketplace activity"   },
                { key:"marketingEmails", label:"Product updates",  sub:"New features, releases, and Flareo announcements"      },
              ].map(({ key, label, sub }) => (
                <FieldRow key={key} label={label} sub={sub}>
                  <Toggle checked={notifications[key]} onChange={() => setNotifications(p => ({...p, [key]:!p[key]}))}/>
                </FieldRow>
              ))}

              <SectionTitle>Delivery channels</SectionTitle>
              <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
                {[
                  { ch:"Email",   value:"john@example.com", status:"Verified",  statusColor:G.success },
                  { ch:"Slack",   value:"Not connected",    status:"Connect →",  statusColor:G.textSecondary    },
                  { ch:"Webhook", value:"Not configured",   status:"Configure →",statusColor:G.textSecondary    },
                ].map(({ ch, value, status, statusColor }, i, arr) => (
                  <div key={ch} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${G.borderWk}` : "none" }}>
                    <div>
                      <span style={{ fontFamily:SANS, fontSize:"13px", color:G.textPrimary, marginRight:"12px" }}>{ch}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{value}</span>
                    </div>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:statusColor, cursor:"pointer" }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === "security" && (
            <div>
              <SectionTitle>Authentication</SectionTitle>
              <FieldRow label="Two-factor authentication" sub={twoFA ? "Enabled via authenticator app" : "Add an extra layer of security to your account"}>
                {twoFA
                  ? <button onClick={() => setTwoFA(false)} style={{ fontFamily:SANS, fontSize:"11px", color:G.error, background:`${G.error}10`, border:`1px solid ${G.error}30`, borderRadius:"4px", padding:"5px 12px", cursor:"pointer" }}>Disable</button>
                  : <BtnPrimary onClick={() => setTwoFA(true)} style={{ padding:"4px 12px", fontSize:"11px" }}>Enable 2FA</BtnPrimary>
                }
              </FieldRow>
              <FieldRow label="Password" sub="Last changed 45 days ago">
                <BtnGhost style={{ padding:"4px 12px", fontSize:"11px" }}>Change password</BtnGhost>
              </FieldRow>

              <SectionTitle>Connected OAuth apps</SectionTitle>
              <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", overflow:"hidden" }}>
                {[
                  { name:"GitHub",   auth:"Connected · github.com/jdoe",      color:G.textPrimary, connected:true  },
                  { name:"GitLab",   auth:"Not connected",                     color:G.textDisabled, connected:false },
                  { name:"Bitbucket",auth:"Not connected",                     color:G.textDisabled, connected:false },
                ].map(({ name, auth, color, connected }, i, arr) => (
                  <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${G.borderWk}` : "none" }}>
                    <div>
                      <div style={{ fontFamily:SANS, fontSize:"13px", color:G.textPrimary, marginBottom:"2px" }}>{name}</div>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color }}>{ auth}</div>
                    </div>
                    {connected
                      ? <button style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", border:`1px solid ${G.borderWk}`, borderRadius:"2px", padding:"4px 12px", cursor:"pointer" }}>Disconnect</button>
                      : <button style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:"none", border:`1px solid ${G.textSecondary}40`, borderRadius:"2px", padding:"4px 12px", cursor:"pointer" }}>Connect</button>
                    }
                  </div>
                ))}
              </div>

              <SectionTitle>Active sessions</SectionTitle>
              <Panel>
                {[
                  { agent:"Chrome on macOS",       ip:"192.168.1.1",  loc:"London, GB",    current:true  },
                  { agent:"Firefox on Windows 11", ip:"10.0.0.14",    loc:"Berlin, DE",    current:false },
                  { agent:"Flareo CLI v1.2.0",     ip:"185.143.12.9", loc:"New York, US",  current:false },
                ].map(({ agent, ip, loc, current }, i, arr) => (
                  <div key={agent} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${G.borderWk}` : "none" }}>
                    <div>
                      <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"3px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textPrimary }}>{agent}</span>
                        {current && <Badge color={G.success}>Current</Badge>}
                      </div>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{ip} · {loc}</span>
                    </div>
                    {!current && (
                      <button style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", border:`1px solid ${G.borderWk}`, borderRadius:"2px", padding:"4px 12px", cursor:"pointer", transition:"all .1s" }}
                        onMouseEnter={e => { e.currentTarget.style.color=G.error; e.currentTarget.style.borderColor=G.error; }}
                        onMouseLeave={e => { e.currentTarget.style.color=G.textDisabled; e.currentTarget.style.borderColor=G.borderWk; }}
                      >Revoke</button>
                    )}
                  </div>
                ))}
              </Panel>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === "billing" && (
            <div>
              <SectionTitle>Current plan</SectionTitle>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
                {[
                  { name:"Free",  price:"$0/mo",  features:["5 modules","1 GB storage","Community support","Public modules only"],  current: plan === "free",  color:G.textSecondary },
                  { name:"Pro",   price:"$19/mo", features:["Unlimited modules","20 GB storage","Priority support","Private modules","Webhook alerts","SLA 99.9%"], current:false, color:G.orange },
                ].map(({ name, price, features, current, color }) => (
                  <div key={name} style={{ background: current ? G.secondary : G.primary, border:`1px solid ${current ? G.border : G.borderWk}`, borderTop: current ? "1px solid rgba(255,255,255,0.07)" : `1px solid ${G.borderWk}`, borderRadius:"8px", padding:"16px", position:"relative" }}>
                    {current && <div style={{ position:"absolute", top:"12px", right:"12px" }}><Badge color={G.success}>Current plan</Badge></div>}
                    <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, marginBottom:"4px" }}>{name}</div>
                    <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color, letterSpacing:"-0.015em", marginBottom:"16px" }}>{price}</div>
                    {features.map(f => (
                      <div key={f} style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"6px" }}>
                        <span style={{ color: current ? G.success : G.textDisabled, fontSize:"11px" }}>✓</span>
                        <span style={{ fontFamily:SANS, fontSize:"12px", color: current ? G.textSecondary : G.textDisabled }}>{f}</span>
                      </div>
                    ))}
                    {!current && (
                      <button style={{ marginTop:"16px", width:"100%", padding:"8px", fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"4px", cursor:"pointer" }}>
                        Upgrade to Pro
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <SectionTitle>Usage this month</SectionTitle>
              <Panel>
                {[
                  { label:"API calls",    used:3420,  max:10000, unit:"req"  },
                  { label:"Build minutes",used:184,   max:500,   unit:"min"  },
                  { label:"Storage",      used:421,   max:1024,  unit:"MB"   },
                  { label:"Scans",        used:12,    max:50,    unit:"scans"},
                ].map(({ label, used, max, unit }, i, arr) => (
                  <div key={label} style={{ padding:"12px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${G.borderWk}` : "none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                      <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>{label}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{used.toLocaleString()} / {max.toLocaleString()} {unit}</span>
                    </div>
                    <div style={{ height:"4px", borderRadius:"2px", background:G.elevated, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min((used/max)*100,100)}%`, background: (used/max) > 0.85 ? G.orange : G.textSecondary, borderRadius:"2px" }}/>
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── PROFILE VIEW ─────────────────────────────────────────────────────────────
const ProfileView = ({ onOpenDetail }) => {
  const [editMode, setEditMode] = useState(false);

  const myMods = MODULES.filter(m => [1,3].includes(m.id));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 0 60px", animation:"fadeUp .18s ease" }}>
      <div style={{ padding:"0 32px" }}>
        {/* Avatar + edit row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", marginTop:"24px" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:G.elevated, border:`3px solid ${G.canvas}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontFamily:SANS, fontSize:"18px", fontWeight:700, color:G.orange }}>JD</span>
          </div>
          <button onClick={() => setEditMode(e => !e)} style={{ marginTop:"32px", fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textSecondary, background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"6px 14px", cursor:"pointer" }}>
            {editMode ? "Done editing" : "Edit profile"}
          </button>
        </div>

        {/* Name + meta */}
        <div style={{ marginBottom:"24px" }}>
          <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, marginBottom:"4px", letterSpacing:"-0.015em" }}>John Doe</h1>
          <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"10px" }}>@jdoe</div>
          <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.7, maxWidth:"520px" }}>
            Building infrastructure tooling and container workflows. Interested in supply chain security, SLSA, and self-hosted software.
          </p>
          <div style={{ display:"flex", gap:"20px", marginTop:"12px" }}>
            {[
              { icon:"loc", text:"London, UK"            },
              { icon:"url", text:"github.com/jdoe"        },
              { icon:"cal", text:"Joined January 2025"   },
            ].map(({ icon, text }) => (
              <span key={text} style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>
                <span style={{ marginRight:"5px" }}>{icon}</span>{text}
              </span>
            ))}
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display:"flex", gap:"24px", padding:"14px 0", borderTop:`1px solid ${G.borderWk}`, borderBottom:`1px solid ${G.borderWk}`, marginBottom:"32px" }}>
          {[
            { label:"Modules",      value:"3" },
            { label:"Total deploys",value:"15.1k" },
            { label:"Total pulls",  value:"328k" },
            { label:"Stars earned", value:"11.8k" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.015em" }}>{value}</div>
              <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Published modules — data table */}
        <div style={{ marginBottom:"32px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
            <div style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em" }}>Published Modules</div>
            <BtnPrimary style={{ padding:"4px 14px", fontSize:"12px" }}>+ Publish New</BtnPrimary>
          </div>
          <div style={{ background:G.primary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.055)", borderRadius:"4px", overflow:"hidden" }}>
            {/* Sortable table header */}
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
                  <SortTh label="Module"      k="name"    style={{ width:"30%" }}/>
                  <SortTh label="Version"     k="ver"     style={{ width:"12%" }}/>
                  <SortTh label="Trust Score" k="status"  style={{ width:"14%" }}/>
                  <SortTh label="Scan"        k="scan"    style={{ width:"12%" }}/>
                  <SortTh label="Stars"       k="stars"   style={{ width:"10%" }}/>
                  <SortTh label="Deploys"     k="deploys" style={{ width:"10%" }}/>
                  <th style={{ padding:"8px 12px", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em", textAlign:"left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {myMods.map((m, i) => {
                const tsColor = m.trustScore >= 90 ? G.success : m.trustScore >= 70 ? G.textSecondary : G.textDisabled;
                return (
                  <tr key={m.id} className="trow" style={{ borderBottom: i < myMods.length-1 ? `1px solid ${G.borderWk}` : "none", cursor:"pointer" }}
                    onClick={() => onOpenDetail(m)}>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary, marginBottom:"2px" }}>{m.name}</div>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.license}</div>
                    </td>
                    <td style={{ padding:"10px 12px" }}><span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>v{m.ver}</span></td>
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:tsColor, minWidth:"24px" }}>{m.trustScore}</span>
                        <div style={{ flex:1, height:"4px", background:G.elevated, borderRadius:"2px", overflow:"hidden", minWidth:"40px" }}>
                          <div style={{ width:`${m.trustScore}%`, height:"100%", background:tsColor, opacity:.75, borderRadius:"2px" }}/>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"10px 12px" }}><ScanResult c={m.c} h={m.h} m={m.m}/></td>
                    <td style={{ padding:"10px 12px" }}><span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.stars}</span></td>
                    <td style={{ padding:"10px 12px" }}><span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{m.deploys}</span></td>
                    <td style={{ padding:"10px 12px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display:"flex", gap:"4px" }}>
                        <button style={{ background:"transparent", border:`1px solid ${G.border}`, borderRadius:"2px", padding:"3px 8px", fontFamily:SANS, fontSize:"11px", color:G.textSecondary, cursor:"pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="#404040"; e.currentTarget.style.color=G.textPrimary; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor=G.border; e.currentTarget.style.color=G.textSecondary; }}
                        >Edit</button>
                        <button style={{ background:`${G.textSecondary}14`, border:`1px solid ${G.textSecondary}40`, borderRadius:"2px", padding:"3px 8px", fontFamily:SANS, fontSize:"11px", color:G.textSecondary, cursor:"pointer" }}>Pipeline</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textSecondary, textTransform:"uppercase", letterSpacing:".03em", marginBottom:"16px" }}>Recent activity</div>
          <Panel>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:"12px", padding:"8px 16px", borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${G.borderWk}` : "none", alignItems:"flex-start" }}>
                <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:a.color, flexShrink:0, marginTop:"4px" }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:SANS, fontSize:"12px", color:G.textPrimary, fontWeight:500, marginBottom:"2px" }}>{a.text}</div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{a.sub}</div>
                </div>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, flexShrink:0 }}>{a.time}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
};


// ─── STAR RATING ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 11, showValue = true }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display:"flex", alignItems:"center", gap:"3px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:`${size}px`, color: i <= full ? G.textSecondary : (i === full+1 && half ? G.textSecondary : G.textDisabled), opacity: i <= full ? 1 : (i === full+1 && half ? 0.6 : 0.25) }}>★</span>
      ))}
      {showValue && <span style={{ fontFamily:SANS, fontSize:`${size-1}px`, color:G.textSecondary, marginLeft:"2px" }}>{rating.toFixed(1)}</span>}
    </span>
  );
};

// ─── REVIEWS TAB ──────────────────────────────────────────────────────────────
const ReviewsTab = ({ module: m }) => {
  const reviews = MOCK_REVIEWS;
  const extras = MODULE_EXTRAS[m.id] || {};
  const avg = extras.ratingStars || 4.5;
  const total = extras.reviewCount || 0;
  const dist = [5,4,3,2,1].map(s => ({ stars:s, pct: s===5?62:s===4?25:s===3?8:s===2?3:2 }));

  return (
    <div style={{ animation:"fadeUp .18s ease" }}>
      <Panel style={{ marginBottom:"12px" }}>
        <PanelHeader label="Rating Overview" sub={`${total.toLocaleString()} reviews`}/>
        <div style={{ padding:"16px", display:"flex", gap:"24px", alignItems:"center" }}>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"40px", color:G.textPrimary, letterSpacing:"-0.02em", lineHeight:1, marginBottom:"6px" }}>{avg.toFixed(1)}</div>
            <StarRating rating={avg} size={13} showValue={false}/>
            <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"4px" }}>{total.toLocaleString()} reviews</div>
          </div>
          <div style={{ flex:1 }}>
            {dist.map(({ stars, pct }) => (
              <div key={stars} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, width:"8px", textAlign:"right" }}>{stars}</span>
                <span style={{ fontSize:"11px", color:G.textDisabled }}>★</span>
                <div style={{ flex:1, height:"5px", borderRadius:"2px", background:G.elevated, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background: stars >= 4 ? G.success : stars === 3 ? G.textSecondary : G.error, borderRadius:"2px" }}/>
                </div>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, width:"24px" }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {reviews.map((rev) => (
        <Panel key={rev.id} style={{ marginBottom:"8px" }}>
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:G.elevated, border:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textSecondary }}>{rev.author.substring(0,2).toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textPrimary }}>{rev.author}</div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{rev.date}</div>
                </div>
              </div>
              <StarRating rating={rev.rating} size={11}/>
            </div>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.7, marginBottom: rev.reply ? "10px" : 0 }}>{rev.content}</p>
            {rev.reply && (
              <div style={{ background:G.elevated, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.textSecondary}`, borderRadius:"0 4px 4px 0", padding:"10px 12px" }}>
                <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, marginBottom:"4px" }}> ↳ Developer reply · {rev.reply.date}</div>
                <p style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, lineHeight:1.65 }}>{rev.reply.content}</p>
              </div>
            )}
          </div>
        </Panel>
      ))}
    </div>
  );
};

// ─── CHANGELOG TAB ────────────────────────────────────────────────────────────
const ChangelogTab = ({ module: m }) => {
  const extras = MODULE_EXTRAS[m.id] || {};
  const entries = extras.changelog || [];
  const typeColor = { feature:G.success, fix:G.error, improvement:G.textSecondary, breaking:G.error };
  const typeLabel = { feature:"feat", fix:"fix", improvement:"impr", breaking:"BREAKING" };

  if (!entries.length) return (
    <Panel><div style={{ padding:"32px", textAlign:"center" }}>
      <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>No changelog entries.</span>
    </div></Panel>
  );

  return (
    <div style={{ animation:"fadeUp .18s ease" }}>
      {entries.map((entry, i) => (
        <Panel key={i} style={{ marginBottom:"10px" }}>
          <PanelHeader label={`v${entry.version}`} sub={entry.date}/>
          <div style={{ padding:"12px 16px" }}>
            {entry.changes.map((ch, j) => (
              <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:"8px", padding:"6px 0", borderBottom: j < entry.changes.length-1 ? `1px solid ${G.borderWk}` : "none" }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:typeColor[ch.type] || G.textDisabled, background:`${typeColor[ch.type] || G.textDisabled}15`, border:`1px solid ${typeColor[ch.type] || G.textDisabled}30`, borderRadius:"2px", padding:"2px 5px", flexShrink:0, minWidth:"46px", textAlign:"center", letterSpacing:".03em" }}>
                  {typeLabel[ch.type] || ch.type}
                </span>
                <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.6 }}>{ch.desc}</span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
};

// ─── Q&A TAB ──────────────────────────────────────────────────────────────────
const QATab = () => {
  const questions = MOCK_QA;
  return (
    <div style={{ animation:"fadeUp .18s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>{questions.length} questions</span>
        <BtnPrimary style={{ padding:"4px 12px", fontSize:"11px" }}>+ Ask a Question</BtnPrimary>
      </div>
      {questions.map(q => (
        <Panel key={q.id} style={{ marginBottom:"10px" }}>
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
              <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:G.elevated, border:`1px solid ${G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textSecondary }}>{q.author.substring(0,2).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:G.textPrimary }}>{q.author}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{q.date}</span>
                </div>
                <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>{q.title}</div>
                <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.65 }}>{q.content}</p>
              </div>
            </div>
            {q.answers.map(ans => (
              <div key={ans.id} style={{ marginLeft:"36px", background: ans.isDeveloper ? `${G.textSecondary}06` : G.elevated, border:`1px solid ${G.border}`, borderLeft:`3px solid ${ans.isDeveloper ? G.textSecondary : G.border}`, borderRadius:"0 4px 4px 0", padding:"10px 12px", marginBottom:"6px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color: ans.isDeveloper ? G.textSecondary : G.textSecondary }}>{ans.author}</span>
                  {ans.isDeveloper && <Badge color={G.textSecondary} mono={false}>dev</Badge>}
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{ans.date}</span>
                </div>
                <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.65 }}>{ans.content}</p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
};

// ─── COMMUNITY VIEW ───────────────────────────────────────────────────────────
const CommunityView = () => {
  const [postType, setPostType] = useState("all");
  const [showAllTags, setShowAllTags] = useState(false);

  const filtered = postType === "all" ? POSTS : POSTS.filter(p => p.type === postType);
  const tags = showAllTags ? TOPIC_TAGS : TOPIC_TAGS.slice(0, 5);

  const typeColors = { question:G.textSecondary, tutorial:G.success, suggestion:G.textSecondary };
  const typeLabels = { question:"Q", tutorial:"T", suggestion:"S" };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px", animation:"fadeUp .2s ease" }}>
      <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>

        {/* Main feed */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Toolbar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
            <div style={{ display:"flex", gap:"4px" }}>
              {[["all","All"],["question","Questions"],["tutorial","Tutorials"],["suggestion","Suggestions"]].map(([t,l]) => (
                <button key={t} className={`dtab ${postType===t?"on":""}`} onClick={() => setPostType(t)} style={{ fontSize:"12px", padding:"6px 12px" }}>{l}</button>
              ))}
            </div>
            <BtnPrimary style={{ padding:"4px 12px", fontSize:"11px" }}>+ New Post</BtnPrimary>
          </div>

          {filtered.map(post => (
            <div key={post.id} className="modcard" style={{ marginBottom:"8px", padding:"16px", cursor:"pointer" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                <div style={{ width:"22px", height:"22px", borderRadius:"4px", background:`${typeColors[post.type] || G.textDisabled}20`, border:`1px solid ${typeColors[post.type] || G.textDisabled}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, color:typeColors[post.type] || G.textDisabled }}>{typeLabels[post.type] || "P"}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"4px", lineHeight:1.3 }}>{post.title}</div>
                  <p style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, lineHeight:1.65, marginBottom:"8px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{post.excerpt}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      {post.tags.slice(0,3).map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <div style={{ display:"flex", gap:"16px", alignItems:"center", flexShrink:0, marginLeft:"10px" }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{post.author}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{post.timeAgo}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>↑ {post.likes}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>✦ {post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ width:"220px", flexShrink:0, display:"flex", flexDirection:"column", gap:"12px" }}>
          <Panel>
            <PanelHeader label="Topic Tags"/>
            <div style={{ padding:"8px 0" }}>
              {tags.map(tag => (
                <div key={tag.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 12px", cursor:"pointer", transition:"background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background=G.elevated}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}># {tag.name}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{tag.count}</span>
                </div>
              ))}
              <div style={{ padding:"6px 14px" }}>
                <button onClick={() => setShowAllTags(t => !t)} style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  {showAllTags ? "Show less" : "Show all →"}
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader label="Community Stats"/>
            <div style={{ padding:"8px 16px" }}>
              {[
                { label:"Active members", value:"12,458" },
                { label:"Posts",          value:"35,842" },
                { label:"This week",      value:"+486",  color:G.success },
                { label:"Resolved",       value:"24,673" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.label}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color: r.color || G.textSecondary }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

// ─── ARENA VIEW ───────────────────────────────────────────────────────────────
const ArenaView = () => {
  const [tab, setTab] = useState("active");

  const shown = CONTESTS.filter(c => {
    if (tab === "active")   return c.status === "active";
    if (tab === "upcoming") return c.status === "upcoming";
    if (tab === "ended")    return c.status === "ended";
    return true;
  });

  const statusColor = { active:G.success, upcoming:G.textSecondary, ended:G.textDisabled };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px", animation:"fadeUp .2s ease" }}>
      {/* Header */}
      <div style={{ marginBottom:"16px" }}>
        <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"4px" }}>Arena</h2>
        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>Developer contests · build hardened modules · win prizes</span>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0", borderBottom:`1px solid ${G.border}`, marginBottom:"16px" }}>
        {[["active","Active"],["upcoming","Upcoming"],["ended","Past"]].map(([t,l]) => (
          <button key={t} className={`dtab ${tab===t?"on":""}`} onClick={() => setTab(t)} style={{ fontSize:"12px", padding:"7px 14px" }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:"12px" }}>
        {shown.map(c => (
          <div key={c.id} className="modcard" style={{ padding:"16px" }}>
            {/* Status + title */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
              <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, lineHeight:1.3, flex:1, marginRight:"10px" }}>{c.title}</span>
              <Badge color={statusColor[c.status]}>{c.status}</Badge>
            </div>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.65, marginBottom:"12px" }}>{c.desc}</p>
            {/* Meta */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", marginBottom:"12px" }}>
              {[
                { label:"Start",        value:c.start },
                { label:"End",          value:c.end   },
                { label:"Participants", value:c.participants || "Open" },
                { label:"Prizes",       value:`${c.prizes.length} tiers` },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", gap:"6px" }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, minWidth:"70px" }}>{row.label}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{row.value}</span>
                </div>
              ))}
            </div>
            {/* Prizes */}
            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}` }}>
              {c.prizes.slice(0,3).map((p,i) => (
                <span key={i} style={{ fontFamily:SANS, fontSize:"11px", color: i===0?G.orange:i===1?G.textSecondary:G.textSecondary, background:`${i===0?G.orange:i===1?G.textSecondary:G.textSecondary}12`, border:`1px solid ${i===0?G.orange:i===1?G.textSecondary:G.textSecondary}30`, borderRadius:"2px", padding:"2px 7px" }}>
                  {i===0?"1st":i===1?"2nd":"3rd"} {p}
                </span>
              ))}
              {c.prizes.length > 3 && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>+{c.prizes.length-3} more</span>}
            </div>
            <div style={{ marginTop:"10px" }}>
              {c.status === "active"   && <BtnPrimary style={{ width:"100%", padding:"6px", fontSize:"12px" }}>Enter Contest →</BtnPrimary>}
              {c.status === "upcoming" && <BtnGhost style={{ width:"100%", padding:"6px", fontSize:"12px" }}>Notify me</BtnGhost>}
              {c.status === "ended"    && <BtnGhost style={{ width:"100%", padding:"6px", fontSize:"12px" }}>View results</BtnGhost>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── BOUNTY VIEW ─────────────────────────────────────────────────────────────
const BountyView = () => {
  const [filter, setFilter] = useState("all");

  const shown = filter === "all" ? BOUNTIES : BOUNTIES.filter(b => b.status === filter);
  const statusColor = { open:G.success, "in-progress":G.textSecondary, completed:G.textDisabled };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"20px 24px 40px", animation:"fadeUp .2s ease" }}>
      <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>
        {/* Main */}
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ display:"flex", gap:"4px" }}>
              {[["all","All"],["open","Open"],["in-progress","In Progress"],["completed","Completed"]].map(([f,l]) => (
                <button key={f} className={`dtab ${filter===f?"on":""}`} onClick={() => setFilter(f)} style={{ fontSize:"12px", padding:"6px 12px" }}>{l}</button>
              ))}
            </div>
            <BtnPrimary style={{ padding:"4px 12px", fontSize:"11px" }}>+ Post Bounty</BtnPrimary>
          </div>

          {shown.map(b => (
            <Panel key={b.id} style={{ marginBottom:"8px" }}>
              <div style={{ padding:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                  <span style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, flex:1, marginRight:"10px" }}>{b.title}</span>
                  <Badge color={statusColor[b.status]}>{b.status}</Badge>
                </div>
                <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.65, marginBottom:"10px" }}>{b.desc}</p>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
                  {b.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:`1px solid ${G.borderWk}` }}>
                  <div style={{ display:"flex", gap:"16px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success }}>$ {b.budget}</span>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{b.deadline}</span>
                  </div>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{b.poster}</span>
                    <StarRating rating={b.posterRating} size={10} showValue={false}/>
                    {b.status === "open" && <BtnPrimary style={{ padding:"3px 10px", fontSize:"11px" }}>Claim →</BtnPrimary>}
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ width:"200px", flexShrink:0, display:"flex", flexDirection:"column", gap:"12px" }}>
          <Panel>
            <PanelHeader label="Bounty Stats"/>
            <div style={{ padding:"8px 16px" }}>
              {[
                { label:"Total bounties", value:"1,245" },
                { label:"Avg completion", value:"25 days" },
                { label:"Avg reward",     value:"$6,500" },
                { label:"Success rate",   value:"92%", color:G.success },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.label}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color: r.color || G.textSecondary }}>{r.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
// The gatekeeper: review PENDING_REVIEW submissions, inspect scan results,
// approve to publish or reject with a reason.
const AdminView = () => {
  const [selected,  setSelected]  = useState(PENDING_SUBMISSIONS[0].id);
  const [decisions, setDecisions] = useState({});   // id -> "approved"|"rejected"
  const [rejectMsg, setRejectMsg] = useState("");
  const [showReject, setShowReject] = useState(null); // id of item being rejected
  const [detailTab, setDetailTab] = useState("overview");

  const sub = PENDING_SUBMISSIONS.find(s => s.id === selected) || PENDING_SUBMISSIONS[0];
  const decision = decisions[selected];

  const approve = (id) => setDecisions(d => ({ ...d, [id]:"approved" }));
  const reject  = (id, msg) => { setDecisions(d => ({ ...d, [id]:"rejected" })); setShowReject(null); setRejectMsg(""); };

  const pendingCount = PENDING_SUBMISSIONS.filter(s => !decisions[s.id]).length;

  const tsColor = sub.trustScore >= 80 ? G.success : sub.trustScore >= 55 ? G.orange : G.error;

  return (
    <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

      {/* Header bar */}
      <div className="nx" style={{ padding:"14px 24px", borderBottom:`1px solid ${G.border}`, background:G.primary, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Admin Review Queue</h2>
            {pendingCount > 0 && (
              <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight:700, background:`${G.orange}22`, color:G.orange, border:`1px solid ${G.orange}44`, borderRadius:"8px", padding:"2px 8px" }}>{pendingCount} pending</span>
            )}
          </div>
          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Modules awaiting approval before going live on the marketplace.</span>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>SLA: review within 48h</div>
          <div style={{ display:"flex", alignItems:"center", gap:"4px", background:`${G.success}12`, border:`1px solid ${G.success}40`, borderRadius:"4px", padding:"4px 10px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.success }}/>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success }}>Queue active</span>
          </div>
        </div>
      </div>

      {/* Two-panel layout: queue list left, detail right */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── LEFT: submission queue ── */}
        <div style={{ width:"280px", flexShrink:0, borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", background:G.primary }}>
          <div style={{ padding:"10px 12px", borderBottom:`1px solid ${G.border}`, display:"flex", gap:"6px" }}>
            {[
              { label:"Pending", count:pendingCount, color:G.orange },
              { label:"Approved", count:Object.values(decisions).filter(d=>d==="approved").length, color:G.success },
              { label:"Rejected", count:Object.values(decisions).filter(d=>d==="rejected").length, color:G.error },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ flex:1, textAlign:"center", background:G.secondary, borderRadius:"4px", padding:"6px 4px", border:`1px solid ${G.border}` }}>
                <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color, lineHeight:1 }}>{count}</div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"2px", textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            {PENDING_SUBMISSIONS.map(s => {
              const dec = decisions[s.id];
              const riskColor = s.c > 0 ? G.error : s.h > 0 ? G.orange : G.success;
              const isActive = selected === s.id;
              return (
                <div key={s.id} onClick={() => { setSelected(s.id); setDetailTab("overview"); }} style={{
                  padding:"12px 14px", borderBottom:`1px solid ${G.borderWk}`,
                  background: isActive ? G.elevated : "transparent",
                  borderLeft:`3px solid ${isActive ? G.orange : "transparent"}`,
                  cursor:"pointer", transition:"all .1s",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"4px" }}>
                    <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:700, color:G.textPrimary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"160px" }}>{s.name}</div>
                    {dec === "approved" && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success, background:`${G.success}18`, border:`1px solid ${G.success}40`, borderRadius:"2px", padding:"1px 5px", flexShrink:0 }}>Approved</span>}
                    {dec === "rejected" && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.error, background:`${G.error}18`, border:`1px solid ${G.error}40`, borderRadius:"2px", padding:"1px 5px", flexShrink:0 }}>Rejected</span>}
                    {!dec && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.orange, background:`${G.orange}18`, border:`1px solid ${G.orange}40`, borderRadius:"2px", padding:"1px 5px", flexShrink:0 }}>Review</span>}
                  </div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"8px" }}>{s.author} · v{s.ver}</div>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:riskColor, background:`${riskColor}18`, border:`1px solid ${riskColor}40`, borderRadius:"2px", padding:"1px 5px" }}>
                      {s.c > 0 ? `${s.c}C ${s.h}H ${s.m}M` : s.h > 0 ? `${s.h}H ${s.m}M` : s.m > 0 ? `${s.m}M` : "✓ Clean"}
                    </span>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>SLSA L{s.slsa}</span>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginLeft:"auto" }}>{s.submittedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: detail panel ── */}
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {/* Module header */}
          <div style={{ padding:"18px 24px 0", borderBottom:`1px solid ${G.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                  <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary }}>{sub.name}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, background:G.elevated, border:`1px solid ${G.border}`, borderRadius:"2px", padding:"2px 7px" }}>v{sub.ver}</span>
                  <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>SLSA L{sub.slsa}</span>
                </div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"4px" }}>
                  {sub.imageRef}
                </div>
                <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>
                  by <span style={{ color:G.textSecondary }}>{sub.author}</span>
                  <span style={{ margin:"0 8px" }}>·</span>Submitted {sub.submittedFull}
                  <span style={{ margin:"0 8px" }}>·</span>{sub.imageSize}
                  <span style={{ margin:"0 8px" }}>·</span>Built in {sub.buildTime}
                </div>
              </div>

              {/* Action buttons */}
              {!decision && (
                <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                  <button onClick={() => setShowReject(sub.id)} style={{ display:"flex", alignItems:"center", gap:"6px", background:`${G.error}14`, border:`1px solid ${G.error}50`, borderRadius:"4px", padding:"8px 18px", cursor:"pointer", fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.error, transition:"all .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${G.error}22`; e.currentTarget.style.borderColor=`${G.error}88`; }}
                    onMouseLeave={e => { e.currentTarget.style.background=`${G.error}14`; e.currentTarget.style.borderColor=`${G.error}50`; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Reject
                  </button>
                  <button onClick={() => approve(sub.id)} style={{ display:"flex", alignItems:"center", gap:"6px", background:`${G.success}14`, border:`1px solid ${G.success}50`, borderRadius:"4px", padding:"8px 22px", cursor:"pointer", fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.success, transition:"all .12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${G.success}22`; e.currentTarget.style.borderColor=`${G.success}88`; }}
                    onMouseLeave={e => { e.currentTarget.style.background=`${G.success}14`; e.currentTarget.style.borderColor=`${G.success}50`; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Approve
                  </button>
                </div>
              )}
              {decision === "approved" && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", background:`${G.success}12`, border:`1px solid ${G.success}40`, borderRadius:"4px", padding:"8px 18px" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke={G.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.success }}>Approved — live on marketplace</span>
                </div>
              )}
              {decision === "rejected" && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", background:`${G.error}12`, border:`1px solid ${G.error}40`, borderRadius:"4px", padding:"8px 18px" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke={G.error} strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.error }}>Rejected</span>
                </div>
              )}
            </div>

            {/* Reject reason modal */}
            {showReject === sub.id && (
              <div style={{ margin:"12px 0", background:`${G.error}08`, border:`1px solid ${G.error}40`, borderRadius:"4px", padding:"16px" }}>
                <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.error, marginBottom:"8px" }}>Rejection reason (sent to developer)</div>
                <textarea value={rejectMsg} onChange={e => setRejectMsg(e.target.value)}
                  placeholder="e.g. 2 CRITICAL CVEs must be resolved before re-submission. Please upgrade openssl to >= 3.0.13 and resubmit."
                  style={{ width:"100%", minHeight:"72px", background:G.canvas, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"9px 12px", fontFamily:SANS, fontSize:"12px", color:G.textPrimary, resize:"vertical", outline:"none", lineHeight:1.6 }}
                />
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  <button onClick={() => reject(sub.id, rejectMsg)} style={{ background:`${G.error}18`, border:`1px solid ${G.error}55`, borderRadius:"4px", padding:"6px 16px", fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.error, cursor:"pointer" }}>Send Rejection</button>
                  <button onClick={() => { setShowReject(null); setRejectMsg(""); }} style={{ background:"transparent", border:`1px solid ${G.border}`, borderRadius:"4px", padding:"6px 14px", fontFamily:SANS, fontSize:"12px", color:G.textDisabled, cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Risk flags */}
            {sub.riskFlags.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"12px" }}>
                {sub.riskFlags.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"4px", background: f.level==="error" ? `${G.error}10` : f.level==="warn" ? `${G.orange}10` : `${G.textSecondary}10`, border:`1px solid ${f.level==="error" ? G.error : f.level==="warn" ? G.orange : G.textSecondary}40`, borderRadius:"4px", padding:"4px 10px" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background: f.level==="error" ? G.error : f.level==="warn" ? G.orange : G.textSecondary, flexShrink:0 }}/>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color: f.level==="error" ? G.error : f.level==="warn" ? G.orange : G.textSecondary }}>{f.msg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0" }}>
              {[["overview","Overview"],["scan","Scan Report"],["sbom","SBOM"],["buildlog","Build Log"]].map(([id, label]) => (
                <button key={id} onClick={() => setDetailTab(id)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:SANS, fontSize:"12px", fontWeight: detailTab===id ? 600 : 400, color: detailTab===id ? G.textPrimary : G.textDisabled, padding:"0 0 12px 0", marginRight:"24px", letterSpacing:".03em", borderBottom: detailTab===id ? `2px solid ${G.orange}` : "2px solid transparent", transition:"all .12s", textTransform:"uppercase" }}
                  onMouseEnter={e => { if(detailTab!==id) e.currentTarget.style.color=G.textSecondary; }}
                  onMouseLeave={e => { if(detailTab!==id) e.currentTarget.style.color=G.textDisabled; }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding:"22px 24px 60px", flex:1 }}>

            {/* ── Overview ── */}
            {detailTab === "overview" && (
              <div style={{ animation:"fadeUp .15s ease", display:"flex", gap:"16px", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <Panel style={{ marginBottom:"12px" }}>
                    <PanelHeader label="Description"/>
                    <div style={{ padding:"16px" }}>
                      <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.8, marginBottom:"16px" }}>{sub.desc}</p>
                      <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                        {sub.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                  </Panel>

                  <Panel>
                    <PanelHeader label="Image Details"/>
                    <div style={{ padding:"16px" }}>
                      {[
                        { label:"Image Ref",    value:sub.imageRef, mono:true },
                        { label:"Digest",       value:sub.digest,   mono:true },
                        { label:"Size",         value:sub.imageSize, mono:true },
                        { label:"Build Time",   value:sub.buildTime },
                        { label:"SBOM Packages",value:sub.sbomPackages + " packages", mono:true },
                        { label:"License",      value:sub.license },
                        { label:"SLSA Level",   value:"Level " + sub.slsa },
                        { label:"Submitted",    value:sub.submittedFull },
                      ].map(r => (
                        <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.label}</span>
                          <span style={{ fontFamily: r.mono ? MONO : SANS, fontSize:"11px", color:G.textSecondary, wordBreak:"break-all", textAlign:"right", maxWidth:"65%" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                {/* Trust score sidebar */}
                <div style={{ width:"200px", flexShrink:0 }}>
                  <Panel style={{ marginBottom:"12px" }}>
                    <PanelHeader label="Trust Score"/>
                    <div style={{ padding:"16px", textAlign:"center" }}>
                      <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"42px", color:tsColor, letterSpacing:"-0.02em", lineHeight:1, marginBottom:"6px" }}>{sub.trustScore}</div>
                      <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginBottom:"16px" }}>out of 100</div>
                      <div style={{ height:"6px", background:G.elevated, borderRadius:"2px", overflow:"hidden", marginBottom:"16px" }}>
                        <div style={{ width:`${sub.trustScore}%`, height:"100%", background:tsColor, borderRadius:"2px", transition:"width .4s ease" }}/>
                      </div>
                      {[
                        { label:"CVE Score",    val: sub.c === 0 && sub.h === 0 ? 30 : sub.c > 0 ? 0 : 15, max:30 },
                        { label:"SLSA Level",   val: sub.slsa * 10, max:30 },
                        { label:"SBOM",         val:15, max:15 },
                        { label:"Signature",    val:10, max:10 },
                        { label:"Provenance",   val:15, max:15 },
                      ].map(d => (
                        <div key={d.label} style={{ marginBottom:"6px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{d.label}</span>
                            <span style={{ fontFamily:SANS, fontSize:"11px", color: d.val === d.max ? G.success : d.val > 0 ? G.orange : G.error }}>{d.val}/{d.max}</span>
                          </div>
                          <div style={{ height:"3px", background:G.elevated, borderRadius:"2px", overflow:"hidden" }}>
                            <div style={{ width:`${(d.val/d.max)*100}%`, height:"100%", background: d.val === d.max ? G.success : d.val > 0 ? G.orange : G.error, borderRadius:"2px" }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel>
                    <PanelHeader label="Scan Summary"/>
                    <div style={{ padding:"12px" }}>
                      {[
                        { label:"CRITICAL", val:sub.c, color:G.error },
                        { label:"HIGH",     val:sub.h, color:G.orange },
                        { label:"MEDIUM",   val:sub.m, color:G.textSecondary },
                        { label:"LOW",      val:sub.l, color:G.textDisabled },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                          <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{label}</span>
                          <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color: val > 0 ? color : G.textDisabled }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {/* ── Scan Report ── */}
            {detailTab === "scan" && (
              <div style={{ animation:"fadeUp .15s ease" }}>
                <Panel style={{ marginBottom:"12px" }}>
                  <PanelHeader label="Vulnerability Summary" sub={`Trivy · ${sub.c + sub.h + sub.m + sub.l} total findings`} action={<ScanResult c={sub.c} h={sub.h} m={sub.m}/>}/>
                  <div style={{ padding:"16px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"16px" }}>
                      {[{ l:"CRITICAL",val:sub.c,c:G.error },{ l:"HIGH",val:sub.h,c:G.error },{ l:"MEDIUM",val:sub.m,c:G.textSecondary },{ l:"LOW",val:sub.l,c:G.textDisabled }].map(({ l, val, c }) => (
                        <div key={l} style={{ background:G.secondary, border:`1px solid ${G.borderWk}`, borderRadius:"4px", padding:"12px", textAlign:"center" }}>
                          <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"24px", color: val > 0 ? c : G.textDisabled, lineHeight:1, letterSpacing:"-0.015em" }}>{val}</div>
                          <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, marginTop:"4px", textTransform:"uppercase", letterSpacing:".03em" }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {sub.c > 0 && (
                      <div style={{ background:`${G.error}08`, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.error}`, borderRadius:"0 4px 4px 0", padding:"8px 16px", marginBottom:"10px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>{sub.c} CRITICAL finding(s) detected. Module cannot be approved until resolved.</span>
                      </div>
                    )}
                    {sub.c === 0 && sub.h === 0 && (
                      <div style={{ background:`${G.success}08`, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.success}`, borderRadius:"0 4px 4px 0", padding:"8px 16px" }}>
                        <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary }}>No CRITICAL or HIGH vulnerabilities. Module is eligible for Verified badge.</span>
                      </div>
                    )}
                  </div>
                </Panel>
                <Panel>
                  <PanelHeader label="Findings"/>
                  <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 80px 80px 60px", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
                    {["CVE ID","Package","Severity","Fixed In","Score"].map(h => (
                      <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
                    ))}
                  </div>
                  {sub.c > 0 && [
                    { id:"CVE-2024-7890", pkg:"openssl 3.0.11",    sev:"CRITICAL", fix:"3.0.13", score:"9.8", color:G.error },
                    { id:"CVE-2024-7891", pkg:"grpc 1.51.0",       sev:"CRITICAL", fix:"1.56.2", score:"9.1", color:G.error },
                  ].slice(0, sub.c).map((r, i) => (
                    <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 80px 80px 60px", padding:"9px 16px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center" }}>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:r.color }}>{r.id}</span>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{r.pkg}</span>
                      <span><Badge color={r.color}>{r.sev}</Badge></span>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.success }}>{r.fix}</span>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>{r.score}</span>
                    </div>
                  ))}
                  {sub.h > 0 && (
                    <div className="trow" style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 80px 80px 60px", padding:"9px 16px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center" }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.orange }}>CVE-2024-1234</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>openssl 3.0.11</span>
                      <span><Badge color={G.orange}>HIGH</Badge></span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success }}>3.0.13</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>7.5</span>
                    </div>
                  )}
                  {sub.m > 0 && [
                    { id:"CVE-2024-5678", pkg:"libexpat 2.5.0", score:"5.3" },
                    { id:"CVE-2023-9012", pkg:"zlib 1.2.13",    score:"4.8" },
                    { id:"CVE-2024-3344", pkg:"curl 8.1.2",     score:"4.3" },
                  ].slice(0, sub.m).map((r, i) => (
                    <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"1.8fr 1.2fr 80px 80px 60px", padding:"9px 16px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center" }}>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{r.id}</span>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textSecondary }}>{r.pkg}</span>
                      <span><Badge color={G.textSecondary}>MEDIUM</Badge></span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.success }}>→ patched</span>
                      <span style={{ fontFamily:MONO, fontSize:"11px", color:G.textDisabled }}>{r.score}</span>
                    </div>
                  ))}
                  {sub.c === 0 && sub.h === 0 && sub.m === 0 && (
                    <div style={{ padding:"20px 16px", textAlign:"center" }}>
                      <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>No findings. Module is clean.</span>
                    </div>
                  )}
                </Panel>
              </div>
            )}

            {/* ── SBOM ── */}
            {detailTab === "sbom" && (
              <div style={{ animation:"fadeUp .15s ease" }}>
                <Panel style={{ marginBottom:"12px" }}>
                  <PanelHeader label="Software Bill of Materials" sub={`${sub.sbomPackages} packages · CycloneDX 1.4`} action={
                    <button style={{ background:"transparent", border:`1px solid ${G.border}`, borderRadius:"2px", padding:"3px 10px", fontFamily:SANS, fontSize:"11px", color:G.textDisabled, cursor:"pointer" }}>Download JSON</button>
                  }/>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"6px 16px", background:G.secondary, borderBottom:`1px solid ${G.border}` }}>
                    {["Package","Version","License","Type"].map(h => (
                      <span key={h} style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".03em" }}>{h}</span>
                    ))}
                  </div>
                  {[
                    { name:"openssl",      ver:"3.0.11", lic:"Apache-2.0",  type:"library"  },
                    { name:"zlib",         ver:"1.2.13", lic:"Zlib",        type:"library"  },
                    { name:"libexpat",     ver:"2.5.0",  lic:"MIT",         type:"library"  },
                    { name:"curl",         ver:"8.1.2",  lic:"curl",        type:"library"  },
                    { name:"ca-certificates",ver:"20230311",lic:"MPL-2.0",  type:"system"   },
                    { name:"libc6",        ver:"2.36",   lic:"LGPL-2.1",   type:"system"   },
                    { name:"tzdata",       ver:"2024a",  lic:"Public Domain",type:"data"    },
                    { name:"bash",         ver:"5.2.15", lic:"GPL-3.0",    type:"shell"    },
                  ].map((p, i) => (
                    <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"8px 16px", borderBottom:`1px solid ${G.borderWk}`, alignItems:"center" }}>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textPrimary }}>{p.name}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{p.ver}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{p.lic}</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{p.type}</span>
                    </div>
                  ))}
                  <div style={{ padding:"8px 16px", background:G.secondary, borderTop:`1px solid ${G.border}` }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Showing 8 of {sub.sbomPackages} packages</span>
                  </div>
                </Panel>
              </div>
            )}

            {/* ── Build Log ── */}
            {detailTab === "buildlog" && (
              <div style={{ animation:"fadeUp .15s ease" }}>
                <Panel>
                  <PanelHeader label="Build Log" sub={`${sub.buildTime} · ${sub.imageSize}`}/>
                  <div style={{ background:"#080808", padding:"18px 0" }}>
                    {sub.buildLog.map((line, i) => {
                      const isOk   = line.includes("complete") || line.includes("built") || line.includes("signed") || line.includes("attached") || line.includes("verified") || line.includes("Pushed");
                      const isWarn = line.includes("review");
                      return (
                        <div key={i} style={{ display:"flex", gap:"0", padding:"2px 24px", fontFamily:MONO, fontSize:"12px", lineHeight:1.9 }}>
                          <span style={{ color:G.textDisabled, marginRight:"20px", flexShrink:0, userSelect:"none" }}>{String(i+1).padStart(3,"0")}</span>
                          <span style={{ color: isOk ? "#7EC8A0" : isWarn ? G.orange : "#82B4D0" }}>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};


// ─── DEPLOY WIZARD VIEW ───────────────────────────────────────────────────────
const DeployWizardView = ({ module: m, onClose }) => {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState(null);
  const [progress, setProgress] = useState(0);
  const [execLogs, setExecLogs] = useState([
    { t:`[00:00.0] Deploying ${m ? m.name : "module"}…`, c:G.textDisabled },
    { t:"[00:00.1] Resolving digest from ECR registry…", c:G.textSecondary },
  ]);
  const [execDone, setExecDone] = useState(false);
  const logRef = useRef(null);

  const METHODS = [
    { id:"docker",     title:"Docker Compose", desc:"Run as a standalone container on any Docker host with a generated compose file.", features:["Full data control","Custom networking","Compose v2 compatible"] },
    { id:"kubernetes", title:"Kubernetes",      desc:"Deploy to a Kubernetes cluster via Helm chart. Supports HPA, PVCs, and ingress.", features:["Auto-scaling","Health probes","Helm v3 chart"] },
    { id:"api",        title:"API Endpoint",   desc:"Expose the module as a managed REST API endpoint — no infrastructure to manage.", features:["Zero infrastructure","Rate limiting","API key auth"] },
  ];

  const STEPS = ["Method","Configure","Preview","Executing","Complete"];

  const execSteps = [
    { label:"Pull image digest",   done: progress >= 20 },
    { label:"Apply configuration", done: progress >= 40 },
    { label:"Start container",     done: progress >= 65 },
    { label:"Health check",        done: progress >= 85 },
    { label:"Register endpoint",   done: progress >= 100 },
  ];

  // Progress simulation when on step 3
  useEffect(() => {
    if (step !== 3) return;
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setExecDone(true); return 100; }
        const next = p + 2;
        if (next === 20) setExecLogs(l => [...l, { t:"[00:04.2] Image pulled → sha256:" + (m && m.digest ? m.digest.substring(7,21) : "a3f9d2c1b5e7"), c:G.success }]);
        if (next === 40) setExecLogs(l => [...l, { t:"[00:09.1] Env vars injected, ports mapped", c:G.success }]);
        if (next === 65) setExecLogs(l => [...l, { t:"[00:15.3] Container started — PID 1 init", c:G.success }]);
        if (next === 85) setExecLogs(l => [...l, { t:"[00:21.7] Health check passed (HTTP 200)", c:G.success }]);
        if (next >= 98) setExecLogs(l => [...l, { t:"[00:26.0] Endpoint registered. Deploy complete.", c:G.success }]);
        return next;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [step]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 99999; }, [execLogs]);

  useEffect(() => {
    if (step === 3 && execDone) {
      const t = setTimeout(() => setStep(4), 600);
      return () => clearTimeout(t);
    }
  }, [execDone, step]);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", animation:"fadeUp .2s ease" }}>
      {/* Step indicator */}
      <div className="nx" style={{ padding:"0 24px", height:"48px", flexShrink:0, background:G.primary, borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:"0" }}>
        {STEPS.map((s, i) => (
          <span key={s} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{ width:"22px", height:"22px", borderRadius:"50%", background: i < step ? G.success : i === step ? G.orange : G.elevated, border:`1px solid ${i < step ? G.success : i === step ? G.orange : G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {i < step
                  ? <span style={{ fontSize:"11px", color:"#fff" }}>✓</span>
                  : <span style={{ fontFamily:MONO, fontSize:"11px", color: i === step ? "#fff" : G.textDisabled }}>{i+1}</span>
                }
              </span>
              <span style={{ fontFamily:SANS, fontSize:"11px", fontWeight: i === step ? 600 : 400, color: i <= step ? G.textPrimary : G.textDisabled, whiteSpace:"nowrap" }}>{s}</span>
            </span>
            {i < STEPS.length-1 && <span style={{ width:"24px", height:"1px", background: i < step ? `${G.success}60` : G.border, margin:"0 6px" }}/>}
          </span>
        ))}
        <div style={{ flex:1 }}/>
        <button onClick={onClose} style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, background:"none", border:"none", cursor:"pointer" }}>Cancel</button>
      </div>

      {/* Step content */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>

        {/* Step 0: Method selection */}
        {step === 0 && (
          <div>
            <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>Choose deployment method</h3>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"20px" }}>Select how you want to run {m && m.name} on your infrastructure.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
              {METHODS.map(mt => (
                <div key={mt.id} onClick={() => setMethod(mt.id)} style={{
                  background: method === mt.id ? G.orangeFaded : G.secondary,
                  border:`1px solid ${method === mt.id ? G.orange+"60" : G.border}`,
                  borderTop:`1px solid ${method === mt.id ? G.orange+"60" : "rgba(255,255,255,0.055)"}`,
                  borderRadius:"4px", padding:"16px", cursor:"pointer", transition:"all .15s",
                }}>
                  <div style={{ fontFamily:SANS, fontWeight:600, fontSize:"13px", color:G.textPrimary, marginBottom:"6px" }}>{mt.title}</div>
                  <p style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, lineHeight:1.65, marginBottom:"12px" }}>{mt.desc}</p>
                  {mt.features.map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                      <span style={{ fontSize:"11px", color:G.success }}>✓</span>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{f}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <BtnPrimary onClick={() => method && setStep(1)} style={{ opacity: method ? 1 : 0.4 }}>Next: Configure →</BtnPrimary>
            </div>
          </div>
        )}

        {/* Step 1: Configure */}
        {step === 1 && (
          <div>
            <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>Configure deployment</h3>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"20px" }}>Set basic parameters for your {m && m.name} instance.</p>
            <Panel style={{ maxWidth:"560px", marginBottom:"16px" }}>
              <PanelHeader label="Basic configuration"/>
              <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {[
                  { label:"Instance name",  placeholder:`${m ? m.name : "module"}-prod`, span:2 },
                  { label:"Region",         placeholder:"us-east-1" },
                  { label:"Version",        placeholder:`v${m ? m.ver : "latest"}` },
                ].map(field => (
                  <div key={field.label} style={{ gridColumn: field.span ? `span ${field.span}` : "auto" }}>
                    <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textSecondary, marginBottom:"4px" }}>{field.label}</div>
                    <input defaultValue="" placeholder={field.placeholder} style={{ width:"100%", background:G.secondary, border:`1px solid ${G.border}`, borderRadius:"4px", padding:"6px 10px", fontFamily:SANS, fontSize:"12px", color:G.textPrimary, outline:"none" }}/>
                  </div>
                ))}
              </div>
            </Panel>
            {m && m.ports && m.ports.length > 0 && (
              <Panel style={{ maxWidth:"560px", marginBottom:"16px" }}>
                <PanelHeader label="Port mapping"/>
                <div style={{ padding:"12px 16px" }}>
                  {m.ports.map(p => (
                    <div key={p} style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary, padding:"4px 0" }}>{p}</div>
                  ))}
                </div>
              </Panel>
            )}
            <div style={{ display:"flex", gap:"8px", maxWidth:"560px" }}>
              <BtnGhost onClick={() => setStep(0)} style={{ flex:1 }}>← Back</BtnGhost>
              <BtnPrimary onClick={() => setStep(2)} style={{ flex:2 }}>Next: Preview →</BtnPrimary>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>Preview &amp; validate</h3>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"20px" }}>Review the generated configuration before deploying.</p>
            <Panel style={{ maxWidth:"640px", marginBottom:"16px" }}>
              <PanelHeader label="Generated compose" sub={`${method} deployment`}/>
              <div style={{ padding:"12px" }}>
                <CodeBlock code={COMPOSE_YAML} lang="YAML"/>
              </div>
            </Panel>
            <div style={{ display:"flex", gap:"8px", maxWidth:"640px" }}>
              <BtnGhost onClick={() => setStep(1)} style={{ flex:1 }}>← Back</BtnGhost>
              <BtnPrimary onClick={() => setStep(3)} style={{ flex:2 }}>Deploy →</BtnPrimary>
            </div>
          </div>
        )}

        {/* Step 3: Executing */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"13px", color:G.textPrimary, marginBottom:"4px" }}>Deploying…</h3>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"20px" }}>Do not close this tab. You'll be notified when complete.</p>
            <div style={{ maxWidth:"560px" }}>
              <Panel style={{ marginBottom:"12px" }}>
                <PanelHeader label="Progress" sub={`${Math.round(progress)}%`} action={<span style={{ fontFamily:SANS, fontSize:"11px", color: progress < 100 ? G.orange : G.success }}>{progress < 100 ? "running" : "done"}</span>}/>
                <div style={{ padding:"12px 16px" }}>
                  <div style={{ height:"5px", borderRadius:"2px", background:G.elevated, marginBottom:"16px", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${progress}%`, background: progress < 100 ? G.orange : G.success, borderRadius:"2px", transition:"width .2s" }}/>
                  </div>
                  {execSteps.map((s, i) => (
                    <div key={s.label} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 0" }}>
                      <div style={{ width:"16px", height:"16px", borderRadius:"50%", background: s.done ? `${G.success}20` : G.elevated, border:`1px solid ${s.done ? G.success+"50" : G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {s.done && <span style={{ fontSize:"11px", color:G.success }}>✓</span>}
                      </div>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color: s.done ? G.textPrimary : G.textDisabled }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <PanelHeader label="Deploy log"/>
                <div ref={logRef} style={{ maxHeight:"160px", overflowY:"auto", padding:"8px 14px", fontFamily:MONO, fontSize:"11px", lineHeight:1.9 }}>
                  {execLogs.map((l, i) => <div key={i} style={{ color: l.c || G.textSecondary }}>{l.t}</div>)}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div style={{ textAlign:"center", maxWidth:"480px", margin:"0 auto", paddingTop:"32px" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:`${G.success}18`, border:`1px solid ${G.success}40`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <span style={{ fontSize:"24px", color:G.success }}>✓</span>
            </div>
            <h3 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, marginBottom:"8px" }}>Deployed successfully!</h3>
            <p style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled, marginBottom:"24px" }}>
              {m && m.name} is running on your infrastructure. Use the credentials below to access it.
            </p>
            <Panel style={{ textAlign:"left", marginBottom:"16px" }}>
              <PanelHeader label="Access credentials"/>
              <div style={{ padding:"12px 14px" }}>
                {[
                  { label:"Endpoint",  value:`https://${m ? m.name : "module"}.local` },
                  { label:"Image URI", value:`ecr.aws/flareo/${m ? m.name : "module"}:latest` },
                  { label:"API Key",   value:"sk_flareo_••••••••••••••••" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${G.borderWk}` }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{r.label}</span>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
              <BtnGhost onClick={onClose}>Back to detail</BtnGhost>
              <BtnPrimary>View API docs →</BtnPrimary>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



// ─── PUBLISH VIEW ─────────────────────────────────────────────────────────────
const PublishView = ({ onJobCreated }) => {
  const [imageRef,   setImageRef]   = useState("");
  const [modName,    setModName]    = useState("");
  const [previewable,setPreviewable]= useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!imageRef.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitted(true);
      const jobId = "job_" + Math.random().toString(36).slice(2, 8);
      setTimeout(() => onJobCreated && onJobCreated(jobId, imageRef.trim(), modName.trim()), 1200);
    }, 1400);
  };

  const isValid = imageRef.trim().length > 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"36px 0 60px", display:"flex", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:"680px", padding:"0 24px" }}>

        <h1 style={{ fontFamily:SANS, fontWeight:700, fontSize:"18px", color:G.textPrimary, letterSpacing:"-0.015em", marginBottom:"6px" }}>Publish Image</h1>
        <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, marginBottom:"32px", lineHeight:1.6 }}>Submit a container image reference for security verification and distribution in the Flareo marketplace.</p>

        {!submitted ? (
          <div>
            {/* Pipeline preview strip */}
            <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"16px 20px", marginBottom:"24px" }}>
              <div style={{ fontFamily:SANS, fontSize:"11px", fontWeight:600, color:G.textDisabled, textTransform:"uppercase", letterSpacing:".04em", marginBottom:"12px" }}>What happens after submission</div>
              <div style={{ display:"flex", alignItems:"center", gap:"0", overflowX:"auto" }}>
                {[
                  { step:"Image Pull",      color:G.textSecondary    },
                  { step:"Trivy Scan",      color:G.textSecondary },
                  { step:"SBOM Generate",   color:G.textSecondary },
                  { step:"Policy Gate",     color:G.textSecondary },
                  { step:"cosign Sign",     color:G.success },
                  { step:"SLSA Attest",     color:G.success },
                  { step:"Admin Review",    color:G.textSecondary    },
                ].map((s, i, arr) => (
                  <div key={s.step} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:s.color, margin:"0 auto 5px", opacity:.7 }}/>
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, whiteSpace:"nowrap" }}>{s.step}</span>
                    </div>
                    {i < arr.length-1 && <div style={{ width:"20px", height:"1px", background:G.border, margin:"0 4px", marginTop:"-11px", flexShrink:0 }}/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"24px", marginBottom:"16px" }}>
              <div style={{ marginBottom:"24px" }}>
                <label style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, display:"block", marginBottom:"8px" }}>
                  Image Reference <span style={{ color:G.success }}>*</span>
                </label>
                <input
                  value={imageRef}
                  onChange={e => setImageRef(e.target.value)}
                  placeholder="e.g., redis:7.2.0-alpine  or  repo/name@sha256:..."
                  style={{
                    width:"100%", boxSizing:"border-box",
                    padding:"9px 12px",
                    background:"#080808", border:`1px solid ${imageRef.trim() ? G.orange+"50" : G.border}`,
                    borderRadius:"4px", outline:"none",
                    fontFamily:SANS, fontSize:"12px", color:G.textPrimary,
                    transition:"border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor=G.orange+"80"}
                  onBlur={e => e.target.style.borderColor=imageRef.trim() ? G.orange+"50" : G.border}
                />
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, display:"block", marginTop:"4px" }}>Must be publicly accessible or use a digest pin (sha256:...).</span>
              </div>

              <div style={{ marginBottom:"24px" }}>
                <label style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color:G.textPrimary, display:"block", marginBottom:"8px" }}>
                  Module Name <span style={{ fontFamily:SANS, fontWeight:400, color:G.textDisabled }}>(optional)</span>
                </label>
                <input
                  value={modName}
                  onChange={e => setModName(e.target.value)}
                  placeholder="e.g., Redis Stack Server"
                  style={{
                    width:"100%", boxSizing:"border-box",
                    padding:"9px 12px",
                    background:"#080808", border:`1px solid ${G.border}`,
                    borderRadius:"4px", outline:"none",
                    fontFamily:SANS, fontSize:"13px", color:G.textPrimary,
                    transition:"border-color .15s",
                  }}
                  onFocus={e => e.target.style.borderColor="#404040"}
                  onBlur={e => e.target.style.borderColor=G.border}
                />
              </div>

              <div style={{ paddingTop:"18px", borderTop:`1px solid ${G.border}` }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:"12px", cursor:"pointer" }}>
                  {/* Custom checkbox */}
                  <div
                    onClick={() => setPreviewable(p => !p)}
                    style={{
                      width:"18px", height:"18px", flexShrink:0, marginTop:"1px",
                      borderRadius:"4px", border:`1.5px solid ${previewable ? G.success : G.border}`,
                      background: previewable ? `${G.success}15` : "#080808",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      cursor:"pointer", transition:"all .12s",
                    }}
                  >
                    {previewable && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={G.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div>
                    <span style={{ fontFamily:SANS, fontSize:"13px", fontWeight:600, color:G.textPrimary, display:"block", marginBottom:"3px" }}>Request Previewable Status</span>
                    <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.6, display:"block" }}>
                      Requires a single HTTP container, fixed port, and low resource usage (0.5 vCPU, 512 MB). If verification fails these constraints, the module will be published as Config-only.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* VEX disclaimer */}
            <div style={{ background:`${G.textSecondary}08`, border:`1px solid ${G.border}`, borderLeft:`3px solid ${G.textSecondary}`, borderRadius:"0 4px 4px 0", padding:"8px 16px", marginBottom:"24px" }}>
              <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textSecondary, lineHeight:1.6 }}>All published modules receive a full Trust Score based on SBOM presence, SLSA provenance, cosign signature, and vulnerability severity. Scores and full scan reports are visible on the module detail page.</span>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <BtnPrimary
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                style={{ padding:"9px 24px", fontSize:"13px", opacity: (!isValid || submitting) ? .45 : 1, cursor: (!isValid || submitting) ? "not-allowed" : "pointer" }}
              >
                {submitting ? (
                  <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ width:"10px", height:"10px", borderRadius:"50%", border:`1.5px solid ${G.orange}40`, borderTop:`1.5px solid ${G.orange}`, animation:"spin .7s linear infinite", display:"block" }}/>
                    Queuing...
                  </span>
                ) : "Submit for Verification"}
              </BtnPrimary>
            </div>
          </div>
        ) : (
          /* Success state */
          <div style={{ background:G.secondary, border:`1px solid ${G.border}`, borderTop:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"48px 32px", textAlign:"center" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`${G.success}15`, border:`1.5px solid ${G.success}40`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke={G.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, marginBottom:"8px" }}>Submission Queued</h2>
            <p style={{ fontFamily:SANS, fontSize:"13px", color:G.textSecondary, lineHeight:1.6, marginBottom:"8px" }}>Your image is being processed. Opening pipeline execution view...</p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginTop:"8px" }}>
              <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:G.orange, animation:"pulse 1.5s infinite", display:"block" }}/>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>redirecting</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── JOB STATUS VIEW ──────────────────────────────────────────────────────────
const JobStatusView = ({ jobData, addLog, onOpenConsole }) => {
  const [steps, setSteps] = useState([
    { name:"Pull Image",        status:"running", time:null,   error:null },
    { name:"Trivy Scan",        status:"pending", time:null,   error:null },
    { name:"Generate SBOM",     status:"pending", time:null,   error:null },
    { name:"Policy Gate",       status:"pending", time:null,   error:null },
    { name:"cosign Sign",       status:"pending", time:null,   error:null },
    { name:"SLSA Attestation",  status:"pending", time:null,   error:null },
    { name:"Publish Version",   status:"pending", time:null,   error:null },
  ]);
  const [elapsed, setElapsed] = useState(0);
  const [jobDone, setJobDone] = useState(false);
  const elRef = useRef(null);

  const stepDurations = [1800, 7000, 4000, 800, 2000, 1500, 1000]; // ms each

  useEffect(() => {
    if (onOpenConsole) onOpenConsole();
    if (addLog) {
      addLog("[JOB] Pipeline started for: " + (jobData.modName || jobData.imageRef));
      addLog("[JOB] Step 1: Pull Image — IN PROGRESS");
    }

    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx >= steps.length) {
        setJobDone(true);
        if (addLog) addLog("[JOB] Pipeline complete — all steps passed");
        return;
      }
      const dur = stepDurations[stepIdx] || 1500;
      const currentIdx = stepIdx;
      const logMsgs = [
        "[JOB] Pulling image from registry...",
        "[JOB] Running Trivy vulnerability scan...",
        "[JOB] Generating CycloneDX SBOM...",
        "[JOB] Evaluating admission-policy.json...",
        "[JOB] Signing with cosign keyless (Sigstore)...",
        "[JOB] Generating SLSA L1 in-toto attestation...",
        "[JOB] Publishing to marketplace...",
      ];
      setTimeout(() => {
        setSteps(prev => {
          const next = [...prev];
          next[currentIdx] = { ...next[currentIdx], status:"done", time: (dur/1000).toFixed(1)+"s" };
          if (currentIdx + 1 < next.length) {
            next[currentIdx+1] = { ...next[currentIdx+1], status:"running" };
            if (addLog) addLog("[JOB] Step "+(currentIdx+2)+": "+next[currentIdx+1].name+" — IN PROGRESS");
            if (addLog) addLog(logMsgs[currentIdx+1] || "");
          }
          return next;
        });
        stepIdx++;
        runStep();
      }, dur);
    };
    runStep();

    elRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (elRef.current) clearInterval(elRef.current); };
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const doneCount = steps.filter(s => s.status === "done").length;
  const overallPct = Math.round((doneCount / steps.length) * 100);
  const statusColor = { done:G.success, running:G.orange, failed:G.error, pending:G.textDisabled };

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      {/* Job header */}
      <div className="nx" style={{ padding:"16px 24px", borderBottom:`1px solid ${G.border}`, background:G.canvas, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
              <span style={{ fontFamily:SANS, fontWeight:700, fontSize:"15px", color:G.textPrimary, letterSpacing:"-0.015em" }}>Pipeline Execution</span>
              {jobDone
                ? <Badge color={G.success}>Passed</Badge>
                : <Badge color={G.orange}>Running</Badge>
              }
            </div>
            <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{jobData.jobId}</span>
              <span style={{ color:G.border }}>·</span>
              <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{jobData.imageRef}</span>
              {jobData.modName && <>
                <span style={{ color:G.border }}>·</span>
                <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{jobData.modName}</span>
              </>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontFamily:SANS, fontSize:"12px", color:G.textDisabled }}>elapsed: {fmt(elapsed)}</span>
            {!jobDone && <BtnGhost style={{ padding:"5px 12px", fontSize:"11px" }}>Cancel</BtnGhost>}
            {jobDone && <BtnPrimary style={{ padding:"4px 12px", fontSize:"11px" }}>View Module</BtnPrimary>}
          </div>
        </div>
        {/* Overall progress bar */}
        <div style={{ marginTop:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
            <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{doneCount} / {steps.length} steps complete</span>
            <span style={{ fontFamily:SANS, fontSize:"11px", color: jobDone ? G.success : G.orange }}>{overallPct}%</span>
          </div>
          <div style={{ background:G.elevated, borderRadius:"2px", height:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:"2px", background: jobDone ? G.success : G.orange, width:`${overallPct}%`, transition:"width .3s ease" }}/>
          </div>
        </div>
      </div>

      {/* Body: stepper left, artifacts right */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"300px 1fr", gap:"20px", padding:"24px", alignItems:"start" }}>

        {/* Execution Stepper */}
        <Panel>
          <PanelHeader label="Execution Trace"/>
          <div style={{ padding:"16px 14px" }}>
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              const st = step.status;
              return (
                <div key={step.name} style={{ display:"flex", gap:"12px" }}>
                  {/* Icon + connector */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"22px", flexShrink:0 }}>
                    {st === "done" && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:`${G.success}15`, border:`1.5px solid ${G.success}55`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={G.success} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {st === "running" && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:`${G.orange}10`, border:`1.5px solid ${G.orange}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:G.orange, animation:"pulse 1.2s infinite", display:"block" }}/>
                      </div>
                    )}
                    {(st === "pending" || st === "failed") && (
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:G.elevated, border:`1.5px solid ${st === "failed" ? G.error : G.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontFamily:MONO, fontSize:"11px", color:st === "failed" ? G.error : G.textDisabled }}>{i+1}</span>
                      </div>
                    )}
                    {!isLast && (
                      <div style={{ width:"1.5px", flex:1, minHeight:"18px", margin:"2px 0", background: st === "done" ? `${G.success}35` : G.border }}/>
                    )}
                  </div>

                  {/* Label */}
                  <div style={{ paddingBottom: isLast ? 0 : "14px", flex:1 }}>
                    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between" }}>
                      <span style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color: st === "pending" ? G.textDisabled : G.textPrimary }}>{step.name}</span>
                      {step.time && <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{step.time}</span>}
                    </div>
                    {st === "running" && (
                      <span style={{ fontFamily:SANS, fontSize:"11px", color:G.orange }}>in progress...</span>
                    )}
                    {step.error && (
                      <div style={{ background:`${G.error}08`, border:`1px solid ${G.error}30`, borderRadius:"4px", padding:"6px 8px", marginTop:"4px", fontFamily:SANS, fontSize:"11px", color:G.error }}>{step.error}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Right: artifacts */}
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

          {/* Artifact download cards */}
          <Panel>
            <PanelHeader label="Artifacts" sub="generated by pipeline"/>
            <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {[
                { name:"SBOM",              fmt:"CycloneDX JSON",    ready: doneCount >= 3, size:"48 KB"  },
                { name:"Vulnerability Report", fmt:"Trivy JSON",      ready: doneCount >= 2, size:"12 KB"  },
                { name:"SLSA Provenance",   fmt:"in-toto JSON",     ready: doneCount >= 6, size:"2 KB"   },
                { name:"cosign Signature",  fmt:"Sigstore keyless", ready: doneCount >= 5, size:"1 KB"   },
              ].map(a => (
                <div key={a.name} style={{ background: a.ready ? G.secondary : G.elevated, border:`1px solid ${a.ready ? G.border : G.borderWk}`, borderRadius:"4px", padding:"16px", display:"flex", alignItems:"center", justifyContent:"space-between", opacity: a.ready ? 1 : .4, transition:"all .3s" }}>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:"12px", fontWeight:600, color: a.ready ? G.textPrimary : G.textDisabled, marginBottom:"3px" }}>{a.name}</div>
                    <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>{a.fmt} {a.ready ? "· "+a.size : ""}</div>
                  </div>
                  {a.ready ? (
                    <BtnGhost style={{ padding:"4px 10px", fontSize:"11px", flexShrink:0 }}>Download</BtnGhost>
                  ) : (
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>pending</span>
                  )}
                </div>
              ))}
            </div>
            {!jobDone && (
              <div style={{ padding:"0 14px 12px", fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>Artifacts unlock as each pipeline step completes.</div>
            )}
          </Panel>

          {/* Trust Score preview */}
          <Panel>
            <PanelHeader label="Trust Score" sub="live — updates as pipeline runs"/>
            <div style={{ padding:"16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"16px" }}>
                {/* Big number */}
                <div style={{ textAlign:"center", flexShrink:0 }}>
                  <div style={{ fontFamily:SANS, fontWeight:700, fontSize:"42px", lineHeight:1, letterSpacing:"-0.02em",
                    color: overallPct >= 80 ? G.success : overallPct >= 50 ? G.orange : G.error,
                  }}>
                    {Math.round(overallPct * 0.85)}
                  </div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled }}>/100</div>
                </div>
                {/* Progress bar */}
                <div style={{ flex:1 }}>
                  <div style={{ background:G.elevated, borderRadius:"2px", height:"6px", overflow:"hidden", marginBottom:"8px" }}>
                    <div style={{ height:"100%", background: overallPct >= 80 ? G.success : G.orange, width:`${Math.round(overallPct*0.85)}%`, borderRadius:"2px", transition:"width .4s ease" }}/>
                  </div>
                  <div style={{ fontFamily:SANS, fontSize:"11px", color:G.textDisabled, lineHeight:1.7 }}>
                    Score is calculated from SBOM presence (+15), SLSA provenance (+15), cosign signature (+20), scan results (+20), policy gate (+15), and base checks (+15).
                  </div>
                </div>
              </div>
              {/* Per-dimension rows */}
              {[
                { label:"Vulnerabilities", val: doneCount >= 2 ? "LOW RISK"  : "pending", color: doneCount >= 2 ? G.success   : G.textDisabled, pct: doneCount >= 2 ? 90 : 0  },
                { label:"SBOM",            val: doneCount >= 3 ? "PRESENT"   : "pending", color: doneCount >= 3 ? G.success   : G.textDisabled, pct: doneCount >= 3 ? 100 : 0 },
                { label:"Provenance",      val: doneCount >= 6 ? "VERIFIED"  : "pending", color: doneCount >= 6 ? G.success   : G.textDisabled, pct: doneCount >= 6 ? 100 : 0 },
                { label:"Recency",         val: doneCount >= 1 ? "< 1 min"   : "pending", color: doneCount >= 1 ? G.success   : G.textDisabled, pct: doneCount >= 1 ? 98 : 0  },
              ].map(r => (
                <div key={r.label} style={{ marginBottom:"8px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:G.textSecondary }}>{r.label}</span>
                    <span style={{ fontFamily:SANS, fontSize:"11px", color:r.color }}>{r.val}</span>
                  </div>
                  <div style={{ background:G.elevated, borderRadius:"2px", height:"3px", overflow:"hidden" }}>
                    <div style={{ height:"100%", background:r.color, width:`${r.pct}%`, transition:"width .5s ease", borderRadius:"2px" }}/>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
};

export default function Flareo() {
  const [authed,        setAuthed]       = useState(false);
  const [showSignIn,    setShowSignIn]   = useState(false);
  const [view,          setView_]         = useState("dashboard");
  const [selMod,        setSelMod_]       = useState(null);
  const [savedModules,  setSavedModules] = useState([]);
  const [cmdOpen,       setCmdOpen]      = useState(false);
  const [consoleOpen,   setConsoleOpen]  = useState(false);
  const [consoleLogs,   setConsoleLogs]  = useState([
    { t:"[SYSTEM] Flareo Console initialized.", c:G.textDisabled },
    { t:"[SYSTEM] Ready for build and preview output.", c:G.textDisabled },
  ]);
  const [pct, setPct] = useState(0);
  const [log, setLog] = useState(LOG_INIT);
  const logRef = useRef(null);
  const [unreadLogs, setUnreadLogs] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // ── New enterprise state ──
  const [toasts,       setToasts]      = useState([]);
  const [notifOpen,    setNotifOpen]   = useState(false);
  const [shortcutOpen, setShortcutOpen]= useState(false);
  const [notifCount,   setNotifCount]  = useState(2); // unread count

  const toast = (msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const addLog = (entry) => {
    const ts = new Date().toISOString().split("T")[1].split(".")[0];
    setConsoleLogs(prev => [...prev, { t:"["+ts+"] "+entry, c:G.textSecondary }]);
    if (!consoleOpen) setUnreadLogs(n => n + 1);
  };

  const openConsole = () => { setConsoleOpen(true); setUnreadLogs(0); };

  const openTab = (tab) => {
    const type = tab.type;
    setView_(type);
    if (tab.data) setSelMod_(tab.data); else if (type !== "detail" && type !== "preview" && type !== "deploy") setSelMod_(null);
  };


  const handleLogin         = () => setAuthed(true);
  const handleLogout        = () => { setAuthed(false); setView_("dashboard"); setSelMod_(null); };
  const handleSelectModule  = (m) => openTab({ id:`detail-${m.id}`, type:"detail",   title:m.name,           data:m });
  const handleOpenPreview   = (m) => { openTab({ id:`prev-${m.id}`,  type:"preview",  title:`Preview: ${m.name}`, data:m }); setConsoleOpen(true); };
  const handleBack          = ()  => openTab({ id:"marketplace", type:"marketplace", title:"Marketplace" });
  const handleToggleSave    = (id) => setSavedModules(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleNavigate      = (type) => {
    const T = { dashboard:"Dashboard", marketplace:"Marketplace", pipeline:"Pipeline", docs:"Docs", "my-modules":"My Modules", "api-keys":"API Keys", settings:"Settings", profile:"Profile", admin:"Review Queue" };
    openTab({ id:type, type, title: T[type] || type });
  };

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) { setShortcutOpen(o => !o); }
      if (e.key === "Escape") { setCmdOpen(false); setShortcutOpen(false); setNotifOpen(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    document.title = "Flareo — Verified Container Marketplace";
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
    const s = document.createElement("style");
    s.textContent = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      html, body, #root { height:100%; }
      body { background:#090807; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; }
      /* Geist — geometric sans, crisp at small sizes, strong personality */
      body, input, button, select, textarea {
        font-family: 'Geist', system-ui, -apple-system, sans-serif;
        font-feature-settings: "kern" 1, "liga" 1;
        font-variant-numeric: tabular-nums;
      }
      h1, h2, h3, h4, h5, h6 { letter-spacing: -0.02em; }
      /* Geist Mono: terminals, badges, version numbers, digests */
      code, pre, kbd, samp { font-family: 'Geist Mono', monospace; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:transparent; border-radius:3px; transition:background .2s; }
      *:hover::-webkit-scrollbar-thumb { background:#2C2A28; }
      *::-webkit-scrollbar-thumb:hover { background:#3A3834; }
      * { scrollbar-width: thin; scrollbar-color: transparent transparent; }
      *:hover { scrollbar-color: #2C2A28 transparent; }
      @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.2} }
      @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      @keyframes spin    { to{transform:rotate(360deg)} }
      .sortable-th { cursor:pointer; user-select:none; transition:color .1s; }
      .sortable-th:hover { color:#D9D9D9 !important; }
      .cmd-row { transition:background .08s; cursor:pointer; }
      .cmd-row:hover { background:#272422; }
      .clog:hover { background:rgba(255,255,255,0.025); border-radius:2px; }
      #fr-root { position:relative; }
      /* global grain — very faint, ties everything together */
      #fr-root::before { content:""; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-repeat:repeat; background-size:180px 180px; }
      #fr-root > * { position:relative; z-index:1; }
      /* surface noise — coarser, stronger, for specific panels / sidebar / topbar */
      .nx { position:relative; overflow:hidden; }
      .nx::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:10; opacity:0.045; mix-blend-mode:overlay; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E"); background-repeat:repeat; background-size:160px 160px; }
      /* hero noise — heavier grain for the login / hero blocks */
      .nx-hero { position:relative; overflow:hidden; }
      .nx-hero::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:10; opacity:0.09; mix-blend-mode:soft-light; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='h'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23h)'/%3E%3C/svg%3E"); background-repeat:repeat; background-size:160px 160px; }
      .modcard { background:#1A1918; border:1px solid #2D2B29; border-top:1px solid rgba(255,255,255,0.065); border-radius:6px; padding:16px; cursor:pointer; transition:border-color .15s, transform .15s, box-shadow .15s; }
      .modcard:hover { border-color:#484848; border-top-color:rgba(255,255,255,0.12); transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.55); }
      .fchip { font-family:'Geist',system-ui,sans-serif; font-size:12px; font-weight:500; padding:5px 14px; border-radius:20px; border:1px solid #2D2B29; background:transparent; color:#9A9A9A; cursor:pointer; transition:all .12s; letter-spacing:-0.01em; }
      .fchip:hover { border-color:#404040; color:#D9D9D9; background:rgba(255,255,255,0.03); }
      .fchip.on { border-color:#403D3A; background:#232120; color:#D9D9D9; }
      .tag { font-family:'Geist Mono',monospace; font-size:10px; padding:2px 7px; border-radius:3px; background:#232120; border:1px solid #2D2B29; color:#555555; cursor:pointer; transition:all .12s; }
      .tag:hover { border-color:#404040; color:#9A9A9A; }
      .srch { background:#1A1918; border:1px solid #2D2B29; border-radius:5px; color:#D9D9D9; font-family:'Geist',system-ui,sans-serif; font-size:13px; font-weight:400; padding:6px 12px 6px 34px; width:200px; outline:none; transition:border-color .15s, box-shadow .15s; letter-spacing:-0.01em; }
      .srch:focus { border-color:#3D3B38; background:#111010; box-shadow:0 0 0 2px rgba(255,120,10,0.08); }
      .srch::placeholder { color:#444444; }
      .stage:hover { background:#232120 !important; }
      .trow:hover { background:rgba(255,255,255,0.025); }
      .dtab { background:none; border:none; cursor:pointer; font-family:'Geist',system-ui,sans-serif; font-size:13px; font-weight:500; letter-spacing:-0.02em; color:#555555; padding:9px 14px; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color .12s, border-color .12s; }
      .dtab:hover { color:#9A9A9A; }
      .dtab.on { color:#D9D9D9; font-weight:600; border-bottom-color:#FF780A; }
      .subtab { background:none; border:none; cursor:pointer; font-family:'Geist Mono',monospace; font-size:11px; color:#555555; padding:6px 14px; border-bottom:1px solid transparent; margin-bottom:-1px; transition:color .12s; }
      .subtab:hover { color:#9A9A9A; }
      .subtab.on { color:#D9D9D9; background:#1A1918; border-color:#2D2B29; border-radius:4px 4px 0 0; }
      .dnav { padding:6px 10px; border-radius:3px; font-family:'Geist',system-ui,sans-serif; font-size:12.5px; font-weight:450; letter-spacing:-0.015em; cursor:pointer; color:#9A9A9A; border-left:2px solid transparent; transition:all .12s; }
      .dnav:hover { color:#D9D9D9; background:#232120; }
      .dnav.on { color:#D9D9D9; background:rgba(255,120,10,0.08); border-left-color:#FF780A; }
    `;
    document.head.appendChild(s);
    return () => { link.remove(); s.remove(); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setPct(p => {
        if (p >= 100) {
          clearInterval(iv);
          setLog(l => l.length < 10 ? [...l,
            { t:"[01:18.4] Scan complete — 0 CRITICAL · 1 HIGH · 3 MEDIUM", c:G.success },
            { t:"[01:18.5] cosign sign sha256:a3f9d2c1 …", c:"#9A9A9A" },
          ] : l);
          return 100;
        }
        return p + 0.7;
      });
    }, 65);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 9999; }, [log]);

  // Sync body overflow with auth state — login page needs to scroll, app shell does not
  useEffect(() => {
    document.body.style.overflow = authed ? "hidden" : "auto";
    return () => { document.body.style.overflow = ""; };
  }, [authed]);

  if (!authed) {
    return (
      <>
        <LandingShell onRequestLogin={() => setShowSignIn(true)}/>
        {showSignIn && (
          <SignInModal
            onLogin={() => { setAuthed(true); setShowSignIn(false); }}
            onClose={() => setShowSignIn(false)}
          />
        )}
      </>
    );
  }

  return (
    <div id="fr-root" style={{ display:"flex", flexDirection:"column", height:"100vh", background:G.canvas, color:G.textPrimary, fontFamily:SANS, overflow:"hidden" }}>
      {/* Global overlays */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} openTab={openTab}/>
      <ShortcutOverlay open={shortcutOpen} onClose={() => setShortcutOpen(false)}/>
      <NotificationDrawer open={notifOpen} onClose={() => { setNotifOpen(false); setNotifCount(0); }}/>
      <ToastStack toasts={toasts} onDismiss={dismissToast}/>

      {/* Status bar — full width, above everything */}
      <StatusBar pipelineRunning={pct < 100} criticalInQueue={false}/>

      {/* Main shell: sidebar + content column */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        <Sidebar
          view={view} setView={handleNavigate} onLogout={handleLogout}
          onHome={() => handleNavigate("dashboard")}
          collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(x => !x)}
          pipelineRunning={pct < 100} unreadLogs={unreadLogs}
          savedModules={savedModules} onPinOpen={handleSelectModule}
          toast={toast}
        />
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          <TopBar
            view={view} selectedModule={selMod} setView={handleNavigate}
            onOpenCmd={() => setCmdOpen(true)}
            onPublish={() => { openTab({ id:"publish", type:"publish", title:"Publish Image" }); toast("Opening publish form…","info"); }}
            unreadLogs={unreadLogs} onOpenConsole={openConsole}
            activeTabTitle={selMod && (selMod.modName || selMod.imageRef || selMod.name)}
            notifCount={notifCount} onOpenNotif={() => { setNotifOpen(o => !o); setNotifCount(0); }}
            onOpenShortcuts={() => setShortcutOpen(true)}
          />
          {/* Grafana variable bar — only on dashboard */}
          <VarBar show={view === "dashboard"}/>
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {view === "dashboard"     && <DashboardView onNavigate={handleNavigate} savedModules={savedModules}/>}
            {view === "marketplace"   && <MarketplaceView onSelectModule={handleSelectModule}/>}
            {view === "detail"        && selMod && <DetailView module={selMod} onBack={handleBack} savedModules={savedModules} onToggleSave={(id) => { handleToggleSave(id); toast(savedModules.includes(id) ? "Module unpinned" : "Module pinned to sidebar","success"); }} onOpenPreview={handleOpenPreview} onDeploy={(mod) => { openTab({ id:"deploy-"+mod.id, type:"deploy", title:"Deploy: "+mod.name, data:mod }); toast("Opening deploy wizard…","info"); }}/>}
            {view === "preview"       && selMod && <PreviewView module={selMod} onOpenConsole={() => setConsoleOpen(true)} addLog={addLog}/>}
            {view === "pipeline"      && <PipelineView pct={pct} log={log} logRef={logRef}/>}
            {view === "docs"          && <DocsView/>}
            {view === "community"     && <CommunityView/>}
            {view === "arena"         && <ArenaView/>}
            {view === "bounty"        && <BountyView/>}
            {view === "deploy"        && selMod && <DeployWizardView module={selMod} onClose={handleBack}/>}
            {view === "my-modules"    && <MyModulesView onOpenDetail={handleSelectModule}/>}
            {view === "analytics"     && <AnalyticsDashView/>}
            {view === "earnings"      && <EarningsView/>}
            {view === "api-keys"      && <APIKeysView toast={toast}/>}
            {view === "settings"      && <SettingsView toast={toast}/>}
            {view === "profile"       && <ProfileView onOpenDetail={handleSelectModule}/>}
            {view === "publish"       && <PublishView onJobCreated={(jobId, imageRef, modName) => { openTab({ id:"job-"+jobId, type:"job", data:{ jobId, imageRef, modName } }); addLog("[PUBLISH] Submitted: "+(modName||imageRef)+" — job "+jobId); openConsole(); toast("Build job queued: "+( modName||imageRef),"info"); }}/>}
            {view === "job"           && selMod && <JobStatusView jobData={selMod} addLog={addLog} onOpenConsole={openConsole}/>}
            {view === "admin"         && <AdminView toast={toast}/>}
          </div>
        </div>
        <ConsoleDrawer open={consoleOpen} logs={consoleLogs} onClose={() => setConsoleOpen(false)} onClear={() => setConsoleLogs([{ t:"[SYSTEM] Console cleared.", c:G.textDisabled }])}/>
      </div>
    </div>
  );
}

