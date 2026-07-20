#!/bin/bash
set -euo pipefail

# Only needed in Claude Code on the web: the remote container clones just the
# session branch, so origin/main is missing until explicitly fetched.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Make main (and the other branches) available in every session.
git fetch origin main
git fetch origin --prune || true

npm install
