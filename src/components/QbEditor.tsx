import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Col, Form, Row } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";

import { getEntityProjections, getNodeTypes } from "@/api/querybuilder";
import { ENTITY_TYPES, GROUP_TYPES } from "@/types/entities";
import type { QbPathItem } from "@/types/query";
import { createPathItem } from "@/utils/query";

import { QbFiltersEditor } from "./QbFiltersEditor";
import { QbProjectionsEditor } from "./QbProjectionsEditor";

import "./QbEditor.scss";

interface QbEditorProps {
  pathItems: QbPathItem[];
  setPathItems: React.Dispatch<React.SetStateAction<QbPathItem[]>>;
  tags: Record<string, string[]>;
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  distinct: boolean;
  setDistinct: (distinct: boolean) => void;
  loading: boolean;
  handleSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
}

export const QbEditor: React.FC<QbEditorProps> = ({
  pathItems,
  setPathItems,
  tags,
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  loading,
  handleSubmit,
}) => {
  const addPathItem = useCallback(() => {
    setPathItems((items) => [...items, createPathItem()]);
  }, [setPathItems]);

  const removePathItem = useCallback(
    (index: number) => {
      setPathItems((items) =>
        items.filter((_, currentIndex) => currentIndex !== index),
      );
    },
    [setPathItems],
  );

  const updatePathItem = useCallback(
    (index: number, updatedItem: Partial<QbPathItem>) => {
      setPathItems((items) =>
        items.map((item, currentIndex) =>
          currentIndex === index ? { ...item, ...updatedItem } : item,
        ),
      );
    },
    [setPathItems],
  );

  return (
    <div id="qb-editor">
      <h2>Query</h2>
      <Form onSubmit={handleSubmit}>
        <div className="qb-section">
          <QbPathEditor
            pathItems={pathItems}
            tags={tags}
            addPathItem={addPathItem}
            removePathItem={removePathItem}
            updatePathItem={updatePathItem}
          />
        </div>
        <div className="qb-section">
          <QbControls
            limit={limit}
            setLimit={setLimit}
            offset={offset}
            setOffset={setOffset}
            distinct={distinct}
            setDistinct={setDistinct}
            loading={loading}
          />
        </div>
      </Form>
    </div>
  );
};

interface QbPathEditorProps {
  pathItems: QbPathItem[];
  tags: Record<string, string[]>;
  addPathItem: () => void;
  removePathItem: (index: number) => void;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

const QbPathEditor: React.FC<QbPathEditorProps> = ({
  pathItems,
  tags,
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

    return () => controller.abort();
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
            tags={tags}
            removePathItem={removePathItem}
            updatePathItem={updatePathItem}
          />
        </div>
      ))}
      <Button variant="outline-secondary" onClick={addPathItem}>
        + path item
      </Button>
    </div>
  );
};

interface QbPathItemEditorProps {
  index: number;
  item: QbPathItem;
  types: string[];
  loadingTypes: boolean;
  errorTypes: string;
  tags: Record<string, string[]>;
  removePathItem: (index: number) => void;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

const QbPathItemEditor: React.FC<QbPathItemEditorProps> = ({
  index,
  item,
  types,
  loadingTypes,
  errorTypes,
  tags,
  removePathItem,
  updatePathItem,
}) => {
  const [projections, setProjections] = useState<string[]>([]);

  const hasTypes = useMemo(
    () => ["node", "group"].includes(item.orm_base),
    [item.orm_base],
  );

  const whichOptions = useMemo(() => {
    if (!item.joining_keyword) return [];
    if (
      ["incoming", "outgoing", "descendents", "ancestors"].includes(
        item.joining_keyword,
      )
    ) {
      return tags.node.filter((tag) => tag != tags.ordered[index]) || [];
    }
    return tags[item.joining_keyword] || [];
  }, [item.joining_keyword, tags, index]);

  useEffect(() => {
    if (index === 0) return;

    if (!item.joining_keyword) {
      if (item.joining_value) {
        updatePathItem(index, { joining_value: "" });
      }
      return;
    }

    if (whichOptions.length === 0) {
      if (item.joining_value) {
        updatePathItem(index, { joining_value: "" });
      }
      return;
    }

    if (!item.joining_value || !whichOptions.includes(item.joining_value)) {
      updatePathItem(index, { joining_value: whichOptions[0] });
    }
  }, [
    index,
    item.joining_keyword,
    item.joining_value,
    whichOptions,
    updatePathItem,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProjections = async () => {
      try {
        const projections = await getEntityProjections(
          item.orm_base,
          item.entity_type,
        );
        setProjections(projections);
      } catch (error) {
        console.error("Failed to load projections:", error);
        setProjections([]);
      }
    };

    fetchProjections();

    return () => controller.abort();
  }, [item.orm_base, item.entity_type]);

  console.log(item);

  return (
    <div className="qb-path-item">
      {index > 0 && (
        <div className="qb-path-item-controls">
          <Button
            className="qb-path-item-remove"
            variant="outline-danger"
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
          <Col md={3}>
            <Form.Label>With</Form.Label>
            <Form.Select
              value={item.joining_keyword || ""}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updatePathItem(index, {
                  joining_keyword: event.target.value,
                })
              }
              required
            >
              <option value=""></option>
              {ENTITY_TYPES[item.orm_base].join_options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Which</Form.Label>
            <Form.Select
              value={item.joining_value || ""}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                updatePathItem(index, {
                  joining_value: event.target.value,
                })
              }
              required
            >
              {whichOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Form.Select>
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
      <QbFiltersEditor
        index={index}
        item={item}
        updatePathItem={updatePathItem}
      />
      <QbProjectionsEditor
        index={index}
        item={item}
        options={projections}
        updatePathItem={updatePathItem}
      />
    </div>
  );
};

interface QbControlsProps {
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  distinct: boolean;
  setDistinct: (distinct: boolean) => void;
  loading: boolean;
}

const QbControls: React.FC<QbControlsProps> = ({
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  loading,
}) => {
  return (
    <div id="qb-query-controls">
      <Row className="g-3 align-items-center">
        <Col md={9} id="qb-query-options">
          <Form.Label>Limit</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={limit}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setLimit(Number(event.target.value))
            }
          />
          <Form.Label>Offset</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={offset}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setOffset(Number(event.target.value))
            }
          />
          <Form.Check
            type="switch"
            label="Distinct"
            checked={distinct}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDistinct(event.target.checked)
            }
          />
        </Col>
        <Col md={3} id="qb-query-submit">
          <Button type="submit" size="lg" variant="dark" disabled={loading}>
            {loading ? "Running..." : "Run query"}
          </Button>
        </Col>
      </Row>
    </div>
  );
};
