export type QbPathItem = {
  entity_type: string;
  orm_base: string;
  tag?: string;
  joining_keyword?: string;
  joining_value?: string;
  edge_tag?: string;
  outerjoin?: boolean;
  projections?: string[];
};

export type QbRequest = {
  path: Array<string | QbPathItem>;
  filters?: Record<string, unknown>;
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
