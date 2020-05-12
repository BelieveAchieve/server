#!/usr/bin/env bash
sed -i 's/mongodb:\/\/localhost/mongodb:\/\/db/g' ../config.ts

sleep 15

node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev