# Salesforce Data Cloud Upload & Validation Checklist

## PRE-UPLOAD: Local Validation

- [ ] Event debugger tested locally (`?debug-events` on `http://localhost:8000`)

  - [ ] Blue **📊** button visible bottom-right
  - [ ] Click button → shows event stream
  - [ ] Browse product → event appears (page_view + select_item)
  - [ ] Add to cart → event appears (add_to_cart)
  - [ ] View cart → event appears (view_cart)
  - [ ] Events show **green dot** (sent to Salesforce) OR **amber dot** (no consent)

- [ ] Consent banner works

  - [ ] Click "Allow Tracking" → enables consent
  - [ ] Refresh page → events now show **green dot** in debugger
  - [ ] Events sent to `https://cdn.c360a.salesforce.com/beacon/...` (check Network tab)

- [ ] No console errors
  - [ ] Open DevTools → **Console** tab
  - [ ] Browse all pages (home, product, categories, checkout, thank-you)
  - [ ] No red errors; only warnings are OK

---

## SALESFORCE UPLOAD: Updated Sitemap

### File to Upload

Location: `site/js/updated_sitemap.js` (in your workspace)

### Step 1: Access Salesforce Data Cloud

1. Log in to **Salesforce Data Cloud org**
2. Go to **Personalization** (or **Einstein Personalization**)
3. Look for **"Sitemap Configuration"** or **"Site Config"** section
4. Find **"Upload Sitemap"** or **"Import Configuration"** button

### Step 2: Upload File

