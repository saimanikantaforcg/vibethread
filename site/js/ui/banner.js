const DEMO_BANNER_ID = "demoBanner";
const CONSENT_BANNER_ID = "consentBanner";
const CONSENT_STORAGE_KEY = "vtTrackingConsent";
const CONSENT_COOKIE_NAME = "vt_tracking_consent";
const CONSENT_PROVIDER = "Example Consent Manager";

function getCookieValue(name) {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + "="));
  if (!cookie) return null;
  return decodeURIComponent(cookie.substring(name.length + 1));
}

function setCookieValue(name, value) {
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; path=/; max-age=31536000; samesite=lax";
}

function getStoredConsent() {
  const fromCookie = getCookieValue(CONSENT_COOKIE_NAME);
  if (fromCookie === "accepted" || fromCookie === "declined") {
    return fromCookie;
  }

  try {
    const fromStorage = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (fromStorage === "accepted" || fromStorage === "declined") {
      return fromStorage;
    }
    return null;
  } catch (_) {
    return null;
  }
}

function setStoredConsent(status) {
  setCookieValue(CONSENT_COOKIE_NAME, status);

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch (_) {
    // Ignore storage access errors (private mode, strict settings, etc.)
  }
}

function resolveConsentStatus(api, accepted) {
  const fallback = accepted ? "Opt In" : "Opt Out";
  if (!api || !api.ConsentStatus) return fallback;
  return accepted ? api.ConsentStatus.OptIn || fallback : api.ConsentStatus.OptOut || fallback;
}

function resolveConsentPurpose(api) {
  const fallback = "Tracking";
  if (!api || !api.ConsentPurpose) return fallback;
  return api.ConsentPurpose.Tracking || fallback;
}

function applyTrackingConsent(accepted) {
  const getApi = window.getSalesforceInteractions;
  if (typeof getApi !== "function") return;

  const api = getApi();
  if (!api || typeof api.sendEvent !== "function") return;

  api.sendEvent({
    consents: [
      {
        purpose: resolveConsentPurpose(api),
        provider: CONSENT_PROVIDER,
        status: resolveConsentStatus(api, accepted),
      },
    ],
  });
}

function buildConsentBanner() {
  const banner = document.createElement("div");
  banner.id = CONSENT_BANNER_ID;
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-live", "polite");
  banner.style.cssText =
    "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;";

  const text = document.createElement("p");
  text.style.cssText = "margin:0;font:500 14px/1.4 system-ui, sans-serif;flex:1;min-width:220px;";
  text.textContent =
    "Allow tracking cookies for product analytics and personalization in this demo?";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;";

  const rejectButton = document.createElement("button");
  rejectButton.type = "button";
  rejectButton.textContent = "Decline";
  rejectButton.style.cssText =
    "border:1px solid #475569;background:transparent;color:#e2e8f0;padding:8px 12px;border-radius:8px;cursor:pointer;font:600 13px system-ui,sans-serif;";

  const acceptButton = document.createElement("button");
  acceptButton.type = "button";
  acceptButton.textContent = "Allow";
  acceptButton.style.cssText =
    "border:1px solid #2563eb;background:#2563eb;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;font:600 13px system-ui,sans-serif;";

  rejectButton.addEventListener("click", () => {
    setStoredConsent("declined");
    applyTrackingConsent(false);
    banner.remove();
  });

  acceptButton.addEventListener("click", () => {
    setStoredConsent("accepted");
    applyTrackingConsent(true);
    banner.remove();
  });

  actions.append(rejectButton, acceptButton);
  banner.append(text, actions);
  return banner;
}

function buildDemoBanner(pageType) {
  const banner = document.createElement("div");
  banner.id = DEMO_BANNER_ID;
  banner.setAttribute("role", "status");
  banner.style.cssText =
    "background:#f59e0b;color:#111827;padding:8px 16px;font-family:Arial, sans-serif;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;border-bottom:1px solid #e5e7eb;";

  if (pageType) {
    banner.setAttribute("data-page-type", pageType);
  }

  const badge = document.createElement("span");
  badge.textContent = "DEMO";
  badge.style.cssText =
    "background:#111827;color:#f59e0b;padding:2px 6px;border-radius:4px;font-weight:700;font-size:12px;letter-spacing:0.08em;";

  const message = document.createElement("span");
  message.textContent = "This site is a demo. Orders will not be fulfilled.";

  banner.append(badge, message);
  return banner;
}

export function initDemoBanner({ pageType } = {}) {
  if (document.getElementById(DEMO_BANNER_ID)) {
    return;
  }

  if (!document.body) {
    return;
  }

  const banner = buildDemoBanner(pageType);
  document.body.prepend(banner);
}

export function initConsentBanner() {
  if (!document.body) return;
  if (document.getElementById(CONSENT_BANNER_ID)) return;

  // If cookie is missing, force a fresh consent prompt even when localStorage exists.
  const cookieConsent = getCookieValue(CONSENT_COOKIE_NAME);
  if (cookieConsent !== "accepted" && cookieConsent !== "declined") {
    const consentBanner = buildConsentBanner();
    document.body.appendChild(consentBanner);
    return;
  }

  const existingConsent = getStoredConsent();
  if (existingConsent === "accepted") {
    applyTrackingConsent(true);
    return;
  }

  if (existingConsent === "declined") {
    applyTrackingConsent(false);
    return;
  }

  const consentBanner = buildConsentBanner();
  document.body.appendChild(consentBanner);
}
