import { createHash } from "node:crypto";
import { getConfig, setCommonHeaders } from "../_lib/config.js";

export default async function handler(request, response) {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({ error: "Konfigurasi server belum lengkap" });
  }
  setCommonHeaders(response, config);

  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    return response.status(405).json({ error: "Method tidak didukung" });
  }

  const query = new URLSearchParams({
    select: "domain",
    status: "eq.verified",
    order: "domain.asc",
    limit: String(config.domainLimit),
  });

  try {
    const upstream = await fetch(`${config.supabaseUrl}/rest/v1/blacklist_domains?${query}`, {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: "application/json",
      },
    });
    if (!upstream.ok) {
      console.error("Supabase blacklist error", upstream.status, await upstream.text());
      return response.status(502).json({ error: "Blacklist belum bisa dimuat" });
    }

    const rows = await upstream.json();
    const domains = rows.map(({ domain }) => domain);
    const payload = JSON.stringify({
      version: new Date().toISOString().slice(0, 10),
      count: domains.length,
      domains,
    });
    const etag = `\"${createHash("sha256").update(payload).digest("base64url")}\"`;
    response.setHeader("ETag", etag);
    if (request.headers["if-none-match"] === etag) return response.status(304).end();
    return response.status(200).send(payload);
  } catch (error) {
    console.error("Blacklist request failed", error);
    return response.status(502).json({ error: "Server database tidak dapat dijangkau" });
  }
}
