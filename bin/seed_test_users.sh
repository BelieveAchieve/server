#!/usr/bin/env bash

set -e

# switch to projct root directory
root_dir=$(git rev-parse --show-toplevel)
cd "$root_dir" || exit 1

if [[ "$UPCHIEVE_SERVER_ENV" == 'production' ]]; then
  echo "ERROR: Don't run this in production."
  exit 1
fi

# seed users from ./seeds/test_users.json
mongoimport \
    --db upchieve \
    --collection users \
    --jsonArray \
    --file ./seeds/test_users.json
