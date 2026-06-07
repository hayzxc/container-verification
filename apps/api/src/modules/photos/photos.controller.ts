import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { photosService } from "./photos.service.js";
import { uploadPhotoSchema } from "./photos.schema.js";

export const photosController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const photos = await photosService.list(req.params.id, req.user!);
    return sendSuccess(res, photos);
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const parsed = uploadPhotoSchema.parse(req.body);
    const photo = await photosService.upload({
      inspectionId: req.params.id,
      photoAngle: parsed.photoAngle,
      file: req.file!
    }, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, photo, undefined, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const photo = await photosService.remove(req.params.photoId, req.user!, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });
    return sendSuccess(res, photo);
  })
};
