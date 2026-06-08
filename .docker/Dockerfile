FROM node:current-alpine AS frontend-builder

WORKDIR /build

ARG VITE_REST_API_PROXY_ROOT_PATH=/aiida/api
ARG VITE_REST_API_VERSION_PREFIX=/v0
ENV VITE_REST_API_PROXY_ROOT_PATH=${VITE_REST_API_PROXY_ROOT_PATH} \
    VITE_REST_API_VERSION_PREFIX=${VITE_REST_API_VERSION_PREFIX}

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts eslint.config.js index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM quay.io/jupyter/minimal-notebook:python-3.12

RUN mamba install -y jupyter-server-proxy && \
    mamba clean -afy

RUN pip install --no-cache-dir git+https://github.com/edan-bainglass/aiida-restapi.git@base-url

RUN verdi presto

COPY .docker/scripts/jupyter_server_config.json /etc/jupyter/jupyter_server_config.json

RUN mkdir -p /home/jovyan/aiida-qb-app
COPY --from=frontend-builder /build/dist/ /home/jovyan/aiida-qb-app/
