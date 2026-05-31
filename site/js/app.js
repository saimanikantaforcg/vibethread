import { initConsentBanner, initDemoBanner } from "./ui/banner.js";

const PAGE_NAME_MAP = {
  home: "home",
  categories: "category_listing",
  product: "product_detail",
  cart: "cart",
  checkout: "checkout",
  login: "login",
  account: "account",
  about: "about",
  "thank-you": "order_confirmation",
};

function normalizePageName(pageType) {
  if (pageType && PAGE_NAME_MAP[pageType]) {
    return PAGE_NAME_MAP[pageType];
  }

  const path = window.location.pathname;
  if (path === "/" || path.endsWith("/index.html")) return "home";
  if (path.endsWith("/categories.html")) return "category_listing";
  if (path.endsWith("/product.html")) return "product_detail";
  if (path.endsWith("/cart.html")) return "cart";
  if (path.endsWith("/checkout.html")) return "checkout";
  if (path.endsWith("/login.html")) return "login";
  if (path.endsWith("/account.html")) return "account";
  if (path.endsWith("/about.html")) return "about";
  if (path.endsWith("/thank-you.html")) return "order_confirmation";
  return "unknown";
}

function trackGlobalPageView(pageType) {
  if (typeof dataLayerManager === "undefined") return;

  const normalizedPage = normalizePageName(pageType);
  dataLayerManager.trackPageView(normalizedPage, document.title);
}

function installProductSelectionTracking() {
  if (window.__vtSelectItemTrackingInstalled) return;
  window.__vtSelectItemTrackingInstalled = true;

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href*='product.html?id=']");
    if (!anchor || typeof dataLayerManager === "undefined") return;

    let productId = null;
    try {
      const href = new URL(anchor.href, window.location.origin);
      productId = href.searchParams.get("id");
    } catch (_) {
      return;
    }

    if (!productId) return;

    const listName = window.location.pathname.endsWith("/categories.html")
      ? "Category Listing"
      : "Homepage Featured";

    let item = {
      item_id: String(productId),
      item_name: "",
      item_category: "",
      price: 0,
      index: 0,
    };

    if (
      typeof ProductUtils !== "undefined" &&
      typeof ProductUtils.getProductById === "function"
    ) {
      const numericId = Number.parseInt(productId, 10);
      const product = ProductUtils.getProductById(numericId);
      if (product) {
        item = {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category || "",
          price: Number(product.price) || 0,
          index: 0,
        };
      }
    }

    dataLayerManager.push({
      event: "select_item",
      ecommerce: {
        item_list_name: listName,
        items: [item],
      },
    });
  });
}

export const app = {
  init({ pageType } = {}) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initDemoBanner({ pageType });
        initConsentBanner();
        document.body.dataset.pageType = normalizePageName(pageType);
        trackGlobalPageView(pageType);
        installProductSelectionTracking();
      });
      return;
    }

    initDemoBanner({ pageType });
    initConsentBanner();
    document.body.dataset.pageType = normalizePageName(pageType);
    trackGlobalPageView(pageType);
    installProductSelectionTracking();
  },
};
