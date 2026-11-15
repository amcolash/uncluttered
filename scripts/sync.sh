#!/usr/bin/env bash
set -e

ACTION="${1:-pull}"
NAS_HOST="${NAS_HOST:-nas}"
NAS_DIR="${NAS_DIR:-docker/uncluttered}"
LOCAL_DATA_DIR="./server/data"
REMOTE_DATA_DIR="$NAS_DIR/server/data"

case "$ACTION" in
  pull)
    echo "==> Pulling data from NAS ($NAS_HOST:$REMOTE_DATA_DIR) to local ($LOCAL_DATA_DIR)..."
    mkdir -p "$LOCAL_DATA_DIR"
    if command -v rsync >/dev/null 2>&1; then
      rsync -avz --progress --exclude 'backups' "$NAS_HOST:$REMOTE_DATA_DIR/" "$LOCAL_DATA_DIR/"
    else
      scp -r "$NAS_HOST:$REMOTE_DATA_DIR/*" "$LOCAL_DATA_DIR/"
    fi
    # Also pull .env if it exists on NAS and not locally
    if [ ! -f .env ]; then
      echo "==> Pulling .env from NAS..."
      scp "$NAS_HOST:$NAS_DIR/.env" ./.env 2>/dev/null || true
    fi
    echo "==> Data pull complete!"
    ;;

  push)
    echo "==> Stopping Docker containers on NAS before pushing data..."
    ssh -t "$NAS_HOST" "export PATH=\$PATH:/usr/local/bin && cd '$NAS_DIR' && docker compose stop"

    echo "==> Pushing local data ($LOCAL_DATA_DIR) to NAS ($NAS_HOST:$REMOTE_DATA_DIR)..."
    ssh "$NAS_HOST" "mkdir -p '$REMOTE_DATA_DIR'"
    if command -v rsync >/dev/null 2>&1; then
      rsync -avz --progress --exclude 'backups' "$LOCAL_DATA_DIR/" "$NAS_HOST:$REMOTE_DATA_DIR/"
    else
      scp -r "$LOCAL_DATA_DIR"/* "$NAS_HOST:$REMOTE_DATA_DIR/"
    fi

    if [ -f .env ]; then
      echo "==> Pushing .env to NAS..."
      scp .env "$NAS_HOST:$NAS_DIR/.env"
    fi

    echo "==> Starting Docker containers on NAS..."
    ssh -t "$NAS_HOST" "export PATH=\$PATH:/usr/local/bin && cd '$NAS_DIR' && docker compose up -d"

    echo "==> Data push complete!"
    ;;

  *)
    echo "Usage: npm run sync [pull|push] or ./scripts/sync.sh [pull|push]"
    exit 1
    ;;
esac
