# ⚡️💥 FAF Bar - Drop-in Code Library

## One-Line Embed (Stripe-Style)

### 🎯 Instant FAF Bar - Just Copy & Paste!

```html
<!-- FAF Bar - One Line Install -->
<script src="https://faf.one/bar.js" data-style="default"></script>
```

That's it! The script automatically injects the FAF Bar wherever you place it.

---

## 🎨 All Available Styles

### 1. **Default Bar** (Horizontal with labels)
```html
<div class="faf-bar-default">
  <a href="https://npmjs.com/package/faf-cli">🩵⚡️ CLI</a> •
  <a href="https://npmjs.com/package/claude-faf-mcp">🧡⚡️ MCP</a> •
  <a href="https://faf.one">💚⚡️ WEB</a> •
  <a href="https://fafdev.tools">🧰⚡️ DevOps</a> •
  <a href="https://faf.one/chrome">🖥️⚡️ Chrome</a>
</div>
```

### 2. **Compact Bar** (Just emojis)
```html
<div class="faf-bar-compact">
  <a href="https://npmjs.com/package/faf-cli" title="CLI">🩵⚡️</a>
  <a href="https://npmjs.com/package/claude-faf-mcp" title="MCP">🧡⚡️</a>
  <a href="https://faf.one" title="WEB">💚⚡️</a>
  <a href="https://fafdev.tools" title="DevOps">🧰⚡️</a>
  <a href="https://faf.one/chrome" title="Chrome">🖥️⚡️</a>
</div>
```

### 3. **Button Grid** (2x3 layout)
```html
<div class="faf-bar-grid">
  <a href="https://npmjs.com/package/faf-cli" class="faf-btn">
    <span>🩵⚡️</span>
    <small>CLI</small>
  </a>
  <a href="https://npmjs.com/package/claude-faf-mcp" class="faf-btn">
    <span>🧡⚡️</span>
    <small>MCP</small>
  </a>
  <a href="https://faf.one" class="faf-btn">
    <span>💚⚡️</span>
    <small>WEB</small>
  </a>
  <a href="https://fafdev.tools" class="faf-btn">
    <span>🧰⚡️</span>
    <small>DevOps</small>
  </a>
  <a href="https://faf.one/chrome" class="faf-btn">
    <span>🖥️⚡️</span>
    <small>Chrome</small>
  </a>
</div>
```

### 4. **Floating FAB** (Material Design style)
```html
<div class="faf-fab">
  <button class="faf-fab-trigger">⚡️</button>
  <div class="faf-fab-menu">
    <a href="https://npmjs.com/package/faf-cli">🩵⚡️</a>
    <a href="https://npmjs.com/package/claude-faf-mcp">🧡⚡️</a>
    <a href="https://faf.one">💚⚡️</a>
    <a href="https://fafdev.tools">🧰⚡️</a>
    <a href="https://faf.one/chrome">🖥️⚡️</a>
  </div>
</div>
```

### 5. **Vertical Stack** (Sidebar style)
```html
<div class="faf-bar-vertical">
  <a href="https://npmjs.com/package/faf-cli">
    <span>🩵⚡️</span> CLI
  </a>
  <a href="https://npmjs.com/package/claude-faf-mcp">
    <span>🧡⚡️</span> MCP
  </a>
  <a href="https://faf.one">
    <span>💚⚡️</span> WEB
  </a>
  <a href="https://fafdev.tools">
    <span>🧰⚡️</span> DevOps
  </a>
  <a href="https://faf.one/chrome">
    <span>🖥️⚡️</span> Chrome
  </a>
</div>
```

---

## 📦 Ready-to-Use Components

### React Component
```jsx
// Install: npm i @faf/react-bar
import { FafBar } from '@faf/react-bar';

// Use it anywhere
<FafBar style="default" />
<FafBar style="compact" />
<FafBar style="grid" />
<FafBar style="fab" />
<FafBar style="vertical" />
```

### Vue Component
```vue
<!-- Install: npm i @faf/vue-bar -->
<template>
  <faf-bar :style="'default'" />
</template>

<script>
import { FafBar } from '@faf/vue-bar';
</script>
```

### Svelte Component
```svelte
<!-- Install: npm i @faf/svelte-bar -->
<script>
  import FafBar from '@faf/svelte-bar';
</script>

<FafBar style="default" />
```

### Web Component (Works Everywhere!)
```html
<!-- No install needed! -->
<script type="module">
  import 'https://faf.one/components/faf-bar.js';
</script>

<faf-bar style="default"></faf-bar>
<faf-bar style="compact"></faf-bar>
<faf-bar style="grid"></faf-bar>
```

