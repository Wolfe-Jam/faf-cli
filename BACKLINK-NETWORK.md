# FAF Backlink Network Strategy

## Core Network (The Triangle of Trust)

```
       faf.one (HUB)
          /  \
         /    \
        /      \
fafcli.dev -- fafdev.tools
```

Each site links to the other two = 6 strong internal links

## 1. FOOTER COMPONENT (Add to all 3 sites)

```html
<!-- FAF Network Footer - Add to every page -->
<footer class="faf-network">
  <div class="faf-ecosystem">
    <h3>.faf Ecosystem</h3>
    <div class="faf-sites">
      <a href="https://faf.one" title=".faf Format Specification">
        <strong>faf.one</strong>
        <span>Format Specification & Hub</span>
      </a>
      <a href="https://fafcli.dev" title="FAF CLI Documentation">
        <strong>fafcli.dev</strong>
        <span>CLI Documentation & Commands</span>
      </a>
      <a href="https://fafdev.tools" title="FAF Developer Tools">
        <strong>fafdev.tools</strong>
        <span>Playground & Validators</span>
      </a>
    </div>
    <div class="faf-external">
      <a href="https://github.com/Wolfe-Jam/faf" rel="external">GitHub</a>
      <a href="https://www.npmjs.com/package/@faf/cli" rel="external">npm</a>
    </div>
  </div>
</footer>
```

## 2. HEADER NAV (Add to all 3 sites)

```html
<!-- Primary Navigation with Network Links -->
<nav class="main-nav">
  <div class="nav-links">
    <a href="/" class="home">Home</a>
    <!-- Site-specific links here -->
    <div class="network-dropdown">
      <button>FAF Network ▼</button>
      <div class="dropdown-content">
        <a href="https://faf.one">.faf Specification</a>
        <a href="https://fafcli.dev">CLI Docs</a>
        <a href="https://fafdev.tools">Dev Tools</a>
      </div>
    </div>
  </div>
</nav>
```

## 3. CONTEXTUAL INLINE LINKS

### For faf.one homepage:
```html
<p>Install the <a href="https://fafcli.dev">official CLI</a> with npm:</p>
<code>npm install -g @faf/cli</code>

<p>Try your .faf file in our <a href="https://fafdev.tools/playground">interactive playground</a></p>

<p>Validate your format with the <a href="https://fafdev.tools/validator">online validator</a></p>
```

### For fafcli.dev:
```html
<p>Learn about the <a href="https://faf.one/specification">.faf format specification</a></p>

<p>The CLI implements the official <a href="https://faf.one">.faf standard</a></p>

<p>Test your commands in the <a href="https://fafdev.tools/playground">web playground</a></p>
```

### For fafdev.tools:
```html
<p>Based on the official <a href="https://faf.one/specification">.faf specification</a></p>

<p>Install the <a href="https://fafcli.dev">command-line interface</a> for local development</p>

<p>View the complete <a href="https://faf.one">format documentation</a></p>
```

## 4. GITHUB BACKLINKS

### Update README.md in faf repo:
```markdown
## Official Resources

- **🌐 Main Hub**: [faf.one](https://faf.one) - Format specification and documentation
- **💻 CLI Docs**: [fafcli.dev](https://fafcli.dev) - Command-line interface documentation
- **🛠 Dev Tools**: [fafdev.tools](https://fafdev.tools) - Online playground and validators
- **📦 npm Package**: [@faf/cli](https://www.npmjs.com/package/@faf/cli)
```

## 5. NPM PACKAGE BACKLINKS

### Update package.json:
```json
{
  "homepage": "https://faf.one",
  "repository": {
    "type": "git",
    "url": "https://github.com/Wolfe-Jam/faf"
  },
  "bugs": {
    "url": "https://github.com/Wolfe-Jam/faf/issues"
  },
  "links": {
    "specification": "https://faf.one",
    "documentation": "https://fafcli.dev",
    "tools": "https://fafdev.tools"
  }
}
```

### Update npm README:
```markdown
## Resources

- 📖 [Format Specification](https://faf.one)
- 📚 [CLI Documentation](https://fafcli.dev)
- 🎮 [Interactive Playground](https://fafdev.tools)
- 💬 [GitHub Discussions](https://github.com/Wolfe-Jam/faf/discussions)
```

## 6. CROSS-DOMAIN SITEMAP REFERENCES

### In each sitemap.xml, add:
```xml
<!-- Cross-reference other sitemaps -->
<sitemap>
  <loc>https://faf.one/sitemap.xml</loc>
</sitemap>
<sitemap>
  <loc>https://fafcli.dev/sitemap.xml</loc>
</sitemap>
<sitemap>
  <loc>https://fafdev.tools/sitemap.xml</loc>
</sitemap>
```

