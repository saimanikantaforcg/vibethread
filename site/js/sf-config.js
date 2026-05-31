/**
 * sf-config.js — Salesforce SDK Configuration & Setup Panel
 *
 * Manages the Salesforce Interactions / Data Cloud Web SDK script URL.
 * Any practitioner can set their own Beacon ID via the floating ⚙ SDK Setup panel.
 *
 * SDK URL format:
 *   https://cdn.c360a.salesforce.com/beacon/c360a/{BEACON_ID}/scripts/c360a.min.js
 *
 * How to find your Beacon ID in Salesforce:
 *   Data Cloud Setup → Web & Mobile SDK → Beacon Snippets
 *
 * FLOW:
 *   1. Open site → click "⚙ SDK Setup"
 *   2. Paste your Beacon ID or full SDK URL → "Save & Reload"
 *   3. Click "Allow" in the cookie consent banner
 *   4. Events now flow to YOUR Salesforce Data Cloud org
 */
(function() {
  "use strict";

  /* ─────────────────────── Constants ─────────────────────── */
  var SF_SDK_KEY = "vtSfSdkUrl";
  var DEFAULT_BEACON_ID = "48cc94a2-0a94-43e1-b0af-46955055efa5";
  var DEFAULT_SDK_URL =
    "https://cdn.c360a.salesforce.com/beacon/c360a/" +
    DEFAULT_BEACON_ID +
    "/scripts/c360a.min.js";

  /**
   * Only these CDN hostnames are accepted as SDK sources.
   * This prevents injection of arbitrary third-party scripts.
   */
  var ALLOWED_HOSTS = ["cdn.c360a.salesforce.com", "cdn.evergage.com"];

  /* ─────────────────────── URL helpers ─────────────────────── */
  function isValidSdkUrl(url) {
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      return ALLOWED_HOSTS.indexOf(parsed.hostname) !== -1;
    } catch (_) {
      return false;
    }
  }

  /**
   * Accepts either:
   *   - A raw Beacon ID  (UUID-like: "48cc94a2-0a94-43e1-b0af-46955055efa5")
   *   - A full HTTPS URL (https://cdn.c360a.salesforce.com/.../c360a.min.js)
   */
  function buildUrlFromInput(raw) {
    raw = (raw || "").trim();
    if (!raw) return DEFAULT_SDK_URL;
    if (raw.indexOf("https://") === 0) return raw;
    /* Treat as raw Beacon ID */
    if (/^[0-9a-f-]{8,}$/i.test(raw)) {
      return (
        "https://cdn.c360a.salesforce.com/beacon/c360a/" +
        raw +
        "/scripts/c360a.min.js"
      );
    }
    return raw;
  }

  /* ─────────────────────── Storage ─────────────────────── */
  function getSdkUrl() {
    try {
      var stored = localStorage.getItem(SF_SDK_KEY);
      if (stored && isValidSdkUrl(stored)) return stored;
    } catch (_) {}
    return DEFAULT_SDK_URL;
  }

  function setSdkUrl(raw) {
    var url = buildUrlFromInput(raw);
    if (!isValidSdkUrl(url)) {
      throw new Error(
        "Invalid SDK URL. Must use https://cdn.c360a.salesforce.com or https://cdn.evergage.com",
      );
    }
    try {
      localStorage.setItem(SF_SDK_KEY, url);
    } catch (_) {}
    return url;
  }

  function resetSdkUrl() {
    try {
      localStorage.removeItem(SF_SDK_KEY);
    } catch (_) {}
  }

  function isUsingDefault() {
    try {
      return !localStorage.getItem(SF_SDK_KEY);
    } catch (_) {
      return true;
    }
  }

  /* ─────────────────────── SDK injection ─────────────────────── */
  (function injectSdk() {
    var s = document.createElement("script");
    s.src = getSdkUrl();
    s.async = true;
    document.head.appendChild(s);
  })();

  /* ─────────────────────── Public API ─────────────────────── */
  window.SFConfig = {
    getSdkUrl: getSdkUrl,
    setSdkUrl: setSdkUrl,
    resetSdkUrl: resetSdkUrl,
    isValidSdkUrl: isValidSdkUrl,
    buildUrlFromInput: buildUrlFromInput,
    isUsingDefault: isUsingDefault,
    DEFAULT_SDK_URL: DEFAULT_SDK_URL,
  };

  /* ─────────────────────── Setup Button ─────────────────────── */
  document.addEventListener("DOMContentLoaded", function() {
    renderSetupButton();
  });

  function renderSetupButton() {
    var custom = !isUsingDefault();
    var btn = createElement("button", {
      id: "sfSdkSetupBtn",
      type: "button",
      title: "Configure your Salesforce Beacon ID",
      "aria-label": "Configure Salesforce SDK",
      style: [
        "position:fixed",
        "right:16px",
        "bottom:90px",
        "z-index:10000",
        "background:" + (custom ? "#16a34a" : "#2563eb"),
        "color:#fff",
        "border:none",
        "border-radius:8px",
        "padding:8px 14px",
        "font:600 12px/1 system-ui,sans-serif",
        "cursor:pointer",
        "box-shadow:0 4px 16px rgba(0,0,0,.4)",
        "letter-spacing:.02em",
      ].join(";"),
    });
    btn.textContent = custom
      ? "\u2699\uFE0F SDK \u2713"
      : "\u2699\uFE0F SDK Setup";
    btn.addEventListener("click", openSetupModal);
    document.body.appendChild(btn);
  }

  /* ─────────────────────── Setup Modal ─────────────────────── */
  function openSetupModal() {
    if (document.getElementById("sfSdkModal")) return;

    var overlay = createElement("div", {
      id: "sfSdkModal",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "sfSdkModalTitle",
      style: [
        "position:fixed",
        "inset:0",
        "background:rgba(0,0,0,.65)",
        "z-index:20000",
        "display:flex",
        "align-items:center",
        "justify-content:center",
        "padding:16px",
      ].join(";"),
    });

    var box = createElement("div", {
      style: [
        "background:#0f172a",
        "color:#e2e8f0",
        "border:1px solid #334155",
        "border-radius:14px",
        "padding:28px 24px 20px",
        "max-width:560px",
        "width:100%",
        "box-shadow:0 24px 60px rgba(0,0,0,.6)",
        "font-family:system-ui,sans-serif",
      ].join(";"),
    });

    /* Title */
    var titleEl = createElement("h2", {
      id: "sfSdkModalTitle",
      style: "margin:0 0 6px;font:700 18px/1.3 system-ui;color:#f8fafc;",
    });
    titleEl.textContent = "Salesforce SDK Setup";

    /* Subtitle */
    var sub = createElement("p", {
      style: "margin:0 0 18px;font:400 13px/1.5 system-ui;color:#94a3b8;",
    });
    sub.textContent =
      "Enter your Beacon ID (UUID) or full SDK URL from Salesforce Data Cloud to send events to your own org — just like Northern Trail Outfitters.";

    /* Steps box */
    var stepsBox = createElement("div", {
      style: [
        "background:#1e293b",
        "border:1px solid #334155",
        "border-radius:8px",
        "padding:12px 14px",
        "margin-bottom:16px",
      ].join(";"),
    });
    var stepsTitle = createElement("p", {
      style: "margin:0 0 8px;font:600 12px system-ui;color:#7dd3fc;",
    });
    stepsTitle.textContent = "How to get your Beacon ID:";
    stepsBox.appendChild(stepsTitle);

    var steps = [
      "\u2460  Salesforce Setup \u2192 Data Cloud \u2192 Web & Mobile SDK \u2192 Beacon Snippets",
      "\u2461  Copy the Beacon ID (UUID) or the full script URL from the snippet",
      "\u2462  Paste it below and click \u201cSave & Reload\u201d",
      "\u2463  Click \u201cAllow\u201d in the cookie banner \u2014 events flow to your org \u2728",
    ];
    steps.forEach(function(text, i) {
      var p = createElement("p", {
        style:
          "margin:" +
          (i === 0 ? "0" : "4px") +
          " 0 0;font:400 12px/1.5 system-ui;color:#94a3b8;",
      });
      p.textContent = text;
      stepsBox.appendChild(p);
    });

    /* Current URL */
    var currentLabel = createElement("p", {
      style:
        "margin:0 0 6px;font:400 11px system-ui;color:#64748b;word-break:break-all;",
    });
    currentLabel.textContent = "Current SDK: " + getSdkUrl();

    /* Input */
    var input = createElement("textarea", {
      id: "sfSdkInput",
      rows: "3",
      placeholder:
        "Paste Beacon ID (e.g. 48cc94a2-0a94-43e1-b0af-46955055efa5)\nor full URL: https://cdn.c360a.salesforce.com/beacon/c360a/.../scripts/c360a.min.js",
      style: [
        "display:block",
        "width:100%",
        "box-sizing:border-box",
        "background:#1e293b",
        "color:#e2e8f0",
        "border:1px solid #475569",
        "border-radius:8px",
        "padding:10px 12px",
        "font:400 13px/1.4 system-ui",
        "resize:vertical",
        "margin-bottom:10px",
        "outline:none",
      ].join(";"),
    });

    /* Error */
    var errMsg = createElement("p", {
      style:
        "display:none;margin:0 0 10px;font:400 12px system-ui;color:#f87171;",
    });

    /* Button row */
    var btnRow = createElement("div", {
      style: "display:flex;gap:8px;flex-wrap:wrap;",
    });

    var saveBtn = makeButton(
      "Save & Reload",
      "#2563eb",
      "#fff",
      "1px solid #2563eb",
      "flex:1;",
    );
    var resetBtn = makeButton(
      "Reset to Default",
      "transparent",
      "#94a3b8",
      "1px solid #475569",
      "",
    );
    var cancelBtn = makeButton(
      "Cancel",
      "transparent",
      "#94a3b8",
      "1px solid #475569",
      "",
    );

    saveBtn.addEventListener("click", function() {
      var raw = input.value.trim();
      if (!raw) {
        showErr("Please enter a Beacon ID or URL.");
        return;
      }
      var url = buildUrlFromInput(raw);
      if (!isValidSdkUrl(url)) {
        showErr(
          "Invalid URL. Only https://cdn.c360a.salesforce.com or https://cdn.evergage.com are accepted.",
        );
        return;
      }
      try {
        setSdkUrl(raw);
      } catch (e) {
        showErr(String(e.message));
        return;
      }
      window.location.reload();
    });

    resetBtn.addEventListener("click", function() {
      resetSdkUrl();
      window.location.reload();
    });

    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) closeModal();
    });

    var escHandler = function(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    function showErr(msg) {
      errMsg.textContent = msg;
      errMsg.style.display = "block";
    }

    btnRow.append(saveBtn, resetBtn, cancelBtn);
    box.append(titleEl, sub, stepsBox, currentLabel, input, errMsg, btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(function() {
      input.focus();
    }, 60);
  }

  function closeModal() {
    var m = document.getElementById("sfSdkModal");
    if (m) m.remove();
  }

  /* ─────────────────────── DOM helpers ─────────────────────── */
  function createElement(tag, attrs) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k) {
      if (k === "style") {
        node.style.cssText = attrs[k];
      } else {
        node.setAttribute(k, attrs[k]);
      }
    });
    return node;
  }

  function makeButton(text, bg, color, border, extra) {
    var b = createElement("button", {
      type: "button",
      style: [
        "background:" + bg,
        "color:" + color,
        "border:" + border,
        "border-radius:8px",
        "padding:10px 16px",
        "font:600 13px system-ui",
        "cursor:pointer",
        extra,
      ]
        .filter(Boolean)
        .join(";"),
    });
    b.textContent = text;
    return b;
  }
})();
