#!/usr/bin/env bash
bash setup -y

node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev