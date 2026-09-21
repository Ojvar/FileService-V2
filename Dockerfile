ARG NODE_BASE_IMAGE=docker.qeng.ir/node:24-slim

## BUILD STAGE
FROM $NODE_BASE_IMAGE AS stage_env_prepare
USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node package*.json ./
RUN yarn install --loglevel verbose
COPY --chown=node . .
RUN yarn build

## DEPLOY STAGEyarn
FROM $NODE_BASE_IMAGE AS stage_deploy
RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get install -y curl \
    && apt-get clean autoclean \
    && apt-get autoremove --yes \
    && rm -rf /var/lib/{apt,dpkg,cache,log}/

WORKDIR /home/node/app
COPY --from=stage_env_prepare /home/node/app/public /home/node/app/public
COPY --from=stage_env_prepare /home/node/app/node_modules /home/node/app/node_modules
COPY --from=stage_env_prepare /home/node/app/dist /home/node/app/dist
COPY --from=stage_env_prepare /home/node/app/package*.json /home/node/app/keycloak.json /home/node/app/

ENV NODE_ENV=production
#ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE $PORT
CMD [ "node", "." ]

## HEALTH CHECK
# HEALTHCHECK CMD curl --insecure http://localhost/ping
