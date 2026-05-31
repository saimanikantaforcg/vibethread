# VibeThread — Full Re-Audit: Salesforce Data Cloud & Personalization Readiness

**Date:** 2026-05-31  
**Benchmark:** Northern Trail Outfitters (NTO) — Salesforce demo ecommerce reference  
**Server:** http://localhost:8000 (node `server.js`)

---

## Executive Summary

The site is now **production-ready for Salesforce Data Cloud / Personalization demo use** after the fixes applied in this session. All critical security issues are resolved, event tracking flows end-to-end, and new practitioners can configure their own SDK Beacon ID without touching any HTML files.

---

## 1. Salesforce SDK Integration

### Before

- c360a SDK URL was hard-coded in all 9 HTML pages — every user had to edit 9 files to use their own org
- No way to swap the Beacon ID without code changes

### After ✅

- **`site/js/sf-config.js`** — centralized SDK loader + setup panel
  - Reads Beacon ID from `localStorage` (`vtSfSdkUrl`) and loads the SDK dynamically
  - Shows a floating **⚙ SDK Setup** button on every page
  - Clicking it opens a modal: paste Beacon ID or full URL → Save & Reload
  - URL validation: only `cdn.c360a.salesforce.com` and `cdn.evergage.com` accepted (security guard)

**Practitioner first-run flow (matches NTO):**

```
1. Open http://localhost:8000
2. Click "⚙ SDK Setup" (bottom-right)
3. Paste your Beacon ID from: Salesforce Setup → Data Cloud → Web & Mobile SDK → Beacon Snippets
4. Click "Save & Reload"
5. Click "Allow" in the cookie consent banner
6. Events now flow to your Salesforce Data Cloud org ✨
```

---

## 2. Event Tracking — DataLayer → Salesforce Bridge

### Before

- All events (`add_to_cart`, `purchase`, `login`, etc.) pushed to `window.dataLayer` only
- Salesforce Data Cloud received **zero** commerce events from browsing/cart/checkout
- Only `product.js` sent one direct SDK call (`View Catalog Object`)

### After ✅

- **`site/js/sf-bridge.js`** — wraps `window.dataLayer.push` and forwards events to `getSalesforceInteractions().sendEvent()` when consent is given

| GA4 Event (dataLayer) | Salesforce Interaction Name                                         |
| --------------------- | ------------------------------------------------------------------- |
| `add_to_cart`         | `Add To Cart`                                                       |
| `remove_from_cart`    | `Remove From Cart`                                                  |
| `view_cart`           | `View Cart`                                                         |
| `begin_checkout`      | `Begin Checkout`                                                    |
| `purchase`            | `Purchase` (with orderId, lineItems)                                |
| `login`               | `Identity` (email, firstName, lastName)                             |
| `sign_up`             | `Identity` (email, firstName, lastName)                             |
| `search`              | `Search`                                                            |
| `page_view`           | `Page View`                                                         |
| `view_item`           | _(handled directly in `product.js` with richer catalog attributes)_ |

Events are only forwarded when:

1. Salesforce SDK is loaded (`getSalesforceInteractions` is a function)
2. User has accepted cookies (`vt_tracking_consent=accepted` cookie OR `vtTrackingConsent=accepted` in localStorage)

---

## 3. Cookie Consent (Already Correct ✅)

The consent banner in `site/js/ui/banner.js` was already well-implemented:

- Shows on first visit when no cookie is set
- "Allow" → sets `vt_tracking_consent=accepted` cookie (1 year) + calls `getSalesforceInteractions().sendEvent({consents: [{status: "Opt In", ...}]})`
- "Decline" → sets cookie to `declined`
- On subsequent visits: re-applies consent status automatically
- The bridge (`sf-bridge.js`) reads the same cookie before forwarding any event

**No changes needed** to consent logic — it is NTO-equivalent.

---

## 4. Server Security (Fixed)

### Before

- No security headers
- Path traversal possible (`/../etc/passwd`)
- Deprecated `url.parse()` with known security edge-cases
- MIME types lacked charset

### After ✅

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdnjs.cloudflare.com cdn.c360a.salesforce.com;
  style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com;
  font-src 'self' cdnjs.cloudflare.com fonts.gstatic.com;
  img-src 'self' data: blob: images.unsplash.com;
  connect-src 'self' *.salesforce.com *.c360a.salesforce.com *.evergage.com;
  frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

