import { Button, Col, Form, Row } from "react-bootstrap";

import { useEffect, useMemo, useState } from "react";
import { IoMdClose } from "react-icons/io";

import { getNodeTypes } from "@/api/querybuilder";
import { ENTITY_TYPES, GROUP_TYPES } from "@/types/entities";
import type { QbPathItem } from "@/types/query";

import "./QbEditor.scss";

export const QbEditor: React.FC<QbEditorProps> = ({
  pathItems,
  setPathItems,
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
  handleSubmit,
}) => {
  const addPathItem = () => {
    setPathItems([...pathItems, { orm_base: "node", entity_type: "" }]);
  };

  const removePathItem = (index: number) => {
    setPathItems(pathItems.filter((_, currentIndex) => currentIndex !== index));
  };

  const updatePathItem = (index: number, updatedItem: Partial<QbPathItem>) => {
    setPathItems(
      pathItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...updatedItem } : item,
      ),
    );
  };

  return (
    <div id="qb-editor">
      <h2>Query</h2>
      <Form onSubmit={handleSubmit}>
        <div id="qb-input">
          <div className="qb-section">
            <QbPathEditor
              pathItems={pathItems}
              addPathItem={addPathItem}
              removePathItem={removePathItem}
              updatePathItem={updatePathItem}
            />
          </div>
          <div className="qb-section">
            <QbOptionsEditor
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
        </div>
        <div className="qb-section">
          <QbSubmissionControl loading={loading} />
        </div>
      </Form>
    </div>
  );
};

const QbPathEditor: React.FC<QbPathEditorProps> = ({
  pathItems,
  addPathItem,
  removePathItem,
  updatePathItem,
}) => {
  const [types, setTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [errorTypes, setErrorTypes] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchNodeTypes = async () => {
      setLoadingTypes(true);
      setErrorTypes("");

      try {
        const types = await getNodeTypes();
        if (types.length === 0) {
          setErrorTypes("No node types available");
        }
        setTypes(types);
      } catch (error) {
        console.error(error);
        setErrorTypes("Failed to load node types");
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchNodeTypes();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div id="qb-path-editor">
      {pathItems.map((item, index) => (
        <div key={`path-item-${index}`}>
          <QbPathItemEditor
            index={index}
            item={item}
            types={types}
            loadingTypes={loadingTypes}
            errorTypes={errorTypes}
            removePathItem={removePathItem}
            updatePathItem={updatePathItem}
          />
        </div>
      ))}
      <Button variant="outline-secondary" onClick={addPathItem}>
        + Add Path Item
      </Button>
    </div>
  );
};

const QbPathItemEditor: React.FC<QbPathItemEditorProps> = ({
  index,
  item,
  types,
  loadingTypes,
  errorTypes,
  removePathItem,
  updatePathItem,
}) => {
  const hasTypes = useMemo(
    () => ["node", "group"].includes(item.orm_base),
    [item.orm_base],
  );

  return (
    <div className="qb-path-item">
      {index > 0 && (
        <div className="qb-path-item-controls">
          <Button
            className="qb-path-item-remove"
            variant="danger"
            size="sm"
            onClick={() => removePathItem(index)}
          >
            <IoMdClose />
          </Button>
        </div>
      )}
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
            <Form.Label>Type</Form.Label>
            {types.length > 0 ? (
              <Form.Select
                value={item.entity_type}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  updatePathItem(index, {
                    entity_type: event.target.value,
                  })
                }
              >
                {item.orm_base === "group" ? (
                  GROUP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="">any</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </>
                )}
              </Form.Select>
            ) : (
              <Form.Control
                className={errorTypes ? "is-invalid text-danger" : "text-muted"}
                value={loadingTypes ? "Loading types..." : errorTypes}
                readOnly
              />
            )}
          </Col>
        )}
        <Col md={3}>
          <Form.Label>Tag</Form.Label>
          <Form.Control
            value={item.tag || ""}
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
              value={item.joining_keyword || ""}
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
              value={item.edge_tag || ""}
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

const QbOptionsEditor: React.FC<QbOptionsEditorProps> = ({
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
    <div id="qb-query-options">
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

const QbSubmissionControl: React.FC<QbSubmissionControlsProps> = ({
  loading,
}) => {
  return (
    <div id="qb-submit">
      <Button type="submit" size="lg" variant="dark" disabled={loading}>
        {loading ? "Running..." : "Run query"}
      </Button>
    </div>
  );
};

interface QbEditorProps {
  pathItems: QbPathItem[];
  setPathItems: (items: QbPathItem[]) => void;
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
  handleSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}

interface QbPathEditorProps {
  pathItems: QbPathItem[];
  addPathItem: () => void;
  removePathItem: (index: number) => void;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

interface QbPathItemEditorProps {
  index: number;
  item: QbPathItem;
  types: string[];
  loadingTypes: boolean;
  errorTypes: string;
  removePathItem: (index: number) => void;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

interface QbOptionsEditorProps {
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

interface QbSubmissionControlsProps {
  loading: boolean;
}
