export default function handler(_request, response) {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  return response.status(configured ? 200 : 503).json({
    ok: configured,
    service: "blokirjudi-api",
    databaseConfigured: configured,
  });
}
