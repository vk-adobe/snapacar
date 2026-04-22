#!/usr/bin/env bash

PIDFILE=".expo.pid"

if [ ! -f "$PIDFILE" ]; then
  echo "No .expo.pid found. Is Expo running?"
  exit 1
fi

PID=$(cat "$PIDFILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm "$PIDFILE"
  echo "Expo stopped (PID $PID)."
else
  echo "Process $PID is not running. Cleaning up stale PID file."
  rm "$PIDFILE"
fi
