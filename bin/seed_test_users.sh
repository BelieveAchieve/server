#!/usr/bin/env bash

set -e

# seed users from ./seeds/test_users.json
mongoimport \
    --db upchieve \
    --collection users \
    --jsonArray \
    --file ./seeds/test_users.json
