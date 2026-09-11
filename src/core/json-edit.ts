/**
 * Text-preserving JSON edits: change the value of a key, or add a key that is
 * missing, and keep every other byte of the file — key order, spacing, a
 * 20-digit integer, an array written on one line. faf uses it for the one
 * JSON file it shares with its owner, a registry `server.json`, where faf owns
 * only the identity keys (`faf server-card`, `faf cards --target registry`).
 *
 * A patch is a plain object. For each key: a plain-object value is a folder to
 * go into (the file's value must be an object too); any other value replaces
 * the value's text when it differs, or is added when the key is missing.
 * Nothing is ever deleted, and `undefined` is skipped. When the file cannot be
 * edited that way — not valid JSON, not an object, a key it repeats on the way,
 * or a value faf would have to replace to go into it — a JsonEditError says
 * why in one line and nothing is changed.
 */

/** Why a JSON text cannot be edited in place (one line). */
export class JsonEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonEditError';
  }
}

interface JMember {
  key: string;
  keyStart: number;
  keyEnd: number;
  value: JNode;
}

interface JNode {
  kind: 'object' | 'array' | 'string' | 'number' | 'literal';
  start: number;
  end: number;
  members: JMember[];
}

const WS = new Set([' ', '\t', '\n', '\r']);

/** A strict JSON parser (RFC 8259) that keeps where every key and value sits. */
class Parser {
  private i = 0;

  constructor(private readonly s: string) {}

  parse(): JNode {
    if (this.s.startsWith('\uFEFF')) {this.i = 1;}
    const node = this.value();
    this.ws();
    if (this.i !== this.s.length) {this.fail('text after the end of the JSON value');}
    return node;
  }

  private fail(why: string): never {
    throw new JsonEditError(`not valid JSON (${why} at offset ${this.i})`);
  }

  private ws(): void {
    while (this.i < this.s.length && WS.has(this.s[this.i])) {this.i++;}
  }

  private value(): JNode {
    this.ws();
    const c = this.s[this.i];
    if (c === '{') {return this.object();}
    if (c === '[') {return this.array();}
    if (c === '"') {
      const start = this.i;
      this.string();
      return { kind: 'string', start, end: this.i, members: [] };
    }
    if (c === '-' || (c >= '0' && c <= '9')) {return this.number();}
    for (const lit of ['true', 'false', 'null']) {
      if (this.s.startsWith(lit, this.i)) {
        const start = this.i;
        this.i += lit.length;
        return { kind: 'literal', start, end: this.i, members: [] };
      }
    }
    return this.fail(c === undefined ? 'unexpected end' : `unexpected ${JSON.stringify(c)}`);
  }

  private object(): JNode {
    const start = this.i++;
    const members: JMember[] = [];
    this.ws();
    if (this.s[this.i] === '}') {
      this.i++;
      return { kind: 'object', start, end: this.i, members };
    }
    for (;;) {
      this.ws();
      if (this.s[this.i] !== '"') {this.fail('expected a key');}
      const keyStart = this.i;
      const key = this.string();
      const keyEnd = this.i;
      this.ws();
      if (this.s[this.i] !== ':') {this.fail('expected ":"');}
      this.i++;
      members.push({ key, keyStart, keyEnd, value: this.value() });
      this.ws();
      if (this.s[this.i] === ',') {
        this.i++;
        continue;
      }
      if (this.s[this.i] === '}') {
        this.i++;
        return { kind: 'object', start, end: this.i, members };
      }
      this.fail('expected "," or "}"');
    }
  }

  private array(): JNode {
    const start = this.i++;
    this.ws();
    if (this.s[this.i] === ']') {
      this.i++;
      return { kind: 'array', start, end: this.i, members: [] };
    }
    for (;;) {
      this.value();
      this.ws();
      if (this.s[this.i] === ',') {
        this.i++;
        continue;
      }
      if (this.s[this.i] === ']') {
        this.i++;
        return { kind: 'array', start, end: this.i, members: [] };
      }
      this.fail('expected "," or "]"');
    }
  }

  /** A string token; returns its value. */
  private string(): string {
    const start = this.i++;
    for (;;) {
      const c = this.s[this.i];
      if (c === undefined) {this.fail('unterminated string');}
      if (c === '"') {break;}
      if (c < ' ') {this.fail('control character in a string');}
      if (c === '\\') {
        const e = this.s[this.i + 1];
        if (e === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(this.s.slice(this.i + 2, this.i + 6))) {this.fail('bad \\u escape');}
          this.i += 6;
          continue;
        }
        if (!'"\\/bfnrt'.includes(e ?? 'x')) {this.fail('bad escape');}
        this.i += 2;
        continue;
      }
      this.i++;
    }
    this.i++;
    return JSON.parse(this.s.slice(start, this.i)) as string;
  }

  private number(): JNode {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(this.s.slice(this.i));
    if (!m) {this.fail('bad number');}
    const start = this.i;
    this.i += m[0].length;
    return { kind: 'number', start, end: this.i, members: [] };
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep equality of parsed JSON values. */
function sameJson(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {return true;}
  if (Array.isArray(a) && Array.isArray(b)) {return a.length === b.length && a.every((x, i) => sameJson(x, b[i]));}
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => k in b && sameJson(a[k], b[k]));
  }
  return false;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

/** Layout facts of the file, so added text looks like the text around it. */
interface Style {
  eol: string;
  unit: string;
}

/** Where to add a missing key: after the first of these keys the object has
 *  (else after its last key). Keyed by the dotted path of the object ('' is the root). */
export type InsertAfter = Record<string, Record<string, readonly string[]>>;

class Editor {
  readonly edits: Edit[] = [];

  constructor(
    private readonly s: string,
    private readonly style: Style,
    private readonly after: InsertAfter,
  ) {}

  /** True when only blanks sit between the start of its line and `pos` (and
   *  there is a line before: a key that starts a line of its own). */
  private startsLine(pos: number): boolean {
    const nl = this.s.lastIndexOf('\n', pos - 1);
    return nl >= 0 && /^[ \t]*$/.test(this.s.slice(nl + 1, pos));
  }

  /** The blanks before `pos` on its line, when `pos` starts the line; else ''. */
  private indentOf(pos: number): string {
    return this.startsLine(pos) ? this.s.slice(this.s.lastIndexOf('\n', pos - 1) + 1, pos) : '';
  }

  /** `v` as JSON text for a value whose key line is indented `indent`: laid
   *  out over lines like the file around it when `multi`, else on one line. */
  private render(v: unknown, indent: string, multi: boolean): string {
    if (!multi) {return JSON.stringify(v);}
    return JSON.stringify(v, null, this.style.unit).split('\n').join(this.style.eol + indent);
  }

  /** Apply `patch` to the object `obj` (at dotted `path`; `multi` when the
   *  object is laid out over lines). */
  apply(obj: JNode, patch: Record<string, unknown>, path: string, multi: boolean): void {
    const fill: Record<string, unknown> = {}; // keys for an empty object, written as one
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) {continue;}
      const at = path ? `${path}.${key}` : key;
      const found = obj.members.filter(m => m.key === key);
      if (found.length > 1) {throw new JsonEditError(`the key "${at}" is there more than once`);}
      const member = found[0];
      if (!member) {
        if (obj.members.length === 0) {fill[key] = value;}
        else {this.insert(obj, key, value, path);}
        continue;
      }
      const lined = this.startsLine(member.keyStart);
      if (isPlainObject(value)) {
        if (member.value.kind !== 'object') {throw new JsonEditError(`"${at}" is not an object, so faf cannot add its keys to it`);}
        this.apply(member.value, value, at, lined || this.s.slice(member.value.start, member.value.end).includes('\n'));
        continue;
      }
      const now: unknown = JSON.parse(this.s.slice(member.value.start, member.value.end));
      if (sameJson(now, value)) {continue;}
      this.edits.push({ start: member.value.start, end: member.value.end, text: this.render(value, this.indentOf(member.keyStart), lined) });
    }
    if (Object.keys(fill).length > 0) {this.fillEmpty(obj, fill, multi);}
  }

  /** Write the keys of an empty object (`{}`) in one go, laid out like the file. */
  private fillEmpty(obj: JNode, keys: Record<string, unknown>, multi: boolean): void {
    const outer = this.indentOf(this.lineLead(obj.start));
    const text = multi
      ? this.render(keys, outer, true)
      : JSON.stringify(keys);
    this.edits.push({ start: obj.start, end: obj.end, text });
  }

  /** Add `key: value` to `obj`, in the layout the object already has. In an
   *  object laid out over lines the new key gets a line of its own and no
   *  existing line changes: it goes after the hinted key, or — when that is
   *  the last key, or there is no hint — just before the last key (after it
   *  would need a comma on the last key's line). On one line it goes after
   *  the hinted key, else at the end. */
  private insert(obj: JNode, key: string, value: unknown, path: string): void {
    const members = obj.members;
    const last = members[members.length - 1];
    const hints = this.after[path]?.[key] ?? [];
    const hinted = hints.map(h => members.find(m => m.key === h)).find(m => m !== undefined);
    if (this.startsLine(members[0].keyStart)) {
      // Before `next` (a key that starts its own line), as a whole line.
      const next = hinted && hinted !== last ? members[members.indexOf(hinted) + 1] : last;
      const indent = this.indentOf(next.keyStart);
      const sep = this.s.slice(next.keyEnd, next.value.start); // ': ' as the file writes it
      const lineAt = this.s.lastIndexOf('\n', next.keyStart - 1);
      const at = lineAt > 0 && this.s[lineAt - 1] === '\r' ? lineAt - 1 : lineAt;
      const text = `${this.style.eol}${indent}${JSON.stringify(key)}${sep}${this.render(value, indent, true)},`;
      this.edits.push({ start: at, end: at, text });
      return;
    }
    const anchor = hinted ?? last;
    const sep = this.s.slice(anchor.keyEnd, anchor.value.start);
    const between = members.length > 1 ? this.s.slice(members[0].value.end, members[1].keyStart) : ', ';
    this.edits.push({ start: anchor.value.end, end: anchor.value.end, text: `${between}${JSON.stringify(key)}${sep}${this.render(value, '', false)}` });
  }

  /** The first non-blank position of the line `pos` is on. */
  private lineLead(pos: number): number {
    let at = this.s.lastIndexOf('\n', pos - 1) + 1;
    while (at < pos && (this.s[at] === ' ' || this.s[at] === '\t')) {at++;}
    return at;
  }
}

/** The file's line ending, and its indent unit (the root's first key
 *  indent), else two spaces. */
function styleOf(s: string, root: JNode): Style {
  const eol = s.includes('\r\n') ? '\r\n' : '\n';
  const first = root.members[0];
  const nl = first ? s.lastIndexOf('\n', first.keyStart - 1) : -1;
  const lead = first && nl >= 0 ? s.slice(nl + 1, first.keyStart) : '';
  return { eol, unit: /^[ \t]+$/.test(lead) ? lead : '  ' };
}

/**
 * Apply `patch` to the JSON `text`, changing only the value text of the keys
 * it names and adding the keys it has that the text lacks (see the file
 * header). Returns the new text and whether it changed. Throws a
 * JsonEditError, having changed nothing, when the text cannot be edited that
 * way. `after` says where a missing key goes (default: after the object's last key).
 */
export function editJsonText(
  text: string,
  patch: Record<string, unknown>,
  after: InsertAfter = {},
): { text: string; changed: boolean } {
  const root = new Parser(text).parse();
  if (root.kind !== 'object') {throw new JsonEditError('the JSON is not an object');}
  const editor = new Editor(text, styleOf(text, root), after);
  editor.apply(root, patch, '', text.slice(root.start, root.end).includes('\n'));
  if (editor.edits.length === 0) {return { text, changed: false };}
  // Last edit first, so earlier offsets stay true; two additions at one spot
  // keep the patch's order.
  const order = editor.edits.map((e, i) => ({ e, i })).sort((a, b) => b.e.start - a.e.start || b.i - a.i);
  let out = text;
  for (const { e } of order) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return { text: out, changed: out !== text };
}
