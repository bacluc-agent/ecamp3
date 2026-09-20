# build stage
FROM node:24.20.0 AS build-stage

COPY common /common

WORKDIR /app

COPY print/package*.json ./

RUN npm ci

COPY print .
RUN npm run build

# production stage
FROM node:24.20.0 AS production-stage
WORKDIR /app

COPY --from=build-stage /app/.output ./.output

ENV NITRO_HOST 0.0.0.0
ENV NITRO_PORT 80

EXPOSE 80
CMD node ./.output/server/index.mjs
