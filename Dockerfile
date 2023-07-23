## BUILD STAGE
# Check out https://hub.docker.com/_/node to select a new base image
FROM docker.qeng.ir/node:18-slim AS stage_env_prepare
RUN npm i -g npm@latest
USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node package*.json ./
RUN npm install --loglevel verbose

COPY --chown=node . .
RUN npm run build

## DEPLOY STAGE
FROM docker.qeng.ir/node:18-slim as stage_deploy
RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install -y curl \
    && apt-get clean autoclean \
    && apt-get autoremove --yes \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/

WORKDIR /home/node/app
COPY --from=stage_env_prepare "/home/node/app/public" /home/node/app/public/
COPY --from=stage_env_prepare "/home/node/app/node_modules" /home/node/app/node_modules/
COPY --from=stage_env_prepare "/home/node/app/dist" /home/node/app/dist
COPY --from=stage_env_prepare "/home/node/app/package*.json" "/home/node/app/.env" "/home/node/app/keycloak.json" /home/node/app

ENV HOST=0.0.0.0 PORT=80
EXPOSE ${PORT}
CMD [ "node", "." ]

## HEALTH CHECK
HEALTHCHECK CMD curl --insecure http://localhost/ping
