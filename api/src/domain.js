const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeDomain(value) {
  if (typeof value !== "string") return null;
  let domain = value.trim().toLowerCase();
  try {
    if (domain.includes("://")) domain = new URL(domain).hostname;
  } catch {
    return null;
  }
  domain = domain.replace(/^\*\./, "").replace(/^www\./, "").replace(/\.$/, "");
  return DOMAIN_PATTERN.test(domain) ? domain : null;
}

export function normalizeDomains(values, limit) {
  if (!Array.isArray(values)) throw new TypeError("domains harus berupa array");
  return [...new Set(values.map(normalizeDomain).filter(Boolean))].sort().slice(0, limit);
}
