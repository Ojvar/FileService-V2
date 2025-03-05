#!/usr/bin/env bash

image_name=file-service
version="$(npm pkg get version | xargs echo)"
remote_repo=docker.qeng.ir/qeng

docker build . -t $image_name:$version

docker tag $image_name:$version $remote_repo/$image_name:$version
docker tag $image_name:$version $remote_repo/$image_name:latest

docker push $remote_repo/$image_name:$version
docker push $remote_repo/$image_name:latest

