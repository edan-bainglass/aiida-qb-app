export type QueryBuilderPathItem = {
  entity_type: string | string[];
  orm_base: string;
  tag?: string;
  joining_keyword?: string;
  joining_value?: string;
  edge_tag?: string;
  outerjoin?: boolean;
};

export type QueryBuilderRequest = {
  path: Array<string | QueryBuilderPathItem>;
  filters?: Record<string, unknown>;
  project?: Record<string, string | string[]>;
  limit?: number;
  offset?: number;
  order_by?: string | string[] | Record<string, unknown>;
  distinct?: boolean;
};

export type QueryBuilderResponse = {
  data?: {
    attributes?: {
      results?: unknown[];
    };
    meta?: {
      total?: number;
      page?: number;
      page_size?: number;
    };
  };
  results?: unknown[];
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
};

export type QueryBuilderRunOptions = {
  flat?: boolean;
  full?: boolean;
  apiBaseUrl?: string;
  signal?: AbortSignal;
};

export type QueryBuilderError = {
  message: string;
  details?: unknown;
};

const DEFAULT_API_BASE_URL = "/v0";

function getApiBaseUrl(apiBaseUrl?: string): string {
  return (
    apiBaseUrl ??
    import.meta.env.VITE_API_BASE_URL ??
    DEFAULT_API_BASE_URL
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

export async function runQueryBuilder(
  request: QueryBuilderRequest,
  options: QueryBuilderRunOptions = {},
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
    .catch(() => null)) as QueryBuilderResponse | null;

  if (!response.ok) {
    throw {
      message: readErrorMessage(
        payload,
        `QueryBuilder request failed with status ${response.status}`,
      ),
      details: payload,
    } satisfies QueryBuilderError;
  }

  const meta = payload?.data?.meta ?? payload?.meta ?? {};
  const results = payload?.data?.attributes?.results ?? payload?.results ?? [];

  return {
    results,
    meta: {
      total: meta.total ?? results.length,
      page: meta.page ?? 1,
      pageSize: meta.page_size ?? request.limit ?? results.length,
    },
  };
}

export async function getEntityTypes(apiBaseUrl?: string): Promise<string[]> {
  const apiUrl = `${getApiBaseUrl(apiBaseUrl)}/nodes/types`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch entity types: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: Array<{ attributes?: { node_type: string } }>;
  } | null;

  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("Invalid response format when fetching entity types");
  }

  return {
    ...payload.data
      .map((item) => item.attributes?.node_type)
      .filter((type): type is string => typeof type === "string"),
  };
}
