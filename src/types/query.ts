export type QueryBuilderPathItem = {
  entity_type: string;
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
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
  data?: {
    attributes?: Record<string, unknown>;
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