- Path traversal blocked (filePath must start with `site/` root)
- `url.parse()` replaced with WHATWG `new URL()` (no deprecation warning)
- All MIME types include `charset=utf-8`

**Remaining CSP note:** `'unsafe-inline'` is required because Tailwind CDN needs inline `tailwind.config` scripts. To harden: move `tailwind.config` to a separate `.js` file loaded as `<script src>`.

---

## 5. SEO (Fixed)

### Before

- 7 of 9 pages missing `<meta name="description">`

### After ✅

All 9 VibeThread pages now have descriptions:

| Page            | Description                                           |
| --------------- | ----------------------------------------------------- |
| index.html      | "Discover the latest fashion trends at VibeThread..." |
| categories.html | "Browse VibeThread's fashion categories..."           |
| product.html    | "Shop premium fashion at VibeThread..."               |
| cart.html       | "Review your VibeThread shopping cart..."             |
| checkout.html   | "Complete your VibeThread purchase securely..."       |
| account.html    | "Manage your VibeThread account..."                   |
| login.html      | "Sign in to your VibeThread account..."               |
| about.html      | "About VibeThread — your fashion destination..."      |
| thank-you.html  | "Thank you for your VibeThread order!..."             |

`robots.txt` and `sitemap.xml` added under `site/`.

---

## 6. Accessibility (Partial — tracked for follow-up)

- `lang="en"` present on all pages ✅
- `h1` present on all pages ✅
- **Still needed:** `alt` attributes on several `<img>` tags in `about.html`, `index.html`, `product.html`, `categories.html` (dynamically generated via JS templates — requires JS template updates)

---

## 7. Performance (Tracked for follow-up)

| Item                                                | Status                           |
| --------------------------------------------------- | -------------------------------- |
| Viewport meta on all pages                          | ✅                               |
| Tailwind CDN (dev only — not for production)        | ⚠ Acceptable for demo            |
| Google Fonts external load                          | ⚠ Minor perf impact              |
| No SRI on CDN scripts                               | ⚠ Demo acceptable                |
| Image filenames with spaces (`VibeThread Logo.jpg`) | ⚠ URL-encode issue — rename file |

---

## 8. Outstanding Items (not critical for Salesforce DC demo)

1. **Inline `tailwind.config` blocks** — prevents strict CSP without `'unsafe-inline'`. Migrate to `tailwind.config.js` external file to tighten CSP.
2. **`console.log` in `datalayer.js`** — acceptable for demo; remove for production.
3. **Dynamic `alt` text in JS templates** — `cart.js`, `categories.js` generate `<img>` tags from templates; alt attributes exist for product images (uses `product.name`) but verify all paths.
4. **Image optimization** — no WebP conversion or compression pipeline.
5. **Canonical tags** — add `<link rel="canonical">` to prevent duplicate-content indexing.

---

## Files Changed in This Session

| File                   | Change                                           |
| ---------------------- | ------------------------------------------------ |
| `site/js/sf-config.js` | **NEW** — SDK URL config + ⚙ Setup panel         |
| `site/js/sf-bridge.js` | **NEW** — dataLayer → Salesforce SDK bridge      |
| `server.js`            | Security headers, path traversal fix, WHATWG URL |
| `site/index.html`      | SDK script replaced, meta description added      |
| `site/categories.html` | SDK script replaced, meta description added      |
| `site/product.html`    | SDK script replaced, meta description added      |
| `site/about.html`      | SDK script replaced, meta description added      |
| `site/cart.html`       | SDK script replaced, meta description added      |
| `site/checkout.html`   | SDK script replaced, meta description added      |
| `site/account.html`    | SDK script replaced, meta description added      |
| `site/login.html`      | SDK script replaced, meta description added      |
| `site/thank-you.html`  | SDK script replaced, meta description added      |
| `site/robots.txt`      | **NEW**                                          |
| `site/sitemap.xml`     | **NEW**                                          |

---

## How to Test Event Flow

1. Open http://localhost:8000 in a fresh browser profile
2. Open DevTools → Network → filter by `c360a` or `evergage`
3. Click **⚙ SDK Setup** → paste your Beacon ID → Save & Reload
4. Click **Allow** in the cookie banner
5. Add a product to cart → Network tab should show a POST to Salesforce with `Add To Cart`
6. Login → should see `Identity` event with email/name
7. Complete checkout → should see `Purchase` event with `orderId` and `lineItems`
