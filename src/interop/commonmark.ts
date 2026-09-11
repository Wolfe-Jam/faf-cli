/**
 * CommonMark's block structure, line by line — just enough of it to say which
 * lines Markdown shows as code, or hides in a raw HTML block or a multi-line
 * comment. faf uses it to tell its own marker lines from marker examples.
 *
 * The algorithm is the reference implementation's (commonmark.js, spec 0.31):
 * each line first continues the open containers (block quotes, list items —
 * a list item's lines sit at its content column, a tab after the marker
 * advancing to the next multiple of 4), then may open new blocks, then is
 * added to the innermost open block or continues a paragraph lazily. Only
 * what decides block structure is kept: no inline parsing, no link reference
 * definitions, no tables.
 *
 * A reader made with `containers: false` reads every line at column 0 with no
 * block quotes and no list items — the plain reading a text editor, an older
 * faf or another tool may apply. faf takes a block as its own only when both
 * readings agree (see inject.ts).
 *
 * What a line counts as hidden in:
 *   - fenced code (its opening and closing lines included) and indented code;
 *   - an HTML block of types 1-5 — <pre>/<script>/<style>/<textarea> up to the
 *     closing tag, a comment up to `-->`, <?…?>, <!X…>, <![CDATA[…]]> — except
 *     a comment that opens and closes on the one line (faf's own marker
 *     lines are such comments);
 *   - not an HTML block of types 6 or 7 (<div>, <details>, any lone tag): a
 *     comment inside raw HTML is still a comment. No fence or other block
 *     opens inside one until a blank line ends it.
 */

const CODE_INDENT = 4;

const TAGNAME = '[A-Za-z][A-Za-z0-9-]*';
const ATTRIBUTENAME = '[a-zA-Z_:][a-zA-Z0-9:._-]*';
const ATTRIBUTEVALUE = '(?:[^"\'=<>`\\x00-\\x20]+|\'[^\']*\'|"[^"]*")';
const ATTRIBUTE = `(?:\\s+${ATTRIBUTENAME}(?:\\s*=\\s*${ATTRIBUTEVALUE})?)`;
const OPENTAG = `<${TAGNAME}${ATTRIBUTE}*\\s*/?>`;
const CLOSETAG = `</${TAGNAME}\\s*>`;
const BLOCK_NAMES =
  'address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|' +
  'fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|' +
  'menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul';

/** HTML block start conditions, types 1-7 (index 0 is type 1). */
const HTML_OPEN: readonly RegExp[] = [
  /^<(script|pre|style|textarea)(?=\s|>|$)/i,
  /^<!--/,
  /^<\?/,
  /^<![A-Za-z]/,
  /^<!\[CDATA\[/,
  new RegExp(`^</?(?:${BLOCK_NAMES})(?=\\s|/?>|$)`, 'i'),
  new RegExp(`^(?:${OPENTAG}|${CLOSETAG})\\s*$`, 'i'),
];
/** End conditions of HTML block types 1-5 (types 6 and 7 end at a blank line). */
const HTML_CLOSE: readonly RegExp[] = [/<\/(?:script|pre|style|textarea)>/i, /-->/, /\?>/, />/, /\]\]>/];
/** The line that meets each end condition of types 1-5 (type 1 names its tag). */
const HTML_CLOSER: readonly string[] = ['', '-->', '?>', '>', ']]>'];

