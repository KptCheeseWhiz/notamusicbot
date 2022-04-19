FROM node:gallium AS build
WORKDIR /app

COPY ./package* /app/
RUN npm i

COPY . /app
RUN npm run build

FROM node:gallium
WORKDIR /app

ENV NODE_ENV production

COPY --from=build /app/out /app
COPY --from=build /app/node_modules /app/node_modules

RUN npm prune

USER node
ENTRYPOINT [ "node", "/app/index.js" ]