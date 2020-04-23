#!/usr/bin/env bash
sed -i 's/mongodb:\/\/localhost/mongodb:\/\/host.docker.internal/g' ../config.js

node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev