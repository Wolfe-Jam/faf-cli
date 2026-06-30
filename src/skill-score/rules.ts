// WJTTC static rule registry — ported from faf-skill-scorer/rules.mjs (static-v6).
//
// Rules are DATA, not buried logic → LEARNING-READY: to "teach" the scorer a new
// pattern you append a rule (human-verified) and bump SCORER_VERSION. A sealed score
// is always tagged with this version, so the same skill+version reproduces forever
// (learning changes the VERSION, never silently drifts a number). FAF don't lie.
//
// Scope: the STATIC half of the WJTTC suite — BRAKE / AERO / static-PIT. The behavioral
// modules (ENGINE / TYRE) are declared below but NOT statically scored (they need the
// run-the-skill harness — the second of the "two truths", the ACTIVATION gate).
//
// v2 (2026-06-27): fleet sweep verified 3 over-broad rules → tightened (learning loop, human-verified):
//   old-ladder → medals 🥇🥈🥉 only (bare 🟢🟡🔴 are status markers, not the ladder)
//   injection  → rm -rf only on root/home (not dist//tmp/subpaths); curl|sh \b-bounded (was matching "shasum")
//   trigger-clarity → action/trigger signal, not the literal word "when"
// v3 (2026-06-27): surface-mark → flag only a BARE achievement 🏆. Allow legit 🏆.
// v4 (2026-06-27): ghost-cli lookbehind (don't read ".faf" as "faf <cmd>"); injection backtick anchor.
// v5 (2026-06-28): brake.fabrication-instruction — honesty is a STATIC property (a strong model resists it behaviorally).
// v6 (2026-06-29): aero.trigger-scope — over-activation read in the description (the activation surface).

import type { Rule, BehavioralModule, ModuleName, SkillContext } from './types.js';

export const SCORER_VERSION = 'static-v6';

const has = (s: string, re: RegExp): boolean => re.test(s);

