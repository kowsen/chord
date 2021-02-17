#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

TMP="/tmp/kowsen-chord-keys"
mkdir -p $TMP

ACTIVE_WINDOW="$(xdotool getactivewindow)"
ACTIVE_WORKSPACE="$(wmctrl -d | grep '*' | cut -d ' ' -f1)"

TIME=$(date +%s%N | cut -b1-13)
echo $ACTIVE_WINDOW > $TMP/$1-$ACTIVE_WORKSPACE-save

zenity --notification --text "Chord registered for key $1 on workspace $ACTIVE_WORKSPACE" 
