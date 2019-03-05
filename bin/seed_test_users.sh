#!/usr/bin/env bash

set -e

# switch to projct root directory
root_dir=$(git rev-parse --show-toplevel)
cd "$root_dir" || exit 1

# seed users from ./seeds/test_users.json
mongoimport \
    --db upchieve \
    --collection users \
    --jsonArray \
    --file ./seeds/test_users.json
