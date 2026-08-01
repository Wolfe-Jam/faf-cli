#!/usr/bin/env bash
# Compatibility entry for /pubpro — canonical script is scripts/boris-ready.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/scripts/boris-ready.sh" "$@"
