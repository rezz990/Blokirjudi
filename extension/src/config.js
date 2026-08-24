export const DEFAULTS = Object.freeze({
  enabled: true,
  endpoint: "https://api.blokirjudi.id/v1/blacklist",
  updateEveryHours: 24,
});

export const ALARM_NAME = "refresh-blacklist";
export const DYNAMIC_RULE_START = 10_000;
export const MAX_DYNAMIC_RULES = 20_000;
