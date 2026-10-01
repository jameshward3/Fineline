import { LocalStorageService } from "./local";
import { VercelBlobStorageService } from "./vercel-blob";
import type { StorageService } from "./types";

export type { StorageService, StoredFile } from "./types";

let instance: StorageService | undefined;

export function getStorageService(): StorageService {
  if (!instance) {
    // Vercel's local filesystem is ephemeral. Once Blob is connected, deployed
    // builds must use it for both direct client uploads and later CRM reads.
    const driver = process.env.NODE_ENV === "production" && process.env.BLOB_READ_WRITE_TOKEN
      ? "vercel-blob"
      : process.env.STORAGE_DRIVER ?? (process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local");
    instance = driver === "vercel-blob" ? new VercelBlobStorageService() : new LocalStorageService();
  }
  return instance;
}
