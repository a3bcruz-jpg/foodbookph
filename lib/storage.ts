export type StoredMedia = { url: string; alt?: string };

/** Media is kept behind this boundary so local previews and cloud object storage share one contract. */
export interface MediaStorage {
  upload(file: Blob, filename: string): Promise<StoredMedia>;
}

export class LocalPreviewStorage implements MediaStorage {
  async upload(file: Blob, filename: string): Promise<StoredMedia> {
    return { url: URL.createObjectURL(file), alt: filename };
  }
}
