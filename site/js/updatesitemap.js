/* =============================================================================
   VIBETHREAD
   Salesforce Data Cloud / Data 360 Web SDK Sitemap

   WEBSITE
   https://manikantacommerce.netlify.app/

   REPOSITORY
   https://github.com/saimanikantaforcg/vibethread

   PURPOSE
   -------
   This sitemap provides the website/page/catalog context for Salesforce
   Data Cloud / Data 360.

   TRANSACTIONAL EVENTS ARE ALREADY SENT BY:

       datalayer.js
             |
             v
       sf-bridge.js
             |
             v
       Salesforce Interactions SDK

   Therefore this sitemap intentionally DOES NOT duplicate:

       add_to_cart
       remove_from_cart
       view_cart
       begin_checkout
       purchase
       login
       sign_up
       logout
       search
       page_view
       view_item_list
       select_item

   PRODUCT VIEW IS ALSO ALREADY HANDLED BY product.js / existing integration.

   THIS SITEMAP HANDLES:

       Home page
       Category / PLP page
       Product detail page context
       Cart page context
       Checkout page context
       Login page context
       Account page context
       About page context
       Order confirmation page context
       Product catalog attributes
       Category information
       Customer identity helpers
       Email capture helper
       Anonymous identity enrichment
       Content zones
       Recommendation zones
       Pretty URL / .html URL support
       SPA URL changes
       Debug information

   DATA CLOUD OBJECT CONTEXT

       Individual
       Contact Point Email
       Web Engagement
       Product
       Product Category
       Cart
       Cart Item
       Order
       Order Item

   ============================================================================= */


/* =============================================================================
   SDK LOGGING
   ============================================================================= */

if (
  typeof SalesforceInteractions !== "undefined" &&
  typeof SalesforceInteractions.setLoggingLevel === "function"
) {
  SalesforceInteractions.setLoggingLevel(100);
}


/* =============================================================================
   VIBETHREAD CONFIGURATION
   ============================================================================= */

var VibeThreadConfig = {

  siteName: "VibeThread",

  channel: "Web",

  currency: "USD",

  locale: "en-US",

  dataSpace: "default",

  storage: {

    customer: "vibeThreadUser",

    cart: "vibeThreadCart",

    order: "vibeThreadLastOrder"

  }

};


/* =============================================================================
   GENERAL HELPERS
   ============================================================================= */

function vtPath() {

  return window.location.pathname || "/";

}


function vtUrl() {

  return window.location.href;

}


function vtLocale() {

  return (

    document.documentElement.lang ||

    navigator.language ||

    VibeThreadConfig.locale

  );

}


function vtQuery(name) {

  try {

    return new URLSearchParams(
      window.location.search
    ).get(name);

  } catch (error) {

    return null;

  }

}


function vtText(selector, fallback) {

  try {

    var value =
      SalesforceInteractions
        .cashDom(selector)
        .text();

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {

      return String(value).trim();

    }

  } catch (error) {}

  return fallback || "";

}


function vtValue(selector, fallback) {

  try {

    var value =
      SalesforceInteractions
        .cashDom(selector)
        .val();

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {

      return String(value).trim();

    }

  } catch (error) {}

  return fallback || "";

}


function vtAttribute(
  selector,
  attribute,
  fallback
) {

  try {

    var value =
      SalesforceInteractions
        .cashDom(selector)
        .attr(attribute);

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {

      return String(value).trim();

    }

  } catch (error) {}

  return fallback || "";

}


function vtMoney(value) {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return 0;

  }

  if (typeof value === "number") {

    return isFinite(value)
      ? value
      : 0;

  }

  var number =
    parseFloat(
      String(value)
        .replace(/[^0-9.-]/g, "")
    );

  return isFinite(number)
    ? number
    : 0;

}


function vtMoneyFromSelector(selector) {

  return vtMoney(
    vtText(selector, "0")
  );

}


/* =============================================================================
   PAGE MATCHING
   ============================================================================= */

function vtMatch(page) {

  var path =
    vtPath();

  return (

    path === "/" + page ||

    path === "/" + page + "/" ||

    path === "/" + page + ".html"

  );

}


