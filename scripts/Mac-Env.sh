#!/bin/bash
set -euo pipefail
if [ "$(uname -s)" != Darwin ]; then
  echo "These commands require macOS. Use TEAMMATE_SETUP.md for Windows." >&2
  exit 1
fi
if [ "$(sw_vers -productVersion | cut -d. -f1)" -lt 14 ]; then
  echo "MongoDB 8.0 requires macOS 14 or later. Send your macOS version to the team." >&2
  exit 1
fi
case "$(uname -m)" in
  arm64) NODE_ARCH=arm64; MONGO_ARCH=arm64 ;;
  x86_64) NODE_ARCH=x64; MONGO_ARCH=x86_64 ;;
  *) echo "Unsupported Mac processor." >&2; exit 1 ;;
esac
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$REPO_DIR/.demo"
NODE_DIR="$STATE_DIR/tools/node-v22.23.3-darwin-$NODE_ARCH"
MONGO_DIR="$STATE_DIR/tools/mongodb-macos-$MONGO_ARCH-8.0.20"
mkdir -p "$STATE_DIR/tmp"
export TMPDIR="$STATE_DIR/tmp"
export PATH="$NODE_DIR/bin:$PATH"
export npm_config_cache="$STATE_DIR/npm-cache"
export npm_config_userconfig="$STATE_DIR/npmrc"
export npm_config_globalconfig="$STATE_DIR/npm-global.rc"
export npm_config_update_notifier=false
cd "$REPO_DIR"
