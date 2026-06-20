import type { QbPathItem } from "@/types/query";

export function createPathItem(): QbPathItem {
  return {
    entity_type: "",
    orm_base: "node",
    tag: "",
    joining_keyword: "",
    joining_value: "",
    edge_tag: "",
    outerjoin: false,
    filters: {
      node_type: {
        like: "%",
      },
    },
    projections: [],
  };
}

export function buildDefaultTypeFilter(
  ormBase: string,
  entityType: string | string[],
): Record<string, unknown> {
  if (!["node", "group"].includes(ormBase)) return {};

  const selectedTypes = normalizeEntityTypes(entityType);
  const filterKey = ormBase === "node" ? "node_type" : "type_string";
  const values = selectedTypes.map((selectedType) =>
    getTypeLikePattern(ormBase, selectedType),
  );
  const uniqueValues = Array.from(new Set(values));

  if (uniqueValues.length === 1) {
    return {
      [filterKey]: {
        like: uniqueValues[0],
      },
    };
  }

  return {
    or: uniqueValues.map((value) => ({
      [filterKey]: {
        like: value,
      },
    })),
  };
}

function normalizeEntityTypes(entityType: string | string[]): string[] {
  if (Array.isArray(entityType)) {
    const normalized = entityType.filter(Boolean);
    return normalized.length > 0 ? normalized : [""];
  }
  return entityType ? [entityType] : [""];
}

function getTypeLikePattern(ormBase: string, entityType: string): string {
  if (ormBase === "node") {
    const parts = entityType.split(".").slice(0, -2).join(".");
    return parts.length > 0 ? `${parts}.%` : "%";
  } else if (ormBase === "group") {
    if (entityType === "group.core") return "%";
    const lastPart = entityType.split(".").slice(-1)[0];
    return `core.${lastPart}%`;
  }
  throw new Error(`Unsupported orm_base: ${ormBase}`);
}