function vtIsHome() {

  var path =
    vtPath();

  return (

    path === "/" ||

    path === "/index" ||

    path === "/index.html"

  );

}


/* =============================================================================
   PRODUCT HELPERS
   ============================================================================= */

function vtProductId() {

  return (

    vtQuery("id") ||

    vtQuery("productId") ||

    vtQuery("sku") ||

    "unknown"

  );

}


function vtProductUrl() {

  return (

    window.location.origin +

    "/product.html?id=" +

    encodeURIComponent(
      vtProductId()
    )

  );

}


function vtProductName() {

  return vtText(
    "#productName",
    "Unknown Product"
  );

}


function vtProductCategory() {

  return vtText(
    "#breadcrumbCategory",
    ""
  );

}


function vtProductPrice() {

  return vtMoneyFromSelector(
    "#productPrice"
  );

}


function vtProductImage() {

  return vtAttribute(
    "#productImage",
    "src",
    ""
  );

}


function vtSelectedColor() {

  return vtText(
    "#colorOptions .bg-blue-600",
    ""
  );

}


function vtSelectedSize() {

  return vtText(
    "#sizeOptions .bg-blue-600",
    ""
  );

}


/* =============================================================================
   CATEGORY HELPERS
   ============================================================================= */

function vtCategoryCode() {

  return (

    vtQuery("category") ||

    "all"

  );

}


function vtCategoryName() {

  var category =
    vtCategoryCode();

  var map = {

    all:
      "All Products",

    men:
      "Men's Clothing",

    women:
      "Women's Clothing",

    accessories:
      "Accessories"

  };

  return (

    map[category] ||

    category

  );

}


/* =============================================================================
   LOCAL STORAGE HELPERS
   ============================================================================= */

function vtStorage(key) {

  try {

    var value =
      localStorage.getItem(key);

    if (!value) {

      return null;

    }

    return JSON.parse(value);

  } catch (error) {

    return null;

  }

}


/* =============================================================================
   CUSTOMER HELPERS
   ============================================================================= */

function vtCustomer() {

  try {

    if (
      typeof AuthSystem !== "undefined" &&
      typeof AuthSystem.getCurrentUser === "function"
    ) {

      return AuthSystem.getCurrentUser();

    }

  } catch (error) {}

  return vtStorage(
    VibeThreadConfig.storage.customer
  );

}


function vtCustomerId() {

  var customer =
    vtCustomer();

  if (
    customer &&
    customer.id
  ) {

    return String(
      customer.id
    );

  }

  return "";

}


function vtCustomerEmail() {

  var customer =
    vtCustomer();

  if (
    customer &&
    customer.email
  ) {

    return String(
      customer.email
    ).trim();

  }

  return (

    vtValue(
      "#email",
      ""
    ) ||

    vtValue(
      "[name='email']",
      ""
    ) ||

    vtValue(
      "input[type='email']",
      ""
    )

  );

}


/* =============================================================================
   ANONYMOUS ID
   ============================================================================= */

function vtAnonymousId() {

  try {

    if (
      typeof SalesforceInteractions !== "undefined" &&
      typeof SalesforceInteractions.getAnonymousId === "function"
    ) {

      return SalesforceInteractions
        .getAnonymousId();

    }

  } catch (error) {}

  return "";

}


/* =============================================================================
   CART HELPERS
   ============================================================================= */

function vtCart() {

  var cart =
    vtStorage(
      VibeThreadConfig.storage.cart
    );

  return Array.isArray(cart)
    ? cart
    : [];

}


function vtCartItemCount() {

  return vtCart().reduce(
    function(total, item) {

      return (

        total +

        Number(
          item.quantity || 0
        )

      );

    },
    0
  );

}


function vtCartValue() {

  return vtCart().reduce(
    function(total, item) {

      var price =
        Number(
          item.price ||
          item.unitPrice ||
          0
        );

      var quantity =
        Number(
          item.quantity || 1
        );

      return (
        total +
        price * quantity
      );

    },
    0
  );

}


