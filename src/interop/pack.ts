/**
 * The card pack: a few answers in, a `.fafa` written from them, and every card
 * that `.fafa` can feed projected out: the A2A Agent Card, the MCP Server
 * Card, the MCP Registry `server.json`, an AI Catalog and an ARD manifest.
 *
 * Pure: no filesystem and no Node built-ins, so the same code runs in the CLI,
 * in a browser front door and in tests. Neutral by default: a card carries an
 * extension (FAF's or anyone's) only when the caller passes one. `faf cards`
 * passes FAF's own for FAF's agent (see `buildA2ACard` in cards.ts).
 */
import { stringify } from 'yaml';

export const A2A_PROTOCOL_BINDING = 'JSONRPC';
export const A2A_PROTOCOL_VERSION = '1.0';
/** The three FAF-family media types, in family order. */
export const FAF_MEDIA_TYPES = [
  'application/vnd.faf+yaml',
  'application/vnd.fafm+yaml',
  'application/vnd.fafa+yaml',
] as const;
/** The only `$schema` a Server Card may carry (modelcontextprotocol/ext-server-card). */
export const SERVER_CARD_SCHEMA = 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json';
/** The dated registry schema a `server.json` declares (latest release 2025-12-11). */
export const SERVER_JSON_SCHEMA = 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json';
export const AI_CATALOG_SPEC_VERSION = '1.0';
export const FAFA_SPEC_VERSION = '1.0';
/** Media types a catalog entry uses for each card it lists (AI Catalog's own list). */
export const CARD_MEDIA_TYPES = {
  a2a: 'application/a2a-agent-card+json',
  server_card: 'application/mcp-server-card+json',
  fafa: 'application/vnd.fafa+yaml',
} as const;

export interface FafaAgent {
  name?: string;
  displayName?: string;
  id?: string;
  vendor?: string;
  version?: string;
  description?: string;
  homepage?: string;
  license?: string;
}

export interface FafaCapability {
  name?: string;
  type?: string;
  description?: string;
  tags?: unknown;
  /** MIME type this capability reads, when it's one of the FAF family — drives the skill's `inputModes` and the card's `defaultInputModes`. */
  cites_spec?: string;
}

export interface FafaEndpoint {
  protocol?: string;
  transport?: string;
  location?: string;
  version?: string;
}

/** Facts only some cards carry, kept in the `.fafa` under `metadata.cards` so the file stays the one source. */
export interface PackExtras {
  domain?: string;
  repository?: string;
  icon?: string;
  organizationUrl?: string;
  keywords?: string[];
  examples?: string[];
  packages?: PackPackage[];
}

export interface PackPackage {
  registryType: string;
  identifier: string;
  version?: string;
}

export interface FafaDoc {
  /** `.fafa` spec version this document is authored against, e.g. `"1.0"` — not `agent.version`. */
  version?: string;
  agent?: FafaAgent;
  capabilities?: FafaCapability[];
  endpoints?: FafaEndpoint[];
  provenance?: Record<string, unknown>;
  metadata?: { persona?: string; cards?: PackExtras; [key: string]: unknown };
  [key: string]: unknown;
}

export interface A2AExtension {
  uri: string;
  description: string;
  required: boolean;
  params: Record<string, unknown>;
}

export interface ProjectedA2A {
  name: string;
  description: string;
  supportedInterfaces: Array<{
    url: string;
    protocolBinding: string;
    protocolVersion: string;
  }>;
  /** Omitted entirely when `agent.vendor` or `agent.homepage` is absent — A2A optional, never a guessed org name. */
  provider?: { organization: string; url: string };
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
    extensions: A2AExtension[];
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    inputModes?: string[];
  }>;
}

export function a2aEndpoints(fafa: FafaDoc): FafaEndpoint[] {
  return (fafa.endpoints ?? []).filter(
    (e) => String(e.protocol ?? '').toLowerCase() === 'a2a' && e.location,
  );
}

/** Authored A2A endpoints, else a single `doorUrl`. Never invents a door. */
export function a2aDoors(fafa: FafaDoc, opts: { doorUrl?: string } = {}): FafaEndpoint[] {
  const fromDoc = a2aEndpoints(fafa);
  if (fromDoc.length > 0) {return fromDoc;}
  const door = opts.doorUrl?.trim();
  if (door) {
    return [{ protocol: 'a2a', location: door, version: A2A_PROTOCOL_VERSION }];
  }
  return [];
}

