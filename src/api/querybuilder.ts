import type { QbError, QbRequest, QbResponse } from "@/types/query";

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

export async function submitRequest(request: QbRequest): Promise<QbResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams();

  const response = await fetch(
    `${apiBaseUrl}/querybuilder?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.api+json, application/json",
      },
      body: JSON.stringify(request),
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

  return payload ?? {};
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

export async function getEntityProjections(
  ormBase: string,
  entityType?: string,
  apiBaseUrl?: string,
): Promise<string[]> {
  let apiUrl = `${getApiBaseUrl(apiBaseUrl)}/${ormBase}s/projections`;
  if (ormBase === "node" && entityType !== "any") {
    apiUrl = apiUrl.concat(`?type=${entityType}`);
  }

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  const type = entityType ? entityType : ormBase;

  if (!response.ok) {
    throw new Error(
      `Failed to fetch projections for ${type}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json().catch(() => null)) as string[] | null;

  if (!payload || !Array.isArray(payload)) {
    throw new Error(
      `Invalid response format when fetching projections for ${type}`,
    );
  }

  return Array.from(new Set(payload));
}
