import { createHash, createHmac } from "node:crypto";

export type ObjectProvider = "s3" | "r2";

export type ObjectStoreConfig = {
  provider: ObjectProvider;
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type ObjectStorePlan =
  | { configured: false; reason: string }
  | { configured: true; config: ObjectStoreConfig };

const LOCATOR = "object:v1:";

export function readObjectStoreEnv(env: Record<string, string | undefined>): ObjectStorePlan {
  const bucket = env.OBJECT_STORE_BUCKET?.trim() ?? "";
  const accessKeyId = env.OBJECT_STORE_ACCESS_KEY_ID?.trim() ?? "";
  const secretAccessKey = env.OBJECT_STORE_SECRET_ACCESS_KEY?.trim() ?? "";
  const endpoint = (env.OBJECT_STORE_ENDPOINT?.trim() ?? "").replace(/\/$/, "");
  const hinted = env.OBJECT_STORE_PROVIDER?.trim().toLowerCase();
  const provider: ObjectProvider = hinted === "r2" || endpoint.includes("r2.cloudflarestorage.com") ? "r2" : "s3";
  const missing = [
    bucket ? "" : "OBJECT_STORE_BUCKET",
    accessKeyId ? "" : "OBJECT_STORE_ACCESS_KEY_ID",
    secretAccessKey ? "" : "OBJECT_STORE_SECRET_ACCESS_KEY",
    provider === "r2" && !endpoint ? "OBJECT_STORE_ENDPOINT" : "",
  ].filter(Boolean);
  if (missing.length > 0) {
    return {
      configured: false,
      reason: `No bucket is configured (${missing.join(", ")}). Files stay in the database.`,
    };
  }
  const region = env.OBJECT_STORE_REGION?.trim() || (provider === "r2" ? "auto" : "us-east-1");
  const forcePathStyle = Boolean(endpoint);
  const host = endpoint || `https://${bucket}.s3.${region}.amazonaws.com`;
  return {
    configured: true,
    config: { provider, bucket, region, endpoint: host, accessKeyId, secretAccessKey, forcePathStyle },
  };
}

export function objectKey(companyId: string, fileId: string): string {
  const company = companyId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const file = fileId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  if (!company || !file) throw new Error("The object key is missing a company or a file.");
  return `${company}/${file}`;
}

export function encodeLocator(input: { provider: ObjectProvider; bucket: string; key: string }): string {
  return LOCATOR + Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
}

export function parseLocator(content: string): { provider: ObjectProvider; bucket: string; key: string } | null {
  if (!content.startsWith(LOCATOR)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(content.slice(LOCATOR.length), "base64url").toString("utf8")) as {
      provider?: string;
      bucket?: string;
      key?: string;
    };
    if ((parsed.provider !== "s3" && parsed.provider !== "r2") || !parsed.bucket || !parsed.key) return null;
    if (parsed.key.includes("..") || parsed.key.startsWith("/")) return null;
    return { provider: parsed.provider, bucket: parsed.bucket, key: parsed.key };
  } catch {
    return null;
  }
}

function sha256Hex(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

export function amzStamp(now: Date): { amz: string; day: string } {
  const amz = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { amz, day: amz.slice(0, 8) };
}

/** Header names must already be lowercase. */
export function authorizationHeader(input: {
  method: string;
  path: string;
  query?: string;
  headers: Record<string, string>;
  payloadHash: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  amzDate: string;
}): string {
  const names = Object.keys(input.headers).map((name) => name.toLowerCase()).sort();
  const canonicalHeaders = names.map((name) => `${name}:${input.headers[name]!.trim()}\n`).join("");
  const signed = names.join(";");
  const canonical = [
    input.method.toUpperCase(),
    input.path,
    input.query ?? "",
    canonicalHeaders,
    signed,
    input.payloadHash,
  ].join("\n");
  const day = input.amzDate.slice(0, 8);
  const scope = `${day}/${input.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", input.amzDate, scope, sha256Hex(canonical)].join("\n");
  const dateKey = hmac(`AWS4${input.secretAccessKey}`, day);
  const regionKey = hmac(dateKey, input.region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(toSign, "utf8").digest("hex");
  return `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${signature}`;
}

export function objectHttpRequest(input: {
  method: "PUT" | "GET" | "DELETE";
  config: ObjectStoreConfig;
  key: string;
  body?: Uint8Array;
  contentType?: string;
  now: Date;
}): { url: string; headers: Record<string, string> } {
  const stamp = amzStamp(input.now);
  const pathKey = input.key.split("/").map(encodeURIComponent).join("/");
  const url = input.config.forcePathStyle
    ? new URL(`${input.config.endpoint}/${input.config.bucket}/${pathKey}`)
    : new URL(`${input.config.endpoint}/${pathKey}`);
  const payloadHash = sha256Hex(input.body ?? new Uint8Array());
  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": stamp.amz,
  };
  if (input.contentType && input.method === "PUT") headers["content-type"] = input.contentType;
  headers.authorization = authorizationHeader({
    method: input.method,
    path: url.pathname,
    headers,
    payloadHash,
    accessKeyId: input.config.accessKeyId,
    secretAccessKey: input.config.secretAccessKey,
    region: input.config.region,
    amzDate: stamp.amz,
  });
  const { host: _host, ...wire } = headers;
  return { url: url.toString(), headers: wire };
}