---

## 🎨 CSS-Only Versions (No JS needed!)

### Minimal CSS
```css
.faf-bar {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
}
.faf-bar a {
  text-decoration: none;
  transition: transform 0.2s;
}
.faf-bar a:hover {
  transform: scale(1.2);
}
```

### Advanced CSS with Animations
```css
@import url('https://faf.one/bar.css');

/* Includes:
   - All 5 style variations
   - Hover effects
   - Mobile responsive
   - Dark mode support
   - Accessibility features
*/
```

---

## 📋 Platform-Specific Embeds

### WordPress Shortcode
```php
// Add to functions.php
[faf_bar style="default"]
```

### GitHub README
```markdown
[![🩵⚡️](https://img.shields.io/badge/CLI-🩵⚡️-0CC0DF)](https://npmjs.com/package/faf-cli)
[![🧡⚡️](https://img.shields.io/badge/MCP-🧡⚡️-FF6B35)](https://npmjs.com/package/claude-faf-mcp)
[![💚⚡️](https://img.shields.io/badge/WEB-💚⚡️-00BF63)](https://faf.one)
[![🧰⚡️](https://img.shields.io/badge/DevOps-🧰⚡️-6B7280)](https://fafdev.tools)
[![🖥️⚡️](https://img.shields.io/badge/Chrome-🖥️⚡️-4285F4)](https://faf.one/chrome)
```

### Notion Embed
```
/embed https://faf.one/bar-widget
```

### Email Signature (Table layout for compatibility)
```html
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td><a href="https://npmjs.com/package/faf-cli">🩵⚡️</a></td>
    <td width="10">&nbsp;</td>
    <td><a href="https://npmjs.com/package/claude-faf-mcp">🧡⚡️</a></td>
    <td width="10">&nbsp;</td>
    <td><a href="https://faf.one">💚⚡️</a></td>
    <td width="10">&nbsp;</td>
    <td><a href="https://fafdev.tools">🧰⚡️</a></td>
    <td width="10">&nbsp;</td>
    <td><a href="https://faf.one/chrome">🖥️⚡️</a></td>
  </tr>
</table>
```

---

## 🚀 CDN Options

### jsDelivr (Fastest)
```html
<script src="https://cdn.jsdelivr.net/npm/@faf/bar@latest/dist/bar.min.js"></script>
```

### unpkg
```html
<script src="https://unpkg.com/@faf/bar@latest/dist/bar.min.js"></script>
```

### Direct from faf.one
```html
<script src="https://faf.one/bar.js"></script>
```

---

## ⚙️ Configuration Options

```html
<script src="https://faf.one/bar.js"
  data-style="compact"
  data-position="bottom-right"
  data-theme="dark"
  data-animate="true"
  data-delay="3000">
</script>
```

### Available Options:
- `data-style`: default | compact | grid | fab | vertical
- `data-position`: top | bottom | left | right | center
- `data-theme`: light | dark | auto
- `data-animate`: true | false
- `data-delay`: milliseconds before showing (0 = immediate)

---

## 📊 Analytics Tracking

```html
<script src="https://faf.one/bar.js"
  data-track="true"
  data-ga="UA-XXXXXXX"
  data-event="faf_bar_click">
</script>
```

Tracks:
- Which emoji clicked
- Conversion rate per component
- User journey through ecosystem

---

## 🎯 A/B Testing

```html
<!-- Test different styles -->
<script src="https://faf.one/bar.js"
  data-experiment="style-test"
  data-variants="default,compact,grid">
</script>
```

---

## 🔥 The "Stripe-Style" One-Liner

Just like Stripe's famous:
```html
<script src="https://js.stripe.com/v3/"></script>
```

We have:
```html
<script src="https://faf.one/bar.js"></script>
```

**That's all you need!** The script:
1. Auto-detects best position
2. Chooses style based on your site
3. Handles all click tracking
4. Works on mobile/desktop
5. Supports dark mode
6. Zero configuration needed

---

## 💡 Pro Tips

1. **For blogs**: Use `compact` style in header
2. **For docs**: Use `vertical` in sidebar
3. **For landing pages**: Use `grid` above fold
4. **For apps**: Use `fab` floating button
5. **For emails**: Use table-based HTML

---

**🏎️⚡️ The FAF Bar - Easier than Stripe, Faster than a Funnel!**

*Copy, paste, convert. That's it.*