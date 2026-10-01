# frontend build stage
FROM node:lts-alpine AS frontend-build-stage

COPY common /common

WORKDIR /app
COPY frontend/package*.json ./
COPY frontend/public ./public
COPY frontend/scripts ./scripts
COPY frontend/patches ./patches
# install and uninstall the native dependencies in one single docker RUN instruction,
# so they do not increase the image layer size
RUN apk --no-cache add --virtual native-deps g++ make python3 git && npm ci && apk del native-deps
COPY frontend .

RUN npm run build

# production stage
FROM nginx:stable-alpine AS production-stage
RUN mkdir /app
WORKDIR /app
COPY --from=frontend-build-stage /app/dist /app
COPY .docker-hub/frontend/nginx.conf /etc/nginx/nginx.conf
COPY .docker-hub/frontend/docker-entrypoint.d/* /docker-entrypoint.d/
RUN chmod -R +x /docker-entrypoint.d/
