# FAF CLI Releases Feed

**Automated release data for faf.one and third-party integrations**

## What is this?

`releases.json` is automatically updated by GitHub Actions whenever a new release is published. It contains structured release data that can be consumed by:

- faf.one updates page
- RSS feeds
- Third-party sites
- Developer tools
- Integration dashboards

## JSON Structure

```json
[
  {
    "version": "v3.1.3",
    "name": "Discord Community Launch",
    "date": "2025-11-07",
    "timestamp": "2025-11-07T23:30:00.000Z",
    "prerelease": false,
    "changelog": "- Added Discord community...",
    "urls": {
      "github": "https://github.com/Wolfe-Jam/faf-cli/releases/tag/v3.1.3",
      "npm": "https://www.npmjs.com/package/faf-cli/v/v3.1.3",
      "discord": "https://discord.com/invite/56fPBUJKfk"
    },
    "install": {
      "npm": "npm install -g faf-cli@v3.1.3",
      "brew": "brew install faf-cli"
    }
  }
]
```

**Newest releases first** - Array is prepended on each release.

## How to Use

### Direct URL (GitHub Raw)
```
https://raw.githubusercontent.com/Wolfe-Jam/faf-cli/main/website/releases.json
```

### JavaScript Fetch
```javascript
fetch('https://raw.githubusercontent.com/Wolfe-Jam/faf-cli/main/website/releases.json')
  .then(res => res.json())
  .then(releases => {
    const latest = releases[0];
    console.log(`Latest: ${latest.version} - ${latest.name}`);
  });
```

### faf.one Integration
The JSON can be fetched client-side or at build time (Next.js ISR):

```jsx
// app/updates/page.tsx
export async function generateStaticParams() {
  const res = await fetch('https://raw.githubusercontent.com/Wolfe-Jam/faf-cli/main/website/releases.json');
  const releases = await res.json();
  return { releases };
}
```

### RSS Feed Generation
```javascript
const releases = await fetch(RELEASES_URL).then(r => r.json());
const rss = generateRSS(releases); // Convert to RSS 2.0 format
```

### Vercel Edge Config (Advanced)
For ultra-fast access, sync releases.json to Vercel Edge Config:
```bash
vercel edge-config create faf-releases
vercel edge-config item add releases "$(cat website/releases.json)"
```

## Example Consumer

See `example-consumer.html` for a standalone HTML page that renders the releases feed.

Open it in a browser to preview how faf.one could display releases.

## Automation

This file is updated automatically by:
`.github/workflows/discord-release-announcement.yml`

**Workflow:**
1. GitHub Release published
2. Discord announcement sent
3. releases.json prepended with new release
4. Committed and pushed by `github-actions[bot]`

## CORS

GitHub raw URLs support CORS, so this JSON can be fetched from any domain.

## Git History

Each release creates a git commit:
```
chore: add v3.1.3 to releases.json

Release: Discord Community Launch
Date: 2025-11-07
Automated by GitHub Actions
```

**Audit trail:** Every release is version-controlled.

## Future Enhancements

- **Vercel deployment:** Host on faf.one for custom domain
- **RSS feed:** Auto-generate `/updates.rss`
- **X/LinkedIn:** Additional adapters for social posts
- **Email:** Mailchimp/ConvertKit integration
- **Webhooks:** Notify third-party services

---

**Championship-grade release distribution. Single source, multiple channels.** 🏎️⚡️