/* =============================================================================
   ORDER HELPERS
   ============================================================================= */

function vtLastOrder() {

  return vtStorage(
    VibeThreadConfig.storage.order
  );

}


function vtOrderId() {

  var order =
    vtLastOrder();

  return (

    order &&
    order.id

  )
    ? String(order.id)
    : "";

}


function vtOrderValue() {

  var order =
    vtLastOrder();

  if (
    order &&
    typeof order.total === "number"
  ) {

    return order.total;

  }

  return 0;

}


/* =============================================================================
   COMMON PAGE ATTRIBUTES
   ============================================================================= */

function vtPageAttributes(
  pageType
) {

  return {

    siteName:
      VibeThreadConfig.siteName,

    channel:
      VibeThreadConfig.channel,

    sourceUrl:
      vtUrl,

    sourceChannel:
      "web",

    sourceLocale:
      vtLocale,

    sourcePageType:
      pageType,

    pagePath:
      vtPath,

    pageTitle:
      function() {

        return (
          document.title ||
          VibeThreadConfig.siteName
        );

      },

    pageView:
      1

  };

}


/* =============================================================================
   EMAIL CAPTURE
   ============================================================================= */

window.sfepCaptureEmail =
  function(emailValue) {

    if (!emailValue) {

      return;

    }

    if (
      typeof SalesforceInteractions ===
      "undefined"
    ) {

      return;

    }

    SalesforceInteractions.sendEvent({

      interaction: {

        name:
          "Email Capture"

      },

      user: {

        attributes: {

          eventType:
            "contactPointEmail",

          email:
            String(
              emailValue
            ).trim(),

          sourceUrl:
            vtUrl(),

          sourceChannel:
            "web",

          sourceLocale:
            vtLocale(),

          sourcePageType:
            "email_capture"

        }

      }

    });

  };


/* =============================================================================
   IDENTITY CAPTURE
   ============================================================================= */

window.sfepCaptureIdentity =
  function(options) {

    options =
      options || {};

    if (
      typeof SalesforceInteractions ===
      "undefined"
    ) {

      return;

    }

    SalesforceInteractions.sendEvent({

      interaction: {

        name:
          "Identity Capture"

      },

      user: {

        attributes: {

          eventType:
            "identity",

          isAnonymous:
            0,

          firstName:
            options.firstName || "",

          lastName:
            options.lastName || "",

          email:
            options.email || "",

          phoneNumber:
            options.phoneNumber || "",

          sourceUrl:
            vtUrl(),

          sourceChannel:
            "web",

          sourceLocale:
            vtLocale(),

          sourcePageType:
            "identity_capture"

        }

      }

    });

  };


/* =============================================================================
   GLOBAL EVENT ENRICHMENT
   ============================================================================= */

function vtGlobalEvent(event) {

  if (
    !event ||
    !event.interaction
  ) {

    return event;

  }


  event.interaction.attributes =
    event.interaction.attributes || {};


  if (
    !event.interaction.attributes.sourceUrl
  ) {

    event.interaction.attributes.sourceUrl =
      vtUrl();

  }


  if (
    !event.interaction.attributes.sourceChannel
  ) {

    event.interaction.attributes.sourceChannel =
      "web";

  }


  if (
    !event.interaction.attributes.sourceLocale
  ) {

    event.interaction.attributes.sourceLocale =
      vtLocale();

  }


  if (
    !event.interaction.attributes.sourcePageType
  ) {

    event.interaction.attributes.sourcePageType =
      vtResolvePageType();

  }


  /*
     Keep the anonymous ID available for debugging.

     The SDK itself manages identity/cookies.
  */

  try {

    var anonymousId =
      vtAnonymousId();

    if (anonymousId) {

      event.user =
        event.user || {};

      event.user.anonymousId =
        anonymousId;

    }

  } catch (error) {}


  /*
     Local debug buffer.
  */

  try {

    window.__vtSfOutbound =
      window.__vtSfOutbound || [];

    window.__vtSfOutbound.push({

      timestamp:
        Date.now(),

      event:
        JSON.parse(
          JSON.stringify(event)
        )

    });

  } catch (error) {}


  return event;

}