/** `text/plain` plus any FAF media type a capability's `cites_spec` names. */
function defaultA2AInputModes(fafa: FafaDoc): string[] {
  const cited = new Set<string>();
  for (const c of fafa.capabilities ?? []) {
    if (c.cites_spec && (FAF_MEDIA_TYPES as readonly string[]).includes(c.cites_spec)) {
      cited.add(c.cites_spec);
    }
  }
  return ['text/plain', ...cited];
}

/**
 * The A2A Agent Card from a `.fafa`: every field comes from the document, and
 * `capabilities.extensions` holds exactly the extensions passed (none by default).
 */
export function projectA2ACard(
  fafa: FafaDoc,
  opts: { doorUrl?: string; extensions?: A2AExtension[] } = {},
): ProjectedA2A {
  const agent = fafa.agent ?? {};
  const doors = a2aDoors(fafa, opts);
  if (doors.length === 0) {
    throw new Error(
      "No A2A endpoint in .fafa (need endpoints[].protocol: a2a + location). Will not invent a door.",
    );
  }
  const name = String(agent.displayName ?? fafa.metadata?.persona ?? agent.name ?? '').trim();
  const description = String(agent.description ?? '').trim();
  const version = String(agent.version ?? '').trim();
  if (!name || !description || !version) {
    throw new Error('A2A card needs agent.displayName|name, description, version in .fafa');
  }
  // provider is A2A-optional: emit it only when both halves are real, never a guessed org name.
  const organization = String(agent.vendor ?? '').trim();
  const homepage = String(agent.homepage ?? '').trim();
  const provider = organization && homepage ? { organization, url: homepage } : undefined;

  const skills = (fafa.capabilities ?? []).map((c) => {
    const id = String(c.name ?? '').trim();
    if (!id) {throw new Error('A2A skill missing capabilities[].name');}
    const tags = Array.isArray(c.tags) ? c.tags.map(String) : [];
    const inputModes =
      c.cites_spec && (FAF_MEDIA_TYPES as readonly string[]).includes(c.cites_spec)
        ? [c.cites_spec, 'text/plain']
        : undefined;
    return {
      id,
      name: id,
      description: String(c.description ?? '').trim() || id,
      tags,
      ...(inputModes ? { inputModes } : {}),
    };
  });

  return {
    name,
    description,
    supportedInterfaces: doors.map((e) => ({
      url: String(e.location),
      protocolBinding: A2A_PROTOCOL_BINDING,
      protocolVersion: String(e.version ?? A2A_PROTOCOL_VERSION),
    })),
    ...(provider ? { provider } : {}),
    version,
    capabilities: {
      // Endpoint existence isn't streaming support: FAFA's A2A door explicitly
      // errors message/stream today (-32004). Advertising true would be a
      // claim the door can't back up. Flip this only once a real per-door
      // streaming signal exists in .fafa/project.faf to key off of.
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
      extensions: [...(opts.extensions ?? [])],
    },
    defaultInputModes: defaultA2AInputModes(fafa),
    defaultOutputModes: ['text/plain', 'application/json'],
    skills,
  };
}

// ---------------------------------------------------------------------------
// Answers → .fafa
// ---------------------------------------------------------------------------

/** What someone tells the front door. Keys match the crosswalk's slot ids. */
export interface PackAnswers {
  display_name: string;
  handle: string;
  domain: string;
  description: string;
  version: string;
  endpoints?: Array<{ protocol: string; url: string }>;
  skills?: Array<{ name: string; description?: string; type?: string }>;
  organization?: string;
  organization_url?: string;
  homepage?: string;
  icon?: string;
  repository?: string;
  license?: string;
  tags?: string[];
  example_requests?: string[];
  packages?: PackPackage[];
}

const HANDLE_RE = /^[a-z0-9][a-z0-9._-]*$/;
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function clean(s: unknown): string {
  return String(s ?? '').trim();
}

function list(xs: unknown): string[] {
  return Array.isArray(xs) ? xs.map(clean).filter(Boolean) : [];
}

/** A domain as typed ("https://www.Example.com/about") reduced to the name ("example.com"). */
function normaliseDomain(raw: unknown): string {
  return clean(raw).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
}

function checkIdentity(a: PackAnswers, handle: string, domain: string): void {
  const missing = (['display_name', 'description', 'version'] as const).filter((k) => !clean(a[k]));
  if (missing.length) {throw new Error(`Missing answer: ${missing.join(', ')}`);}
  if (!HANDLE_RE.test(handle)) {throw new Error('Short name: lowercase letters, digits, dots, hyphens or underscores.');}
  if (!DOMAIN_RE.test(domain)) {throw new Error(`Domain "${a.domain}" is not a domain name (e.g. example.com).`);}
}

