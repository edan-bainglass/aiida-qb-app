import type { QbPathItem } from "@/types/query";

export const createPathItem = (): QbPathItem => {
  return {
    entity_type: "",
    orm_base: "node",
    tag: "",
    joining_keyword: "",
    joining_value: "",
    edge_tag: "",
    outerjoin: false,
  };
};

export const serializeItem = (item: QbPathItem): string | QbPathItem => {
  const pathItem: QbPathItem = {
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
