/* =============================================================================
   Salesforce Einstein Personalization — E-Com Demo Sitemap
   Site: VibeThread — https://shop.mikesdemos.com
   Data Cloud Web SDK (SalesforceInteractions)

   UPLOAD: Data Cloud > Website Connectors > [connector] > Sitemap > Upload Sitemap
   DEBUG:  https://shop.mikesdemos.com/index.html?sf_personalization_wpm — check console
   DOCS:   https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/integrate-salesforce-interactions-sdk.html
   ============================================================================= */

/* =============================================================================
   SECTION 1 — LOGGING
   Remove or comment out before uploading to production.
   ============================================================================= */
SalesforceInteractions.setLoggingLevel(100);

/* =============================================================================
   SECTION 2 — GLOBAL HELPERS
   Functions exposed on window so the site's own JS can call them directly.
   ============================================================================= */

/**
 * Fires a contactPointEmail event.
 * Called from site JS on any email capture: window.sfepCaptureEmail(emailValue)
 */
window.sfepCaptureEmail = function(emailValue) {
  SalesforceInteractions.sendEvent({
    interaction: { name: "emailCapture" },
    user: {
      attributes: {
        eventType: "contactPointEmail",
        email: emailValue,
      },
    },
  });
};

/**
 * Fires an identity event with name and email.
 * Called on account creation / profile update.
 */
window.sfepCaptureIdentity = function({
  firstName,
  lastName,
  email,
  phoneNumber,
} = {}) {
  SalesforceInteractions.sendEvent({
    interaction: { name: "identityCapture" },
    user: {
      attributes: {
        eventType: "identity",
        isAnonymous: 0,
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
      },
    },
  });
};

/* =============================================================================
   SECTION 3 — PERSONALIZATION TRANSFORMER INITIALIZATION
   Registers Handlebars templates for Personalization Points.
   Must run BEFORE SalesforceInteractions.init().
   ============================================================================= */
try {
  SalesforceInteractions.Personalization.Config.initialize({
    customFlickerDefenseConfig: {
      redisplayTimeoutMilliseconds: 2000,
      renderPersonalizationAfterTimeoutElapsed: false,
    },
    additionalTransformers: [
      /* --- SimpleRecs ---------------------------------------------------
           Horizontal product recommendation carousel.
           Field names reference Salesforce Goods Product DMO API names.
           ------------------------------------------------------------------ */
      {
        name: "SimpleRecs",
        transformerType: "Handlebars",
        substitutionDefinitions: {
          recs: { defaultValue: "[data]" },
          id: { defaultValue: "[ssot__Id__c]" },
          image: { defaultValue: "[ImageURL__c]" },
          name: { defaultValue: "[ssot__Name__c]" },
          price: { defaultValue: "[UnitPrice__c]" },
          url: { defaultValue: "[ProductUrl__c]" },
        },
        transformerTypeDetails: {
          html: `
                    <div class="sfep-recs-carousel" style="display:flex;gap:16px;overflow-x:auto;padding:16px 0;">
                        {{#each (subVar 'recs')}}
                            <div class="sfep-recs-item"
                                 style="min-width:180px;text-align:center;"
                                 data-sf-personalization-click='{"object-id":"{{subVar "id"}}","content-id":"{{subVar "id"}}"}'
                                 data-sf-personalization-view='{"destination":"Product"}'>
                                <a href="product.html?id={{subVar 'id'}}" style="text-decoration:none;color:inherit;">
                                    <img src="{{subVar 'image'}}" alt="{{subVar 'name'}}"
                                         style="width:160px;height:160px;object-fit:cover;border-radius:8px;" />
                                    <p class="sfep-recs-name" style="font-weight:600;margin:8px 0 4px;">{{subVar 'name'}}</p>
                                    <p class="sfep-recs-price" style="color:#2563eb;">$\{{subVar 'price'}}</p>
                                </a>
                            </div>
                        {{/each}}
                    </div>
                `,
        },
      },

      /* --- SimpleHero ---------------------------------------------------
           Hero banner with background image, headline, and CTA button.
           Attributes are set in the Personalization Decision.
           ------------------------------------------------------------------ */
      {
        name: "SimpleHero",
        transformerType: "Handlebars",
        substitutionDefinitions: {
          BackgroundImageUrl: {
            defaultValue: "[attributes].[BackgroundImageUrl]",
          },
          Header: { defaultValue: "[attributes].[Header]" },
          Subheader: { defaultValue: "[attributes].[Subheader]" },
          CallToActionUrl: { defaultValue: "[attributes].[CallToActionUrl]" },
          CallToActionText: { defaultValue: "[attributes].[CallToActionText]" },
        },
        transformerTypeDetails: {
          html: `
                    <section class="sfep-hero bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20"
                             style="background: url('{{subVar 'BackgroundImageUrl'}}') no-repeat center center / cover;">
                        <div class="container mx-auto px-4 text-center">
                            <h1 class="text-5xl font-bold mb-6">{{subVar 'Header'}}</h1>
                            <p class="text-xl mb-8 max-w-2xl mx-auto">{{subVar 'Subheader'}}</p>
                            <a class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                               href="{{subVar 'CallToActionUrl'}}">
                                {{subVar 'CallToActionText'}}
                            </a>
                        </div>
                    </section>
                `,
        },
      },
    ],
  });
} catch (e) {
  console.warn("[sitemap] Personalization.Config.initialize failed:", e);
}

