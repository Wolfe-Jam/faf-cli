# Google Search Console Submission Package

## Three Domains to Submit:
1. **faf.one** - Main hub site
2. **fafcli.dev** - CLI documentation site
3. **fafdev.tools** - Developer tools site

## 1. SITEMAP FILES (sitemap.xml)

### For faf.one/sitemap.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://faf.one/</loc>
    <lastmod>2025-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://faf.one/specification</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://faf.one/install</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://faf.one/docs</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

### For fafcli.dev/sitemap.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fafcli.dev/</loc>
    <lastmod>2025-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fafcli.dev/commands</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fafcli.dev/api</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

### For fafdev.tools/sitemap.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fafdev.tools/</loc>
    <lastmod>2025-09-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fafdev.tools/playground</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://fafdev.tools/validator</loc>
    <lastmod>2025-09-20</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
```

## 2. ROBOTS.TXT FILES

### For all three sites (robots.txt):
```
User-agent: *
Allow: /

# Google specific
User-agent: Googlebot
Allow: /

Sitemap: https://faf.one/sitemap.xml
Sitemap: https://fafcli.dev/sitemap.xml
Sitemap: https://fafdev.tools/sitemap.xml
```

## 3. META TAGS (Add to <head> section)

### For faf.one:
```html
<!-- Primary Meta Tags -->
<title>.faf - Foundational AI-context Format | AI needed a format, it got one</title>
<meta name="title" content=".faf - Foundational AI-context Format | AI needed a format, it got one">
<meta name="description" content="Universal, shareable AI-context for any AI, human or team, regardless of size, location, languages, stack, setup or documentation. Works with Claude, ChatGPT, Gemini, and all AI tools.">
<meta name="keywords" content="faf, .faf, ai context, ai format, foundational ai-context format, claude, chatgpt, gemini, ai tools, universal context">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://faf.one/">
<meta property="og:title" content=".faf - Foundational AI-context Format">
<meta property="og:description" content="Universal, shareable AI-context for any AI, human or team, regardless of size, location, languages, stack, setup or documentation.">
<meta property="og:image" content="https://faf.one/assets/faf-chaos-to-clarity.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://faf.one/">
<meta property="twitter:title" content=".faf - Foundational AI-context Format">
<meta property="twitter:description" content="AI needed a format, it got one— .faf. Universal context for any AI tool.">
<meta property="twitter:image" content="https://faf.one/assets/faf-chaos-to-clarity.png">

<!-- Google Verification (add your code) -->
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" />
```

### For fafcli.dev:
```html
<title>FAF CLI - Command Line Tool for .faf Format</title>
<meta name="description" content="Official CLI for .faf (Foundational AI-context Format). Install with npm: @faf/cli. Context-on-demand in <30ms.">
<meta name="keywords" content="faf cli, faf command line, npm @faf/cli, ai context cli, faf tools">
<meta property="og:url" content="https://fafcli.dev/">
<meta property="og:title" content="FAF CLI - Official Command Line Tool">
<meta property="og:description" content="Install: npm install -g @faf/cli. Context-on-demand for AI development.">
```

### For fafdev.tools:
```html
<title>FAF Developer Tools - .faf Format Utilities</title>
<meta name="description" content="Developer tools for .faf (Foundational AI-context Format). Validators, playground, and integration tools for AI-context management.">
<meta name="keywords" content="faf developer tools, faf validator, faf playground, ai context tools">
<meta property="og:url" content="https://fafdev.tools/">
<meta property="og:title" content="FAF Developer Tools">
<meta property="og:description" content="Tools and utilities for working with .faf format. Validators, playground, and more.">
```

## 4. STRUCTURED DATA (JSON-LD)

Add to all three sites:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": ".faf - Foundational AI-context Format",
  "description": "Universal, shareable AI-context for any AI, human or team, regardless of size, location, languages, stack, setup or documentation.",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "FAF Project"
  },
  "datePublished": "2025-09-20",
  "softwareVersion": "2.0.0",
  "keywords": "faf, ai-context, ai format, claude, chatgpt, gemini",
  "url": "https://faf.one",
  "sameAs": [
    "https://github.com/Wolfe-Jam/faf",
    "https://www.npmjs.com/package/@faf/cli",
    "https://fafcli.dev",
    "https://fafdev.tools"
  ]
}
</script>
```

## 5. GOOGLE SEARCH CONSOLE SUBMISSION STEPS

### Step 1: Add All Properties
1. Go to: https://search.google.com/search-console
2. Click "Add Property"
3. Choose "Domain" type
4. Enter each domain:
   - faf.one
   - fafcli.dev
   - fafdev.tools

### Step 2: Verify Ownership (DNS Method)
Add TXT record to each domain's DNS:
```
TXT google-site-verification=YOUR_VERIFICATION_CODE
```

### Step 3: Submit Sitemaps
For each verified property:
1. Go to "Sitemaps" in left menu
2. Enter: sitemap.xml
3. Click "Submit"

### Step 4: Request Indexing
1. Use "URL Inspection" tool
2. Enter each URL:
   - https://faf.one/
   - https://fafcli.dev/
   - https://fafdev.tools/
3. Click "Request Indexing"

### Step 5: Submit to Google Directly
Ping Google with sitemaps:
```bash
curl "https://www.google.com/ping?sitemap=https://faf.one/sitemap.xml"
curl "https://www.google.com/ping?sitemap=https://fafcli.dev/sitemap.xml"
curl "https://www.google.com/ping?sitemap=https://fafdev.tools/sitemap.xml"
```

## 6. BACKLINK STRATEGY

### Immediate Actions:
1. **GitHub**: Update all repos with links to all three sites
2. **npm**: Update @faf/cli package with all three URLs
3. **Cross-link**: Each site should link to the other two

### Cross-linking HTML:
```html
<!-- Add to footer of each site -->
<div class="faf-network">
  <h4>FAF Network</h4>
  <a href="https://faf.one">faf.one - Main Hub</a>
  <a href="https://fafcli.dev">fafcli.dev - CLI Docs</a>
  <a href="https://fafdev.tools">fafdev.tools - Dev Tools</a>
</div>
```

## 7. CONTENT REQUIREMENTS

Each site needs:
- Minimum 300 words of unique content
- The official .faf definition prominently displayed
- Clear navigation structure
- Mobile-responsive design
- Fast loading (< 3 seconds)

## 8. MONITORING

Check indexing status:
```
site:faf.one
site:fafcli.dev
site:fafdev.tools
```

## IMMEDIATE ACTIONS:

1. **NOW**: Add meta tags and structured data to all three sites
2. **NOW**: Create and upload sitemap.xml to each site
3. **NOW**: Create and upload robots.txt to each site
4. **NOW**: Go to Google Search Console and add all three properties
5. **TODAY**: Verify ownership via DNS
6. **TODAY**: Submit sitemaps
7. **TODAY**: Request indexing for homepage of each site
8. **TOMORROW**: Check indexing status

## Expected Timeline:
- 24-48 hours: Google discovers sites
- 3-7 days: Initial indexing
- 2-4 weeks: Full indexing

---

**IMPORTANT**: The .faf definition MUST appear on all three sites:
"Universal, shareable AI-context for any AI, human or team, regardless of size, location, languages, stack, setup or documentation."

**TAGLINE**: "AI needed a format, it got one— .faf"