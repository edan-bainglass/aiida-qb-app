import type { QbRequest, QbOptions, QbResponse, QbError } from "@/types/query";

export function normalizePathPrefix(
  value: string | undefined,
  fallback: string = "",
): string {
  const raw = (value ?? fallback).trim();
  if (!raw) {
    return fallback;
  }
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/$/, "") || "/";
}

function getApiBaseUrl(apiBaseUrl?: string): string {
  const configuredProxyRootPath = normalizePathPrefix(
    import.meta.env.VITE_REST_API_PROXY_ROOT_PATH,
  );
  const configuredVersionPrefix = normalizePathPrefix(
    import.meta.env.VITE_REST_API_VERSION_PREFIX,
  );

  return (
    apiBaseUrl ?? `${configuredProxyRootPath}${configuredVersionPrefix}`
  ).replace(/\/$/, "");
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const response = payload as {
    detail?: unknown;
    message?: unknown;
    errors?: unknown;
  };

  if (typeof response.message === "string" && response.message.trim()) {
    return response.message;
  }

  if (typeof response.detail === "string" && response.detail.trim()) {
    return response.detail;
  }

  if (Array.isArray(response.detail) && response.detail.length > 0) {
    const firstDetail = response.detail[0];

    if (firstDetail && typeof firstDetail === "object") {
      const detailItem = firstDetail as {
        msg?: unknown;
        message?: unknown;
        loc?: unknown;
      };

      if (typeof detailItem.message === "string") {
        return detailItem.message;
      }

      if (typeof detailItem.msg === "string") {
        return detailItem.msg;
      }

      if (Array.isArray(detailItem.loc)) {
        return `${detailItem.loc.join(".")}: validation failed`;
      }
    }
  }

  if (typeof response.errors === "string") {
    return response.errors;
  }

  return fallback;
}

export async function submitRequest(
  request: QbRequest,
  options: QbOptions = {},
): Promise<{
  results: unknown[];
  meta: { total: number; page: number; pageSize: number };
}> {
  const apiBaseUrl = getApiBaseUrl(options.apiBaseUrl);
  const params = new URLSearchParams();

  if (options.flat ?? true) {
    params.set("flat", "true");
  }

  if (options.full) {
    params.set("full", "true");
  }

  const response = await fetch(
    `${apiBaseUrl}/querybuilder?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.api+json, application/json",
      },
      body: JSON.stringify(request),
      signal: options.signal,
    },
  );

  const payload = (await response
    .json()
    .catch(() => null)) as QbResponse | null;

  if (!response.ok) {
    throw {
      message: readErrorMessage(
        payload,
        `QueryBuilder request failed with status ${response.status}`,
      ),
      details: payload,
    } satisfies QbError;
  }

  const meta = payload?.meta ?? {};
  const results = payload?.data?.attributes?.results ?? [];

  return {
    results,
    meta: {
      total: meta.total ?? results.length,
      page: meta.page ?? 1,
      pageSize: meta.page_size ?? request.limit ?? results.length,
    },
  };
}

export async function getNodeTypes(apiBaseUrl?: string): Promise<string[]> {
  const apiUrl = `${getApiBaseUrl(apiBaseUrl)}/nodes/types`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch node types: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { node_type: string }[]
    | null;

  if (!payload || !Array.isArray(payload)) {
    throw new Error("Invalid response format when fetching node types");
  }

  return payload.map((item) => item.node_type);
}
