import { action, redirect } from "@solidjs/router";
import axios from "axios";
import { getRequestEvent } from "solid-js/web";
import { config } from "~/config";

export type AuthResult = { ok: false; error: string };

const error = (message: string): AuthResult => ({ ok: false, error: message });

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function readErrorMessage(data: unknown, fallback: string): string {
  if (isRecord(data) && typeof data.error === "string") return data.error;
  return fallback;
}

export const login = action(async (form: FormData): Promise<AuthResult> => {
  "use server";

  const password = form.get("password");
  if (!password) return error("Password is required");

  const res = await axios.post(
    `${config.core}/admin/auth/login`,
    { password },
    {
      headers: { "content-type": "application/json" },
      timeout: 8000,
      validateStatus: () => true,
    },
  );

  if (res.status < 200 || res.status >= 300) {
    return error(readErrorMessage(res.data, "LOGIN_FAILED"));
  }

  const ev = getRequestEvent();
  if (!ev) return error("No request event");

  const setCookieHeader = res.headers["set-cookie"];
  if (!setCookieHeader) return error("No set cookie");

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  for (const cookie of cookies) {
    ev.response.headers.append("set-cookie", cookie);
  }
  throw redirect("/");
}, "login");

export const setup = action(async (form: FormData): Promise<AuthResult> => {
  "use server";

  const password = form.get("password");
  if (!password) return error("Password is required");

  const res = await axios.post(
    `${config.core}/admin/auth/setup`,
    { password },
    {
      headers: { "content-type": "application/json" },
      timeout: 8000,
      validateStatus: () => true,
    },
  );

  if (res.status < 200 || res.status >= 300) {
    return error(readErrorMessage(res.data, "SETUP_FAILED"));
  }

  throw redirect("/login");
}, "setup");