function capabilitiesFrom(a: PackAnswers, keywords: string[]): FafaCapability[] {
  return (a.skills ?? [])
    .filter((s) => clean(s.name))
    .map((s) => ({
      name: clean(s.name),
      type: clean(s.type) || 'tool',
      description: clean(s.description) || clean(s.name),
      // A2A requires tags on every skill: the keywords, else the skill's own name.
      tags: keywords.length ? keywords : [clean(s.name).toLowerCase()],
    }));
}

function packagesFrom(a: PackAnswers): PackPackage[] {
  return (a.packages ?? [])
    .filter((p) => clean(p.registryType) && clean(p.identifier))
    .map((p) => ({
      registryType: clean(p.registryType),
      identifier: clean(p.identifier),
      ...(clean(p.version) ? { version: clean(p.version) } : {}),
    }));
}

function endpointsFrom(a: PackAnswers, packages: PackPackage[]): FafaEndpoint[] {
  const endpoints: FafaEndpoint[] = [
    ...(a.endpoints ?? [])
      .filter((e) => clean(e.url))
      .map((e) => ({ protocol: clean(e.protocol).toLowerCase(), transport: 'http', location: clean(e.url) })),
    ...packages.map((p) => ({ protocol: 'mcp', transport: 'stdio', location: p.identifier })),
  ];
  if (endpoints.length === 0) {throw new Error('Missing answer: endpoints (a URL, or a package people install)');}
  return endpoints;
}

function extrasFrom(a: PackAnswers, domain: string, keywords: string[], packages: PackPackage[]): PackExtras {
  const extras: PackExtras = { domain };
  const optional: Array<[keyof PackExtras, string]> = [
    ['repository', clean(a.repository)],
    ['icon', clean(a.icon)],
    ['organizationUrl', clean(a.organization_url)],
  ];
  for (const [key, value] of optional) {
    if (value) {(extras as Record<string, unknown>)[key] = value;}
  }
  if (keywords.length) {extras.keywords = keywords;}
  const examples = list(a.example_requests);
  if (examples.length) {extras.examples = examples;}
  if (packages.length) {extras.packages = packages;}
  return extras;
}

/** Write the `.fafa` a set of answers describes. Throws, naming the answer, when one is missing or malformed. */
export function answersToFafa(a: PackAnswers): FafaDoc {
  const handle = clean(a.handle).toLowerCase();
  const domain = normaliseDomain(a.domain);
  checkIdentity(a, handle, domain);
  const keywords = list(a.tags);
  const packages = packagesFrom(a);
  const agent: FafaAgent = {
    name: handle,
    displayName: clean(a.display_name),
    id: `urn:air:${domain}:agent:${handle}`,
    ...(clean(a.organization) ? { vendor: clean(a.organization) } : {}),
    version: clean(a.version),
    description: clean(a.description),
    homepage: clean(a.homepage) || `https://${domain}`,
    ...(clean(a.license) ? { license: clean(a.license) } : {}),
  };
  return {
    version: FAFA_SPEC_VERSION,
    agent,
    capabilities: capabilitiesFrom(a, keywords),
    endpoints: endpointsFrom(a, packages),
    metadata: { cards: extrasFrom(a, domain, keywords, packages) },
  };
}

/** The `.fafa` as the YAML document people keep. */
export function fafaYaml(fafa: FafaDoc): string {
  return stringify(fafa, { lineWidth: 0 });
}

// ---------------------------------------------------------------------------
// .fafa → the other cards
// ---------------------------------------------------------------------------

/** Where the `.fafa` says it is published: `agent.id` (urn:air), else metadata, else the homepage host. */
export function fafaDomain(fafa: FafaDoc): string {
  const id = clean(fafa.agent?.id);
  const m = /^urn:air:([^:]+):/.exec(id);
  if (m) {return m[1];}
  const fromExtras = clean(fafa.metadata?.cards?.domain);
  if (fromExtras) {return fromExtras;}
  try {
    return new URL(clean(fafa.agent?.homepage)).hostname.replace(/^www\./, '');
  } catch {
    throw new Error('The .fafa names no domain (agent.id urn:air, metadata.cards.domain or agent.homepage).');
  }
}

/** The stable short name a card is filed under: `agent.name`, lowercased and
 *  reduced to the characters an identifier may carry. The `{name}` of
 *  `urn:air:{publisher}:{namespace}:{name}` — never a display string. */
export function fafaHandle(fafa: FafaDoc): string {
  return handleOf(fafa);
}

