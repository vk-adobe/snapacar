#!/usr/bin/env bash
set -e

PIDFILE=".expo.pid"

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "Expo is already running (PID $(cat "$PIDFILE")). Run ./stop-expo.sh first."
  exit 1
fi

echo "Starting Expo..."
npx expo start "$@" &
echo $! > "$PIDFILE"
echo "Expo started (PID $!). Run ./stop-expo.sh to stop."
