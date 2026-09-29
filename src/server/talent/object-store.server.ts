import {
  encodeLocator,
  objectHttpRequest,
  objectKey,
  parseLocator,
  readObjectStoreEnv,
} from "@/domain/object-store";

/** Store bytes in S3 or R2 when the bucket env is complete. Otherwise return database base64. */
export async function storeFileBytes(input: {
  companyId: string;
  fileId: string;
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  const plan = readObjectStoreEnv(process.env);
  if (!plan.configured) return input.bytes.toString("base64");
  const key = objectKey(input.companyId, input.fileId);
  const bytes = new Uint8Array(input.bytes);
  const request = objectHttpRequest({
    method: "PUT",
    config: plan.config,
    key,
    body: bytes,
    contentType: input.contentType,
    now: new Date(),
  });
  const response = await fetch(request.url, { method: "PUT", headers: request.headers, body: bytes });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(`Object storage refused the file (${response.status}). It was not saved. ${detail}`.trim());
  }
  return encodeLocator({ provider: plan.config.provider, bucket: plan.config.bucket, key });
}

export async function loadFileBytes(content: string): Promise<Buffer> {
  const locator = parseLocator(content);
  if (!locator) return Buffer.from(content, "base64");
  const plan = readObjectStoreEnv(process.env);
  if (!plan.configured) throw new Error("This file is in object storage, but no bucket is configured.");
  const request = objectHttpRequest({ method: "GET", config: plan.config, key: locator.key, now: new Date() });
  const response = await fetch(request.url, { method: "GET", headers: request.headers });
  if (!response.ok) throw new Error(`Object storage could not return the file (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

/** No-op for database bytes. A remote object is deleted before the row may go. */
export async function removeStoredFile(content: string): Promise<void> {
  const locator = parseLocator(content);
  if (!locator) return;
  const plan = readObjectStoreEnv(process.env);
  if (!plan.configured) throw new Error("This file is in object storage, but no bucket is configured. The row was kept.");
  const request = objectHttpRequest({ method: "DELETE", config: plan.config, key: locator.key, now: new Date() });
  const response = await fetch(request.url, { method: "DELETE", headers: request.headers });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Object storage could not delete the file (${response.status}). The row was kept.`);
  }
}
