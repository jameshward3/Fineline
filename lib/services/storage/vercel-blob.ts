import { put, list, del } from "@vercel/blob";
import type { StorageService, StoredFile } from "./types";

/**
 * Vercel Blob-backed storage. Keys are used as blob pathnames with
 * `addRandomSuffix: false` so a key always maps to exactly one blob —
 * callers (export packaging, the /api/files proxy) look files up by the
 * same key they stored them under, never by Vercel's signed URL.
 */
export class VercelBlobStorageService implements StorageService {
  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return { storageKey: key, url: this.getUrl(key), fileSizeBytes: data.byteLength };
  }

  async get(key: string): Promise<Buffer> {
    const { blobs } = await list({ prefix: key, limit: 1 });
    const blob = blobs.find((b) => b.pathname === key);
    if (!blob) throw new Error(`Not found in blob storage: ${key}`);
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error(`Failed to fetch blob: ${key}`);
    return Buffer.from(await res.arrayBuffer());
  }

  getUrl(key: string): string {
    // Proxied through our own route so callers never depend on Vercel's
    // blob host directly, and access stays consistent with local dev.
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    const { blobs } = await list({ prefix: key, limit: 1 });
    const blob = blobs.find((b) => b.pathname === key);
    if (blob) await del(blob.url);
  }
}
