import { Elysia, t } from "elysia";
import { AppError } from "@/error.handler";
import { StorageRepository } from "../storage/storage.repository";
import path from "path";
import { randomUUID } from "crypto";
import { isWebp } from "../storage/storage.utils";
import { ErrorResponse } from "@/shared/http";

const storageRepo = new StorageRepository();

export const adminStorageRoutes = new Elysia({ prefix: "/storage" }).post(
  "/upload",
  async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new AppError(400, "NO_FILE_UPLOADED");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isWebp(buffer)) {
      throw new AppError(400, "INVALID_FILE_TYPE");
    }

    const ext = path.extname(file.name);
    const uuid = randomUUID();
    const filename = uuid + ext;

    await storageRepo.uploadImage(filename, buffer, "image/webp");

    return { filename };
  },
  {
    response: {
      200: t.Object({ filename: t.String() }),
      400: ErrorResponse,
      401: ErrorResponse,
      500: ErrorResponse,
    },
  },
);
