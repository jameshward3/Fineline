import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import type { StorageService, StoredFile } from "./types";

const BASE_DIR = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "./.data/artwork");

function resolveSafePath(key: string): string {
  const normalized = path.normalize(key).replace(/^([./\\]+)/, "");
  const full = path.join(BASE_DIR, normalized);
  if (!full.startsWith(BASE_DIR)) {
    throw new Error(`Refusing to access storage path outside base directory: ${key}`);
  }
  return full;
}

export class LocalStorageService implements StorageService {
  async put(key: string, data: Buffer, _contentType: string): Promise<StoredFile> {
    const full = resolveSafePath(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    const info = await stat(full);
    return { storageKey: key, url: this.getUrl(key), fileSizeBytes: info.size };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(resolveSafePath(key));
  }

  getUrl(key: string): string {
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    await rm(resolveSafePath(key), { force: true });
  }
}
