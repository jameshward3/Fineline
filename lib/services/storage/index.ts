import { LocalStorageService } from "./local";
import type { StorageService } from "./types";

export type { StorageService, StoredFile } from "./types";

let instance: StorageService | undefined;

export function getStorageService(): StorageService {
  if (!instance) {
    // Only "local" is implemented today. A future S3 / Vercel Blob driver
    // can be selected here via STORAGE_DRIVER without touching call sites.
    instance = new LocalStorageService();
  }
  return instance;
}
