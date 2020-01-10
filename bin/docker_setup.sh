#!/usr/bin/env bash

mongod &

sleep 5

bash setup -y

node init