#!/bin/bash -e

# build stage script for Auto-DevOps

apk add --update curl tar
(curl -sSL "https://github.com/buildpacks/pack/releases/download/v0.15.1/pack-v0.15.1-linux.tgz" | tar -C /usr/local/bin/ --no-same-owner -xzv pack)

if ! docker info &>/dev/null; then
  if [ -z "$DOCKER_HOST" ] && [ "$KUBERNETES_PORT" ]; then
    export DOCKER_HOST='tcp://localhost:2375'
  fi
fi

if [[ -n "$CI_REGISTRY" && -n "$CI_REGISTRY_USER" ]]; then
  echo "Logging to GitLab Container Registry with CI credentials..."
  echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
fi

image_tagged="$CI_APPLICATION_REPOSITORY:$CI_APPLICATION_TAG"
image_latest="$CI_APPLICATION_REPOSITORY:latest"

builder=${AUTO_DEVOPS_BUILD_IMAGE_CNB_BUILDER:-"heroku/buildpacks:18"}
echo "Building Cloud Native Buildpack-based application with builder ${builder}..."
pack build "$image_tagged" \
  --clear-cache \
  --builder "$builder" \
  --buildpack registry.gitlab.com/upchieve/doppler-buildpack \
  --buildpack heroku/nodejs \
  --buildpack heroku/procfile \
  --env "NODE_ENV=production"

docker tag "$image_tagged" "$image_latest"

docker push "$image_tagged"
docker push "$image_latest"
