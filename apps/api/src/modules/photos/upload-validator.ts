import exifr from "exifr";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);

export type ValidatedImage = {
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  resolution: string;
  exifTimestamp: Date | null;
  deviceInfo: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function validateImageUpload(file: Express.Multer.File): Promise<ValidatedImage> {
  if (!file) throw new AppError("VALIDATION_ERROR", "Photo file is required", 400);

  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new AppError("UPLOAD_TOO_LARGE", `Photo must be ${env.MAX_UPLOAD_MB} MB or smaller`, 400);
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  const mimeType = detected?.mime ?? file.mimetype;
  if (!allowedMimeTypes.has(mimeType)) {
    throw new AppError("UPLOAD_INVALID_TYPE", "Unsupported image type", 400, {
      allowed: Array.from(allowedMimeTypes)
    });
  }

  const metadata = await sharp(file.buffer, { failOn: "none" }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < env.MIN_IMAGE_WIDTH || height < env.MIN_IMAGE_HEIGHT) {
    throw new AppError("VALIDATION_ERROR", "Image resolution is below the configured minimum", 400, {
      minimum: { width: env.MIN_IMAGE_WIDTH, height: env.MIN_IMAGE_HEIGHT },
      actual: { width, height }
    });
  }

  // Extract EXIF metadata
  let exifTimestamp: Date | null = null;
  let deviceInfo: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  try {
    const exif = await exifr.parse(file.buffer, {
      pick: ["DateTimeOriginal", "CreateDate", "Make", "Model", "latitude", "longitude"]
    });

    if (exif) {
      const dateField = exif.DateTimeOriginal ?? exif.CreateDate;
      if (dateField instanceof Date) {
        exifTimestamp = dateField;
      }

      const parts = [exif.Make, exif.Model].filter(Boolean);
      if (parts.length > 0) {
        deviceInfo = parts.join(" ");
      }

      if (typeof exif.latitude === "number" && typeof exif.longitude === "number") {
        latitude = exif.latitude;
        longitude = exif.longitude;
      }
    }
  } catch {
    // EXIF extraction is best-effort; photos without EXIF are still valid
  }

  return {
    mimeType,
    ext: detected?.ext ?? "jpg",
    width,
    height,
    resolution: `${width}x${height}`,
    exifTimestamp,
    deviceInfo,
    latitude,
    longitude
  };
}

// Generate a WebP thumbnail at max 480px width
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, { failOn: "none" })
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
