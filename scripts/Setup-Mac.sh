#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/Mac-Env.sh"
mkdir -p "$STATE_DIR/tools" "$STATE_DIR/downloads"
case "$NODE_ARCH" in
  arm64)
    NODE_HASH=23b25245dcfb9af7262f8ff142e9e2e0af025368117329e7a7458a51e5922f53
    MONGO_HASH=3aeda22011446292a48c1633b4fc74ae566bd4f0b8dd663f69b0ce4cbfd18566 ;;
  x64)
    NODE_HASH=8a677b0219178efd6eb0e475457c4afb452b521a92f6e67845a73bd85727f2a8
    MONGO_HASH=0cddcee05d2b1f5ca55251e205ed6c4072d223fc9359c1bf8d2ad15f3f406f74 ;;
esac
download_runtime() {
  local url="$1" archive="$2" hash="$3" destination="$4"
  echo "Downloading $(basename "$archive"). Please wait."
  curl --fail --location --retry 3 --output "$archive" "$url"
  if ! printf '%s  %s\n' "$hash" "$archive" | shasum -a 256 -c -; then
    echo "Download verification failed. Run setup again." >&2
    exit 1
  fi
  mkdir -p "$destination"
  tar -xzf "$archive" -C "$destination" --strip-components=1
  rm "$archive"
}
if [ ! -x "$NODE_DIR/bin/node" ]; then
  download_runtime "https://nodejs.org/dist/v22.23.3/node-v22.23.3-darwin-$NODE_ARCH.tar.gz" "$STATE_DIR/downloads/node.tar.gz" "$NODE_HASH" "$NODE_DIR"
fi
if [ ! -x "$MONGO_DIR/bin/mongod" ]; then
  download_runtime "https://fastdl.mongodb.org/osx/mongodb-macos-$MONGO_ARCH-8.0.20.tgz" "$STATE_DIR/downloads/mongodb.tgz" "$MONGO_HASH" "$MONGO_DIR"
fi
"$NODE_DIR/bin/node" --version
"$MONGO_DIR/bin/mongod" --version
npm run setup
npm run init:demo
echo "SETUP COMPLETE. Next: bash scripts/Run-Mac.sh database"
