import { Button, Col, Form, Row } from "react-bootstrap";

import { useEffect, useMemo, useState } from "react";

import { getNodeTypes } from "@/api/querybuilder";
import { ENTITY_TYPES } from "@/types/entities";
import type { QueryBuilderPathItem } from "@/types/query";

interface QueryBuilderEditorProps {
  pathItems: QueryBuilderPathItem[];
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  distinct: boolean;
  setDistinct: (distinct: boolean) => void;
  flat: boolean;
  setFlat: (flat: boolean) => void;
  full: boolean;
  setFull: (full: boolean) => void;
  loading: boolean;
  updatePathItem: (
    index: number,
    updatedItem: Partial<QueryBuilderPathItem>,
  ) => void;
  handleSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}

export const QueryBuilderEditor: React.FC<QueryBuilderEditorProps> = ({
  pathItems,
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  flat,
  setFlat,
  full,
  setFull,
  loading,
  updatePathItem,
  handleSubmit,
}) => {
  return (
    <div className="qb-editor">
      <Form onSubmit={handleSubmit}>
        <h2>Query</h2>
        <div className="qb-section">
          <QueryBuilderPathEditor
            pathItems={pathItems}
            updatePathItem={updatePathItem}
          />
        </div>
        <div className="qb-section">
          <QueryBuilderOptionsEditor
            limit={limit}
            setLimit={setLimit}
            offset={offset}
            setOffset={setOffset}
            distinct={distinct}
            setDistinct={setDistinct}
            flat={flat}
            setFlat={setFlat}
            full={full}
            setFull={setFull}
          />
        </div>
        <div className="qb-section">
          <QueryBuilderSubmissionControls loading={loading} />
        </div>
      </Form>
    </div>
  );
};

interface QueryBuilderPathEditorProps {
  pathItems: QueryBuilderPathItem[];
  updatePathItem: (
    index: number,
    updatedItem: Partial<QueryBuilderPathItem>,
  ) => void;
}

const QueryBuilderPathEditor: React.FC<QueryBuilderPathEditorProps> = ({
  pathItems,
  updatePathItem,
}) => {
  return (
    <div className="qb-path-editor">
      {pathItems.map((item, index) => (
        <div key={`path-item-${index}`}>
          <QueryBuilderPathItemEditor
            item={item}
            index={index}
            updatePathItem={updatePathItem}
          />
        </div>
      ))}
    </div>
  );
};

interface QueryBuilderPathItemEditorProps {
  item: QueryBuilderPathItem;
  index: number;
  updatePathItem: (
    index: number,
    updatedItem: Partial<QueryBuilderPathItem>,
  ) => void;
}

const QueryBuilderPathItemEditor: React.FC<QueryBuilderPathItemEditorProps> = ({
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

interface QueryBuilderOptionsEditorProps {
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  distinct: boolean;
  setDistinct: (distinct: boolean) => void;
  flat: boolean;
  setFlat: (flat: boolean) => void;
  full: boolean;
  setFull: (full: boolean) => void;
}

const QueryBuilderOptionsEditor: React.FC<QueryBuilderOptionsEditorProps> = ({
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  flat,
  setFlat,
  full,
  setFull,
}) => {
  return (
    <div className="qb-query-options">
      <Row className="g-3">
        <Col md={2}>
          <Form.Label>Limit</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={limit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setLimit(Number(event.target.value))
            }
          />
        </Col>
        <Col md={2}>
          <Form.Label>Offset</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={offset}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setOffset(Number(event.target.value))
            }
          />
        </Col>
        <Col md={2} className="d-flex align-items-end">
          <Form.Check
            type="switch"
            label="Distinct"
            checked={distinct}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDistinct(event.target.checked)
            }
          />
        </Col>
        <Col md="auto" className="d-flex align-items-end">
          <Form.Check
            type="switch"
            label="Flat results"
            checked={flat}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFlat(event.target.checked)
            }
          />
        </Col>
        <Col md="auto" className="d-flex align-items-end">
          <Form.Check
            type="switch"
            label="Full serialization"
            checked={full}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFull(event.target.checked)
            }
          />
        </Col>
      </Row>
    </div>
  );
};

interface QueryBuilderSubmissionControlsProps {
  loading: boolean;
}

const QueryBuilderSubmissionControls: React.FC<
  QueryBuilderSubmissionControlsProps
> = ({ loading }) => {
  return (
    <div className="qb-submit">
      <Button type="submit" size="lg" variant="dark" disabled={loading}>
        {loading ? "Running..." : "Run query"}
      </Button>
    </div>
  );
};
