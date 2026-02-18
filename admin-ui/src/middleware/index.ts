import { redirect } from "@solidjs/router";
import { createMiddleware } from "@solidjs/start/middleware";
import axios from "axios";
import { config } from "~/config";

type InitStatus = { initialized: boolean };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isInitStatus(x: unknown): x is InitStatus {
  return isRecord(x) && typeof x.initialized === "boolean";
}

function isPublicAssetPath(path: string) {
  return (
    path.startsWith("/_build") ||
    path.startsWith("/_server") ||
    path.startsWith("/_assets") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/manifest.webmanifest"
  );
}

function isProxiedApiPath(path: string) {
  // /api/* is proxied by dev server only
  return path.startsWith("/api/");
}

function isDocumentRequest(req: Request) {
  // We only guard page navigations (HTML).
  // API calls / polling should not trigger auth checks.
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

/**
 * Cache "me" per cookie for 10 seconds.
 * This prevents spamming CORE on each page load / refresh.
 */
const ME_TTL_MS = 10_000;
const meCache = new Map<string, { at: number; ok: boolean }>();

async function getAuthedCached(req: Request): Promise<boolean> {
  const cookie = req.headers.get("cookie") ?? "";
  if (!cookie) return false;

  const cached = meCache.get(cookie);
  const now = Date.now();

  if (cached && now - cached.at < ME_TTL_MS) {
    return cached.ok;
  }

  const res = await axios.get(`${config.core}/admin/auth/me`, {
    headers: { cookie, accept: "application/json" },
    timeout: 5000,
    validateStatus: () => true,
  });

  const ok = res.status >= 200 && res.status < 300;
  meCache.set(cookie, { at: now, ok });
  return ok;
}

async function getInitialized(req: Request): Promise<boolean> {
  const cookie = req.headers.get("cookie") ?? "";

  const res = await axios.get(`${config.core}/admin/auth/status`, {
    headers: { cookie, accept: "application/json" },
    timeout: 5000,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) return true;

  const data: unknown = res.data;
  if (!isInitStatus(data)) return true;

  return data.initialized;
}

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url);
    const path = url.pathname;

    // Skip assets + proxied API + non-html requests
    if (isPublicAssetPath(path)) return;
    if (isProxiedApiPath(path)) return;
    if (!isDocumentRequest(event.request)) return;

    // 1) Check auth first (cached)
    const authed = await getAuthedCached(event.request);

    // If authed => never check init/status
    if (authed) {
      if (path === "/" || path === "/login" || path === "/setup") {
        return redirect("/dashboard");
      }
      return;
    }

    // 2) Not authed => now we check init to decide setup/login
    const initialized = await getInitialized(event.request);

    if (!initialized) {
      if (path !== "/setup") return redirect("/setup");
      return;
    }

    // initialized=true but not authed
    if (path !== "/login") return redirect("/login");
  },
});
