#!/bin/zsh

set -e

PROJECT_DIR=${0:A:h}
PORT=4175
LOG_FILE="/tmp/economics-essay-logic-bank-${PORT}.log"

cd "$PROJECT_DIR"
npm run build

if ! lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory dist >"$LOG_FILE" 2>&1 &
  sleep 1
fi

open -a Safari "http://127.0.0.1:${PORT}/"
