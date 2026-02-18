import { Elysia } from "elysia";
import { adminAuthPlugin } from "./admin.auth.plugin";
import { AUTH_COOKIE_REQUIRED_SCHEMA, AUTH_COOKIE_NAME, verifyAuthToken } from "./admin.auth.utils";

export const adminAuthGuard = new Elysia()
  .use(adminAuthPlugin)
  .guard({
    cookie: AUTH_COOKIE_REQUIRED_SCHEMA,
  })
  .onBeforeHandle(async ({ cookie, jwt, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value;
    if (!token) {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }

    const ok = await verifyAuthToken(jwt, token);
    if (!ok) {
      set.status = 401;
      return { error: "UNAUTHORIZED" };
    }
  });
