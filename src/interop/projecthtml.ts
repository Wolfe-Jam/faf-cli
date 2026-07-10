import { writeFileSync } from 'fs';
import { join } from 'path';
import type { FafData, ScoreResult } from '../core/types.js';
import { FAF_HEX } from '../ui/colors.js';

/**
 * project.html — the visual render of project.faf.
 *
 * A "show-me" for .faf: rendered from the current project.faf, opens in any
 * browser, zero deps, self-contained. NOT a format, NOT a mime-type, NOT an
 * IANA application — a derived view that registers nothing and adds zero spec
 * surface. The inverse of style-source.html (that one is authored; this is
 * rendered). Deterministic on purpose: no timestamps, so a regenerate only
 * diffs when project.faf actually changed (versioned like .fafb).
 *
 * Humans like visuals. We gave them one.
 */

// Tier glyph + accent. Glyphs = canonical tier symbols (core/tiers.ts).
// BRAND colors DERIVE from ui/colors.ts FAF_HEX (single source — change there,
// propagates to CLI + here). STATUS colors are canon-sourced from
// PLANET-FAF/website-docs/FAF-BRAND-STYLE-GUIDE.md (--faf-warning/--faf-error).
// Two registers: brand (orange Trophy/Gold · cyan Silver · deep-cyan Bronze)
// + status (HTML affords color the CLI can't). Green #00BF63 reserved for the
// GO/✅ all-pass state, never a tier band. Neutral = theme grey, not brand.
const ORANGE = FAF_HEX.orange; // brand — derived
const CYAN = FAF_HEX.cyan; // brand — derived (Silver)
const CYAN_DEEP = FAF_HEX.cyanDeep; // brand — derived (Bronze: same lane, one rung down)
const WARNING = '#FF9500'; // --faf-warning (status: caution)
const ERROR = '#FF3B30'; // --faf-error (status: danger)
const NEUTRAL_BRIGHT = '#E6EDF3'; // theme grey — "good, not done, no alarm"
const NEUTRAL_DIM = '#6E7681'; // theme grey — empty
const TIER_VIS: Record<string, { glyph: string; color: string }> = {
  TROPHY: { glyph: '🏆', color: ORANGE },
  GOLD: { glyph: '★', color: ORANGE },
  SILVER: { glyph: '◆', color: CYAN },
  BRONZE: { glyph: '◇', color: CYAN_DEEP },
  GREEN: { glyph: '●', color: NEUTRAL_BRIGHT },
  YELLOW: { glyph: '●', color: WARNING },
  RED: { glyph: '○', color: ERROR },
  WHITE: { glyph: '♡', color: NEUTRAL_DIM },
};

