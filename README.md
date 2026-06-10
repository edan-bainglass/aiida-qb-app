# AiiDA QueryBuilder app

A guided React interface for the AiiDA QueryBuilder.

## Overview

This app talks directly to the AiiDA REST API QueryBuilder endpoint. It does not ship a separate backend.

The client defaults to the versioned API prefix used by aiida-restapi:

- local development: `http://127.0.0.1:8000/v0/querybuilder`
- JupyterLab container: the same `/v0/querybuilder` path, with root-path handling already provided by the image

## Development

Install dependencies if needed:

```sh
npm install
```

Run the Vite dev server:

```sh
npm run dev
```

If you want to point the app at a different API base URL, set `VITE_API_BASE_URL` before starting Vite.

## Build

```sh
npm run build
```

## Notes

- The local Vite server proxies `/v0` to `http://127.0.0.1:8000`.
- The app is intentionally frontend-only.
- QueryBuilder requests are posted as JSON to the REST API and results are rendered directly in the browser.
