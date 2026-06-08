import { randomUUID } from "crypto";

const SIDECAR = "http://127.0.0.1:1106";

function getBucketId(): string {
  const id = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!id) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  return id;
}

function getPrivatePrefix(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR ?? "";
  const match = dir.match(/^gs:\/\/[^/]+\/(.+)$/);
  return match ? match[1] : "private";
}

async function signURL(
  objectName: string,
  method: "PUT" | "GET" | "DELETE",
  ttlSec: number,
): Promise<string> {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: getBucketId(),
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Sidecar sign failed: ${res.status}`);
  const { signed_url } = (await res.json()) as { signed_url: string };
  return signed_url;
}

export async function requestChartUploadURL(): Promise<{
  uploadURL: string;
  objectName: string;
}> {
  const prefix = getPrivatePrefix();
  const objectName = `${prefix}/chart-uploads/${randomUUID()}`;
  const uploadURL = await signURL(objectName, "PUT", 900);
  return { uploadURL, objectName };
}

export async function downloadChartImage(objectName: string): Promise<{
  dataUrl: string;
  contentType: string;
}> {
  const getURL = await signURL(objectName, "GET", 120);
  const res = await fetch(getURL);
  if (!res.ok) throw new Error(`Chart download failed: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`, contentType };
}

export function deleteChartImage(objectName: string): void {
  signURL(objectName, "DELETE", 60)
    .then((url) => fetch(url, { method: "DELETE" }))
    .catch(() => undefined);
}
