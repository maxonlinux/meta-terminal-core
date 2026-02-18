import fs from "fs/promises";
import path from "path";

type StorageObject = {
  contentType: string;
  body: Uint8Array;
};

export class StorageRepository {
  async uploadImage(key: string, buffer: Buffer, contentType: string) {
    const filePath = resolveStoragePath(key);
    await ensureStorageDir(filePath);
    await fs.writeFile(filePath, buffer);
    void contentType;
  }

  async getImage(key: string): Promise<StorageObject | null> {
    const filePath = resolveStoragePath(key);
    try {
      const body = await fs.readFile(filePath);
      return {
        contentType: contentTypeFromKey(key),
        body,
      };
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }
}

// resolveStoragePath ensures the key resolves under data/images.
function resolveStoragePath(key: string): string {
  const safeKey = path.basename(key);
  return path.join(process.cwd(), "data", "images", safeKey);
}

// ensureStorageDir ensures the destination folder exists.
async function ensureStorageDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

// contentTypeFromKey provides a minimal type mapping.
function contentTypeFromKey(key: string): string {
  switch (path.extname(key).toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

// isNotFound detects missing-file errors.
function isNotFound(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT",
  );
}
