/** About is a repo role, not an app_type.
 *
 *  Signal: the `about:` block with `represents: owner/repo`.
 *  Score is inherited (`about.source_score`) or unknown (−1 / —).
 */

export const REPRESENTS_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export interface AboutDecl {
  represents: string;
  sourceScore: number; // −1 when missing or out of range
}

/** Parsed .faf object: About iff about.represents is a non-empty string. */
export function isAboutFaf(data: { about?: { represents?: unknown } } | null | undefined): boolean {
  const r = data?.about?.represents;
  return typeof r === 'string' && r.length > 0;
}

/**
 * Hot-path YAML detect — no parser.
 * About = an `about:` map that contains `represents:`.
 * `app_type: about` is not a type and does not trigger this.
 */
export function aboutFromYaml(yaml: string): AboutDecl | null {
  const block = yaml.match(/^about:\s*\n((?:[ \t]+.*\n?)*)/m);
  if (!block) {return null;}
  const body = block[1] ?? '';
  const representsMatch = body.match(/^[ \t]+represents:\s*(\S+)\s*$/m);
  if (!representsMatch) {return null;}
  const represents = representsMatch[1];
  const scoreMatch = body.match(/^[ \t]+source_score:\s*(\d+)\s*$/m);
  let sourceScore = -1;
  if (scoreMatch) {
    const n = parseInt(scoreMatch[1], 10);
    if (n >= 0 && n <= 100) {sourceScore = n;}
  }
  return { represents, sourceScore };
}
