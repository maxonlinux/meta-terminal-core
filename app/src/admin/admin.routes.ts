import { Elysia } from "elysia";
import { adminAuthGuard } from "./admin.auth.guard";
import { adminAuthRoutes } from "./admin.auth.routes";
import { adminAssetsRoutes } from "./admin.assets.routes";
import { adminStorageRoutes } from "./admin.storage.routes";

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(adminAuthRoutes)
  .use(adminAuthGuard)
  .use(adminAssetsRoutes)
  .use(adminStorageRoutes)
  .post("/restart", () => {
    setImmediate(() => {
      process.exit(0);
    });
    return { message: "Restarting" };
  });
