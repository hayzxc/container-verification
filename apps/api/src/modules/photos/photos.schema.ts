import { PhotoAngle } from "@prisma/client";
import { z } from "zod";

export const uploadPhotoSchema = z.object({
  photoAngle: z.nativeEnum(PhotoAngle)
});
