import { useEffect, useMemo, useState } from "react";

import { Col, Form, Row } from "react-bootstrap";

import { getNodeTypes } from "../api/querybuilder";
import { ENTITY_TYPES } from "../types/entities";
import type { QueryBuilderItemEditor } from "../types/query";

interface PathItemEditorProps {
  item: QueryBuilderItemEditor;
  index: number;
  updatePathItem: (
    index: number,
    updatedItem: Partial<QueryBuilderItemEditor>,
  ) => void;
}

export const QueryBuilderPathItem: React.FC<PathItemEditorProps> = ({
  item,
  index,
  updatePathItem,
}) => {
  const [types, setTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [errorTypes, setErrorTypes] = useState<string | null>(null);

  const hasTypes = useMemo(
    () => ["node", "group"].includes(item.orm_base),
    [item.orm_base],
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchNodeTypes = async () => {
      if (!hasTypes) {
        setTypes([""]);
        setErrorTypes(null);
        return;
      }

      setLoadingTypes(true);
      setErrorTypes(null);

      try {
        const types = await getNodeTypes();
        if (types.length === 0) {
          throw new Error("No node types found.");
        }
        setTypes(["", ...types]);
      } catch (error) {
        setErrorTypes(
          error instanceof Error ? error.message : "Failed to load node types.",
        );
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchNodeTypes();

    return () => {
      controller.abort();
    };
  }, [hasTypes]);

  return (
    <div className="qb-path-item">
      <Row className="g-3">
        <Col md={hasTypes ? 3 : 9}>
          <Form.Label>Entity</Form.Label>
          <Form.Select
            value={item.orm_base}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
              updatePathItem(index, {
                orm_base: event.target.value,
                entity_type: ENTITY_TYPES[event.target.value]?.type,
              })
            }
          >
            {Object.keys(ENTITY_TYPES).map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </Form.Select>
        </Col>
        {hasTypes && (
          <Col md={6}>
            <Form.Label>
              {loadingTypes ? "Loading..." : errorTypes ? errorTypes : "Type"}
            </Form.Label>
            {types.length > 0 && (
              <Form.Select
                value={item.entity_type}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  updatePathItem(index, {
                    entity_type: event.target.value,
                  })
                }
              >
                {item.orm_base === "group"
                  ? ["", "auto", "import"].map((type) => {
                      const displayType = type
                        ? `group.core.${type}`
                        : "group.core";
                      return (
                        <option key={type} value={displayType}>
                          {displayType}
                        </option>
                      );
                    })
                  : types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
              </Form.Select>
            )}
          </Col>
        )}
        <Col md={3}>
          <Form.Label>Tag</Form.Label>
          <Form.Control
            value={item.tag}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              updatePathItem(index, {
                tag: event.target.value,
              })
            }
          />
        </Col>
      </Row>
      {index > 0 && (
        <Row className="g-3">
          <Col md={9}>
            <Form.Label>With</Form.Label>
            <Form.Select
              value={item.joining_keyword}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updatePathItem(index, {
                  joining_keyword: event.target.value,
                })
              }
            />
          </Col>
          <Col md={3}>
            <Form.Label>Edge tag</Form.Label>
            <Form.Control
              value={item.edge_tag}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updatePathItem(index, {
                  edge_tag: event.target.value,
                })
              }
            />
          </Col>
        </Row>
      )}
    </div>
  );
};
