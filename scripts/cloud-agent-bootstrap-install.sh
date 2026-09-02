#!/usr/bin/env sh
# Repo-local Cloud Agent Build install.
# Pins Node from .nvmrc when PATH Node major differs, then npm ci (runs prepare).
set -eu

repo_root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$repo_root"
export CLOUD_AGENT_INSTALL_CMD="npm ci"
exec sh "$repo_root/scripts/cloud-agent-install.sh"
