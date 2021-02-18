#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

node ./ghost.js $1
