// Firefox masih menjalankan MV3 background script sebagai script klasik. File
// mandiri ini sengaja menghindari bundler dan punya perilaku sama dengan versi Chromium.
const api = globalThis.browser;
const defaults = { enabled: true, endpoint: "https://api.blokirjudi.id/v1/blacklist", updateEveryHours: 24 };
const alarmName = "refresh-blacklist";

function normalize(value) {
  if (typeof value !== "string") return null;
  let domain = value.trim().toLowerCase().replace(/^\*\./, "").replace(/^www\./, "").replace(/\.$/, "");
  try { if (domain.includes("://")) domain = new URL(domain).hostname; } catch { return null; }
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ? domain : null;
}

async function refresh() {
  const settings = await api.storage.local.get(defaults);
  const old = await api.declarativeNetRequest.getDynamicRules();
  if (!settings.enabled) {
    await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map((rule) => rule.id) });
    await api.storage.local.set({ count: 0 });
    return { skipped: true, count: 0 };
  }
  const response = await fetch(settings.endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Server membalas ${response.status}`);
  const payload = await response.json();
  const source = Array.isArray(payload) ? payload : payload.domains;
  if (!Array.isArray(source)) throw new Error("Format blacklist tidak valid");
  const domains = [...new Set(source.map(normalize).filter(Boolean))].slice(0, 20000);
  const rules = domains.map((domain, index) => ({ id: 10000 + index, priority: 1, action: { type: "redirect", redirect: { extensionPath: "/blocked/index.html" } }, condition: { requestDomains: [domain], resourceTypes: ["main_frame"] } }));
  await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map((rule) => rule.id), addRules: rules });
  const status = { count: rules.length, lastUpdated: new Date().toISOString(), lastError: null };
  await api.storage.local.set(status);
  return status;
}
async function schedule() { const { updateEveryHours } = await api.storage.local.get(defaults); await api.alarms.clear(alarmName); await api.alarms.create(alarmName, { delayInMinutes: 1, periodInMinutes: Math.max(1, updateEveryHours) * 60 }); }
async function saveError(error) { await api.storage.local.set({ lastError: error.message ?? String(error) }); }
api.runtime.onInstalled.addListener(() => schedule().then(refresh).catch(saveError));
api.runtime.onStartup.addListener(() => schedule().catch(saveError));
api.alarms.onAlarm.addListener((alarm) => { if (alarm.name === alarmName) refresh().catch(saveError); });
api.runtime.onMessage.addListener((message) => message?.type === "refresh" ? refresh().catch(async (error) => { await saveError(error); return { error: error.message }; }) : undefined);
