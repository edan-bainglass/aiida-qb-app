# AiiDA `QueryBuilder` app

A guided React interface for the AiiDA `QueryBuilder`.

## Overview

This app talks directly to the AiiDA REST API `QueryBuilder` endpoint. It does not ship a separate backend.

For local development, API routing is controlled by three variables:

- `VITE_REST_API_URL` (example: `http://localhost:8000`)
- `VITE_REST_API_PROXY_ROOT_PATH` (example: `/aiida/api`)
- `VITE_REST_API_VERSION_PREFIX` (example: `/v0`)

With those example values, the browser requests:

- `http://localhost:5173/aiida/api/v0/...`

and Vite proxies to:

- `http://localhost:8000/v0/...`

In the container, app/API proxy paths are hardcoded through `jupyter-server-proxy` configuration.

## Development

Install dependencies if needed:

```sh
npm install
```

Run the Vite dev server:

```sh
npm run dev
```

Create a local `.env` file (you can copy from `.env.example`) with, for example:

```sh
VITE_REST_API_URL=http://localhost:8000
VITE_REST_API_PROXY_ROOT_PATH=/aiida/api
VITE_REST_API_VERSION_PREFIX=/v0
```

In the container image, proxy paths are hardcoded in `.docker/scripts/jupyter_server_config.json`:

- app path: `/apps/querybuilder`
- API proxy base path: `/aiida/api`

## Build

```sh
npm run build
```

## Notes

- The local Vite server proxies `${VITE_REST_API_PROXY_ROOT_PATH}${VITE_REST_API_VERSION_PREFIX}` to `${VITE_REST_API_URL}${VITE_REST_API_VERSION_PREFIX}`.
- The app is intentionally frontend-only.
- QueryBuilder requests are posted as JSON to the REST API and results are rendered directly in the browser.