/* =============================================================================
   SECTION 4 — SDK INITIALIZATION + SITEMAP CONFIG
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
}).then(() => {
  const sitemapConfig = {
    /* -------------------------------------------------------------------
           GLOBAL — runs on every page
           ------------------------------------------------------------------- */
    global: {
      onActionEvent: (event) => {
        return event;
      },
    },

    /* -------------------------------------------------------------------
           PAGE TYPE DEFAULT — catch-all for unmatched pages
           ------------------------------------------------------------------- */
    pageTypeDefault: {
      name: "default",
      interaction: {
        name: "default",
        eventType: "userEngagement",
      },
    },

    /* -------------------------------------------------------------------
           PAGE TYPES — VibeThread (shop.mikesdemos.com)
           All URL patterns and DOM selectors confirmed from repo analysis.
           ------------------------------------------------------------------- */
    pageTypes: [
      /* ---------------------------------------------------------------
               HOME PAGE  /index.html or /
               --------------------------------------------------------------- */
      {
        name: "home",

        isMatch: () =>
          window.location.pathname === "/" ||
          window.location.pathname === "/index.html",

        interaction: {
          name: "home view",
          eventType: "userEngagement",
        },

        contentZones: [
          // Hero section — SimpleHero transformer replaces this entire section
          { name: "hero_banner", selector: "section.bg-gradient-to-r" },
          // Featured Products grid — SimpleRecs injects into this container
          { name: "recommendations_1", selector: "#featuredProducts" },
        ],
      },

      /* ---------------------------------------------------------------
               PRODUCT LIST PAGE (PLP)  /categories.html?category=men|women|accessories
               --------------------------------------------------------------- */
      {
        name: "plp",

        isMatch: () => window.location.pathname === "/categories.html",

        interaction: {
          name: "plp view",
          eventType: "userEngagement",
          // Capture which category is being browsed
          attributes: {
            browseCategory: () =>
              new URLSearchParams(window.location.search).get("category") ||
              "all",
          },
        },

        contentZones: [
          // Top-of-page blue header banner — SimpleHero can replace/overlay
          { name: "recs_header", selector: "section.bg-blue-600" },
          // Product grid — SimpleRecs populates curated/recommended products
          { name: "recs_featured", selector: "#productsGrid" },
        ],
      },

      /* ---------------------------------------------------------------
               PRODUCT DETAIL PAGE (PDP)  /product.html?id={productId}
               Sends a Catalog interaction with live product attributes from DOM.
               --------------------------------------------------------------- */
      {
        name: "pdp",

        isMatch: () => window.location.pathname === "/product.html",

        interaction: {
          name: "pdp view",
          eventType: "productEngagement",

          catalogObject: {
            type: "Product",

            // Product ID is the ?id= query parameter
            id: () =>
              new URLSearchParams(window.location.search).get("id") ||
              "unknown",

            attributes: {
              // Text content of #productName h1
              attributeProductName: SalesforceInteractions.resolvers.fromSelector(
                "#productName",
              ),

              // SKU — use the id parameter as SKU (no separate SKU element in DOM)
              attributeProductSku: () =>
                new URLSearchParams(window.location.search).get("id") || "",

              // Canonical page URL
              attributeProductUrl: () =>
                window.location.origin +
                window.location.pathname +
                "?id=" +
                (new URLSearchParams(window.location.search).get("id") || ""),

              // src attribute of #productImage
              attributeProductImageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute(
                "#productImage",
                "src",
              ),

              // Strip "$" and parse to number from #productPrice
              attributeUnitPrice: () => {
                const raw =
                  SalesforceInteractions.cashDom("#productPrice").text() || "0";
                return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
              },

              // Active color option — button with bg-blue-600 class in #colorOptions
              attributeColor: () => {
                const active = SalesforceInteractions.cashDom(
                  "#colorOptions .bg-blue-600",
                );
                return active.length ? active.text().trim() : "";
              },

              // Active size option — button with bg-blue-600 class in #sizeOptions
              attributeSize: () => {
                const active = SalesforceInteractions.cashDom(
                  "#sizeOptions .bg-blue-600",
                );
                return active.length ? active.text().trim() : "";
              },

              // Category from breadcrumb — #breadcrumbCategory
              attributeItemType: SalesforceInteractions.resolvers.fromSelector(
                "#breadcrumbCategory",
              ),
            },
          },
        },

        contentZones: [
          // Related Products section — SimpleRecs populates recommendations
          { name: "recs_you_may_like", selector: "#relatedProducts" },
          // Second recommendations zone — reuses related products area for a/b
          { name: "recs_frequently_bought", selector: "#relatedProducts" },
        ],

        /* Add-to-Cart listener — fires cartEngagement when user clicks Add to Cart */
        listeners: [
          {
            name: "Add to Cart",
            element: "#addToCartBtn",
            onEvent: () => {
              const productId =
                new URLSearchParams(window.location.search).get("id") ||
                "unknown";
              const qtyText =
                SalesforceInteractions.cashDom("#quantity").text() || "1";
              const priceText =
                SalesforceInteractions.cashDom("#productPrice").text() || "0";
              const quantity = parseInt(qtyText, 10) || 1;
              const price = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;

              return {
                interaction: {
                  name: "addToCart",
                  eventType: "cartEngagement",
                  catalogObject: {
                    type: "Product",
                    id: productId,
                  },
                  lineItem: {
                    catalogObjectType: "Product",
                    catalogObjectId: productId,
                    quantity: quantity,
                    price: price,
                  },
                },
              };
            },
          },
        ],
      },

      /* ---------------------------------------------------------------
               CART PAGE  /cart.html
               --------------------------------------------------------------- */
      {
        name: "cart",

        isMatch: () => window.location.pathname === "/cart.html",

        interaction: {
          name: "cart view",
          eventType: "cartEngagement",
        },

        contentZones: [
          // Upsell zone — injected after cart items list in the left column
          { name: "recs_upsell", selector: "#cartPageItems" },
        ],
      },

      /* ---------------------------------------------------------------
               CHECKOUT PAGE  /checkout.html
               --------------------------------------------------------------- */
      {
        name: "checkout",

        isMatch: () => window.location.pathname === "/checkout.html",

        interaction: {
          name: "checkout view",
          eventType: "userEngagement",
        },

        contentZones: [
          // Last-chance zone — injected above the payment button
          { name: "recs_last_chance", selector: "#checkoutItems" },
        ],

        /* Order completion listener — fires when Face Pay button is clicked */
        listeners: [
          {
            name: "Face Pay — Order Complete",
            element: "#facePayBtn",
            onEvent: () => {
              // Read total from checkout summary
              const totalText =
                SalesforceInteractions.cashDom("#checkoutTotal").text() || "0";
              const total = parseFloat(totalText.replace(/[^0-9.]/g, "")) || 0;

              return {
                interaction: {
                  name: "order complete",
                  eventType: "orderEngagement",
                  order: {
                    id: "ORDER-" + Date.now(), // no order ID in DOM — use timestamp
                    totalValue: total,
                    currency: "USD",
                  },
                },
              };
            },
          },
        ],
      },

      /* ---------------------------------------------------------------
               LOGIN / REGISTER PAGE  /login.html
               Captures email on sign-in and full identity on registration.
               --------------------------------------------------------------- */
      {
        name: "login",

        isMatch: () => window.location.pathname === "/login.html",

        interaction: {
          name: "login view",
          eventType: "userEngagement",
        },

        listeners: [
          /* Sign-in form — capture email on submit */
          {
            name: "Sign In Submit",
            element: "#loginFormForm",
            onEvent: ({ sourceEvent }) => {
              sourceEvent.preventDefault();
              const email =
                SalesforceInteractions.cashDom("#loginEmail").val() || "";
              if (email) {
                window.sfepCaptureEmail(email);
              }
              return null;
            },
          },

          /* Registration form — capture full identity on submit */
          {
            name: "Create Account Submit",
            element: "#registerFormForm",
            onEvent: ({ sourceEvent }) => {
              sourceEvent.preventDefault();
              window.sfepCaptureIdentity({
                firstName:
                  SalesforceInteractions.cashDom("#firstName").val() || "",
                lastName:
                  SalesforceInteractions.cashDom("#lastName").val() || "",
                email:
                  SalesforceInteractions.cashDom("#registerEmail").val() || "",
              });
              return null;
            },
          },
        ],
      },

      /* ---------------------------------------------------------------
               ABOUT PAGE  /about.html
               Captures email from contact form.
               --------------------------------------------------------------- */
      {
        name: "about",

        isMatch: () => window.location.pathname === "/about.html",

        interaction: {
          name: "about view",
          eventType: "userEngagement",
        },

        listeners: [
          /* Contact form — capture email on submit */
          {
            name: "Contact Form Submit",
            element: "form",
            onEvent: ({ sourceEvent }) => {
              sourceEvent.preventDefault();
              const email =
                SalesforceInteractions.cashDom("#email").val() || "";
              if (email) {
                window.sfepCaptureEmail(email);
              }
              return null;
            },
          },
        ],
      },
    ], // end pageTypes
  }; // end sitemapConfig

  SalesforceInteractions.initSitemap(sitemapConfig);

  /* =========================================================================
       SECTION 5 — SPA SUPPORT
       Detects URL changes (hash or pushState) and reinitializes the sitemap.
       ========================================================================= */
  let currentUrl = window.location.href;

  setInterval(() => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      SalesforceInteractions.reinit();
    }
  }, 500);
}); // end SalesforceInteractions.init().then()
