export type QbPathItem = {
  entity_type: string;
  orm_base: string;
  tag: string;
  joining_keyword?: string | null;
  joining_value?: string | null;
  edge_tag?: string | null;
  outerjoin?: boolean;
  filters?: Record<string, unknown>;
  projections?: string[];
};

export type QbRequest = {
  path: Array<QbPathItem>;
  filters?: Record<string, Record<string, unknown>>;
  project?: Record<string, string | string[]>;
  limit?: number;
  offset?: number;
  order_by?: string | string[] | Record<string, unknown>;
  distinct?: boolean;
};

export type QbResponse = {
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
  data?: {
    attributes?: {
      results?: unknown[];
    };
  };
};

export type QbOptions = {
  flat?: boolean;
  full?: boolean;
  apiBaseUrl?: string;
  signal?: AbortSignal;
};

export type QbError = {
  message: string;
  details?: unknown;
};
