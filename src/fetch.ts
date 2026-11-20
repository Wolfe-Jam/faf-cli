/**
 * `faf-cli/fetch` — the fetch step of `faf git`, for tools that author a .faf
 * from a URL (the MCP servers). This entry runs git (a shallow clone, no
 * shell); the main `faf-cli` import does not. Author the fetched folder with
 * authorFafFromRepo from `faf-cli`.
 */
export { fetchRepo, FetchRepoError } from './interop/fetch-repo.js';
export type { FetchedRepo, FetchRepoOptions } from './interop/fetch-repo.js';