/** HTML-escape — project.faf content is arbitrary; never inject raw. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SIX_W = ['who', 'what', 'why', 'where', 'when', 'how'] as const;

function rows(entries: [string, unknown][]): string {
  return entries
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(
      ([k, v]) =>
        `<div class="row"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`,
    )
    .join('\n');
}

/** Render project.faf data + its score into a self-contained HTML string. */
export function generateProjectHtml(
  data: FafData,
  result: ScoreResult,
  fafPath = 'project.faf',
): string {
  const name = esc(data.project?.name ?? 'Project');
  const tierName = result.tier?.name ?? 'WHITE';
  const vis = TIER_VIS[tierName] ?? TIER_VIS.WHITE;
  const scoreText = result.inherited
    ? result.represents
      ? `inherited from ${esc(result.represents)}`
      : 'inherited'
    : `${result.score}%`;
  // Trophy = earned (not an About-repo inherited 100 — that one displays, doesn't earn).
  const isTrophy = tierName === 'TROPHY' && !result.inherited;

  // 6 W's first, in canonical order, then any other human_context keys.
  const hc = data.human_context ?? {};
  const sixW: [string, unknown][] = SIX_W.map((w) => [w, hc[w]]);
  const otherHc = Object.entries(hc).filter(
    ([k]) => !SIX_W.includes(k as (typeof SIX_W)[number]),
  );

  const projectMeta: [string, unknown][] = [
    ['goal', data.project?.goal],
    ['main_language', data.project?.main_language],
    ['type', data.project?.type],
    ['framework', (data.project as Record<string, unknown> | undefined)?.framework],
    ['faf_version', data.faf_version],
  ];

  const stackEntries = Object.entries(data.stack ?? {});
  const stackActive = stackEntries.filter(
    ([, v]) => v && v !== 'slotignored' && String(v).trim() !== '',
  );
  const stackIgnored = stackEntries.filter(([, v]) => v === 'slotignored').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — project.faf</title>
<meta name="description" content="Visual render of project.faf. Authored by faf — humans like visuals, we gave them one.">
<meta name="robots" content="index,follow">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#0a0a0a;color:#e6edf3;line-height:1.55;padding:48px 20px}
.wrap{max-width:880px;margin:0 auto}
.bar{height:3px;border-radius:2px;background:linear-gradient(90deg,transparent,${vis.color},transparent);margin-bottom:40px}
header{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:8px}
h1{font-size:2.2rem;font-weight:800;letter-spacing:-1px}
.badge{font-size:1.05rem;font-weight:800;color:${vis.color};white-space:nowrap}
.score{font-size:1.05rem;font-weight:700;color:#8b949e}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6e7681;margin-bottom:36px}
section{margin-bottom:34px}
h2{font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${vis.color};margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.07)}
.row{display:flex;gap:18px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.k{flex:0 0 150px;color:#8b949e;font-size:.9rem;text-transform:capitalize}
.v{flex:1;color:#e6edf3;font-size:.95rem;word-break:break-word}
.meter{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden;margin:6px 0 10px}
.meter span{display:block;height:100%;background:${vis.color};width:${Math.max(0, Math.min(100, result.score))}%}
.award{font-size:.95rem}
.statline{margin-bottom:32px}
.awd-pre{color:#6E7681}
.awd-win{color:#FFFFFF;font-weight:700}
.muted{color:#6e7681;font-size:.85rem}
footer{margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,.07);font-size:.82rem;color:#6e7681}
footer strong{color:#e6edf3}
@media(max-width:560px){.row{flex-direction:column;gap:2px}.k{flex:none}}
</style>
</head>
<body>
<div class="wrap">
<div class="bar"></div>
<div class="eyebrow">project.faf · visual render</div>
<header>
<h1>${name}</h1>
<span class="badge">${vis.glyph} ${esc(tierName)}</span>
<span class="score">${scoreText}</span>
</header>
<div class="meter"><span></span></div>
${
  isTrophy
    ? '<p class="award statline"><span class="awd-pre">✅ All Required slots filled.</span> <span class="awd-win">100% Trophy 🏆 Awarded</span></p>'
    : `<p class="muted statline">${result.populated}/${result.active} slots populated · ${result.total} total${stackIgnored ? ` · ${stackIgnored} N/A` : ''}</p>`
}

<section>
<h2>The 6 W's</h2>
${rows(sixW) || '<p class="muted">No human_context yet.</p>'}
${otherHc.length ? rows(otherHc) : ''}
</section>

<section>
<h2>Project</h2>
${rows(projectMeta) || '<p class="muted">—</p>'}
</section>

<section>
<h2>Stack</h2>
${
  stackActive.length
    ? rows(stackActive)
    : '<p class="muted">No active stack slots.</p>'
}
</section>

<footer>
Rendered on-demand from your current <strong>${esc(fafPath)}</strong><br>
<strong>Humans like visuals. <span style="color:#00D4D4">We gave them one.</span></strong>
</footer>
</div>
</body>
</html>
`;
}

/** Write project.html beside project.faf (repo root). */
export function writeProjectHtml(
  dir: string,
  data: FafData,
  result: ScoreResult,
  fafPath = 'project.faf',
): void {
  writeFileSync(
    join(dir, 'project.html'),
    generateProjectHtml(data, result, fafPath),
    'utf-8',
  );
}
