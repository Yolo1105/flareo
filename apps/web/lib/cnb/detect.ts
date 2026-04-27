/**
 * Cloud Native Buildpacks (CNB) language detection.
 *
 * Maps a submission's source artifact to a recommended Paketo builder
 * and language identifier. Used by the submission API to fill
 * Submission.cnbDetectedLanguage and Submission.cnbBuilder when the
 * submitter chose buildType="cnb" instead of providing a Dockerfile.
 *
 * Why this is server-side and not in the worker:
 *
 *   - The reviewer needs to see the detected language at decision
 *     time, not after build start. If we detected wrong, the reviewer
 *     can flag it and ask the submitter for a Dockerfile.
 *   - If detection fails (no recognizable signal), the submission
 *     should fail validation up front — not start a build that's
 *     going to error out 30 seconds in.
 *   - Detection is deterministic, dependency-free, and small enough
 *     that it doesn't belong in the worker's hot path.
 *
 * Detection inputs are intentionally narrow: the file list at the
 * root of the source archive. We don't need to scan the full tree
 * because every supported language has a recognizable root marker.
 */

export type CnbLanguage =
  | "node"
  | "python"
  | "go"
  | "rust"
  | "ruby"
  | "java"
  | "php"
  | "dotnet"
  | "static";

export interface CnbDetection {
  language: CnbLanguage;
  /** Pinned Paketo builder image. Specific version, not "latest" — see schema comment. */
  builder: string;
  /** Why we picked this language. The signal we matched. */
  reason: string;
  /** Confidence in the detection. "exact" = unambiguous root marker;
   *  "fuzzy" = inferred from surrounding files when the marker is absent
   *  but other heuristics line up. */
  confidence: "exact" | "fuzzy";
}

/**
 * Per-language Paketo builder images. Pinned to specific versions for
 * reproducibility — bumping the version is a deliberate config change,
 * not a silent drift from upstream.
 *
 * "base" rather than "full" so the resulting image is small. Static
 * binaries get the lightest builder. Bionic images get a hardened
 * minimal-OS base.
 */
const BUILDERS: Record<CnbLanguage, string> = {
  node: "paketobuildpacks/builder-jammy-base:0.4.290",
  python: "paketobuildpacks/builder-jammy-base:0.4.290",
  go: "paketobuildpacks/builder-jammy-tiny:0.0.252",
  rust: "paketobuildpacks/builder-jammy-base:0.4.290",
  ruby: "paketobuildpacks/builder-jammy-base:0.4.290",
  java: "paketobuildpacks/builder-jammy-base:0.4.290",
  php: "paketobuildpacks/builder-jammy-base:0.4.290",
  dotnet: "paketobuildpacks/builder-jammy-base:0.4.290",
  static: "paketobuildpacks/builder-jammy-tiny:0.0.252",
};

/**
 * Markers we look for at the source root, in priority order. The
 * first match wins. Order matters because some projects carry
 * multiple language artifacts (e.g. a Node-based JS toolchain in a
 * Python project will have a package.json AND a requirements.txt) —
 * we want the build language, not the toolchain language.
 */
const ROOT_MARKERS: { language: CnbLanguage; files: string[]; reason: string }[] = [
  // Compiled languages first — their markers are unambiguous and
  // they're rarely false positives.
  { language: "go", files: ["go.mod"], reason: "go.mod at root" },
  { language: "rust", files: ["Cargo.toml"], reason: "Cargo.toml at root" },
  { language: "java", files: ["pom.xml", "build.gradle", "build.gradle.kts"], reason: "Maven or Gradle build file" },
  { language: "dotnet", files: ["*.csproj", "*.fsproj", "*.sln"], reason: ".NET project file" },

  // Scripting languages.
  { language: "python", files: ["pyproject.toml", "requirements.txt", "setup.py", "Pipfile"], reason: "Python project marker" },
  { language: "ruby", files: ["Gemfile", "Gemfile.lock", "*.gemspec"], reason: "Ruby Gemfile" },
  { language: "php", files: ["composer.json"], reason: "Composer manifest" },

  // Node last — many projects in other languages carry a
  // package.json for tooling. We only treat it as a Node project
  // if no other marker won first.
  { language: "node", files: ["package.json"], reason: "package.json at root" },
];

/**
 * Run language detection over a list of root-level filenames.
 *
 * Input: an array of strings, each the basename of a file at the
 * source archive's root (e.g. ["package.json", "Dockerfile",
 * "README.md", ".gitignore"]).
 *
 * Output: a CnbDetection object on success, or null when no marker
 * matches AND no fuzzy fallback applies.
 *
 * The function is pure, dependency-free, and synchronous so it can
 * run inside a Zod refine() during request validation without any
 * I/O surprises.
 */
export function detectCnbLanguage(rootFiles: string[]): CnbDetection | null {
  const lower = new Set(rootFiles.map((f) => f.toLowerCase()));

  for (const marker of ROOT_MARKERS) {
    for (const candidate of marker.files) {
      if (matchesMarker(lower, candidate)) {
        return {
          language: marker.language,
          builder: BUILDERS[marker.language],
          reason: marker.reason,
          confidence: "exact",
        };
      }
    }
  }

  // Fuzzy fallback — pure-static-site detection. If the root has
  // an index.html and nothing else recognizable, it's a static site.
  if (lower.has("index.html")) {
    return {
      language: "static",
      builder: BUILDERS.static,
      reason: "index.html at root with no other language marker",
      confidence: "fuzzy",
    };
  }

  return null;
}

function matchesMarker(rootFiles: Set<string>, pattern: string): boolean {
  // Plain filename → exact match.
  if (!pattern.includes("*")) {
    return rootFiles.has(pattern.toLowerCase());
  }
  // Glob pattern (limited — only "*.ext" is supported).
  if (pattern.startsWith("*.")) {
    const ext = pattern.slice(1).toLowerCase(); // ".csproj"
    for (const f of rootFiles) {
      if (f.endsWith(ext)) return true;
    }
  }
  return false;
}

/**
 * Human-readable label for a CNB language. Shown in the publish
 * wizard ("we detected: Node 20") and on the admin submission detail.
 */
export function languageLabel(language: CnbLanguage): string {
  switch (language) {
    case "node":
      return "Node.js";
    case "python":
      return "Python";
    case "go":
      return "Go";
    case "rust":
      return "Rust";
    case "ruby":
      return "Ruby";
    case "java":
      return "JVM (Java / Kotlin)";
    case "php":
      return "PHP";
    case "dotnet":
      return ".NET";
    case "static":
      return "Static site";
  }
}

/**
 * Two-line explanation for a detection result. Shown in the publish
 * wizard's confirmation step so the submitter sees what we plan to
 * build before they hit submit.
 */
export function explainDetection(detection: CnbDetection): string {
  const builderShort = detection.builder.split("/").pop() ?? detection.builder;
  return [
    `${languageLabel(detection.language)} (${detection.confidence === "exact" ? "exact match" : "best guess"} on ${detection.reason})`,
    `Builder: ${builderShort}`,
  ].join(" · ");
}
