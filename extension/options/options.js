import api from "../src/browser.js";
import { DEFAULTS } from "../src/config.js";

const form = document.querySelector("#form");
const notice = document.querySelector("#notice");
const settings = await api.storage.local.get(DEFAULTS);
form.enabled.checked = settings.enabled;
form.endpoint.value = settings.endpoint;
form.hours.value = settings.updateEveryHours;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const endpoint = new URL(form.endpoint.value);
  if (endpoint.protocol !== "https:") { notice.textContent = "Gunakan endpoint HTTPS, ya."; return; }
  const originPattern = `${endpoint.origin}/*`;
  if (api.permissions?.request && !(await api.permissions.contains({ origins: [originPattern] }))) {
    const granted = await api.permissions.request({ origins: [originPattern] });
    if (!granted) { notice.textContent = "Izin akses API belum diberikan."; return; }
  }
  await api.storage.local.set({ enabled: form.enabled.checked, endpoint: endpoint.href, updateEveryHours: Number(form.hours.value) });
  notice.textContent = "Sip, pengaturan tersimpan.";
  await api.runtime.sendMessage({ type: "refresh" });
});
