# 🚨 SUBMIT TO GOOGLE NOW - Step-by-Step Actions

## Step 1: Open Google Search Console
**Go to:** https://search.google.com/search-console

---

## Step 2: Add First Property (faf.one)

1. Click **"Add property"**
2. Choose **"Domain"** (not URL prefix)
3. Enter: `faf.one`
4. Click **Continue**

### DNS Verification for faf.one:
You'll see a TXT record like:
```
google-site-verification=xxxxxxxxxxxxx
```

**Add this TXT record to your DNS:**
- Host: `@` or leave blank
- Type: `TXT`
- Value: `google-site-verification=xxxxxxxxxxxxx`

5. Click **"Verify"** (may take a few minutes)

---

## Step 3: Add Second Property (fafcli.dev)

1. Click **"Add property"** again
2. Choose **"Domain"**
3. Enter: `fafcli.dev`
4. Add the new TXT record to fafcli.dev DNS
5. Click **"Verify"**

---

## Step 4: Add Third Property (fafdev.tools)

1. Click **"Add property"** again
2. Choose **"Domain"**
3. Enter: `fafdev.tools`
4. Add the new TXT record to fafdev.tools DNS
5. Click **"Verify"**

---

## Step 5: Submit Sitemaps (for each domain)

For **faf.one**:
1. Go to **Sitemaps** in left menu
2. Enter: `sitemap.xml`
3. Click **Submit**

*Repeat for fafcli.dev and fafdev.tools*

---

## Step 6: Request Indexing (CRITICAL!)

For each domain:
1. Go to **URL Inspection**
2. Enter the homepage URL:
   - `https://faf.one`
   - `https://fafcli.dev`
   - `https://fafdev.tools`
3. Click **"Request Indexing"**
4. Wait for confirmation

---

## Step 7: Ping Google Directly (BONUS)

Open these URLs in your browser:

```
https://www.google.com/ping?sitemap=https://faf.one/sitemap.xml
https://www.google.com/ping?sitemap=https://fafcli.dev/sitemap.xml
https://www.google.com/ping?sitemap=https://fafdev.tools/sitemap.xml
```

---

## Step 8: Add to Bing Too (While We're At It)

**Go to:** https://www.bing.com/webmasters/

1. Sign in with Microsoft account
2. Import from Google Search Console (easiest!)
3. Or add manually like above

---

## QUICK CHECKLIST:

### For faf.one:
□ Added to Search Console
□ DNS verified
□ Sitemap submitted
□ Homepage indexed
□ Pinged Google

### For fafcli.dev:
□ Added to Search Console
□ DNS verified
□ Sitemap submitted
□ Homepage indexed
□ Pinged Google

### For fafdev.tools:
□ Added to Search Console
□ DNS verified
□ Sitemap submitted
□ Homepage indexed
□ Pinged Google

---

## DNS PROVIDERS QUICK GUIDE:

### If using Cloudflare:
1. Go to DNS settings
2. Add record → Type: TXT
3. Name: @ 
4. Content: google-site-verification=xxx
5. Save

### If using GoDaddy:
1. DNS Management
2. Add → TXT
3. Host: @
4. Value: google-site-verification=xxx
5. Save

### If using Namecheap:
1. Advanced DNS
2. Add New Record → TXT Record
3. Host: @
4. Value: google-site-verification=xxx
5. Save

---

## VERIFICATION ISSUES?

If verification fails:
1. Wait 5 minutes (DNS propagation)
2. Try again
3. Check DNS with: `nslookup -type=txt faf.one`
4. Should see your google-site-verification record

---

## AFTER VERIFICATION:

### Check Coverage:
1. Go to **Coverage** report
2. See indexed pages
3. Fix any errors shown

### Submit More URLs:
1. Use **URL Inspection**
2. Enter important pages:
   - /specification
   - /install
   - /docs
3. Request indexing for each

---

## SUCCESS INDICATORS:

✅ "Ownership verified" message
✅ Sitemaps show "Success" status
✅ URL inspection shows "URL is on Google"
✅ Coverage report starts populating (24-48h)

---

## TEST YOUR SUCCESS:

In 24-48 hours, search:
```
site:faf.one
site:fafcli.dev
site:fafdev.tools
```

You should see your pages!

---

**DO THIS NOW!** Open https://search.google.com/search-console and start with Step 2! 🚀