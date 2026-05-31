/**
 * sf-bridge.js — DataLayer → Salesforce Data Cloud Event Bridge
 *
 * Intercepts window.dataLayer.push() events and forwards them to the
 * Salesforce Interactions SDK (getSalesforceInteractions().sendEvent())
 * ONLY when the user has granted tracking consent.
 *
 * Mapped events:
 *   add_to_cart       → Add To Cart
 *   remove_from_cart  → Remove From Cart
 *   view_cart         → View Cart
 *   begin_checkout    → Begin Checkout
 *   purchase          → Purchase
 *   login             → Identity (with email/name)
 *   sign_up           → Identity (with email/name)
 *   search            → Search
 *   page_view         → Page View
 *
 * Note: view_item / View Catalog Object is handled directly by product.js
 *       with richer catalog attributes and is intentionally excluded here.
 *
 * Consent is read from:
 *   - Cookie:       vt_tracking_consent=accepted
 *   - localStorage: vtTrackingConsent=accepted
 */
(function() {
  "use strict";

  var CONSENT_COOKIE = "vt_tracking_consent";
  var CONSENT_LS_KEY = "vtTrackingConsent";

  /* ── Consent check ─────────────────────────────────────────── */
  function getCookie(name) {
    var parts = document.cookie.split(";");
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (p.indexOf(name + "=") === 0) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return null;
  }

  function isConsentGiven() {
    if (getCookie(CONSENT_COOKIE) === "accepted") return true;
    try {
      return localStorage.getItem(CONSENT_LS_KEY) === "accepted";
    } catch (_) {
      return false;
    }
  }

  /* ── Salesforce SDK accessor ────────────────────────────────── */
  function getSFApi() {
    if (typeof window.getSalesforceInteractions !== "function") return null;
    try {
      var api = window.getSalesforceInteractions();
      return api && typeof api.sendEvent === "function" ? api : null;
    } catch (_) {
      return null;
    }
  }

  function sendToSF(payload) {
    if (!isConsentGiven()) return;
    var api = getSFApi();
    if (!api) return;
    try {
      api.sendEvent(payload);
    } catch (_) {}
  }

  /* ── GA4 → Salesforce event translators ─────────────────────── */
  var EVENTS = {
    add_to_cart: function(d) {
      var ec = d.ecommerce || {};
      var item = (ec.items || [])[0] || {};
      if (!item.item_id) return null;
      return {
        interaction: {
          name: "Add To Cart",
          lineItem: {
            catalogObjectType: "Product",
            catalogObjectId: String(item.item_id),
            quantity: item.quantity || 1,
            price: item.price || 0,
            currency: ec.currency || "USD",
          },
        },
      };
    },

    remove_from_cart: function(d) {
      var ec = d.ecommerce || {};
      var item = (ec.items || [])[0] || {};
      if (!item.item_id) return null;
      return {
        interaction: {
          name: "Remove From Cart",
          lineItem: {
            catalogObjectType: "Product",
            catalogObjectId: String(item.item_id),
            quantity: item.quantity || 1,
            price: item.price || 0,
            currency: ec.currency || "USD",
          },
        },
      };
    },

    view_cart: function(d) {
      var ec = d.ecommerce || {};
      return {
        interaction: {
          name: "View Cart",
          orderValue: ec.value || 0,
          currency: ec.currency || "USD",
        },
      };
    },

    begin_checkout: function(d) {
      var ec = d.ecommerce || {};
      return {
        interaction: {
          name: "Begin Checkout",
          orderValue: ec.value || 0,
          currency: ec.currency || "USD",
        },
      };
    },

    purchase: function(d) {
      var ec = d.ecommerce || {};
      return {
        interaction: {
          name: "Purchase",
          orderId: String(ec.transaction_id || ""),
          totalValue: ec.value || 0,
          currency: ec.currency || "USD",
          lineItems: (ec.items || []).map(function(item) {
            return {
              catalogObjectType: "Product",
              catalogObjectId: String(item.item_id || ""),
              quantity: item.quantity || 1,
              price: item.price || 0,
            };
          }),
        },
      };
    },

    login: function(d) {
      var up = d.user_properties || {};
      return {
        interaction: {
          name: "Identity",
          emailAddress: up.email || "",
          firstName: up.first_name || "",
          lastName: up.last_name || "",
        },
      };
    },

    sign_up: function(d) {
      var up = d.user_properties || {};
      return {
        interaction: {
          name: "Identity",
          emailAddress: up.email || "",
          firstName: up.first_name || "",
          lastName: up.last_name || "",
        },
      };
    },

    search: function(d) {
      return {
        interaction: {
          name: "Search",
          searchTerm: d.search_term || "",
        },
      };
    },

    page_view: function(d) {
      return {
        interaction: {
          name: "Page View",
          pageName: d.page_name || d.page_title || "",
          pageUrl: d.page_location || window.location.href,
        },
      };
    },
  };

  /* ── Patch window.dataLayer.push ────────────────────────────── */
  window.dataLayer = window.dataLayer || [];

  var _dl = window.dataLayer;
  /* Save a reference to the native Array push */
  var _nativePush = Array.prototype.push;

  /* Override push on the specific array instance */
  _dl.push = function() {
    /* Push to the underlying array first */
    var result = _nativePush.apply(_dl, arguments);
    /* Then forward to Salesforce SDK */
    for (var i = 0; i < arguments.length; i++) {
      processEvent(arguments[i]);
    }
    return result;
  };

  function processEvent(item) {
    if (!item || typeof item !== "object" || !item.event) return;
    var translator = EVENTS[item.event];
    if (typeof translator !== "function") return;
    try {
      var payload = translator(item);
      if (payload) sendToSF(payload);
    } catch (_) {}
  }
})();
