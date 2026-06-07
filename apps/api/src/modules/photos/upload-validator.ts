import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);

export async function validateImageUpload(file: Express.Multer.File) {
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

  return {
    mimeType,
    ext: detected?.ext ?? "jpg",
    width,
    height,
    resolution: `${width}x${height}`
  };
}
