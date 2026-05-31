# VibeThread → Netlify Deployment Guide

## Step 1: Connect GitHub to Netlify

1. Go to **[netlify.com](https://netlify.com)** → Sign in (create account if needed)
2. Click **"New site from Git"** or **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → Authorize Netlify access to your repos
4. Choose repository: **saimanikantaforcg/vibethread**
5. Configure build settings:
   - **Base directory**: (leave blank)
   - **Build command**: (leave blank — we serve static files)
   - **Publish directory**: `site/`
6. Click **"Deploy site"**

Netlify will auto-deploy whenever you push to `main` branch.

---

## Step 2: Get Your Netlify Domain

After deployment completes (~2-5 min):

- You'll see a domain like: `https://vibethread-xxx.netlify.app` or `https://your-custom-name.netlify.app`
- Copy this URL — you'll need it for the next step

**Optional: Use Custom Domain**

- Go to **Site settings** → **Domain management** → **Add custom domain**
- Point your DNS records to Netlify (they'll show exact settings)

---

## Step 3: Update robots.txt & sitemap.xml

Your deployment domain is now live, but you need to update SEO files with the real URL.

### Edit `/site/robots.txt`:

```
User-agent: *
Allow: /
Allow: /index.html
Allow: /categories.html
Allow: /product.html
Allow: /about.html

Disallow: /cart.html
Disallow: /checkout.html
Disallow: /account.html
Disallow: /thank-you.html

Sitemap: https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/sitemap.xml
```

Replace `YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app` with your real Netlify domain.

### Edit `/site/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/categories.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/product.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/about.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app/login.html</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
```

Replace `YOUR-ACTUAL-NETLIFY-DOMAIN.netlify.app` with your real Netlify domain.

---

## Step 4: Commit & Push to GitHub

```bash
# After editing robots.txt and sitemap.xml locally:
git add site/robots.txt site/sitemap.xml
git commit -m "Update domain URLs for Netlify deployment"
git push origin main
```

Netlify auto-redeploys when you push (watch **Deployments** tab).

---

## Step 5: Verify Deployment

1. Visit your Netlify domain in browser: `https://your-site.netlify.app/`
2. Open DevTools → **Network** tab
3. Filter: `c360a` (to see Salesforce SDK calls)
4. Browse a product, add to cart → check Network tab for SDK requests
5. Open with `?debug-events` param to test event debugger:
   - `https://your-site.netlify.app/?debug-events`
   - Click **📊** button to see event stream

---

## Step 6: Verify robots.txt & sitemap.xml

- `https://your-site.netlify.app/robots.txt` (should show correct Sitemap URL)
- `https://your-site.netlify.app/sitemap.xml` (should show all URLs with your domain)

Submit sitemap to Google Search Console if you want SEO indexing.

---

## Netlify Build Logs

If deployment fails, check **Deployments** → **Build log**:

- Most common issue: wrong **Publish directory** (should be `site/`)
- Check the build log for TypeScript/Node errors

---

## Security Headers Already In Place

Netlify `netlify.toml` includes:

- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Content-Security-Policy with Salesforce CDN allowlist
- ✅ Cache rules: HTML no-cache, assets 1 year

---

## Salesforce Data Cloud Integration

After deployment:

1. Your site is now collecting events and sending to Salesforce (with user consent)
2. Next: Upload `site/js/updated_sitemap.js` to Salesforce Data Cloud
3. See **SALESFORCE_VALIDATION_CHECKLIST.md** for next steps
