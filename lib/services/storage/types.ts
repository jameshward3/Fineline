export interface StoredFile {
  storageKey: string;
  url: string;
  fileSizeBytes: number;
}

/**
 * Object/blob storage boundary. The local filesystem implementation is used
 * in development; swap in an S3 / Vercel Blob implementation for production
 * by providing another class that satisfies this interface and wiring it up
 * in `index.ts` — nothing else in the app should depend on the concrete
 * implementation.
 */
export interface StorageService {
  put(key: string, data: Buffer, contentType: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}
