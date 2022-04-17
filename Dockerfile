FROM node:gallium AS build
WORKDIR /app

COPY --chown=node:node ./package* /app/
RUN npm i

COPY --chown=node:node . /app
RUN npm run build

FROM node:gallium
WORKDIR /app

ENV NODE_ENV production

COPY --chown=node:node --from=build /app/out /app
COPY --chown=node:node --from=build /app/node_modules /app/node_modules

RUN npm prune

USER node
ENTRYPOINT [ "node", "/app/index.js" ]