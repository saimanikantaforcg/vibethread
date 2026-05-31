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

function getActiveOptionText(containerSelector) {
  const active = SalesforceInteractions.cashDom(
    containerSelector + " .bg-blue-600",
  );

  return active.length ? active.text().trim() : "";
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
  consents: [
    {
      purpose: SalesforceInteractions.ConsentPurpose.Tracking,
      provider: "Example Consent Manager",
      status: SalesforceInteractions.ConsentStatus.OptIn,
    },
  ],
}).then(function() {
  const sitemapConfig = {
    global: {
      onActionEvent: function(event) {
        if (!event || !event.interaction) {
          return event;
        }

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
          return (
            window.location.pathname === "/" ||
            window.location.pathname === "/index.html"
          );
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
            selector: "section.bg-gradient-to-r",
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
          return window.location.pathname === "/categories.html";
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
            selector: "section.bg-blue-600",
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
          return window.location.pathname === "/product.html";
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

        listeners: [
          {
            name: "Add to Cart",
            element: "#addToCartBtn",

            onEvent: function() {
              const productId = getProductId();

              const quantityText =
                SalesforceInteractions.cashDom("#quantity").val() ||
                SalesforceInteractions.cashDom("#quantity").text() ||
                "1";

              const quantity = parseInt(quantityText, 10) || 1;
              const price = parseMoneyFromSelector("#productPrice");

              return {
                interaction: {
                  name: "addToCart",
                  eventType: "cart",

                  attributes: {
                    sourcePageType: "pdp",
                    sourceUrl: getCurrentUrl(),
                    sourceChannel: "web",
                    sourceLocale: getPageLocale(),
                    pageView: 1,
                  },

                  catalogObject: {
                    type: "Product",
                    id: productId,
                  },

                  lineItem: {
                    catalogObjectType: "Product",
                    catalogObjectId: productId,
                    quantity: quantity,
                    price: price,
                    currency: "USD",
                  },
                },
              };
            },
          },
        ],
      },

      /* -----------------------------------------------------------------------
         CART PAGE
         ----------------------------------------------------------------------- */

      {
        name: "cart",

        isMatch: function() {
          return window.location.pathname === "/cart.html";
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
          return window.location.pathname === "/checkout.html";
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

        listeners: [
          {
            name: "Face Pay Order Complete",
            element: "#facePayBtn",

            onEvent: function() {
              const total = parseMoneyFromSelector("#checkoutTotal");

              return {
                interaction: {
                  name: "order complete",
                  eventType: "order",

                  attributes: {
                    sourcePageType: "checkout",
                    sourceUrl: getCurrentUrl(),
                    sourceChannel: "web",
                    sourceLocale: getPageLocale(),
                    pageView: 1,
                  },

                  order: {
                    id: "ORDER-" + Date.now(),
                    totalValue: total,
                    currency: "USD",
                  },
                },
              };
            },
          },
        ],
      },

      /* -----------------------------------------------------------------------
         LOGIN PAGE
         ----------------------------------------------------------------------- */

      {
        name: "login",

        isMatch: function() {
          return window.location.pathname === "/login.html";
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

        listeners: [
          {
            name: "Sign In Submit",
            element: "#loginFormForm",

            onEvent: function(eventObject) {
              if (
                eventObject &&
                eventObject.sourceEvent &&
                eventObject.sourceEvent.preventDefault
              ) {
                eventObject.sourceEvent.preventDefault();
              }

              const email = getValue("#loginEmail", "");

              if (email) {
                window.sfepCaptureEmail(email);
              }

              return null;
            },
          },

          {
            name: "Create Account Submit",
            element: "#registerFormForm",

            onEvent: function(eventObject) {
              if (
                eventObject &&
                eventObject.sourceEvent &&
                eventObject.sourceEvent.preventDefault
              ) {
                eventObject.sourceEvent.preventDefault();
              }

              window.sfepCaptureIdentity({
                firstName: getValue("#firstName", ""),
                lastName: getValue("#lastName", ""),
                email: getValue("#registerEmail", ""),
              });

              return null;
            },
          },
        ],
      },

      /* -----------------------------------------------------------------------
         ABOUT PAGE
         ----------------------------------------------------------------------- */

      {
        name: "about",

        isMatch: function() {
          return window.location.pathname === "/about.html";
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
              if (
                eventObject &&
                eventObject.sourceEvent &&
                eventObject.sourceEvent.preventDefault
              ) {
                eventObject.sourceEvent.preventDefault();
              }

              const email = getValue("#email", "");

              if (email) {
                window.sfepCaptureEmail(email);
              }

              return null;
            },
          },
        ],
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
