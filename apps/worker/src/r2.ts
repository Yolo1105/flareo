/**
 * Cloudflare R2 access. R2 exposes an S3-compatible API, so we use
 * the AWS S3 SDK and point it at R2's endpoint.
 *
 * Reads: submissions/<id>/Dockerfile
 * Writes: logs/<id>.txt, sboms/<id>.cdx.json
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketSubmissions: string;
  bucketArtifacts: string;
}

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Read a submitted Dockerfile. Returns null if not present (older
 * submissions may not have one).
 */
export async function fetchDockerfile(
  client: S3Client,
  bucket: string,
  submissionId: string
): Promise<string | null> {
  try {
    const resp = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: `submissions/${submissionId}/Dockerfile`,
      })
    );
    if (!resp.Body) return null;
    return await streamToString(resp.Body as Readable);
  } catch (err) {
    const e = err as { name?: string };
    if (e.name === "NoSuchKey") return null;
    throw err;
  }
}

/**
 * Write a build log to R2 and return a presigned URL valid for 7
 * days. The URL goes in the submitter's email and in the admin UI.
 */
export async function writeBuildLog(
  client: S3Client,
  bucket: string,
  submissionId: string,
  content: string
): Promise<string> {
  const key = `logs/${submissionId}.txt`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: "text/plain; charset=utf-8",
    })
  );
  return await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 7 * 24 * 3600 }
  );
}

/**
 * Write an SBOM (CycloneDX JSON) to R2 and return a public URL.
 * SBOMs are public artifacts by design — anyone pulling the image
 * can verify them.
 */
export async function writeSbom(
  client: S3Client,
  bucket: string,
  submissionId: string,
  content: string
): Promise<string> {
  const key = `sboms/${submissionId}.cdx.json`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: "application/vnd.cyclonedx+json",
      // Public — SBOMs are meant to be fetched by anyone running the image.
      ACL: "public-read",
    })
  );
  // Public URL format for R2. In production the bucket should have a
  // custom domain like sboms.flareo.app; the raw r2.dev URL works too.
  return `https://${bucket}.r2.dev/${key}`;
}
