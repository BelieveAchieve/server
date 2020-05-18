#!/usr/bin/env bash

#Alter a line in default config.ts: 
#     database: 'mongodb://localhost:27017/upchieve',
#New line should read
#     database: 'mongodb://db:27017/upchieve',
sed -i 's/mongodb:\/\/localhost/mongodb:\/\/db/g' ../config.ts

sleep 15

npx ts-node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev