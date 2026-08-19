import { LocalStorageService } from "./local";
import { VercelBlobStorageService } from "./vercel-blob";
import type { StorageService } from "./types";

export type { StorageService, StoredFile } from "./types";

let instance: StorageService | undefined;

export function getStorageService(): StorageService {
  if (!instance) {
    const driver =
      process.env.STORAGE_DRIVER ?? (process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local");
    instance = driver === "vercel-blob" ? new VercelBlobStorageService() : new LocalStorageService();
  }
  return instance;
}