function handleOf(fafa: FafaDoc): string {
  const h = clean(fafa.agent?.name).toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/^-+|-+$/g, '');
  if (!h) {throw new Error('The .fafa needs agent.name (the short name).');}
  return h;
}

/** MCP names are reverse-DNS: example.com + weather → com.example/weather. */
export function mcpName(fafa: FafaDoc): string {
  return `${fafaDomain(fafa).split('.').reverse().join('.')}/${handleOf(fafa)}`;
}

/** Server Card and registry descriptions and titles cap at 100 characters. */
function cap100(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= 100 ? t : `${t.slice(0, 97).trimEnd()}...`;
}

function mcpRemotes(fafa: FafaDoc): Array<{ type: string; url: string }> {
  return (fafa.endpoints ?? [])
    .filter((e) => clean(e.protocol).toLowerCase() === 'mcp' && /^https?:\/\//.test(clean(e.location)))
    .map((e) => ({ type: 'streamable-http', url: clean(e.location) }));
}

function repositoryOf(url: string): { url: string; source: string } | undefined {
  if (!url) {return undefined;}
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return { url, source: host.split('.')[0] };
  } catch {
    return undefined;
  }
}

/** Identity shared by the Server Card and the registry entry. */
function mcpIdentity(fafa: FafaDoc): Record<string, unknown> {
  const agent = fafa.agent ?? {};
  const extras = fafa.metadata?.cards ?? {};
  const description = clean(agent.description);
  const version = clean(agent.version);
  if (!description || !version) {throw new Error('An MCP card needs agent.description and agent.version in .fafa');}
  const out: Record<string, unknown> = {
    name: mcpName(fafa),
    version,
    description: cap100(description),
  };
  const title = clean(agent.displayName);
  if (title) {out.title = cap100(title);}
  const homepage = clean(agent.homepage);
  if (homepage) {out.websiteUrl = homepage;}
  const repo = repositoryOf(clean(extras.repository));
  if (repo) {out.repository = repo;}
  if (clean(extras.icon)) {out.icons = [{ src: clean(extras.icon) }];}
  return out;
}

/** The MCP Server Card for a remote MCP server. */
export function projectServerCard(fafa: FafaDoc): Record<string, unknown> {
  const remotes = mcpRemotes(fafa);
  if (remotes.length === 0) {
    throw new Error('A Server Card describes a remote MCP server: the .fafa has no mcp endpoint at an http(s) URL.');
  }
  return { $schema: SERVER_CARD_SCHEMA, ...mcpIdentity(fafa), remotes };
}

/** The MCP Registry `server.json` (publishing it stays the owner's step). */
export function projectServerJson(fafa: FafaDoc): Record<string, unknown> {
  const remotes = mcpRemotes(fafa);
  const packages = (fafa.metadata?.cards?.packages ?? []).map((p) => ({
    registryType: clean(p.registryType),
    identifier: clean(p.identifier),
    ...(clean(p.version) ? { version: clean(p.version) } : {}),
    transport: { type: 'stdio' },
  }));
  if (remotes.length === 0 && packages.length === 0) {
    throw new Error('A registry entry needs a package people install or a remote MCP URL.');
  }
  return {
    $schema: SERVER_JSON_SCHEMA,
    ...mcpIdentity(fafa),
    ...(packages.length ? { packages } : {}),
    ...(remotes.length ? { remotes } : {}),
  };
}

export type PackCard = 'a2a' | 'server_card' | 'server_json' | 'ai_catalog' | 'ard' | 'fafa';

export interface CatalogRow {
  identifier: string;
  displayName: string;
  type: string;
  description: string;
  url: string;
  version?: string;
  updatedAt: string;
}

/** One row per card the domain serves: the A2A card, the Server Card, and the `.fafa` only when asked. */
export function catalogRows(fafa: FafaDoc, cards: PackCard[], opts: { now?: string; listFafa?: boolean } = {}): CatalogRow[] {
  const domain = fafaDomain(fafa);
  const handle = handleOf(fafa);
  const agent = fafa.agent ?? {};
  const displayName = clean(agent.displayName) || clean(agent.name);
  const description = clean(agent.description);
  const version = clean(agent.version);
  const now = opts.now ?? new Date().toISOString();
  const row = (ns: string, type: string, url: string): CatalogRow => ({
    identifier: `urn:air:${domain}:${ns}:${handle}`,
    displayName,
    type,
    description,
    url,
    ...(version ? { version } : {}),
    updatedAt: now,
  });
  const rows: CatalogRow[] = [];
  if (cards.includes('a2a')) {rows.push(row('a2a', CARD_MEDIA_TYPES.a2a, `https://${domain}/.well-known/agent-card.json`));}
  if (cards.includes('server_card')) {
    const remote = mcpRemotes(fafa)[0];
    if (remote) {rows.push(row('mcp', CARD_MEDIA_TYPES.server_card, `${remote.url.replace(/\/+$/, '')}/server-card`));}
  }
  if (opts.listFafa) {rows.push(row('agent', CARD_MEDIA_TYPES.fafa, `https://${domain}/.well-known/fafa`));}
  return rows;
}

