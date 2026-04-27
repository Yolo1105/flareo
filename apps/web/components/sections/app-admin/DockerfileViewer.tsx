/**
 * Display the Dockerfile for review. Keywords highlighted with
 * simple tokenization — we deliberately don't pull in shiki/highlight.js
 * because the value-to-bundle-cost ratio is poor for this one screen.
 *
 * If the Dockerfile is in R2 rather than the flagsJson (the Horizon 2
 * pattern), this component is given the URL and renders a link to it
 * instead. The worker can inline it via a separate data fetch later.
 */

interface Props {
  content: string | null;
  dockerfileUrl: string | null;
}

// Dockerfile instructions. Highlighted at the start of a line.
const INSTRUCTIONS = new Set([
  "FROM",
  "RUN",
  "CMD",
  "LABEL",
  "MAINTAINER",
  "EXPOSE",
  "ENV",
  "ADD",
  "COPY",
  "ENTRYPOINT",
  "VOLUME",
  "USER",
  "WORKDIR",
  "ARG",
  "ONBUILD",
  "STOPSIGNAL",
  "HEALTHCHECK",
  "SHELL",
]);

interface Token {
  text: string;
  kind: "instruction" | "comment" | "string" | "plain";
}

function tokenizeLine(line: string): Token[] {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#")) {
    return [{ text: line, kind: "comment" }];
  }
  // Leading instruction
  const match = line.match(/^(\s*)([A-Z][A-Z_]+)(\s+)(.*)$/);
  if (match && INSTRUCTIONS.has(match[2])) {
    const rest = match[4];
    // Split quoted strings from the rest
    const tokens: Token[] = [
      { text: match[1], kind: "plain" },
      { text: match[2], kind: "instruction" },
      { text: match[3], kind: "plain" },
    ];
    let buf = "";
    let inString = false;
    for (let i = 0; i < rest.length; i++) {
      const ch = rest[i];
      if (ch === '"' || ch === "'") {
        if (inString) {
          buf += ch;
          tokens.push({ text: buf, kind: "string" });
          buf = "";
          inString = false;
        } else {
          if (buf) tokens.push({ text: buf, kind: "plain" });
          buf = ch;
          inString = true;
        }
      } else {
        buf += ch;
      }
    }
    if (buf) {
      tokens.push({ text: buf, kind: inString ? "string" : "plain" });
    }
    return tokens;
  }
  return [{ text: line, kind: "plain" }];
}

export function DockerfileViewer({ content, dockerfileUrl }: Props) {
  if (!content && !dockerfileUrl) {
    return (
      <section className="border border-dashed border-hairline bg-canvas-deep p-6">
        <div className="mb-2 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          DOCKERFILE
        </div>
        <p className="font-body text-[13px] text-ink-softer">
          No Dockerfile attached to this submission. (Legacy submissions
          from before the build worker don&apos;t carry one.)
        </p>
      </section>
    );
  }

  if (!content && dockerfileUrl) {
    return (
      <section className="border border-hairline bg-canvas-deep p-5">
        <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          DOCKERFILE
        </div>
        <a
          href={dockerfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[12px] text-accent hover:text-accent-hot"
        >
          download from R2 →
        </a>
      </section>
    );
  }

  const lines = (content ?? "").split("\n");

  return (
    <section className="border border-hairline bg-canvas-deep">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas-panel px-5 py-2.5">
        <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
          DOCKERFILE
        </div>
        <div className="font-mono text-[10px] tracking-[0.04em] text-ink-faint">
          {lines.length} lines
        </div>
      </div>
      <div className="overflow-x-auto">
        <pre className="m-0 p-0 font-mono text-[12.5px] leading-[1.6]">
          {lines.map((line, i) => (
            <div
              key={i}
              className="grid grid-cols-[50px_1fr] gap-4 px-5 py-0 hover:bg-canvas-panel/30"
            >
              <span className="select-none text-right text-ink-faint">
                {i + 1}
              </span>
              <span className="break-all text-ink-softer">
                {tokenizeLine(line).map((tok, j) => (
                  <span
                    key={j}
                    className={
                      tok.kind === "instruction"
                        ? "font-medium text-accent"
                        : tok.kind === "comment"
                        ? "italic text-ink-faint"
                        : tok.kind === "string"
                        ? "text-good"
                        : ""
                    }
                  >
                    {tok.text || "\u00a0"}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </section>
  );
}
