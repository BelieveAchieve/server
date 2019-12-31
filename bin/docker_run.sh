#!/usr/bin/env bash

mongod &

sleep 5

export NODE_OPTIONS=--max-old-space-size=8192

npm run dev