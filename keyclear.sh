#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

TMP="/tmp/kowsen-chord-keys"
mkdir -p $TMP
rm $TMP/*

zenity --notification --text "Chords cleared" 
