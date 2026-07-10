/**
 * The `.faf` format series a freshly written file is stamped with — the single
 * source of truth for `faf_version`.
 *
 * Everything that authors a new `.faf` (detect, recover, conductor) and the
 * `migrate` target reads it from here, so the version can never drift file-to-
 * file again. (That drift is exactly what left those paths stranded on the old
 * `2.5.0` while the ecosystem moved to the `3.0` series.)
 */
export const FAF_VERSION = '3.0';
