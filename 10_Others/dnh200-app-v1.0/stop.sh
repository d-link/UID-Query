#!/usr/bin/env bash
start-stop-daemon -K -n nuclias-core
start-stop-daemon -K -n nuclias-media
start-stop-daemon -K -n nuclias-web
echo "Nuclias Connect services stopped"
exit 0

