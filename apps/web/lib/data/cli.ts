export interface CliCommand {
  num: string;
  slug: string;
  name: string;
  /** Whether auth is required */
  auth: boolean;
  description: string;
  usage: string;
  flags?: Array<{
    flag: string;
    type: string;
    description: string;
    default: string;
  }>;
}

export const GLOBAL_FLAGS = [
  {
    flag: "--json",
    type: "bool",
    description:
      "Emit output as line-delimited JSON for scripts and pipelines. Disables color automatically.",
    default: "false",
  },
  {
    flag: "--no-color",
    type: "bool",
    description: "Disable ANSI colors. Respects NO_COLOR env var as an alternative.",
    default: "false",
  },
  {
    flag: "--config",
    type: "path",
    description: "Path to an alternate config file. Useful for CI or multi-account setups.",
    default: "~/.flareo/config.json",
  },
  {
    flag: "--verbose, -v",
    type: "bool",
    description: "Verbose output. Stackable (-vv, -vvv) for trace and debug logging.",
    default: "false",
  },
  {
    flag: "--timeout",
    type: "duration",
    description:
      "Network timeout for any HTTP call. Accepts Go duration strings: 30s, 2m, 1h.",
    default: "60s",
  },
  {
    flag: "--registry",
    type: "url",
    description: "Override the default Flareo registry. Used for self-hosted instances.",
    default: "ghcr.io/flareo",
  },
] as const;

export const CLI_COMMANDS: readonly CliCommand[] = [
  {
    num: "01",
    slug: "init",
    name: "flareo init",
    auth: false,
    description:
      "Initialize a new Flareo project in the current directory. Creates a flareo.json manifest with sane defaults, detects your Dockerfile, and sets up a .gitignore entry for the build cache.",
    usage: "flareo init [name] [--force] [--template=<kind>]",
    flags: [
      {
        flag: "--force, -f",
        type: "bool",
        description: "Overwrite an existing flareo.json.",
        default: "false",
      },
      {
        flag: "--template",
        type: "string",
        description:
          "Start from a preset: rust, go, node, python, static. Each writes a matching sample Dockerfile.",
        default: "none",
      },
    ],
  },
  {
    num: "02",
    slug: "login",
    name: "flareo login",
    auth: false,
    description:
      "Authenticate with Flareo via GitHub OAuth. Opens a browser to the consent page; once approved, drops an encrypted token at ~/.flareo/config.json. Required before publish, deploy, or billing.",
    usage: "flareo login [--device] [--token=<raw>]",
    flags: [
      {
        flag: "--device",
        type: "bool",
        description:
          "Use device-code flow instead of browser redirect. Useful on headless servers.",
        default: "false",
      },
      {
        flag: "--token",
        type: "string",
        description: "Skip OAuth and use a raw personal access token. Not recommended outside CI.",
        default: "none",
      },
    ],
  },
  {
    num: "03",
    slug: "search",
    name: "flareo search",
    auth: false,
    description:
      "Search the Flareo catalog by name, tag, or author. Results are sorted by trust score by default. Returns a table in the terminal, or JSON with --json for pipelines.",
    usage: "flareo search <query> [--category=<cat>] [--sort=<field>] [--limit=<n>]",
    flags: [
      {
        flag: "--category",
        type: "string",
        description:
          "Filter by category: proxy, monitoring, security, auth, devops, media.",
        default: "all",
      },
      {
        flag: "--sort",
        type: "string",
        description: "Sort field: trust, deploys, updated, name.",
        default: "trust",
      },
      {
        flag: "--limit, -n",
        type: "int",
        description: "Max number of results. Use 0 for unlimited.",
        default: "20",
      },
    ],
  },
  {
    num: "04",
    slug: "pull",
    name: "flareo pull",
    auth: false,
    description:
      "Pull a verified module and its signed digest. Unlike docker pull, flareo pull runs cosign verify and slsa-verifier before the image lands on disk. If any check fails, nothing is pulled and the command exits non-zero.",
    usage: "flareo pull <name>[@<version>|@<digest>] [--no-verify] [--platform=<os/arch>]",
    flags: [
      {
        flag: "--no-verify",
        type: "bool",
        description:
          "Skip signature and provenance checks. Defeats the purpose of Flareo. Allowed for offline retrieval only.",
        default: "false",
      },
      {
        flag: "--platform",
        type: "string",
        description:
          "Target platform: linux/amd64, linux/arm64. Defaults to the host platform.",
        default: "host",
      },
    ],
  },
  {
    num: "05",
    slug: "verify",
    name: "flareo verify",
    auth: false,
    description:
      "Run the three-check verification suite against any image reference or digest, without pulling. Useful inside CI pipelines as a gate.",
    usage: "flareo verify <image|digest> [--strict] [--require-slsa=<level>]",
    flags: [
      {
        flag: "--strict",
        type: "bool",
        description:
          "Fail on any non-green finding: LOW CVEs, partial attestations, or missing SBOM.",
        default: "false",
      },
      {
        flag: "--require-slsa",
        type: "int",
        description: "Require at least this SLSA level (1, 2, or 3).",
        default: "1",
      },
    ],
  },
  {
    num: "06",
    slug: "compose",
    name: "flareo compose",
    auth: false,
    description:
      "Generate a docker-compose.yaml for a module, with the image pinned to the signed digest. Output goes to stdout by default.",
    usage: "flareo compose <name>[@<version>] [--env=<key=val>] [--ports=<map>]",
  },
  {
    num: "07",
    slug: "deploy",
    name: "flareo deploy",
    auth: true,
    description:
      "Convenience wrapper around flareo compose + docker compose up -d. For local runs only. Flareo never runs your containers remotely — deploy happens on your machine.",
    usage: "flareo deploy <name>[@<version>] [--format=compose|helm|kustomize] [--dry-run]",
  },
  {
    num: "08",
    slug: "publish",
    name: "flareo publish",
    auth: true,
    description:
      "Submit a module to the Flareo pipeline. Reads flareo.json from the current directory, uploads the Dockerfile and build context, and triggers the six-stage pipeline.",
    usage: "flareo publish [--source=<path>] [--tag=<name:ver>] [--wait]",
  },
  {
    num: "09",
    slug: "inspect",
    name: "flareo inspect",
    auth: false,
    description:
      "Show everything Flareo knows about a module: digest, SBOM summary, provenance trail, signature identity, full build record. Read-only.",
    usage: "flareo inspect <name>[@<version>] [--include=<section,...>]",
  },
  {
    num: "10",
    slug: "tail",
    name: "flareo tail",
    auth: true,
    description:
      "Stream live pipeline logs for a build or module. Works with a build ID (#0847), a module name, or --pipeline for the global firehose.",
    usage: "flareo tail <build-id|name> [--follow] [--stage=<name>]",
  },
  {
    num: "11",
    slug: "status",
    name: "flareo status",
    auth: false,
    description:
      "Print the live Flareo pipeline health: region, version, build count last 7 days, scan pass rate, median stage latency.",
    usage: "flareo status [--watch] [--interval=<dur>]",
  },
  {
    num: "12",
    slug: "billing",
    name: "flareo billing",
    auth: true,
    description:
      "Show your current plan, usage in the billing period, and upcoming invoice. During public beta this returns a flat \"all features free\" response.",
    usage: "flareo billing [--tier] [--usage] [--history=<months>]",
  },
] as const;
