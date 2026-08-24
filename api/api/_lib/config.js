const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

export function getConfig() {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Environment belum lengkap: ${missing.join(", ")}`);

  const rawLimit = Number.parseInt(process.env.BLACKLIST_MAX_DOMAINS ?? "20000", 10);
  return {
    supabaseUrl: process.env.SUPABASE_URL.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    allowedOrigin: process.env.BLACKLIST_ALLOWED_ORIGIN ?? "*",
    cacheControl: process.env.BLACKLIST_CACHE_CONTROL ?? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    domainLimit: Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20_000) : 20_000,
  };
}

export function setCommonHeaders(response, config) {
  response.setHeader("Access-Control-Allow-Origin", config.allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, If-None-Match");
  response.setHeader("Cache-Control", config.cacheControl);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
}
