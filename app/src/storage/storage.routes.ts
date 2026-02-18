import { Elysia, t } from "elysia";
import { AppError } from "@/error.handler";
import { ErrorResponse } from "@/shared/http";
import { logger } from "@/shared/logger";
import { StorageRepository } from "./storage.repository";

const storageRepo = new StorageRepository();

export const storageRoutes = new Elysia({ prefix: "/storage" }).get(
  "/:filename",
  async ({ params }: { params: { filename: string } }) => {
    try {
      const data = await storageRepo.getImage(params.filename);

      if (!data) {
        throw new AppError(404, "FILE_NOT_FOUND");
      }

      return new Response(Buffer.from(data.body), {
        headers: {
          "content-type": data.contentType ?? "application/octet-stream",
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Error in getting file", { error });

      throw new AppError(500, "INTERNAL_SERVER_ERROR");
    }
  },
  {
    params: t.Object({
      filename: t.String(),
    }),
    response: {
      200: t.Any(),
      400: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
  },
);
