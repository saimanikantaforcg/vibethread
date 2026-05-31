/* =============================================================================
   Salesforce Data Cloud Web SDK / Einstein Personalization Sitemap
   Site: VibeThread
   Purpose: Schema-aligned event capture
   Event Types Used:
   - browse
   - catalog
   - cart
   - order
   - contactPointEmail
   - identity
   ============================================================================= */

SalesforceInteractions.setLoggingLevel(100);

/* =============================================================================
   HELPERS
   ============================================================================= */

function getQueryParam(paramName) {
  return new URLSearchParams(window.location.search).get(paramName);
}

function getCurrentUrl() {
  return window.location.href;
}

function getPageLocale() {
  return document.documentElement.lang || navigator.language || "en-US";
}

function getProductId() {
  return getQueryParam("id") || "unknown";
}

function getProductUrl() {
  const productId = getProductId();
  return window.location.origin + window.location.pathname + "?id=" + productId;
}

function getText(selector, fallbackValue) {
  const value = SalesforceInteractions.cashDom(selector).text();
  return value && value.trim() ? value.trim() : fallbackValue || "";
}

function getValue(selector, fallbackValue) {
  const value = SalesforceInteractions.cashDom(selector).val();
  return value && String(value).trim()
    ? String(value).trim()
    : fallbackValue || "";
}

