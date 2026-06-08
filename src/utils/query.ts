import type { QueryBuilderPathItem } from "../types/query";

export const createPathItem = (
  item?: string | QueryBuilderPathItem,
): QueryBuilderPathItem => {
  return {
    entity_type:
      typeof item === "string"
        ? item
        : item?.entity_type
          ? Array.isArray(item.entity_type)
            ? item.entity_type[0]
            : item.entity_type
          : "",
    orm_base:
      typeof item === "object" && item.orm_base ? item.orm_base : "node",
    tag: typeof item === "object" && item.tag ? item.tag : "",
    joining_keyword:
      typeof item === "object" && item.joining_keyword
        ? item.joining_keyword
        : "",
    joining_value:
      typeof item === "object" && item.joining_value ? item.joining_value : "",
    edge_tag: typeof item === "object" && item.edge_tag ? item.edge_tag : "",
    outerjoin:
      typeof item === "object" && typeof item.outerjoin === "boolean"
        ? item.outerjoin
        : false,
  };
};

export const serializeItem = (
  item: QueryBuilderPathItem,
): string | QueryBuilderPathItem => {
  const pathItem: QueryBuilderPathItem = {
    entity_type: item.entity_type,
    orm_base: item.orm_base,
    tag: item.tag || undefined,
    joining_keyword: item.joining_keyword || undefined,
    joining_value: item.joining_value || undefined,
    edge_tag: item.edge_tag || undefined,
    outerjoin: item.outerjoin,
  };

  return pathItem;
};

export const toTableData = (
  results: unknown[],
): Array<Record<string, string>> => {
  return results.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { value: JSON.stringify(row) };
    }

    return Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    );
  });
};
