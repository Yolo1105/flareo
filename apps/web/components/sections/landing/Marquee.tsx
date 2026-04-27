/**
 * Horizontal scrolling marquee of tools Flareo integrates with.
 * Pure CSS, duplicates content for seamless loop. The key trick is
 * setting the container to `animate` with a linear, infinite keyframe
 * that translates -50%.
 */
export function Marquee() {
  const tools = [
    "buildkit",
    "trivy",
    "cosign",
    "sigstore",
    "fulcio",
    "rekor",
    "syft",
    "slsa-generator",
    "in-toto",
    "cyclonedx",
    "bullmq",
    "docker-in-docker",
    "firecracker",
    "caddy",
    "github-actions-oidc",
    "cloudflare-r2",
    "aws-ecr-public",
    "hetzner-cloud",
  ];

  return (
    <div className="relative flex overflow-hidden border-b border-hairline bg-canvas-panel py-4">
      <div className="animate-marquee flex shrink-0 whitespace-nowrap">
        {[...tools, ...tools].map((tool, i) => (
          <span
            key={i}
            className="mx-[22px] font-mono text-[13px] tracking-[0.04em] text-ink-faint"
          >
            {tool}
            <span className="ml-[22px] text-ink-ghost">·</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
