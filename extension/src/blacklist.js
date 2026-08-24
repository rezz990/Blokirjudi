import api from "./browser.js";
import { DEFAULTS, DYNAMIC_RULE_START, MAX_DYNAMIC_RULES } from "./config.js";

export function normalizeDomain(value) {
  if (typeof value !== "string") return null;
  let candidate = value.trim().toLowerCase();
  if (!candidate || candidate.length > 253) return null;
  try {
    if (candidate.includes("://")) candidate = new URL(candidate).hostname;
  } catch {
    return null;
  }
  candidate = candidate.replace(/^\*\./, "").replace(/^www\./, "").replace(/\.$/, "");
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(candidate)) return null;
  return candidate;
}

export function createRules(domains) {
  return [...new Set(domains.map(normalizeDomain).filter(Boolean))]
    .slice(0, MAX_DYNAMIC_RULES)
    .map((domain, index) => ({
      id: DYNAMIC_RULE_START + index,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: "/blocked/index.html" } },
      condition: { requestDomains: [domain], resourceTypes: ["main_frame"] },
    }));
}

export async function refreshBlacklist() {
  const settings = await api.storage.local.get(DEFAULTS);
  if (!settings.enabled) {
    const previous = await api.declarativeNetRequest.getDynamicRules();
    await api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: previous.map(({ id }) => id) });
    await api.storage.local.set({ count: 0 });
    return { skipped: true, count: 0 };
  }

  const response = await fetch(settings.endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`Server membalas ${response.status}`);
  const payload = await response.json();
  const domains = Array.isArray(payload) ? payload : payload.domains;
  if (!Array.isArray(domains)) throw new Error("Format blacklist tidak valid");

  const rules = createRules(domains);
  const previous = await api.declarativeNetRequest.getDynamicRules();
  await api.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: previous.map(({ id }) => id),
    addRules: rules,
  });
  const status = { count: rules.length, lastUpdated: new Date().toISOString(), lastError: null };
  await api.storage.local.set(status);
  return status;
}
