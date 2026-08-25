import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("BLACKLIST_ALLOWED_ORIGIN") ?? "*";
const cacheControl = Deno.env.get("BLACKLIST_CACHE_CONTROL") ?? "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
const configuredLimit = Number.parseInt(Deno.env.get("BLACKLIST_MAX_DOMAINS") ?? "20000", 10);
const domainLimit = Number.isFinite(configuredLimit) ? Math.min(Math.max(configuredLimit, 1), 20_000) : 20_000;

const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": cacheControl,
  "Content-Type": "application/json; charset=utf-8",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "GET") return Response.json({ error: "Method tidak didukung" }, { status: 405, headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase
    .from("blacklist_domains")
    .select("domain")
    .eq("status", "verified")
    .order("domain")
    .limit(domainLimit);

  if (error) return Response.json({ error: "Blacklist belum bisa dimuat" }, { status: 500, headers: cors });
  const domains = data.map(({ domain }) => domain);
  const body = JSON.stringify({ version: new Date().toISOString().slice(0, 10), count: domains.length, domains });
  const etag = `W/\"${domains.length}-${body.length}\"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ...cors, ETag: etag } });
  return new Response(body, { headers: { ...cors, ETag: etag } });
});
