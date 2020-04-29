#!/usr/bin/env bash
sed -i 's/mongodb:\/\/localhost/mongodb:\/\/db/g' ../config.js

sleep 15

node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev