/**
 * Locate and parse a Sigstore bundle from a cosign signature manifest.
 *
 * Cosign has used more than one OCI layout:
 *   1. A layer whose media type is a Sigstore bundle
 *      (`application/vnd.dev.sigstore.bundle+json;version=0.x` or
 *      `application/vnd.dev.sigstore.bundle.v0.3+json`). The layer
 *      bytes are the bundle; if it carries a message signature, a
 *      companion simplesigning payload layer supplies the signed bytes.
 *   2. The older layout: a
 *      `application/vnd.dev.cosign.simplesigning.v1+json` layer whose
 *      annotations carry the signature, Fulcio certificate, and Rekor
 *      SET. We assemble a v0.1 bundle from those annotations.
 *
 * Anything else is returned as `unrecognized` rather than treated as
 * unsigned — absence of a signature manifest is a different outcome.
 */

import { createHash } from "node:crypto";
import {
  BUNDLE_V01_MEDIA_TYPE,
  bundleFromJSON,
  type Bundle,
} from "@sigstore/bundle";
import {
  fetchBlob,
  type ParsedRef,
  type RegistryError,
} from "@/lib/sigstore/registry";

const BUNDLE_MEDIA_TYPE_RE =
  /^application\/vnd\.dev\.sigstore\.bundle(\+json;version=0\.\d+|\.v0\.3\+json)$/;

const SIMPLESIGNING_MEDIA_TYPE =
  "application/vnd.dev.cosign.simplesigning.v1+json";

type OciLayer = {
  mediaType?: string;
  digest?: string;
  annotations?: Record<string, string>;
};

type OciManifest = {
  layers?: OciLayer[];
};

export type BundleExtractResult =
  | { kind: "ok"; bundle: Bundle; artifact: Buffer }
  | { kind: "unrecognized" }
  | { kind: "error"; code: string; message: string };

/**
 * Detect which layout a signature manifest uses and return a parsed
 * bundle plus the bytes that were signed (for message-signature
 * bundles). Pure against the manifest JSON; network only for blobs.
 */
export async function extractBundleFromSigManifest(
  parsed: ParsedRef,
  manifestBody: unknown,
): Promise<BundleExtractResult> {
  if (!isOciManifest(manifestBody)) {
    return { kind: "unrecognized" };
  }
  const layers = manifestBody.layers ?? [];
  if (layers.length === 0) return { kind: "unrecognized" };

  const bundleLayer = layers.find(
    (l) => typeof l.mediaType === "string" && BUNDLE_MEDIA_TYPE_RE.test(l.mediaType),
  );
  if (bundleLayer?.digest) {
    return extractFromBundleLayer(parsed, layers, bundleLayer);
  }

  const simpleLayer = layers.find(
    (l) => l.mediaType === SIMPLESIGNING_MEDIA_TYPE,
  );
  if (simpleLayer?.digest) {
    return extractFromAnnotationLayout(parsed, simpleLayer);
  }

  return { kind: "unrecognized" };
}

/**
 * Classify a signature manifest's layout without fetching blobs.
 * Exported for unit tests.
 */
export function detectSigManifestLayout(
  manifestBody: unknown,
): "bundle-layer" | "annotation" | "unrecognized" {
  if (!isOciManifest(manifestBody)) return "unrecognized";
  const layers = manifestBody.layers ?? [];
  if (
    layers.some(
      (l) =>
        typeof l.mediaType === "string" && BUNDLE_MEDIA_TYPE_RE.test(l.mediaType),
    )
  ) {
    return "bundle-layer";
  }
  if (layers.some((l) => l.mediaType === SIMPLESIGNING_MEDIA_TYPE)) {
    return "annotation";
  }
  return "unrecognized";
}

async function extractFromBundleLayer(
  parsed: ParsedRef,
  layers: OciLayer[],
  bundleLayer: OciLayer,
): Promise<BundleExtractResult> {
  const blob = await fetchBlob(parsed, bundleLayer.digest!);
  if (!blob.ok) return registryFailure(blob.error);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(blob.body.toString("utf8"));
  } catch {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "signature bundle layer is not valid JSON",
    };
  }

  let bundle: Bundle;
  try {
    bundle = bundleFromJSON(parsedJson);
  } catch (err) {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: err instanceof Error ? err.message : "bundle parse failed",
    };
  }

  // DSSE envelopes carry their own payload; message signatures need the
  // signed artifact bytes (usually a companion simplesigning layer).
  if (bundle.content?.$case === "dsseEnvelope") {
    return { kind: "ok", bundle, artifact: Buffer.alloc(0) };
  }

  const payloadLayer = layers.find(
    (l) =>
      l.mediaType === SIMPLESIGNING_MEDIA_TYPE &&
      l.digest &&
      l.digest !== bundleLayer.digest,
  );
  if (!payloadLayer?.digest) {
    return {
      kind: "error",
      code: "bundle_incomplete",
      message:
        "message-signature bundle layer has no companion simplesigning payload",
    };
  }
  const payload = await fetchBlob(parsed, payloadLayer.digest);
  if (!payload.ok) return registryFailure(payload.error);
  return { kind: "ok", bundle, artifact: payload.body };
}

