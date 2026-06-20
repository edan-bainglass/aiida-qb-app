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
