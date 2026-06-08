import { createWriteStream, mkdirSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env.js";

// S3-compatible client (works with MinIO locally)
const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE
});

// Local filesystem storage root (fallback when S3 is not available)
const LOCAL_STORAGE_ROOT = join(process.cwd(), ".storage");

export const storageService = {
  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    if (env.STORAGE_DRIVER === "s3") {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType
        })
      );
      return;
    }

    // Local filesystem fallback
    const filePath = join(LOCAL_STORAGE_ROOT, key);
    mkdirSync(dirname(filePath), { recursive: true });
    const stream = createWriteStream(filePath);
    await pipeline(Readable.from(body), stream);
  },

  async getSignedUrl(key: string): Promise<string> {
    if (env.STORAGE_DRIVER === "s3") {
      const command = new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key
      });
      return getSignedUrl(s3Client, command, {
        expiresIn: env.SIGNED_URL_EXPIRY
      });
    }

    // Local fallback: return a relative path the API can serve
    return `/api/storage/${encodeURIComponent(key)}`;
  },

  async delete(key: string): Promise<void> {
    if (env.STORAGE_DRIVER === "s3") {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key
        })
      );
      return;
    }

    const filePath = join(LOCAL_STORAGE_ROOT, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  },

  getLocalPath(key: string): string {
    return join(LOCAL_STORAGE_ROOT, key);
  },

  getLocalBuffer(key: string): Buffer | null {
    const filePath = join(LOCAL_STORAGE_ROOT, key);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath);
  }
};