## 7. CANONICAL URLS

### For duplicate content, use canonical tags:
```html
<!-- If .faf specification appears on multiple sites -->
<link rel="canonical" href="https://faf.one/specification" />
```

## 8. SOCIAL MEDIA BACKLINKS

### Twitter/X Bio:
```
.faf - AI needed a format, it got one
🔗 faf.one | fafcli.dev | fafdev.tools
```

### LinkedIn:
```
Foundational AI-context Format (.faf)
Official Sites:
• Specification: faf.one
• CLI Docs: fafcli.dev  
• Dev Tools: fafdev.tools
```

## 9. DEV COMMUNITY BACKLINKS

### Dev.to Article Footer:
```markdown
---

## Learn More

- **Official Site**: [faf.one](https://faf.one)
- **CLI Documentation**: [fafcli.dev](https://fafcli.dev)
- **Try It Online**: [fafdev.tools](https://fafdev.tools)
- **GitHub**: [Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
- **npm**: [@faf/cli](https://www.npmjs.com/package/@faf/cli)
```

### Hacker News:
```
Show HN: .faf - Universal AI-context format (faf.one)
CLI docs at fafcli.dev, playground at fafdev.tools
```

## 10. DOCUMENTATION CROSS-REFERENCES

### Every documentation page should include:
```html
<div class="doc-footer">
  <h4>Related Resources</h4>
  <ul>
    <li><a href="https://faf.one/specification">Format Specification</a></li>
    <li><a href="https://fafcli.dev/commands">CLI Commands</a></li>
    <li><a href="https://fafdev.tools/validator">Online Validator</a></li>
  </ul>
</div>
```

## 11. API DOCUMENTATION LINKS

```javascript
// In API responses, include links
{
  "format": ".faf",
  "version": "2.0.0",
  "_links": {
    "specification": "https://faf.one/specification",
    "cli": "https://fafcli.dev",
    "tools": "https://fafdev.tools",
    "github": "https://github.com/Wolfe-Jam/faf"
  }
}
```

## 12. PRESS RELEASE BACKLINKS

In all press releases:
```markdown
## Official Resources

The .faf format and tools are available at:
- Specification: [faf.one](https://faf.one)
- CLI Documentation: [fafcli.dev](https://fafcli.dev)
- Developer Tools: [fafdev.tools](https://fafdev.tools)
- GitHub: [github.com/Wolfe-Jam/faf](https://github.com/Wolfe-Jam/faf)
- npm: [@faf/cli](https://www.npmjs.com/package/@faf/cli)
```

## IMMEDIATE BACKLINK ACTIONS:

1. **NOW**: Add footer to all 3 sites with cross-links
2. **NOW**: Update GitHub README with all 3 URLs
3. **NOW**: Update npm package.json with links
4. **TODAY**: Add contextual inline links in content
5. **TODAY**: Submit all to Google Search Console
6. **THIS WEEK**: Post on Dev.to with backlinks
7. **THIS WEEK**: Update social media profiles

## BACKLINK QUALITY CHECKLIST:

✅ Use descriptive anchor text (not "click here")
✅ Mix follow and nofollow appropriately
✅ Include title attributes for accessibility
✅ Ensure all links are HTTPS
✅ Test all links work (no 404s)
✅ Use both domain and deep links
✅ Natural placement in content

## MONITORING:

```bash
# Check backlinks after 1 week
link:faf.one
link:fafcli.dev
link:fafdev.tools

# Check cross-indexing
site:faf.one "fafcli.dev"
site:fafcli.dev "faf.one"
site:fafdev.tools "faf.one"
```

## THE POWER MOVE:

Create a "Network Status" page on each site showing all three sites are connected:

```html
<!-- network-status.html on each site -->
<div class="network-status">
  <h1>FAF Network Status</h1>
  <div class="site-grid">
    <div class="site-card">
      <h2>faf.one</h2>
      <span class="status green">● Active</span>
      <a href="https://faf.one">Visit Hub</a>
    </div>
    <div class="site-card">
      <h2>fafcli.dev</h2>
      <span class="status green">● Active</span>
      <a href="https://fafcli.dev">Visit CLI Docs</a>
    </div>
    <div class="site-card">
      <h2>fafdev.tools</h2>
      <span class="status green">● Active</span>
      <a href="https://fafdev.tools">Visit Tools</a>
    </div>
  </div>
</div>
```

This creates a strong web of trust that Google will recognize! 🕸️