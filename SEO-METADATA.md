# SEO and Search Engine Indexing Guide for FAF

## Google Search Console Issues

### Current Problem
- URL: https://www.faf.one/
- Status: Google reports "doesn't exist" despite site being live
- Likely causes: New domain, DNS propagation, or missing verification

### Recommended Actions

1. **Google Search Console Verification**
   ```
   - Add property in Google Search Console
   - Verify ownership via DNS TXT record or HTML file
   - Submit sitemap.xml
   - Request indexing manually
   ```

2. **Meta Tags for Homepage**
   ```html
   <meta name="description" content="Foundational AI-context Format (.faf) - The universal context protocol for AI coding assistants. AI needed a format, it got one.">
   <meta name="keywords" content="faf, foundational ai-context format, ai coding, claude.md, ai context, developer tools">
   <meta property="og:title" content="FAF - Foundational AI-context Format">
   <meta property="og:description" content="Universal context format for Anthropic Claude, OpenAI ChatGPT, Google Gemini, GitHub Copilot, and all AI coding tools">
   <meta property="og:url" content="https://www.faf.one/">
   <meta property="og:type" content="website">
   ```

3. **Schema.org Structured Data**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "FAF CLI",
     "applicationCategory": "DeveloperApplication",
     "operatingSystem": "Windows, macOS, Linux",
     "offers": {
       "@type": "Offer",
       "price": "0",
       "priceCurrency": "USD"
     },
     "description": "Foundational AI-context Format - Universal context for AI development",
     "url": "https://www.faf.one/",
     "downloadUrl": "https://www.npmjs.com/package/@faf/cli",
     "softwareVersion": "2.0.0"
   }
   ```

4. **Sitemap.xml Content**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://www.faf.one/</loc>
       <lastmod>2025-01-20</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>https://www.faf.one/docs</loc>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>https://www.faf.one/vibe</loc>
       <priority>0.8</priority>
     </url>
   </urlset>
   ```

5. **Alternative Indexing Strategies**
   - Submit to Bing Webmaster Tools
   - Add to DuckDuckGo
   - Submit to Yahoo Search
   - Create Wikipedia draft article
   - Academic paper repositories (arXiv, etc.)

## Search Query Targets

Primary queries to rank for:
- "faf format"
- "foundational ai context format"
- "claude.md alternative"
- "universal ai context"
- "ai coding context format"
- ".faf file"

## Backlink Strategy

1. **GitHub**: Ensure README has proper links
2. **npm**: Package page with full description
3. **Dev.to**: Technical article about FAF
4. **Hacker News**: Launch announcement
5. **Product Hunt**: Developer tools category
6. **Reddit**: r/programming, r/artificial

## Content for Google Knowledge Graph

**Entity Type:** Software/File Format
**Name:** Foundational AI-context Format
**Extension:** .faf
**MIME Type:** application/x-faf+yaml
**Developer:** .faf Development Team
**Initial Release:** 2025
**License:** MIT
**Purpose:** Universal context format for AI coding assistants
**Tagline:** "AI needed a format, it got one-- .faf"