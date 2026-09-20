#!/usr/bin/env bash
set -euo pipefail

export DOCKER_BUILDKIT=0

image_name=file-service
version="$(node -p "require('./package.json').version")"
remote_repo="docker.qeng.ir/qeng"

# Default to pushing after 3 seconds
DOCKER_PUSH="${DOCKER_PUSH:-}"

if [[ -z "${DOCKER_PUSH}" ]]; then
    echo
    echo "========================================"
    echo "  Docker Push"
    echo "========================================"
    echo "  0) Keep pushing / skip push"
    echo "  1) Push images"
    echo
    echo -n "Choose [1]: "

    if read -r -t 5 choice; then
        case "${choice}" in
            0)
                DOCKER_PUSH=0
                ;;
            1)
                DOCKER_PUSH=1
                ;;
            *)
                echo "Invalid choice. Defaulting to 1 (push)."
                DOCKER_PUSH=1
                ;;
        esac
    else
        echo
        echo "No choice made after 3 seconds. Defaulting to 1 (push)."
        DOCKER_PUSH=1
    fi
fi


echo "Building ${image_name}:${version}..."
docker build . -t "${image_name}:${version}"

echo "Tagging image..."
docker tag "${image_name}:${version}" "${remote_repo}/${image_name}:${version}"
docker tag "${image_name}:${version}" "${remote_repo}/${image_name}:latest"

if [[ "${DOCKER_PUSH}" == "1" ]]; then
    echo "Pushing ${remote_repo}/${image_name}:${version}..."
    docker push "${remote_repo}/${image_name}:${version}"

    echo "Pushing ${remote_repo}/${image_name}:latest..."
    docker push "${remote_repo}/${image_name}:latest"

    curl -H "x-security-key: change-this-to-a-long-random-secret" "https://api.qeng.ir/auto-deployer/run?component=deploy-v2-file-service"
else
    echo "DOCKER_PUSH is disabled; skipping push."
fi
