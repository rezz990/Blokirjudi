import api from "../src/browser.js";

const count = document.querySelector("#count");
const updated = document.querySelector("#updated");
const refresh = document.querySelector("#refresh");
const state = document.querySelector("#state");

async function render() {
  const data = await api.storage.local.get({ enabled: true, count: 0, lastUpdated: null, lastError: null });
  count.textContent = new Intl.NumberFormat("id-ID").format(data.count);
  state.textContent = data.enabled ? "Proteksi aktif" : "Proteksi dijeda";
  updated.textContent = data.lastError ? `Update terakhir gagal: ${data.lastError}` : data.lastUpdated ? `Diperbarui ${new Date(data.lastUpdated).toLocaleString("id-ID")}` : "Belum pernah diperbarui.";
}

refresh.addEventListener("click", async () => {
  refresh.disabled = true; refresh.textContent = "Lagi update…";
  await api.runtime.sendMessage({ type: "refresh" });
  refresh.disabled = false; refresh.textContent = "Update sekarang";
  render();
});
document.querySelector("#options").addEventListener("click", () => api.runtime.openOptionsPage());
render();