async function extractFromAnnotationLayout(
  parsed: ParsedRef,
  layer: OciLayer,
): Promise<BundleExtractResult> {
  const anns = layer.annotations ?? {};
  const signatureB64 =
    anns["dev.cosignproject.cosign/signature"] ??
    anns["dev.sigstore.cosign/signature"];
  const certPem = anns["dev.sigstore.cosign/certificate"];
  const rekorRaw = anns["dev.sigstore.cosign/bundle"];

  if (!signatureB64 || !certPem || !rekorRaw) {
    return { kind: "unrecognized" };
  }

  const payload = await fetchBlob(parsed, layer.digest!);
  if (!payload.ok) return registryFailure(payload.error);

  let rekor: {
    SignedEntryTimestamp?: string;
    Payload?: {
      body?: string;
      integratedTime?: number | string;
      logIndex?: number | string;
      logID?: string;
    };
  };
  try {
    rekor = JSON.parse(rekorRaw) as typeof rekor;
  } catch {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "cosign Rekor annotation is not valid JSON",
    };
  }

  const set = rekor.SignedEntryTimestamp;
  const body = rekor.Payload?.body;
  const logID = rekor.Payload?.logID;
  const logIndex = rekor.Payload?.logIndex;
  const integratedTime = rekor.Payload?.integratedTime;
  if (!set || !body || !logID || logIndex === undefined || integratedTime === undefined) {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "cosign Rekor annotation is missing required fields",
    };
  }

  let certDer: Buffer;
  try {
    certDer = pemToDer(certPem);
  } catch {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "Fulcio certificate annotation is not valid PEM",
    };
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(signatureB64, "base64");
  } catch {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "signature annotation is not valid base64",
    };
  }

  const payloadDigest = createHash("sha256").update(payload.body).digest();
  let logIdB64: string;
  try {
    logIdB64 = Buffer.from(logID, "hex").toString("base64");
  } catch {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: "Rekor logID is not valid hex",
    };
  }

  // @sigstore/bundle's toMessageSignatureBundle omits the Rekor SET and
  // leaves messageDigest unset, which breaks both timestamp and digest
  // checks. Build a serialized v0.1 bundle and let bundleFromJSON
  // validate the shape.
  try {
    const bundle = bundleFromJSON({
      mediaType: BUNDLE_V01_MEDIA_TYPE,
      verificationMaterial: {
        certificate: { rawBytes: certDer.toString("base64") },
        tlogEntries: [
          {
            logIndex: String(logIndex),
            logId: { keyId: logIdB64 },
            kindVersion: { kind: "hashedrekord", version: "0.0.1" },
            integratedTime: String(integratedTime),
            inclusionPromise: { signedEntryTimestamp: set },
            canonicalizedBody: body,
          },
        ],
      },
      messageSignature: {
        messageDigest: {
          algorithm: "SHA2_256",
          digest: payloadDigest.toString("base64"),
        },
        signature: signature.toString("base64"),
      },
    });
    return { kind: "ok", bundle, artifact: payload.body };
  } catch (err) {
    return {
      kind: "error",
      code: "bundle_malformed",
      message: err instanceof Error ? err.message : "bundle assembly failed",
    };
  }
}

function pemToDer(pem: string): Buffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const der = Buffer.from(b64, "base64");
  if (der.length === 0) throw new Error("empty certificate");
  return der;
}

function isOciManifest(body: unknown): body is OciManifest {
  return typeof body === "object" && body !== null;
}

function registryFailure(error: RegistryError): BundleExtractResult {
  if (error.kind === "timeout") {
    return { kind: "error", code: "timeout", message: "registry request timed out" };
  }
  if (error.kind === "not_found") {
    return {
      kind: "error",
      code: "registry_error",
      message: "signature blob not found",
    };
  }
  if (error.kind === "http") {
    return {
      kind: "error",
      code: "registry_error",
      message: `registry returned ${error.status}`,
    };
  }
  return { kind: "error", code: "network_error", message: error.message };
}