function parseMoneyFromSelector(selector) {
  const raw = SalesforceInteractions.cashDom(selector).text() || "0";
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

function getLastOrder() {
  try {
    return JSON.parse(localStorage.getItem("vibeThreadLastOrder") || "null");
  } catch (_) {
    return null;
  }
}

function getActiveOptionText(containerSelector) {
  const active = SalesforceInteractions.cashDom(
    containerSelector + " .bg-blue-600",
  );

  return active.length ? active.text().trim() : "";
}

/* Matches a page path with or without .html (handles Netlify Pretty URLs) */
function matchPath(page) {
  var p = window.location.pathname;
  return p === "/" + page + ".html" || p === "/" + page || p === "/" + page + "/";
}

/* =============================================================================
   PROFILE / IDENTITY HELPERS
   ============================================================================= */

window.sfepCaptureEmail = function(emailValue) {
  if (!emailValue) {
    return;
  }

  SalesforceInteractions.sendEvent({
    interaction: {
      name: "emailCapture",
    },
    user: {
      attributes: {
        eventType: "contactPointEmail",
        email: emailValue,
        sourceUrl: getCurrentUrl(),
        sourceChannel: "web",
        sourceLocale: getPageLocale(),
        sourcePageType: "email_capture",
      },
    },
  });
};

window.sfepCaptureIdentity = function({
  firstName,
  lastName,
  email,
  phoneNumber,
} = {}) {
  SalesforceInteractions.sendEvent({
    interaction: {
      name: "identityCapture",
    },
    user: {
      attributes: {
        eventType: "identity",
        isAnonymous: 0,
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
        sourceUrl: getCurrentUrl(),
        sourceChannel: "web",
        sourceLocale: getPageLocale(),
        sourcePageType: "identity_capture",
      },
    },
  });
};

/* =============================================================================
   SDK INIT + SITEMAP
   ============================================================================= */

SalesforceInteractions.init({
  personalization: {
    dataspace: "default",
  },
}).then(function() {
  const sitemapConfig = {
    global: {
      onActionEvent: function(event) {
        if (!event || !event.interaction) {
          return event;
        }

        /* Feed the SF Data Cloud inspector panel */
        try {
          window.__vtSfOutbound = window.__vtSfOutbound || [];
          var capturedEvent = JSON.parse(JSON.stringify(event));
          /* Enrich with anonymousId — SDK adds this after onActionEvent runs */
          try {
            var anonId = typeof SalesforceInteractions.getAnonymousId === "function"
              ? SalesforceInteractions.getAnonymousId()
              : null;
            if (anonId) {
              capturedEvent.user = capturedEvent.user || {};
              capturedEvent.user.anonymousId = anonId;
            }
          } catch (_) {}
          window.__vtSfOutbound.push({ t: Date.now(), e: capturedEvent });
        } catch (_) {}

        const eventTypeMap = {
          userEngagement: "browse",
          UserEngagement: "browse",
          productEngagement: "catalog",
          ProductEngagement: "catalog",
          cartEngagement: "cart",
          CartEngagement: "cart",
          orderEngagement: "order",
          OrderEngagement: "order",
        };

        if (
          event.interaction.eventType &&
          eventTypeMap[event.interaction.eventType]
        ) {
          event.interaction.eventType =
            eventTypeMap[event.interaction.eventType];
        }

        event.interaction.attributes = event.interaction.attributes || {};

        if (!event.interaction.attributes.sourceUrl) {
          event.interaction.attributes.sourceUrl = getCurrentUrl();
        }

        if (!event.interaction.attributes.sourceChannel) {
          event.interaction.attributes.sourceChannel = "web";
        }

        if (!event.interaction.attributes.sourceLocale) {
          event.interaction.attributes.sourceLocale = getPageLocale();
        }

        return event;
      },
    },

    pageTypeDefault: {
      name: "default",
      interaction: {
        name: "default view",
        eventType: "browse",
        attributes: {
          pageName: function() {
            return document.title || "Default Page";
          },
          pageType: "default",
          pageUrl: getCurrentUrl,
          sourcePageType: "default",
          pageView: 1,
        },
      },
    },

    pageTypes: [
      /* -----------------------------------------------------------------------
         HOME PAGE
         ----------------------------------------------------------------------- */

      {
        name: "home",

        isMatch: function() {
          var p = window.location.pathname;
          return p === "/" || p === "/index.html" || p === "/index";
        },

        interaction: {
          name: "home view",
          eventType: "browse",
          attributes: {
            pageName: "Home Page",
            pageType: "home",
            pageUrl: getCurrentUrl,
            sourcePageType: "home",
            pageView: 1,
          },
        },

        contentZones: [
          {
            name: "hero_banner",
            selector: "section[class*='bg-[#161B22]']",
          },
          {
            name: "recommendations_1",
            selector: "#featuredProducts",
          },
        ],
      },

      /* -----------------------------------------------------------------------
         PRODUCT LISTING PAGE
         ----------------------------------------------------------------------- */

      {
        name: "plp",

        isMatch: function() {
          return matchPath("categories");
        },

        interaction: {
          name: "plp view",
          eventType: "browse",
          attributes: {
            pageName: function() {
              const category = getQueryParam("category") || "all";
              return "Product Listing - " + category;
            },
            pageType: "plp",
            pageUrl: getCurrentUrl,
            sourcePageType: "plp",
            pageView: 1,
          },
        },

        contentZones: [
          {
            name: "recs_header",
            selector: "#categoryTitle",
          },
          {
            name: "recs_featured",
            selector: "#productsGrid",
          },
        ],
      },

      /* -----------------------------------------------------------------------
         PRODUCT DETAIL PAGE
         Schema eventType: catalog
         ----------------------------------------------------------------------- */

      {
        name: "pdp",

        isMatch: function() {
          return matchPath("product");
        },

        interaction: {
          name: "pdp view",
          eventType: "catalog",

          attributes: {
            sourcePageType: "pdp",
            sourceUrl: getCurrentUrl,
            sourceChannel: "web",
            sourceLocale: getPageLocale,
            pageView: 1,
          },

          catalogObject: {
            type: "Product",

            id: function() {
              return getProductId();
            },

            attributes: {
              attributeProductName: SalesforceInteractions.resolvers.fromSelector(
                "#productName",
              ),

              attributeProductSku: function() {
                return getProductId();
              },

              attributeProductUrl: function() {
                return getProductUrl();
              },

              attributeProductImageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute(
                "#productImage",
                "src",
              ),

              attributeUnitPrice: function() {
                return parseMoneyFromSelector("#productPrice");
              },

              attributeColor: function() {
                return getActiveOptionText("#colorOptions");
              },

              attributeSize: function() {
                return getActiveOptionText("#sizeOptions");
              },

              attributeItemType: SalesforceInteractions.resolvers.fromSelector(
                "#breadcrumbCategory",
              ),

              attributeInventory: function() {
                return 1;
              },
            },
          },
        },

        contentZones: [
          {
            name: "recs_you_may_like",
            selector: "#relatedProducts",
          },
          {
            name: "recs_frequently_bought",
            selector: "#relatedProducts",
          },
        ],
      },

      /* -----------------------------------------------------------------------
         CART PAGE
         ----------------------------------------------------------------------- */

      {
        name: "cart",

        isMatch: function() {
          return matchPath("cart");
        },

        interaction: {
          name: "cart view",
          eventType: "cart",
          attributes: {
            sourcePageType: "cart",
            sourceUrl: getCurrentUrl,
            sourceChannel: "web",
            sourceLocale: getPageLocale,
            pageView: 1,
          },
        },

        contentZones: [
          {
            name: "recs_upsell",
            selector: "#cartPageItems",
          },
        ],
      },

      /* -----------------------------------------------------------------------
         CHECKOUT PAGE
         ----------------------------------------------------------------------- */

      {
        name: "checkout",

        isMatch: function() {
          return matchPath("checkout");
        },

        interaction: {
          name: "checkout view",
          eventType: "browse",
          attributes: {
            pageName: "Checkout Page",
            pageType: "checkout",
            pageUrl: getCurrentUrl,
            sourcePageType: "checkout",
            pageView: 1,
          },
        },

        contentZones: [
          {
            name: "recs_last_chance",
            selector: "#checkoutItems",
          },
        ],
      },

      /* -----------------------------------------------------------------------
         LOGIN PAGE
         ----------------------------------------------------------------------- */

      {
        name: "login",

        isMatch: function() {
          return matchPath("login");
        },

        interaction: {
          name: "login view",
          eventType: "browse",
          attributes: {
            pageName: "Login Page",
            pageType: "login",
            pageUrl: getCurrentUrl,
            sourcePageType: "login",
            pageView: 1,
          },
        },

        listeners: [],
      },

      /* -----------------------------------------------------------------------
         ABOUT PAGE
         ----------------------------------------------------------------------- */

      {
        name: "about",

        isMatch: function() {
          return matchPath("about");
        },

        interaction: {
          name: "about view",
          eventType: "browse",
          attributes: {
            pageName: "About Page",
            pageType: "about",
            pageUrl: getCurrentUrl,
            sourcePageType: "about",
            pageView: 1,
          },
        },

        listeners: [
          {
            name: "Contact Form Submit",
            element: "form",

            onEvent: function(eventObject) {
              const email = getValue("#email", "");

              if (email) {
                window.sfepCaptureEmail(email);
              }

              return null;
            },
          },
        ],
      },

      {
        name: "thank_you",

        isMatch: function() {
          return matchPath("thank-you");
        },

        interaction: {
          name: "order confirmation view",
          eventType: "order",
          attributes: {
            pageName: "Order Confirmation",
            pageType: "thank_you",
            pageUrl: getCurrentUrl,
            sourcePageType: "thank_you",
            pageView: 1,
          },
          order: {
            id: function() {
              const order = getLastOrder();
              return order && order.id ? String(order.id) : "";
            },
            totalValue: function() {
              const order = getLastOrder();
              return order && typeof order.total === "number" ? order.total : 0;
            },
            currency: "USD",
            lineItems: function() {
              const order = getLastOrder();
              const items =
                order && Array.isArray(order.items) ? order.items : [];

              return items.map(function(item) {
                const price =
                  typeof item.unitPrice === "number"
                    ? item.unitPrice
                    : typeof item.price === "number"
                    ? item.price
                    : 0;

                return {
                  catalogObjectType: "Product",
                  catalogObjectId: String(item.productId || ""),
                  quantity: item.quantity || 1,
                  price: price,
                };
              });
            },
          },
        },
      },
    ],
  };

  SalesforceInteractions.initSitemap(sitemapConfig);

  let currentUrl = window.location.href;

  setInterval(function() {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      SalesforceInteractions.reinit();
    }
  }, 500);
});