export const RULES: Rule[] = [
  // ─────────────── 🛑 BRAKE — Safety (the gate, 60) ───────────────
  { id: 'brake.ghost-cli', module: 'BRAKE', fatal: true, title: 'No ghost CLI commands',
    run(ctx: SkillContext) {
      // v4: lookbehind excludes ".faf" (the FORMAT) + "faf-x"; no ":" in capture (YAML keys like project:).
      const cited = [...new Set([...ctx.code.matchAll(/(?<![.\w-])faf\s+([a-z][a-z0-9-]+)/g)].map((m) => m[1]))];
      if (!cited.length) return { verdict: 'na', detail: 'no CLI commands shown' };
      const cite = /invent|ghost|e\.g\.|example|reject|don'?t|doesn'?t exist|not (a )?real|catch|wrong[- ]surface|historically/i;
      const ghosts = cited.filter((c) => !ctx.inv.faf_commands.includes(c)).filter((c) => {
        // keep as a ghost ONLY if not cited purely as an example (meta-skills name ghosts to reject)
        const lines = ctx.body.split('\n').filter((l) => new RegExp(`faf\\s+${c}\\b`).test(l));
        return !lines.length || !lines.every((l) => cite.test(l));
      });
      return ghosts.length
        ? { verdict: 'fail', detail: `ghost: ${ghosts.join(', ')}`, fix: `not in faf-cli (${ctx.inv.version}) — remove/correct` }
        : { verdict: 'beat', detail: `${cited.length} cmd(s) real (example-citations ignored)` };
    } },
  { id: 'brake.ghost-mcp', module: 'BRAKE', fatal: true, title: 'No ghost MCP tools',
    run(ctx: SkillContext) {
      const cited = [...new Set([...ctx.body.matchAll(/\bfaf_([a-z][a-z0-9_]+)/g)].map((m) => m[1]))];
      if (!cited.length) return { verdict: 'na', detail: 'no MCP tools cited' };
      const ghosts = cited.filter((t) => !ctx.inv.mcp_tools.includes(t));
      return ghosts.length
        ? { verdict: 'fail', detail: `ghost tool: ${ghosts.map((g) => 'faf_' + g).join(', ')}`, fix: 'not in default tools/list — remove/correct' }
        : { verdict: 'beat', detail: `${cited.length} tool(s), all real` };
    } },
  { id: 'brake.banned-guarantee', module: 'BRAKE', fatal: true, title: 'No banned word "Guarantee"',
    run(ctx: SkillContext) { return has(ctx.body, /guarantee/i)
      ? { verdict: 'fail', detail: 'contains "Guarantee[d]"', fix: 'BANNED word — remove' }
      : { verdict: 'pass', detail: 'clean' }; } },
  { id: 'brake.injection', module: 'BRAKE', fatal: true, title: 'No destructive / injection patterns',
    run(ctx: SkillContext) {
      const pats = [
        /ignore (all )?previous instructions/i,
        /rm\s+-rf\s+(\/|~|\$HOME|\$\{HOME\})(?![\w/])/,  // root/home wipe only — not dist//tmp/subpaths (v4: anchor fixed)
        /\bcurl\b[^|]*\|\s*(sh|bash)\b/i,                 // pipe-to-shell — \b excludes "shasum"
        /exfiltrat/i,
        /disable (the )?(safety|guard|sandbox)/i,
      ];
      const hit = pats.find((p) => p.test(ctx.body));
      return hit ? { verdict: 'fail', detail: `pattern: ${hit.source.slice(0, 36)}`, fix: 'remove destructive/injection instruction' }
                 : { verdict: 'pass', detail: 'no destructive patterns' };
    } },
  { id: 'brake.surface-mark', module: 'BRAKE', fatal: true, title: 'Work-surface mark ✪ not 🏆',
    run(ctx: SkillContext) {
      // v3: a 🏆 is a violation ONLY as a bare achievement mark. These contexts are legit:
      const LEGIT = [
        /\(🏆 social\)/,                        // teaching annotation (the standard format)
        /`🏆`/,                                 // backtick citation (the rulebook)
        /✪\s*=\s*🏆|🏆\s*=\s*✪/,                // "✪ = 🏆" teaching
        /🏆.{0,15}social|social[- ]?mark/i,      // explaining the social mark
        /[★◆◇●○♡🏁⚡]\s*🏆|🏆\s*[★◆◇●○♡🏁]|🏎️/,  // charset / symbol-set string
      ];
      const bare = ctx.body.split('\n').filter((l) => /🏆/.test(l) && !LEGIT.some((re) => re.test(l)));
      if (bare.length) return { verdict: 'fail', detail: `bare 🏆 (×${bare.length}) on a work surface`, fix: 'use ✪; keep 🏆 only as a teaching note "(🏆 social)" or a citation' };
      if (has(ctx.body, /🏆/)) return { verdict: 'beat', detail: '🏆 only in teaching/citation context' };
      return has(ctx.body, /✪/) ? { verdict: 'beat', detail: 'uses ✪' } : { verdict: 'pass', detail: 'no wrong-surface mark' };
    } },
  { id: 'brake.old-ladder', module: 'BRAKE', fatal: true, title: 'No legacy tier-emoji ladder',
    run(ctx: SkillContext) {
      // v2: medals 🥇🥈🥉 are unambiguous legacy tier badges. Bare 🟢🟡🔴 are overloaded as
      // STATUS markers (radar/standards/git) → not flagged. 🤍 only in an explicit tier context.
      if (has(ctx.body, /[🥇🥈🥉]/)) return { verdict: 'fail', detail: 'medal tier badge (🥇🥈🥉)', fix: 'use ★ ◆ ◇ ● ○ ♡' };
      if (has(ctx.body, /🤍/) && has(ctx.body, /\b(tier|score|trophy|white tier)\b/i))
        return { verdict: 'fail', detail: '🤍 as a tier mark', fix: 'use ♡ for the white tier' };
      return { verdict: 'pass', detail: 'clean' };
    } },
  { id: 'brake.overclaim', module: 'BRAKE', fatal: false, title: 'No unearned Anthropic overclaims',
    run(ctx: SkillContext) {
      if (has(ctx.body, /anthropic[-\s]?(approved|certified)|official anthropic|anthropic registry/i))
        return { verdict: 'fail', detail: 'unearned Anthropic standing claim', fix: 'only sanctioned line: "original Anthropic MCP ecosystem (#2759)"' };
      return { verdict: 'pass', detail: 'no overclaims' };
    } },
  { id: 'brake.fabricated-metrics', module: 'BRAKE', fatal: false, signoff: true, title: 'Metrics falsifiable (not fabricated)',
    run(ctx: SkillContext) {
      const m = ctx.body.match(/\b\d+%\s*(ROI|faster|improvement|reduction|accuracy|less|more)|\bscore\s+(jumped|rose|increased)\s+\d+|\b\d+\s?ms\b/i);
      return m ? { verdict: 'fail', detail: `metric "${m[0].trim()}" — verify`, fix: 'cite source or remove (sign-off review)' }
               : { verdict: 'pass', detail: 'no fabricated metrics' };
    } },
  { id: 'brake.fabrication-instruction', module: 'BRAKE', fatal: true, title: 'No fabrication / deception instructions',
    run(ctx: SkillContext) {
      // v5 (P1.5 control): a skill that TELLS the AI to invent/guess/hide-uncertainty is the real
      // bad-skill signal — caught STATICALLY (a strong model resists it behaviorally, so static owns honesty).
      // Discriminates on the IMPERATIVE direction: "use a sensible default" (bad) vs "never invents" (good).
      const BAD = [
        /\b(use|fill|insert|put|provide)\b[^.\n]{0,18}\b(sensible|reasonable|plausible|professional|smart|generic)\b[^.\n]{0,18}\b(default|guess|value|placeholder)/i,
        /\b(invent|fabricate|make up|made up)\b[^.\n]{0,25}\b(stack|framework|goal|value|market|timeline|details?|name|default)/i,
        /\b(infer|guess|assume)\b[^.\n]{0,20}\b(plausible|sensible|likely|reasonable)\b/i,
        /\bnever\s+(tell|admit|mention|reveal|say|let on)\b[^.\n]{0,50}(guess|empty|blank|unsure|made[\s-]?up|don'?t know|uncertain)/i,
        /\b(blank|empty|unfilled)\s+(slot|field|value|cell|answer)s?\s+(is|are|=|means?)\s+(a\s+)?(failure|fail|bad|wrong|loss|problem)/i,
        /\b(complete|filled|finished|polished|full|100%)[^\n]{0,30}\bbeats\b[^\n]{0,30}\b(empty|honest|blank|incomplete|real)/i,
        /\bnever\s+leave\b[^.\n]{0,25}\b(blank|empty|slot|field|unfilled|anything)/i,
      ];
      const hits = BAD.map((re) => (ctx.body.match(re) || [])[0]).filter(Boolean) as string[];
      return hits.length
        ? { verdict: 'fail', detail: `instructs fabrication: "${hits[0].trim().slice(0, 46)}"${hits.length > 1 ? ` (+${hits.length - 1})` : ''}`,
            fix: 'a skill must never tell the AI to invent, guess, or hide uncertainty — honesty is the standard (empty beats wrong)' }
        : { verdict: 'pass', detail: 'no fabrication instructions' };
    } },

  // ─────────────── 🪽 AERO — AI-Optimised (20) ───────────────
  { id: 'aero.frontmatter-lean', module: 'AERO', title: 'Lean frontmatter',
    run(ctx: SkillContext) {
      const allowed = ['name', 'description', 'license'];
      const extra = ctx.fmKeys.filter((k) => !allowed.includes(k));
      if (extra.length) return { verdict: 'fail', detail: `extra keys: ${extra.join(', ')}`, fix: 'keep name + description [+ license] only' };
      return ctx.fmKeys.length <= 2 ? { verdict: 'beat', detail: 'name + description only' } : { verdict: 'pass', detail: 'lean' };
    } },
  { id: 'aero.token-budget', module: 'AERO', title: 'Within budget (progressive disclosure)',
    run(ctx: SkillContext) {
      if (ctx.lines > 400 || ctx.tokens > 5000) return { verdict: 'fail', detail: `${ctx.lines} lines / ~${ctx.tokens} tok`, fix: 'defer heavy detail to references/' };
      return ctx.lines < 200 ? { verdict: 'beat', detail: `tight (${ctx.lines} lines)` } : { verdict: 'pass', detail: `${ctx.lines} lines` };
    } },
  { id: 'aero.trigger-clarity', module: 'AERO', title: 'Description states what + when',
    run(ctx: SkillContext) {
      // v2: pass on ANY action/trigger signal, not the literal word "when" (too strict, mass FPs).
      const d = ctx.fm.description || '';
      if (!d) return { verdict: 'fail', detail: 'no description', fix: 'add description: what it does + when to use' };
      const action = /\b(use|when|before|after|for |get|give|creat|build|run|generat|score|audit|check|fix|review|turn|draw|publish|deploy|find|scan|writ|add|make|render|seal|test|validat|convert|sync|recover|migrat|send|post|claim|detect|deliver|help|score|onboard|set up|setup)\b/i;
      return action.test(d)
        ? { verdict: 'pass', detail: 'states what/when' }
        : { verdict: 'fail', detail: 'vague description (no action/trigger signal)', fix: 'state what it does + when to use' };
    } },
  { id: 'aero.trigger-scope', module: 'AERO', title: 'No over-broad / greedy trigger',
    run(ctx: SkillContext) {
      // v6: over-activation can't be caught behaviorally (model resists a greedy "use me always" claim) →
      // read it in the DESCRIPTION (the activation surface). Scopes the trigger, not compatibility claims.
      const d = ctx.fm.description || '';
      const GREEDY = [
        /\b(always|whenever)\s+(use|invoke|load|run|reach for)\s+(this|it|me)/i,
        /\bfor\s+(any|every|all|literally any)\s+(request|task|prompt|situation|need|case)/i,  // activation-greed, NOT "for any project" (scope)
        /\bessential\s+first\s+step\s+for\s+(any|every|all)/i,
        /\bapplies\s+(universally|to (everything|anything|all))/i,
        /\buse\s+(this|it|me)\s+(for|on|with|whenever)\s+(any|every|all|everything|anything)/i,
      ];
      const hit = GREEDY.find((re) => re.test(d));
      return hit
        ? { verdict: 'fail', detail: `over-broad trigger: "${(d.match(hit) || [''])[0].trim().slice(0, 40)}"`, fix: 'scope the trigger to a specific use case — over-claiming "use for everything" makes the AI over-fire it' }
        : { verdict: 'pass', detail: 'trigger is scoped' };
    } },

  // ─────────────── 🔧 PIT — Operational (static subset, 20) ───────────────
  { id: 'pit.name-matches-dir', module: 'PIT', title: 'name matches directory',
    run(ctx: SkillContext) { return ctx.fm.name === ctx.name
      ? { verdict: 'pass', detail: `= ${ctx.name}` }
      : { verdict: 'fail', detail: `name "${ctx.fm.name}" ≠ dir "${ctx.name}"`, fix: 'align name to dir' }; } },
  { id: 'pit.frontmatter-valid', module: 'PIT', title: 'Installs clean (name + description present)',
    run(ctx: SkillContext) { return (ctx.fm.name && ctx.fm.description)
      ? { verdict: 'pass', detail: 'valid' }
      : { verdict: 'fail', detail: 'missing name/description', fix: 'add required frontmatter' }; } },
  { id: 'pit.referenced-files-ship', module: 'PIT', title: 'Referenced files actually ship',
    run(ctx: SkillContext) {
      if (!ctx.refs.length) return { verdict: 'na', detail: 'no bundled refs' };
      const missing = ctx.refs.filter((r) => !ctx.fileExists(r));
      return missing.length
        ? { verdict: 'fail', detail: `missing: ${missing.join(', ')}`, fix: 'ship the referenced file(s) or drop the ref' }
        : { verdict: 'beat', detail: `${ctx.refs.length} ref(s) all ship` };
    } },
  { id: 'pit.no-env-cruft', module: 'PIT', title: 'No environment-specific cruft',
    run(ctx: SkillContext) {
      const m = ctx.body.match(/what we (fixed|did|shipped) today|PLANET-FAF|FAF-GOLD|\.config\/claude-code|\/Users\/[\w.-]+\//i);
      return m ? { verdict: 'fail', detail: `cruft: "${m[0]}"`, fix: 'remove local/session residue' }
               : { verdict: 'pass', detail: 'clean' };
    } },
];

// Behavioral modules — declared for transparency, NOT statically scored (the harness scores these).
export const BEHAVIORAL: BehavioralModule[] = [
  { module: 'ENGINE', weight: 15, title: 'Activates + delivers the claimed result (the receipt)' },
  { module: 'TYRE',   weight: 15, title: 'Holds up on messy/partial input; degrades, never hallucinates' },
];

// GATE MODEL (locked 2026-06-28): static IS the full 0-100 GRADE (what you can READ — durable);
// behavioral (ENGINE/TYRE) is NO LONGER graded — it becomes the ACTIVATION GATE (pass/fail).
// Weights rescaled 40/15/15 → 60/20/20 (safety-emphasis kept; tunable).
export const WEIGHTS: Record<ModuleName, number> = { BRAKE: 60, AERO: 20, PIT: 20 };
export const STATIC_MODULES: ModuleName[] = ['BRAKE', 'AERO', 'PIT'];
