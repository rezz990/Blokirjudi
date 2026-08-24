import api from "./browser.js";
import { ALARM_NAME, DEFAULTS } from "./config.js";
import { refreshBlacklist } from "./blacklist.js";

async function saveError(error) {
  await api.storage.local.set({ lastError: error instanceof Error ? error.message : String(error) });
}

async function schedule() {
  const { updateEveryHours } = await api.storage.local.get(DEFAULTS);
  await api.alarms.clear(ALARM_NAME);
  await api.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: Math.max(1, updateEveryHours) * 60 });
}

api.runtime.onInstalled.addListener(() => {
  schedule().then(refreshBlacklist).catch(saveError);
});
api.runtime.onStartup.addListener(() => schedule().catch(saveError));
api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshBlacklist().catch(saveError);
});
api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "refresh") return false;
  refreshBlacklist().then(sendResponse).catch((error) => {
    saveError(error);
    sendResponse({ error: error.message });
  });
  return true;
});
