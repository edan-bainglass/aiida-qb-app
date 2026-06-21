export type QbPathItem = {
  entity_type: string | string[];
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
  path: QbPathItem[];
  filters?: Record<string, Record<string, unknown>>;
  project?: Record<string, string | string[]>;
  limit?: number;
  offset?: number;
  order_by?: string | string[] | Record<string, unknown>;
  distinct?: boolean;
};

export type QbResult = Record<string, Record<string, unknown>>;

export type QbResponseMeta = {
  total: number;
  page: number;
  page_size: number;
};

export type QbResponse = {
  meta?: QbResponseMeta;
  data?: {
    attributes?: {
      results?: QbResult[];
    };
  };
};

export type QbJsonApiError = {
  jsonapi: {
    version: string;
  };
  links: {
    self: string;
  };
  errors: {
    status: string;
    title: string;
    detail: string;
  }[];
};

export type QbError = {
  message: string;
  details?: QbJsonApiError;
};

export type PaginationItem =
  | { type: "page"; page: number; active?: boolean }
  | { type: "ellipsis"; key: string };
