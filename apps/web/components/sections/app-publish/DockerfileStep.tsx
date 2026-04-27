"use client";

import { useRef, useState } from "react";

/**
 * Wizard step 3: attach a Dockerfile.
 *
 * Three input paths, all converging on the same string in state:
 *   1. Drag-and-drop a file onto the drop zone
 *   2. Click the drop zone → native file picker
 *   3. Paste the Dockerfile body into the textarea
 *
 * On "Continue", the component:
 *   - Computes SHA-256 via crypto.subtle.digest (browser-native)
 *   - POSTs to /api/v1/submissions/dockerfile-upload
 *   - Receives { submissionId, referenceUrl }
 *   - Hands both back to the parent wizard via onComplete
 *
 * Skip is allowed. The parent submission endpoint accepts no Dockerfile;
 * the reviewer can request changes if one is needed. When skipped,
 * onComplete is called with null values and the wizard proceeds.
 *
 * Error surfaces:
 *   - Empty content on Continue → inline error ("paste or attach first")
 *   - >20 KB content → inline error (matches server cap)
 *   - Upload network/server error → inline error with retry
 *   - SHA-256 mismatch (shouldn't happen with browser-native hashing,
 *     but surfaces server-side integrity bugs if they ever appear)
 */

interface Props {
  onComplete: (args: {
    dockerfileUrl: string | null;
    dockerfileSha256: string | null;
    submissionId: string | null;
  }) => void;
  onBack: () => void;
}

const MAX_BYTES = 20_000;

export function DockerfileStep({ onComplete, onBack }: Props) {
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bytes = new TextEncoder().encode(content).byteLength;
  const tooBig = bytes > MAX_BYTES;
  const hasContent = content.trim().length > 0;

  // ─── file ingestion ────────────────────────────────────────────────
  async function ingestFile(file: File) {
    if (file.size > MAX_BYTES) {
      setError(
        `File is ${Math.round(file.size / 1024)} KB — limit is 20 KB. Most Dockerfiles are under 2 KB; double-check you're not attaching a tarball.`,
      );
      return;
    }
    const text = await file.text();
    setContent(text);
    setFilename(file.name);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void ingestFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  function handlePickClick() {
    fileInputRef.current?.click();
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void ingestFile(file);
    // Reset so re-picking the same file triggers onChange again.
    e.target.value = "";
  }

  // ─── submit ────────────────────────────────────────────────────────
  async function handleContinueWithUpload() {
    if (!hasContent) {
      setError("Paste or attach a Dockerfile first — or click Skip.");
      return;
    }
    if (tooBig) {
      setError(
        `Dockerfile is ${Math.round(bytes / 1024)} KB — limit is 20 KB.`,
      );
      return;
    }
    setBusy(true);
    setError(null);

    try {
      // SHA-256 via browser crypto. Produces 32 bytes → 64-char hex.
      const encoded = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const res = await fetch("/api/v1/submissions/dockerfile-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dockerfile: content,
          sha256: hashHex,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(
          errBody.error?.message ??
            `Upload failed (${res.status}). Try again or click Skip.`,
        );
        setBusy(false);
        return;
      }

      const result = (await res.json()) as {
        submissionId: string;
        referenceUrl: string;
        sha256: string;
      };

      onComplete({
        dockerfileUrl: result.referenceUrl,
        dockerfileSha256: result.sha256,
        submissionId: result.submissionId,
      });
    } catch {
      setError("Network error during upload. Check your connection and retry.");
      setBusy(false);
    }
  }

  function handleSkip() {
    onComplete({
      dockerfileUrl: null,
      dockerfileSha256: null,
      submissionId: null,
    });
  }

  return (
    <div className="border border-hairline bg-canvas-deep p-7">
      <div className="mb-1 font-mono text-[10px] font-medium tracking-[0.14em] text-accent">
        03 · ATTACH DOCKERFILE
      </div>
      <h2 className="mb-3 font-display text-[22px] font-black leading-[1.1] tracking-[-0.025em] text-ink">
        Paste or upload the Dockerfile we should build.
      </h2>
      <p className="mb-6 max-w-[620px] font-body text-[13.5px] leading-[1.6] text-ink-softer">
        Flareo builds this Dockerfile in a network-isolated sandbox. Use
        multi-stage builds to pre-bake dependencies; <code className="font-mono text-ink-mute">apt-get</code>{" "}
        and <code className="font-mono text-ink-mute">npm install</code>{" "}
        at build time won&apos;t reach the network. See{" "}
        <a
          href="/docs/submitting-dockerfiles"
          className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
        >
          docs/submitting-dockerfiles
        </a>{" "}
        for the pattern. You can skip this now and add it later if the
        reviewer requests changes.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handlePickClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePickClick();
          }
        }}
        className={`mb-4 cursor-pointer border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragActive
            ? "border-accent bg-accent/[0.04]"
            : "border-hairline bg-canvas hover:border-ink-ghost"
        }`}
      >
        <div className="mb-1 font-mono text-[11px] tracking-[0.14em] text-ink-ghost">
          DROP A DOCKERFILE HERE
        </div>
        <div className="font-body text-[13px] text-ink-softer">
          {filename ? (
            <>
              <span className="font-mono text-ink">{filename}</span> loaded
              — {bytes} bytes
            </>
          ) : (
            <>
              or <span className="text-accent">click to browse</span> · max
              20 KB
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".dockerfile,Dockerfile,text/plain,*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Paste textarea */}
      <div className="mb-4">
        <label className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            OR PASTE DIRECTLY
          </span>
          <span
            className={`font-mono text-[10.5px] ${
              tooBig ? "text-bad" : "text-ink-ghost"
            }`}
          >
            {bytes} / {MAX_BYTES} bytes
          </span>
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (filename) setFilename(null);
            if (error) setError(null);
          }}
          rows={10}
          placeholder="FROM alpine:3.19&#10;RUN apk add --no-cache ca-certificates&#10;COPY app /usr/local/bin/app&#10;ENTRYPOINT [&quot;/usr/local/bin/app&quot;]"
          className="w-full border border-hairline bg-canvas px-4 py-3 font-mono text-[12.5px] leading-[1.6] text-ink placeholder:text-ink-ghost focus:border-accent focus:outline-none"
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="mb-4 border border-bad/40 bg-bad/[0.06] px-4 py-3 font-mono text-[12px] text-bad">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="border border-hairline px-5 py-2.5 font-body text-[13px] font-medium text-ink transition-colors hover:border-ink-ghost"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            className="border border-hairline px-5 py-2.5 font-body text-[13px] font-medium text-ink-softer transition-colors hover:border-ink-ghost hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleContinueWithUpload}
            disabled={busy || !hasContent || tooBig}
            className="flex items-center gap-2 bg-accent px-5 py-2.5 font-body text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hot disabled:cursor-not-allowed disabled:bg-ink-ghost"
          >
            {busy ? (
              <>
                <span className="block h-2 w-2 rounded-full bg-canvas meta-pulse" />
                Uploading...
              </>
            ) : (
              <>Upload &amp; continue →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
