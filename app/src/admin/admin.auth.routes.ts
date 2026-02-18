import { Elysia, t } from "elysia";
import { AppError } from "@/error.handler";
import {
  isPasswordSet,
  setPassword,
  verifyPassword,
} from "./admin.auth.service";
import { adminAuthPlugin } from "./admin.auth.plugin";
import {
  clearAuthCookie,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_REQUIRED_SCHEMA,
  setAuthCookie,
  verifyAuthToken,
} from "./admin.auth.utils";

export const adminAuthRoutes = new Elysia({ prefix: "/auth" })
  .use(adminAuthPlugin)

  .get("/status", async () => {
    const initialized = await isPasswordSet();
    return { initialized };
  })


  .post(
    "/setup",
    async ({ body, cookie, jwt }) => {
      const initialized = await isPasswordSet();
      if (initialized) throw new AppError(409, "ALREADY_INITIALIZED");

      await setPassword(body.password);

      const signed = await jwt.sign({ role: "admin" });

      setAuthCookie(cookie, signed);

      return { success: true };
    },
    {
      body: t.Object({ password: t.String({ minLength: 6 }) }),
    },
  )

  .post(
    "/login",
    async ({ body, cookie, jwt }) => {
      const initialized = await isPasswordSet();
      if (!initialized) throw new AppError(409, "NOT_INITIALIZED");

      const valid = await verifyPassword(body.password);
      if (!valid) throw new AppError(401, "INVALID_PASSWORD");

      const signed = await jwt.sign({ role: "admin" });

      setAuthCookie(cookie, signed);

      return { success: true };
    },
    {
      body: t.Object({ password: t.String({ minLength: 1 }) }),
    },
  )
  .guard({
    cookie: AUTH_COOKIE_REQUIRED_SCHEMA,
  })
  .get("/me", async ({ cookie, jwt }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value;
    if (!token) throw new AppError(401, "UNAUTHORIZED");

    const ok = await verifyAuthToken(jwt, token);
    if (!ok) throw new AppError(401, "UNAUTHORIZED");

    return { authed: true };
  })
  .post("/logout", async ({ cookie }) => {
    clearAuthCookie(cookie);

    return { success: true };
  });
