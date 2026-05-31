/**
 * event-debugger.js — SF Data Cloud Event Inspector
 *
 * Reads events from window.__vtSfOutbound (fed by the sitemap's
 * onActionEvent callback) and displays them in a panel.
 *
 * Zero interference with the Salesforce SDK internals.
 * Toggle: click blue button or press Ctrl+Shift+E.
 */
(function() {
  "use strict";

  var isOpen = false;
  var panelEl = null;
  var listEl = null;
  var statusEl = null;
  var rendered = 0;

  function safeJson(v) {
    try {
      return JSON.stringify(v, null, 2);
    } catch (_) {
      return "{}";
    }
  }

  function timeStr(ms) {
    return new Date(ms).toLocaleTimeString();
  }

  function getOutbound() {
    return window.__vtSfOutbound || [];
  }

  function isConsentGiven() {
    try {
      var parts = document.cookie.split(";");
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].trim().indexOf("vt_tracking_consent=accepted") === 0)
          return true;
      }
      return localStorage.getItem("vtTrackingConsent") === "accepted";
    } catch (_) {
      return false;
    }
  }

  function isSdkReady() {
    return (
      typeof window.SalesforceInteractions !== "undefined" &&
      window.SalesforceInteractions !== null
    );
  }

  function getCurrentUser() {
    try {
      if (
        typeof AuthSystem !== "undefined" &&
        typeof AuthSystem.getCurrentUser === "function"
      ) {
        return AuthSystem.getCurrentUser();
      }
    } catch (_) {}
    return null;
  }

  function refreshStatus() {
    if (!statusEl) return;
    var user = getCurrentUser();
    var events = getOutbound();
    statusEl.innerHTML =
      "<div><strong>User:</strong> " +
      (user
        ? (user.firstName || "") + " " + (user.lastName || "")
        : "anonymous") +
      "</div>" +
      "<div><strong>Consent:</strong> " +
      (isConsentGiven() ? "accepted" : "declined") +
      "</div>" +
      "<div><strong>SDK:</strong> " +
      (isSdkReady() ? "ready" : "not loaded") +
      "</div>" +
      "<div><strong>Captured:</strong> " +
      events.length +
      " outbound event(s)</div>";
  }

  function renderList() {
    if (!listEl) return;
    var events = getOutbound();
    if (events.length === 0) {
      listEl.innerHTML =
        '<div style="padding:14px;color:#6b7280;font-size:11px;">' +
        "No outbound Salesforce events yet. Navigate or interact with the page.</div>";
      rendered = 0;
      return;
    }

    var html = "";
    for (var i = events.length - 1; i >= 0; i--) {
      var item = events[i];
      var ev = item.e || {};
      var inter = ev.interaction || {};
      var attrs = inter.attributes || {};

      html +=
        '<div style="border-bottom:1px solid #e5e7eb;padding:10px;font-size:11px;font-family:monospace;">' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
        '<span style="color:#10b981;font-weight:bold;">\u25CF</span>' +
        '<span style="color:#4b5563;">' +
        timeStr(item.t) +
        "</span>" +
        '<span style="color:#1f2937;font-weight:700;">' +
        (inter.name || "unknown") +
        "</span>" +
        '<span style="background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:4px;font-size:10px;">' +
        (inter.eventType || "?") +
        "</span>" +
        (attrs.sourcePageType
          ? '<span style="color:#0f766e;font-size:10px;">page: ' +
            attrs.sourcePageType +
            "</span>"
          : "") +
        "</div>" +
        '<div style="margin-top:6px;color:#111827;font-size:10px;font-weight:600;">Payload sent to SF Data Cloud</div>' +
        '<pre style="margin-top:4px;background:#f8fafc;border:1px solid #e5e7eb;padding:8px;border-radius:6px;' +
        'color:#374151;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto;">' +
        safeJson(ev) +
        "</pre>" +
        "</div>";
    }

    listEl.innerHTML = html;
    rendered = events.length;
  }

  function createPanel() {
    if (panelEl) return;

    panelEl = document.createElement("div");
    panelEl.style.cssText =
      "position:fixed;bottom:16px;left:16px;width:460px;max-height:560px;" +
      "background:#fff;border:2px solid #dbeafe;border-radius:10px;" +
      "box-shadow:0 10px 40px rgba(0,0,0,0.28);z-index:999999;display:none;" +
      "font-family:system-ui,sans-serif;";

    var header = document.createElement("div");
    header.style.cssText =
      "padding:12px 14px;border-bottom:1px solid #e5e7eb;background:#eff6ff;" +
      "display:flex;align-items:center;justify-content:space-between;border-radius:8px 8px 0 0;";

    var title = document.createElement("span");
    title.style.cssText = "font-weight:700;font-size:13px;color:#1e3a8a;";
    title.textContent = "SF Data Cloud Event Inspector";

    var closeBtn = document.createElement("button");
    closeBtn.style.cssText =
      "background:none;border:none;color:#334155;cursor:pointer;font-size:16px;padding:0;";
    closeBtn.textContent = "\u2715";
    closeBtn.onclick = function() {
      togglePanel();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    var tabBar = document.createElement("div");
    tabBar.style.cssText =
      "padding:8px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc;";
    tabBar.innerHTML =
      '<span style="border:1px solid #bfdbfe;background:#dbeafe;color:#1e3a8a;' +
      'padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;">SF Data Cloud</span>';

    statusEl = document.createElement("div");
    statusEl.style.cssText =
      "padding:8px 14px;background:#f8fafc;border-bottom:1px solid #e5e7eb;" +
      "font-size:10px;color:#334155;line-height:1.5;";

    listEl = document.createElement("div");
    listEl.style.cssText = "max-height:390px;overflow-y:auto;background:#fff;";

    panelEl.appendChild(header);
    panelEl.appendChild(tabBar);
    panelEl.appendChild(statusEl);
    panelEl.appendChild(listEl);
    document.body.appendChild(panelEl);
  }

  function togglePanel() {
    isOpen = !isOpen;
    if (!panelEl) createPanel();

    if (isOpen) {
      panelEl.style.display = "block";
      refreshStatus();
      renderList();
    } else {
      panelEl.style.display = "none";
    }
  }

  function createToggleButton() {
    if (!document.body || document.getElementById("__vtEventDebugBtn")) return;

    var btn = document.createElement("button");
    btn.id = "__vtEventDebugBtn";
    btn.style.cssText =
      "position:fixed;bottom:16px;left:16px;width:48px;height:48px;border-radius:50%;" +
      "background:#2563eb;color:#fff;border:none;cursor:pointer;font-size:20px;" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:999998;" +
      "display:flex;align-items:center;justify-content:center;";
    btn.textContent = "\uD83D\uDCCA";
    btn.title = "SF Data Cloud Inspector (Ctrl+Shift+E)";
    btn.onclick = function() {
      togglePanel();
    };
    document.body.appendChild(btn);
  }

  function poll() {
    if (!isOpen) return;
    refreshStatus();
    var events = getOutbound();
    if (events.length !== rendered) {
      renderList();
    }
  }

  function init() {
    createToggleButton();
    setInterval(poll, 800);

    document.addEventListener("keydown", function(e) {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyE") {
        e.preventDefault();
        togglePanel();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
