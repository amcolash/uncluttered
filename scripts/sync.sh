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
    scp -O "$NAS_HOST:$REMOTE_DATA_DIR/*.json" "$NAS_HOST:$REMOTE_DATA_DIR/*.joblib" "$LOCAL_DATA_DIR/" 2>/dev/null || true

    # Also pull .env if it exists on NAS and not locally
    if [ ! -f .env ]; then
      echo "==> Pulling .env from NAS..."
      scp -O "$NAS_HOST:$NAS_DIR/.env" ./.env 2>/dev/null || true
    fi
    echo "==> Data pull complete!"
    ;;

  push)
    echo "==> Ensuring remote directory and .env exist on NAS..."
    ssh "$NAS_HOST" "mkdir -p '$REMOTE_DATA_DIR'"

    if [ -f .env ]; then
      echo "==> Pushing .env to NAS..."
      scp -O .env "$NAS_HOST:$NAS_DIR/.env"
    fi

    echo "==> Stopping Docker containers on NAS if running..."
    ssh -t "$NAS_HOST" "export PATH=\$PATH:/usr/local/bin && cd '$NAS_DIR' && docker compose stop 2>/dev/null || true"

    echo "==> Adjusting remote permissions on NAS..."
    ssh "$NAS_HOST" "export PATH=\$PATH:/usr/local/bin && cd '$NAS_DIR' && docker compose run --rm --entrypoint chmod server -R 777 /usr/src/app/server/data/ 2>/dev/null || true"

    echo "==> Pushing local data ($LOCAL_DATA_DIR) to NAS ($NAS_HOST:$REMOTE_DATA_DIR)..."
    DATA_FILES=$(find "$LOCAL_DATA_DIR" -maxdepth 1 -type f)
    if [ -n "$DATA_FILES" ]; then
      scp -O $DATA_FILES "$NAS_HOST:$REMOTE_DATA_DIR/"
    fi

    echo "==> Starting Docker containers on NAS (Rebuilding if necessary)..."
    ssh -t "$NAS_HOST" "export PATH=\$PATH:/usr/local/bin && cd '$NAS_DIR' && git pull && docker compose up -d --build"

    echo "==> Data push complete!"
    ;;

  *)
    echo "Usage: npm run sync [pull|push] or ./scripts/sync.sh [pull|push]"
    exit 1
    ;;
esac
