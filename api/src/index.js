import fallback from "../blacklist.json" with { type: "json" };
import { normalizeDomains } from "./domain.js";
import { corsHeaders, error, json } from "./response.js";

const BLACKLIST_KEY = "blacklist:current";
const MAX_LIMIT = 20_000;

function domainLimit(env) {
  const value = Number.parseInt(env.MAX_DOMAINS || String(MAX_LIMIT), 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, 1), MAX_LIMIT) : MAX_LIMIT;
}

async function hash(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `\"${[...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}\"`;
}

async function readBlacklist(env) {
  if (!env.BLACKLIST_KV) return { ...fallback, source: "fallback" };
  const stored = await env.BLACKLIST_KV.get(BLACKLIST_KEY, "json");
  return stored ? { ...stored, source: "kv" } : { ...fallback, source: "fallback" };
}

async function blacklistResponse(request, env) {
  const stored = await readBlacklist(env);
  const domains = normalizeDomains(stored.domains, domainLimit(env));
  const body = JSON.stringify({
    version: stored.version || stored.updatedAt || "unknown",
    updatedAt: stored.updatedAt || null,
    count: domains.length,
    domains,
  });
  const etag = await hash(body);
  const headers = {
    ...corsHeaders(env),
    "Cache-Control": env.CACHE_CONTROL || "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    ETag: etag,
  };
  if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { status: 200, headers });
}

async function updateBlacklist(request, env) {
  if (!env.BLACKLIST_KV) return error("KV binding belum dikonfigurasi", 503, env);
  if (!env.ADMIN_API_TOKEN) return error("Admin API belum diaktifkan", 503, env);
  if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_API_TOKEN}`) {
    return error("Token admin tidak valid", 401, env);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return error("Body harus berupa JSON", 400, env);
  }
  if (!Array.isArray(payload.domains)) return error("Field domains harus berupa array", 400, env);

  const domains = normalizeDomains(payload.domains, domainLimit(env));
  const updatedAt = new Date().toISOString();
  const data = { version: payload.version || updatedAt, updatedAt, domains };
  await env.BLACKLIST_KV.put(BLACKLIST_KEY, JSON.stringify(data));
  return json({ ok: true, count: domains.length, version: data.version, updatedAt }, { status: 200 }, env);
}

async function health(env) {
  let source = "fallback";
  try {
    if (env.BLACKLIST_KV && await env.BLACKLIST_KV.get(BLACKLIST_KEY)) source = "kv";
  } catch {
    return json({ ok: false, service: "blokirjudi-api", kv: "error" }, { status: 503 }, env);
  }
  return json({ ok: true, service: "blokirjudi-api", kv: env.BLACKLIST_KV ? "connected" : "unbound", source }, {}, env);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });
    if (pathname === "/" && request.method === "GET") {
      return json({ name: "BlokirJudi API", endpoints: ["GET /v1/blacklist", "GET /health"] }, {}, env);
    }
    if (pathname === "/health" && request.method === "GET") return health(env);
    if (pathname === "/v1/blacklist" && request.method === "GET") return blacklistResponse(request, env);
    if (pathname === "/v1/blacklist" && request.method === "PUT") return updateBlacklist(request, env);
    return error("Endpoint tidak ditemukan", 404, env);
  },
};