/** Who publishes a catalog: AI Catalog's `host` object. */
export interface CatalogHost {
  displayName: string;
  identifier?: string;
}

/**
 * The catalog's `host` — who publishes these entries. Naming one is what
 * lifts a catalog from Level 1 "minimal" to Level 2 "discoverable", and
 * `displayName` is the field that does it: the validator takes an empty one
 * as *invalid*, not as minimal. So a `.fafa` that names nobody gets no host
 * at all — a minimal catalog that validates beats a discoverable one that
 * does not. `identifier` rides along whenever the `.fafa` says where it
 * lives, and is left off when it does not.
 */
export function catalogHost(fafa: FafaDoc): CatalogHost | undefined {
  const agent = fafa.agent ?? {};
  const displayName = clean(agent.vendor) || clean(agent.displayName) || clean(agent.name);
  if (!displayName) {return undefined;}
  let identifier: string | undefined;
  try {
    identifier = fafaDomain(fafa);
  } catch {
    identifier = undefined;
  }
  return { displayName, ...(identifier ? { identifier } : {}) };
}

/** The AI Catalog for the domain: every row above, with the host named. */
export function projectAiCatalog(fafa: FafaDoc, cards: PackCard[], opts: { now?: string; listFafa?: boolean } = {}): Record<string, unknown> {
  const host = catalogHost(fafa);
  return {
    specVersion: AI_CATALOG_SPEC_VERSION,
    ...(host ? { host } : {}),
    entries: catalogRows(fafa, cards, opts),
  };
}

/** The ARD manifest: the same rows, plus the search hints ARD reads (keywords, example requests). */
export function projectArd(fafa: FafaDoc, cards: PackCard[], opts: { now?: string; listFafa?: boolean } = {}): Record<string, unknown> {
  const extras = fafa.metadata?.cards ?? {};
  const tags = list(extras.keywords);
  const queries = list(extras.examples);
  return {
    entries: catalogRows(fafa, cards, opts).map((r) => ({
      ...r,
      ...(tags.length ? { tags } : {}),
      ...(queries.length ? { representativeQueries: queries } : {}),
    })),
  };
}

export interface PackOptions {
  /** Which cards to build; the `.fafa` is always written. */
  cards: PackCard[];
  /** `updatedAt` for catalog rows (tests); otherwise now. */
  now?: string;
  /** List the `.fafa` itself in the catalog and ARD manifest (it is then served at /.well-known/fafa). */
  listFafa?: boolean;
  /** Extensions to put on the A2A card; none by default. */
  a2aExtensions?: A2AExtension[];
}

export interface Pack {
  fafa: FafaDoc;
  fafaText: string;
  a2a?: ProjectedA2A;
  server_card?: Record<string, unknown>;
  server_json?: Record<string, unknown>;
  ai_catalog?: Record<string, unknown>;
  ard?: Record<string, unknown>;
}

/** Every card a `.fafa` can feed, for the cards asked. */
export function projectPack(fafa: FafaDoc, opts: PackOptions): Pack {
  const want = new Set(opts.cards);
  const pack: Pack = { fafa, fafaText: fafaYaml(fafa) };
  if (want.has('a2a')) {pack.a2a = projectA2ACard(fafa, { extensions: opts.a2aExtensions });}
  if (want.has('server_card')) {pack.server_card = projectServerCard(fafa);}
  if (want.has('server_json')) {pack.server_json = projectServerJson(fafa);}
  const rowOpts = { now: opts.now, listFafa: opts.listFafa };
  if (want.has('ai_catalog')) {pack.ai_catalog = projectAiCatalog(fafa, opts.cards, rowOpts);}
  if (want.has('ard')) {pack.ard = projectArd(fafa, opts.cards, rowOpts);}
  return pack;
}

/** Answers in, the `.fafa` and every card asked for out. */
export function buildPack(answers: PackAnswers, opts: PackOptions): Pack {
  return projectPack(answersToFafa(answers), opts);
}