/* =============================================================================
   PAGE TYPE RESOLVER
   ============================================================================= */

function vtResolvePageType() {

  if (vtIsHome()) {

    return "home";

  }

  if (vtMatch("categories")) {

    return "category_listing";

  }

  if (vtMatch("product")) {

    return "product_detail";

  }

  if (vtMatch("cart")) {

    return "cart";

  }

  if (vtMatch("checkout")) {

    return "checkout";

  }

  if (vtMatch("login")) {

    return "login";

  }

  if (vtMatch("account")) {

    return "account";

  }

  if (vtMatch("about")) {

    return "about";

  }

  if (vtMatch("thank-you")) {

    return "order_confirmation";

  }

  return "unknown";

}


/* =============================================================================
   WAIT FOR SDK
   ============================================================================= */

(function() {

  var attempts = 0;

  var maxAttempts = 40;

  var timer =
    setInterval(
      function() {

        attempts++;

        if (
          typeof SalesforceInteractions !==
          "undefined"
        ) {

          clearInterval(timer);

          vtInitialize();

        }


        if (
          attempts >=
          maxAttempts
        ) {

          clearInterval(timer);

          console.warn(
            "[VibeThread] Salesforce Interactions SDK not available."
          );

        }

      },
      250
    );

})();


/* =============================================================================
   INITIALIZE
   ============================================================================= */

