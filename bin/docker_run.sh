#!/usr/bin/env bash

#Alter a line in default config.ts: 
#     database: 'mongodb://localhost:27017/upchieve',
#New line should read
#     database: 'mongodb://db:27017/upchieve',
sed -i 's/mongodb:\/\/localhost/mongodb:\/\/db/g' ../config.ts

# Alter a line in default config.ts:
#     redisConnectionString: 'redis://127.0.0.1:6379'
# New line should read
#     redisConnectionString: 'redis://cache:6379'
sed -i 's/redis:\/\/127\.0\.0\.1/redis:\/\/cache/g' ../config.ts

sleep 15

npx ts-node init

export NODE_OPTIONS=--max-old-space-size=5000
npm install bcrypt
npm run dev