const THEMATIC_BREAK = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/;
const MAYBE_SPECIAL = /^[#`~*+_=<>0-9-]/;
const BULLET = /^[*+-]/;
const ORDERED = /^(\d{1,9})([.)])/;
const ATX_HEADING = /^#{1,6}(?:[ \t]+|$)/;
const FENCE_OPEN = /^`{3,}(?!.*`)|^~{3,}/;
const FENCE_CLOSE = /^(?:`{3,}|~{3,})(?=[ \t]*$)/;
const SETEXT_LINE = /^(?:=+|-+)[ \t]*$/;
const NON_SPACE = /[^ \t\f\v\r\n]/;

interface ListData {
  bullet: string | null;
  delimiter: string | null;
  markerOffset: number;
  padding: number;
}

interface Fence {
  char: string;
  len: number;
  offset: number;
}

type Block =
  | { kind: 'document' | 'quote' | 'paragraph' | 'heading' | 'break'; hasChild?: boolean }
  | { kind: 'list'; list: ListData; hasChild?: boolean }
  | { kind: 'item'; list: ListData; hasChild?: boolean }
  | { kind: 'code'; fence: Fence | null; hasChild?: boolean }
  | { kind: 'html'; type: number; tag: string; hasChild?: boolean };

type Kind = Block['kind'];

/** What hides a line: its region, as faf names it to the user. */
export type HiddenIn = 'code fence' | 'indented code' | 'html' | 'comment' | `<${string}>`;

/** 0: no; 1: yes, a container; 2: yes, and the line is done with (a leaf). */
type Step = 0 | 1 | 2;

const isSpaceOrTab = (c: string | undefined): boolean => c === ' ' || c === '\t';

function canContain(parent: Kind, child: Kind): boolean {
  if (parent === 'document' || parent === 'quote' || parent === 'item') {return child !== 'item';}
  return parent === 'list' && child === 'item';
}

const acceptsLines = (kind: Kind): boolean => kind === 'paragraph' || kind === 'code' || kind === 'html';

function copyBlock(b: Block): Block {
  if (b.kind === 'list' || b.kind === 'item') {return { ...b, list: { ...b.list } };}
  if (b.kind === 'code') {return { ...b, fence: b.fence && { ...b.fence } };}
  return { ...b };
}

/** Feeds a text line by line (terminators removed) and says which lines are hidden. */
export class BlockReader {
  private stack: Block[] = [{ kind: 'document' }];
  // The line being read, and where the reader stands in it.
  private ln = '';
  private offset = 0;
  private column = 0;
  private nextNonspace = 0;
  private nextNonspaceColumn = 0;
  private indent = 0;
  private indented = false;
  private blank = false;
  private allClosed = true;
  private matched = 0;
  private htmlStarted = false;
  private hiddenIn: HiddenIn | null = null;
  private readonly starts: ReadonlyArray<(container: Block) => Step>;

  /** `containers: false` — the plain column-0 reading: no block quotes, no list items. */
  constructor(private readonly containers: boolean = true) {
    this.starts = [
      () => this.startQuote(),
      () => this.startHeading(),
      () => this.startFence(),
      c => this.startHtml(c),
      c => this.startSetext(c),
      () => this.startBreak(),
      c => this.startItem(c),
      () => this.startIndentedCode(),
    ];
  }

  /** An independent copy, for trying lines out. */
  clone(): BlockReader {
    const copy = new BlockReader(this.containers);
    copy.stack = this.stack.map(copyBlock);
    return copy;
  }

  /** Read one line (no terminator). Returns what hides it, or null when it is shown as text. */
  line(ln: string): HiddenIn | null {
    this.ln = ln;
    this.offset = 0;
    this.column = 0;
    this.blank = false;
    this.htmlStarted = false;
    this.hiddenIn = null;
    const container = this.continueContainers();
    if (container < 0) {return this.hiddenIn;} // a closing fence: the line is its last
    const leaf = this.openBlocks(container);
    // A lazy paragraph line (a list item's or a quote's paragraph, run on) is text.
    if (!this.allClosed && !this.blank && this.tip.kind === 'paragraph') {return null;}
    this.closeUnmatched();
    this.addText(leaf);
    return this.hiddenIn;
  }

  /** The line that would close the region a column-0 line would now be hidden
   *  in (a fence or an HTML block of types 1-5 at the top level), or null. */
  closer(): string | null {
    if (this.stack.length !== 2) {return null;}
    const b = this.stack[1];
    if (b.kind === 'code') {return b.fence ? b.fence.char.repeat(b.fence.len) : null;}
    if (b.kind !== 'html' || b.type > 5) {return null;}
    return b.type === 1 ? `</${b.tag}>` : HTML_CLOSER[b.type - 1];
  }

  private get tip(): Block {
    return this.stack[this.stack.length - 1];
  }

  /** Step 1: the open containers the line continues. Returns the index of the
   *  last one it continues, or -1 when it closed a fence. */
  private continueContainers(): number {
    const oldTip = this.stack.length - 1;
    let container = 0;
    while (container < oldTip) {
      this.findNextNonspace();
      const res = this.continues(this.stack[container + 1], container + 1);
      if (res === 2) {return -1;}
      if (res === 1) {break;}
      container++;
    }
    this.allClosed = container === oldTip;
    this.matched = container;
    return container;
  }

  /** Step 2: the blocks the line opens, from the container at `index`. Returns the block the rest of the line goes to. */
  private openBlocks(index: number): Block {
    let container = this.stack[index];
    let leaf = container.kind !== 'paragraph' && acceptsLines(container.kind);
    while (!leaf) {
      this.findNextNonspace();
      if (!this.indented && !MAYBE_SPECIAL.test(this.ln.slice(this.nextNonspace))) {break;}
      let res: Step = 0;
      for (const start of this.starts) {
        res = start(container);
        if (res !== 0) {break;}
      }
      if (res === 0) {break;}
      container = this.tip;
      leaf = res === 2;
    }
    if (!leaf) {this.advanceNextNonspace();}
    return container;
  }

  /** Step 3: the rest of the line goes to `block`. */
  private addText(block: Block): void {
    if (block.kind === 'code') {
      this.hiddenIn = block.fence ? 'code fence' : 'indented code';
    } else if (block.kind === 'html') {
      this.addHtmlLine(block);
    } else if (!acceptsLines(block.kind) && this.offset < this.ln.length && !this.blank) {
      this.addChild({ kind: 'paragraph' });
    }
  }

  private addHtmlLine(block: Extract<Block, { kind: 'html' }>): void {
    if (block.type > 5) {return;}
    const closes = HTML_CLOSE[block.type - 1].test(this.ln.slice(this.offset));
    const oneLineComment = this.htmlStarted && block.type === 2 && closes;
    if (!oneLineComment) {this.hiddenIn = block.type === 1 ? `<${block.tag}>` : block.type === 2 ? 'comment' : 'html';}
    if (closes) {this.stack.pop();}
  }

  /** Does the line continue the open block `b` (at `index`)? 0 yes, 1 no, 2 it closed a fence. */
  private continues(b: Block, index: number): Step {
    switch (b.kind) {
      case 'quote':
        return this.continueQuote();
      case 'item':
        return this.continueItem(b);
      case 'code':
        return b.fence ? this.continueFence(b.fence, index) : this.continueIndentedCode();
      default:
        return this.continueOther(b);
    }
  }

  /** The document and a list always continue; a heading or a break never
   *  does; a paragraph and an HTML block of type 6 or 7 end at a blank line. */
  private continueOther(b: Block): Step {
    if (b.kind === 'heading' || b.kind === 'break') {return 1;}
    const endsAtBlank = b.kind === 'paragraph' || (b.kind === 'html' && b.type >= 6);
    return endsAtBlank && this.blank ? 1 : 0;
  }

  private continueQuote(): Step {
    if (this.indented || this.ln[this.nextNonspace] !== '>') {return 1;}
    this.advanceNextNonspace();
    this.advanceOffset(1, false);
    if (isSpaceOrTab(this.ln[this.offset])) {this.advanceOffset(1, true);}
    return 0;
  }

  private continueItem(b: Extract<Block, { kind: 'item' }>): Step {
    const width = b.list.markerOffset + b.list.padding;
    if (this.blank) {
      if (!b.hasChild) {return 1;} // a blank line after an empty list item ends it
      this.advanceNextNonspace();
    } else if (this.indent >= width) {
      this.advanceOffset(width, true);
    } else {
      return 1;
    }
    return 0;
  }

  private continueFence(fence: Fence, index: number): Step {
    const rest = this.ln.slice(this.nextNonspace);
    const m = this.indent <= 3 && rest[0] === fence.char ? FENCE_CLOSE.exec(rest) : null;
    if (m && m[0].length >= fence.len) {
      this.stack.length = index;
      this.hiddenIn = 'code fence';
      return 2;
    }
    for (let i = fence.offset; i > 0 && isSpaceOrTab(this.ln[this.offset]); i--) {this.advanceOffset(1, true);}
    return 0;
  }

  private continueIndentedCode(): Step {
    if (this.indent >= CODE_INDENT) {
      this.advanceOffset(CODE_INDENT, true);
    } else if (this.blank) {
      this.advanceNextNonspace();
    } else {
      return 1;
    }
    return 0;
  }

  private get rest(): string {
    return this.ln.slice(this.nextNonspace);
  }

  private startQuote(): Step {
    if (!this.containers || this.indented || this.rest[0] !== '>') {return 0;}
    this.advanceNextNonspace();
    this.advanceOffset(1, false);
    if (isSpaceOrTab(this.ln[this.offset])) {this.advanceOffset(1, true);}
    this.closeUnmatched();
    this.addChild({ kind: 'quote' });
    return 1;
  }

  private startHeading(): Step {
    if (this.indented || !ATX_HEADING.test(this.rest)) {return 0;}
    this.closeUnmatched();
    this.addChild({ kind: 'heading' });
    this.offset = this.ln.length;
    return 2;
  }

  private startFence(): Step {
    const m = this.indented ? null : FENCE_OPEN.exec(this.rest);
    if (!m) {return 0;}
    this.closeUnmatched();
    this.addChild({ kind: 'code', fence: { char: m[0][0], len: m[0].length, offset: this.indent } });
    this.advanceNextNonspace();
    this.advanceOffset(m[0].length, false);
    return 2;
  }

  private startHtml(container: Block): Step {
    if (this.indented || this.rest[0] !== '<') {return 0;}
    const lazy = !this.allClosed && !this.blank && this.tip.kind === 'paragraph';
    const type7 = container.kind !== 'paragraph' && !lazy; // type 7 cannot interrupt a paragraph
    for (let type = 1; type <= (type7 ? 7 : 6); type++) {
      const m = HTML_OPEN[type - 1].exec(this.rest);
      if (m) {
        this.closeUnmatched();
        this.addChild({ kind: 'html', type, tag: type === 1 ? m[1].toLowerCase() : '' });
        this.htmlStarted = true;
        return 2;
      }
    }
    return 0;
  }

  private startSetext(container: Block): Step {
    if (this.indented || container.kind !== 'paragraph' || !SETEXT_LINE.test(this.rest)) {return 0;}
    this.closeUnmatched();
    this.stack[this.stack.length - 1] = { kind: 'heading' }; // the paragraph becomes a heading
    this.offset = this.ln.length;
    return 2;
  }

  private startBreak(): Step {
    if (this.indented || !THEMATIC_BREAK.test(this.rest)) {return 0;}
    this.closeUnmatched();
    this.addChild({ kind: 'break' });
    this.offset = this.ln.length;
    return 2;
  }

  private startItem(container: Block): Step {
    if (!this.containers || (this.indented && container.kind !== 'list')) {return 0;}
    const data = this.listMarker(container);
    if (!data) {return 0;}
    this.closeUnmatched();
    const tip = this.tip;
    if (tip.kind !== 'list' || tip.list.bullet !== data.bullet || tip.list.delimiter !== data.delimiter) {
      this.addChild({ kind: 'list', list: data });
    }
    this.addChild({ kind: 'item', list: data, hasChild: false });
    return 1;
  }

  private startIndentedCode(): Step {
    if (!this.indented || this.tip.kind === 'paragraph' || this.blank) {return 0;}
    this.advanceOffset(CODE_INDENT, true);
    this.closeUnmatched();
    this.addChild({ kind: 'code', fence: null });
    return 2;
  }

  /** The list marker at the reader's position: its kind, where it sits and
   *  its content column (padding); null when there is none. */
  private listMarker(container: Block): ListData | null {
    if (this.indent >= 4) {return null;}
    const marker = this.markerAt(container);
    if (!marker) {return null;}
    const markerOffset = this.indent;
    this.advanceNextNonspace();
    this.advanceOffset(marker.width, true);
    return { ...marker.kind, markerOffset, padding: this.paddingAfter(marker.width) };
  }

  /** A bullet or an ordered marker followed by a space, a tab or the line's end. */
  private markerAt(container: Block): { width: number; kind: Pick<ListData, 'bullet' | 'delimiter'> } | null {
    const rest = this.rest;
    const inParagraph = container.kind === 'paragraph';
    const found = this.markerKind(rest, inParagraph);
    if (!found) {return null;}
    const after = rest[found.width];
    if (!(after === undefined || isSpaceOrTab(after))) {return null;}
    // A list item that interrupts a paragraph cannot start with a blank line.
    if (inParagraph && !NON_SPACE.test(rest.slice(found.width))) {return null;}
    return found;
  }

  private markerKind(rest: string, inParagraph: boolean): { width: number; kind: Pick<ListData, 'bullet' | 'delimiter'> } | null {
    const bullet = BULLET.exec(rest);
    if (bullet) {return { width: 1, kind: { bullet: bullet[0], delimiter: null } };}
    const ordered = ORDERED.exec(rest);
    // An ordered list interrupts a paragraph only when it starts at 1.
    if (!ordered || (inParagraph && Number(ordered[1]) !== 1)) {return null;}
    return { width: ordered[0].length, kind: { bullet: null, delimiter: ordered[2] } };
  }

  /** The columns from the marker to the item's content: 1-4 spaces (or tabs
   *  to that many columns) after it; with 5 or more, or none (a blank item),
   *  the content starts one column after the marker. */
  private paddingAfter(width: number): number {
    const startCol = this.column;
    const startOffset = this.offset;
    do {
      this.advanceOffset(1, true);
    } while (this.column - startCol < 5 && isSpaceOrTab(this.ln[this.offset]));
    const spaces = this.column - startCol;
    if (spaces >= 1 && spaces < 5 && this.ln[this.offset] !== undefined) {return width + spaces;}
    this.column = startCol;
    this.offset = startOffset;
    if (isSpaceOrTab(this.ln[this.offset])) {this.advanceOffset(1, true);}
    return width + 1;
  }

  private addChild(block: Block): void {
    while (!canContain(this.tip.kind, block.kind)) {this.stack.pop();}
    this.tip.hasChild = true;
    this.stack.push(block);
  }

  private closeUnmatched(): void {
    if (!this.allClosed) {
      this.stack.length = this.matched + 1;
      this.allClosed = true;
    }
  }

  private findNextNonspace(): void {
    const ln = this.ln;
    let i = this.offset;
    let cols = this.column;
    for (; i < ln.length; i++) {
      if (ln[i] === ' ') {
        cols++;
      } else if (ln[i] === '\t') {
        cols += 4 - (cols % 4);
      } else {
        break;
      }
    }
    this.blank = i >= ln.length;
    this.nextNonspace = i;
    this.nextNonspaceColumn = cols;
    this.indent = cols - this.column;
    this.indented = this.indent >= CODE_INDENT;
  }

  private advanceNextNonspace(): void {
    this.offset = this.nextNonspace;
    this.column = this.nextNonspaceColumn;
  }

  /** Move `count` characters on (or, with `columns`, `count` columns: a tab may be taken in part). */
  private advanceOffset(count: number, columns: boolean): void {
    let left = count;
    while (left > 0 && this.offset < this.ln.length) {
      if (this.ln[this.offset] !== '\t') {
        this.offset++;
        this.column++;
        left--;
        continue;
      }
      const toTab = 4 - (this.column % 4);
      const partial = columns && toTab > left;
      this.column += partial ? left : toTab;
      this.offset += partial ? 0 : 1;
      left -= columns ? Math.min(toTab, left) : 1;
    }
  }
}
