import { t } from "elysia";
import { config } from "@/env.config";
import { AppError } from "@/error.handler";

export const AUTH_COOKIE_NAME = config.COOKIE_TOKEN_NAME;
export const AUTH_COOKIE_REQUIRED_SCHEMA = t.Cookie({
  [AUTH_COOKIE_NAME]: t.String(),
});

const isProd = process.env.NODE_ENV === "production";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
};

export function setAuthCookie(
  cookie: Record<
    string,
    { set: (options: Record<string, unknown>) => void; value?: string | unknown } | undefined
  >,
  value: string,
) {
  const tokenCookie = cookie[AUTH_COOKIE_NAME];
  if (!tokenCookie) throw new AppError(500, "COOKIE_NOT_AVAILABLE");

  tokenCookie.set({
    value,
    ...AUTH_COOKIE_OPTIONS,
  });
}

export function clearAuthCookie(
  cookie: Record<
    string,
    { remove: () => void; value?: string | unknown } | undefined
  >,
) {
  const tokenCookie = cookie[AUTH_COOKIE_NAME];
  if (tokenCookie) tokenCookie.remove();
}

export async function verifyAuthToken(
  jwt: { verify: (token: string) => Promise<unknown> },
  token: string,
) {
  try {
    const payload = await jwt.verify(token);
    return Boolean(payload);
  } catch {
    return false;
  }
}
