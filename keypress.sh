#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

TMP="/tmp/kowsen-chord-keys"
mkdir -p $TMP
touch $TMP/1
touch $TMP/2
touch $TMP/3
touch $TMP/4

TIME=$(date +%s%N | cut -b1-13)
echo $TIME > $TMP/$1

TIME1=$(< $TMP/1)
TIME2=$(< $TMP/2)
TIME3=$(< $TMP/3)
TIME4=$(< $TMP/4)

TIME1="${TIME1:-0}"
TIME2="${TIME2:-0}"
TIME3="${TIME3:-0}"
TIME4="${TIME4:-0}"

TIME1=$(($TIME - $TIME1))
TIME2=$(($TIME - $TIME2))
TIME3=$(($TIME - $TIME3))
TIME4=$(($TIME - $TIME4))

echo "$TIME1, $TIME2, $TIME3, $TIME4" > $TMP/last-chord

node ./chord.js $TIME1 $TIME2 $TIME3 $TIME4
