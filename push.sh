#!/bin/bash
# Pre-push quality gate mandated by CLAUDE.md.
# Usage: ./push.sh "commit message in Hebrew"
#
# If no message is supplied, we refuse rather than commit with
# a placeholder — the previous version silently used a stale hard-coded
# string which obscured the actual change.
set -e
cd "$(dirname "$0")"

msg="${1:-}"
if [ -z "$msg" ]; then
  echo "שימוש: ./push.sh \"הודעת commit בעברית\"" >&2
  exit 1
fi

echo "→ npm run lint"
npm run lint

echo "→ npm run typecheck"
npm run typecheck

echo "→ npm test"
npm test

echo "→ npm run build"
npm run build

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$msg"
fi

git push origin master