1. Click **"Upload"** or **"Import"**
2. Select `updated_sitemap.js` from your workspace (`site/js/updated_sitemap.js`)
3. Click **"Validate"** or **"Parse"**
4. Check for errors:
   - [ ] **No syntax errors** (JavaScript parsing passes)
   - [ ] **No undefined selector warnings** (safe to ignore #productName if PDP content varies)
   - [ ] All **page types recognized**: home, plp, pdp, cart, checkout, login, about, thank_you

### Step 3: Review Parsed Configuration

After upload, verify the parser shows:

**Page Types:**

- [ ] `home` — matched by `/` or `/index.html`
- [ ] `plp` — matched by `/categories.html`
- [ ] `pdp` — matched by `/product.html` with catalog object mapping
- [ ] `cart` — matched by `/cart.html`
- [ ] `checkout` — matched by `/checkout.html`
- [ ] `login` — matched by `/login.html`
- [ ] `about` — matched by `/about.html` with form listener
- [ ] `thank_you` — matched by `/thank-you.html` with order capture

**Event Types Recognized:**

- [ ] `browse` (page views: home, plp, checkout, login, about)
- [ ] `catalog` (PDP with product attributes)
- [ ] `cart` (cart page)
- [ ] `order` (thank-you page with order lineItems)
- [ ] `contactPointEmail` (form submission on about page)
- [ ] `identity` (user login/signup)

**Content Zones:**

- [ ] `hero_banner` (home page)
- [ ] `recommendations_1` (home page)
- [ ] `recs_header` (plp header)
- [ ] `recs_featured` (plp grid)
- [ ] `recs_you_may_like` (pdp)
- [ ] `recs_frequently_bought` (pdp)
- [ ] `recs_upsell` (cart page)
- [ ] `recs_last_chance` (checkout page)

**Product Catalog Mapping (PDP):**

- [ ] `attributeProductName` → `#productName`
- [ ] `attributeProductSku` → query param `id`
- [ ] `attributeProductUrl` → dynamic URL builder
- [ ] `attributeProductImageUrl` → `#productImage` src attribute
- [ ] `attributeUnitPrice` → `#productPrice` (parsed from text)
- [ ] `attributeColor` → active color button class `.bg-blue-600`
- [ ] `attributeSize` → active size button class `.bg-blue-600`
- [ ] `attributeItemType` → `#breadcrumbCategory`
- [ ] `attributeInventory` → returns 1 (in stock)

**Order Capture (Thank-You Page):**

- [ ] Order ID extracted from `localStorage.vibeThreadLastOrder`
- [ ] Total value extracted and formatted as number
- [ ] Currency set to `USD`
- [ ] Line items mapped: productId, quantity, price

### Step 4: Save/Publish Configuration

1. After validation passes, click **"Save"** or **"Publish"**
2. You should see confirmation: **"Sitemap configuration activated"** or similar
3. Configuration is now **live** — your deployed site will use it

---

## POST-UPLOAD: End-to-End Testing

### Test Data Flow

1. **Deploy to Netlify** (if not already deployed)

   - Your site: `https://your-domain.netlify.app`

2. **Open Site with Debugger**

   - `https://your-domain.netlify.app/?debug-events`
   - Accept tracking consent when banner appears
   - Click **📊** button

3. **User Journey Test** (monitor debugger + Salesforce dashboard simultaneously)

   **Home Page:**

   - [ ] `page_view` event fires (eventType: "browse", pageName: "Home Page")
   - [ ] Check Salesforce Data Cloud **Event Viewer** → event appears within 30 sec
   - [ ] Event includes: sourcePageType, sourceChannel, sourceLocale

   **Product Page:**

   - Click a product link:
   - [ ] `select_item` event fires (eventType: "browse", catalogObject populated)
   - [ ] Land on PDP (`/product.html?id=X`):
   - [ ] `page_view` event fires (eventType: "catalog", catalogObject with product details)
   - [ ] Check Salesforce: product attributes (name, price, color, size) captured

   **Add to Cart:**

   - Click "Add to Cart" button:
   - [ ] `add_to_cart` event fires (shows lineItem with quantity, price)
   - [ ] Verify in Salesforce: itemized cart payload received

   **View Cart:**

   - Navigate to cart page:
   - [ ] `page_view` event fires (eventType: "cart")
   - [ ] `view_cart` event fires (shows orderValue, lineItems)

   **Checkout:**

   - Navigate to checkout page:
   - [ ] `page_view` event fires (eventType: "browse", sourcePageType: "checkout")
   - [ ] `begin_checkout` event fires

   **Order Confirmation:**

   - Complete order:
   - [ ] Redirect to thank-you page (`/thank-you.html`)
   - [ ] `page_view` event fires (eventType: "order")
   - [ ] `order_confirmation_view` event fires with:
     - [ ] Order ID populated
     - [ ] Total value (sum of all line items)
     - [ ] Line items array with productId, quantity, price
   - [ ] **Critical**: Check Salesforce Data Cloud that order event landed with full schema

   **User Login:**

   - On any page, go to account/login:
   - [ ] Enter email and password, click login
   - [ ] `login` event fires (eventType: "identity", email captured)
   - [ ] Verify in Salesforce: user profile enriched with identity attributes

---

## TROUBLESHOOTING

### Events Not Reaching Salesforce

**Problem:** Debugger shows events (any color) but Salesforce Data Cloud Event Viewer is empty

1. Check **SDK Beacon ID**:

   - Open page → Click **⚙** SDK Setup button (top-right)
   - Verify Beacon ID matches your Salesforce org
   - Default: `48cc94a2-0a94-43e1-b0af-46955055efa5`
   - You can customize via modal without editing HTML

2. Check **Network Tab** (DevTools):

   - Open DevTools → **Network** tab
   - Filter by: `c360a`
   - Perform an action (browse product)
   - Should see POST request to `https://cdn.c360a.salesforce.com/beacon/.../interactions`
   - Response should be 200 OK (not 401, 403, or error)

3. Check **Consent Status**:

   - Debugger header shows: **"Consent: ✓ accepted"** or **"✗ declined"**
   - If declined, events won't send to Salesforce (normal behavior)
   - User must click "Allow Tracking" on consent banner first

4. Check **Salesforce SDK Loading**:
   - In debugger header: **"SDK: ✓ loaded"** or **"✗ not ready"**
   - If "not ready": SDK script may have failed to load
   - Check browser console for Salesforce SDK errors

### Page Events Not Firing

**Problem:** Debugger shows no events at all

1. Check **Debugger Activation**:

   - URL must include `?debug-events` parameter
   - Example: `http://localhost:8000?debug-events`
   - Click **📊** button to open panel

2. Check **Consent Banner**:

   - First visit should show blue consent banner at top
   - Click "Allow Tracking" to enable event sending

3. Check **Browser Console**:
   - Open DevTools → **Console**
   - Look for errors in red
   - Check for blocked CORS requests to Salesforce CDN

### Product Details Not Capturing on PDP

**Problem:** Catalog object empty on product page

1. Verify **HTML selectors** match your DOM:

   - Right-click product name → **Inspect** → Find element ID
   - Should match `#productName` in sitemap (or update sitemap if different)
   - Same for `#productImage`, `#productPrice`, color/size buttons

2. Check **Product ID in URL**:

   - URL must include query param: `/product.html?id=XXXXX`
   - Debugger will show productId value

3. If selectors differ:
   - Update `updated_sitemap.js` with correct selector names
   - Upload new version to Salesforce
   - Publish and refresh site

### Order Not Capturing on Thank-You Page

**Problem:** Order event fires but lineItems empty or order ID missing

1. Verify **Order in localStorage**:

   - Open DevTools → **Application** → **Local Storage** → `vibeThreadLastOrder`
   - Should contain: `{"id": "ORDER-xxx", "total": 99.99, "items": [...]}`
   - If empty: check that checkout page saves order before redirect

2. Check **Order Schema**:
   - Each item in `items` array must have: `productId`, `quantity`, `price` (or `unitPrice`)
   - Mismatch will cause empty lineItems

---

## SUCCESS INDICATORS

✅ **All Green:**

- Events appear in debugger with **green dots**
- Network tab shows successful requests to `c360a`
- Salesforce Data Cloud Event Viewer shows all events
- Product attributes captured on PDP
- Order details captured on thank-you
- User identity captured on login

📊 **Ready for Personalization:**

- Next step: Create segments in Salesforce (e.g., "High-Value Shoppers", "Browsed but Not Bought")
- Create experiences (e.g., "Personalized PDP Recommendations", "Checkout Upsell")
- Test delivery in real browser

---

## Questions?

If events aren't flowing, check in this order:

1. **Debugger shows events?** → If no, check consent + SDK in debugger header
2. **Network shows c360a requests?** → If no, check SDK Beacon ID
3. **Salesforce Event Viewer empty?** → Check org permissions + data stream settings
4. **Selectors not finding elements?** → Inspect page DOM, update sitemap selectors