function vtInitialize() {

  SalesforceInteractions
    .init({

      personalization: {

        dataspace:
          VibeThreadConfig.dataSpace

      }

    })

    .then(function() {


      /* =======================================================================
         SITEMAP
         ======================================================================= */

      var sitemapConfig = {


        /* =====================================================================
           GLOBAL
           ===================================================================== */

        global: {

          onActionEvent:
            vtGlobalEvent

        },


        /* =====================================================================
           DEFAULT
           ===================================================================== */

        pageTypeDefault: {

          name:
            "default",

          interaction: {

            name:
              "Page View",

            eventType:
              "browse",

            attributes:
              vtPageAttributes(
                "default"
              )

          }

        },


        /* =====================================================================
           PAGE TYPES
           ===================================================================== */

        pageTypes: [


          /* ===================================================================
             HOME
             =================================================================== */

          {

            name:
              "home",

            isMatch:
              function() {

                return vtIsHome();

              },

            interaction: {

              name:
                "Home Page View",

              eventType:
                "browse",

              attributes:
                vtPageAttributes(
                  "home"
                )

            },

            contentZones: [

              {

                name:
                  "home_hero",

                selector:
                  "section"

              },

              {

                name:
                  "home_featured_products",

                selector:
                  "#featuredProducts"

              },

              {

                name:
                  "home_recommendations",

                selector:
                  "#featuredProducts"

              }

            ]

          },


          /* ===================================================================
             CATEGORY / PRODUCT LISTING
             =================================================================== */

          {

            name:
              "category_listing",

            isMatch:
              function() {

                return vtMatch(
                  "categories"
                );

              },

            interaction: {

              name:
                "Category View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "category_listing",

                pageType:
                  "category_listing",

                pageName:
                  function() {

                    return (

                      "Category - " +

                      vtCategoryName()

                    );

                  },

                categoryCode:
                  vtCategoryCode,

                categoryName:
                  vtCategoryName,

                pageView:
                  1

              }

            },

            contentZones: [

              {

                name:
                  "category_header",

                selector:
                  "#categoryTitle"

              },

              {

                name:
                  "category_products",

                selector:
                  "#productsGrid"

              },

              {

                name:
                  "category_recommendations",

                selector:
                  "#productsGrid"

              }

            ]

          },


          /* ===================================================================
             PRODUCT DETAIL
             =================================================================== */

          {

            name:
              "product_detail",

            isMatch:
              function() {

                return vtMatch(
                  "product"
                );

              },

            interaction: {

              /*
                 IMPORTANT:

                 Product view is represented as a Catalog interaction.

                 This is the correct structure for a product page.
              */

              name:
                "View Catalog Object",

              eventType:
                "catalog",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "product_detail",

                pageType:
                  "product_detail",

                pageName:
                  function() {

                    return (

                      "Product - " +

                      vtProductName()

                    );

                  },

                productId:
                  vtProductId,

                productName:
                  vtProductName,

                productCategory:
                  vtProductCategory,

                productPrice:
                  vtProductPrice,

                pageView:
                  1

              },

              catalogObject: {

                type:
                  "Product",

                id:
                  function() {

                    return vtProductId();

                  },

                attributes: {

                  attributeProductName:
                    function() {

                      return vtProductName();

                    },

                  attributeProductSku:
                    function() {

                      return vtProductId();

                    },

                  attributeProductUrl:
                    function() {

                      return vtProductUrl();

                    },

                  attributeProductImageUrl:
                    function() {

                      return vtProductImage();

                    },

                  attributeUnitPrice:
                    function() {

                      return vtProductPrice();

                    },

                  attributeColor:
                    function() {

                      return vtSelectedColor();

                    },

                  attributeSize:
                    function() {

                      return vtSelectedSize();

                    },

                  attributeItemType:
                    function() {

                      return vtProductCategory();

                    },

                  attributeInventory:
                    function() {

                      return 1;

                    }

                }

              }

            },

            contentZones: [

              {

                name:
                  "product_recommendations",

                selector:
                  "#relatedProducts"

              },

              {

                name:
                  "product_you_may_like",

                selector:
                  "#relatedProducts"

              },

              {

                name:
                  "product_frequently_bought",

                selector:
                  "#relatedProducts"

              }

            ]

          },


          /* ===================================================================
             CART
             =================================================================== */

          {

            name:
              "cart",

            isMatch:
              function() {

                return vtMatch(
                  "cart"
                );

              },

            interaction: {

              name:
                "Cart Page View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "cart",

                pageType:
                  "cart",

                pageName:
                  "Shopping Cart",

                cartItemCount:
                  vtCartItemCount,

                cartValue:
                  vtCartValue,

                currency:
                  "USD",

                pageView:
                  1

              }

            },

            contentZones: [

              {

                name:
                  "cart_items",

                selector:
                  "#cartPageItems"

              },

              {

                name:
                  "cart_upsell",

                selector:
                  "#cartPageItems"

              },

              {

                name:
                  "cart_recommendations",

                selector:
                  "#cartPageItems"

              }

            ]

          },


          /* ===================================================================
             CHECKOUT
             =================================================================== */

          {

            name:
              "checkout",

            isMatch:
              function() {

                return vtMatch(
                  "checkout"
                );

              },

            interaction: {

              name:
                "Checkout Page View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "checkout",

                pageType:
                  "checkout",

                pageName:
                  "Checkout",

                checkoutStarted:
                  1,

                cartItemCount:
                  vtCartItemCount,

                cartValue:
                  vtCartValue,

                currency:
                  "USD",

                pageView:
                  1

              }

            },

            contentZones: [

              {

                name:
                  "checkout_items",

                selector:
                  "#checkoutItems"

              },

              {

                name:
                  "checkout_recommendations",

                selector:
                  "#checkoutItems"

              },

              {

                name:
                  "checkout_last_chance",

                selector:
                  "#checkoutItems"

              }

            ]

          },


          /* ===================================================================
             LOGIN
             =================================================================== */

          {

            name:
              "login",

            isMatch:
              function() {

                return vtMatch(
                  "login"
                );

              },

            interaction: {

              name:
                "Login Page View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "login",

                pageType:
                  "login",

                pageName:
                  "Login",

                pageView:
                  1

              }

            }

          },


          /* ===================================================================
             ACCOUNT
             =================================================================== */

          {

            name:
              "account",

            isMatch:
              function() {

                return vtMatch(
                  "account"
                );

              },

            interaction: {

              name:
                "Account Page View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "account",

                pageType:
                  "account",

                pageName:
                  "Customer Account",

                customerId:
                  vtCustomerId,

                pageView:
                  1

              }

            },

            contentZones: [

              {

                name:
                  "account_profile",

                selector:
                  "#profileForm"

              },

              {

                name:
                  "account_preferences",

                selector:
                  "#preferencesForm"

              }

            ]

          },


          /* ===================================================================
             ABOUT
             =================================================================== */

          {

            name:
              "about",

            isMatch:
              function() {

                return vtMatch(
                  "about"
                );

              },

            interaction: {

              name:
                "About Page View",

              eventType:
                "browse",

              attributes:
                vtPageAttributes(
                  "about"
                )

            },

            listeners: [

              {

                name:
                  "Email Capture",

                element:
                  "form",

                onEvent:
                  function() {

                    var email =
                      vtValue(
                        "#email",
                        ""
                      );

                    if (email) {

                      window
                        .sfepCaptureEmail(
                          email
                        );

                    }

                    return null;

                  }

              }

            ]

          },


          /* ===================================================================
             ORDER CONFIRMATION
             =================================================================== */

          {

            name:
              "order_confirmation",

            isMatch:
              function() {

                return vtMatch(
                  "thank-you"
                );

              },

            /*
               IMPORTANT:

               DO NOT send another Purchase event here.

               sf-bridge.js already maps the DataLayer "purchase" event to
               Salesforce "Purchase".

               This page therefore only records the page context.
            */

            interaction: {

              name:
                "Order Confirmation Page View",

              eventType:
                "browse",

              attributes: {

                siteName:
                  "VibeThread",

                channel:
                  "Web",

                sourceUrl:
                  vtUrl,

                sourceChannel:
                  "web",

                sourceLocale:
                  vtLocale,

                sourcePageType:
                  "order_confirmation",

                pageType:
                  "order_confirmation",

                pageName:
                  "Order Confirmation",

                orderId:
                  vtOrderId,

                orderValue:
                  vtOrderValue,

                currency:
                  "USD",

                pageView:
                  1

              }

            }

          }

        ]

      };


      /* =======================================================================
         INITIALIZE SITEMAP
         ======================================================================= */

      SalesforceInteractions
        .initSitemap(
          sitemapConfig
        );


      /* =======================================================================
         DEBUG INFORMATION
         ======================================================================= */

      window.VibeThreadDataCloud = {

        getPageType:
          vtResolvePageType,

        getProductId:
          vtProductId,

        getProductName:
          vtProductName,

        getProductCategory:
          vtProductCategory,

        getProductPrice:
          vtProductPrice,

        getCategory:
          vtCategoryName,

        getCartValue:
          vtCartValue,

        getCartItemCount:
          vtCartItemCount,

        getCustomerId:
          vtCustomerId,

        getCustomerEmail:
          vtCustomerEmail,

        getOrderId:
          vtOrderId,

        getOrderValue:
          vtOrderValue,

        getAnonymousId:
          vtAnonymousId

      };


      console.log(
        "[VibeThread] Data Cloud Sitemap initialized:",
        vtResolvePageType()
      );


    })

    .catch(function(error) {

      console.error(
        "[VibeThread] Data Cloud Sitemap initialization failed:",
        error
      );

    });

}


/* =============================================================================
   URL CHANGE SUPPORT
   ============================================================================= */

(function() {

  if (
    window.__vibeThreadSitemapWatcher
  ) {

    return;

  }

  window.__vibeThreadSitemapWatcher =
    true;


  var currentUrl =
    window.location.href;


  setInterval(
    function() {

      if (
        currentUrl !==
        window.location.href
      ) {

        currentUrl =
          window.location.href;


        try {

          if (
            typeof SalesforceInteractions !==
            "undefined" &&
            typeof SalesforceInteractions.reinit ===
            "function"
          ) {

            SalesforceInteractions.reinit();

          }

        } catch (error) {

          console.warn(
            "[VibeThread] Sitemap reinitialization error:",
            error
          );

        }

      }

    },
    500
  );

})();


/* =============================================================================
   END OF VIBETHREAD SITEMAP
   ============================================================================= */
