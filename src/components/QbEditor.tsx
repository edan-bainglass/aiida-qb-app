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
  const [pathErrors, setPathErrors] = useState<Record<number, string>>({});

  const hasError = useMemo(
    () => Object.values(pathErrors).some(Boolean),
    [pathErrors],
  );

  const setPathError = useCallback((index: number, error: string) => {
    setPathErrors((errors) => {
      const currentError = errors[index] ?? "";
      if (currentError === error) return errors;
      const nextErrors = { ...errors };
      if (error) {
        nextErrors[index] = error;
      } else {
        delete nextErrors[index];
      }
      return nextErrors;
    });
  }, []);

  const addPathItem = useCallback(() => {
    setPathItems((items) => [...items, createPathItem()]);
  }, [setPathItems]);

  const removePathItem = useCallback(
    (index: number) => {
      setPathItems((items) =>
        items.filter((_, currentIndex) => currentIndex !== index),
      );

      setPathErrors((errors) => {
        const nextErrors: Record<number, string> = {};
        for (const [key, value] of Object.entries(errors)) {
          const currentIndex = Number(key);
          if (currentIndex < index) {
            nextErrors[currentIndex] = value;
          } else if (currentIndex > index) {
            nextErrors[currentIndex - 1] = value;
          }
        }
        return nextErrors;
      });
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
      <Form
        onSubmit={(event) => {
          if (hasError) {
            event.preventDefault();
            return;
          }
          handleSubmit(event);
        }}
      >
        <div className="qb-section">
          <QbPathEditor
            pathItems={pathItems}
            tags={tags}
            addPathItem={addPathItem}
            removePathItem={removePathItem}
            updatePathItem={updatePathItem}
            setPathError={setPathError}
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
            disabled={loading || hasError}
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
  setPathError: (index: number, error: string) => void;
}

const QbPathEditor: React.FC<QbPathEditorProps> = ({
  pathItems,
  tags,
  addPathItem,
  removePathItem,
  updatePathItem,
  setPathError,
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
            setPathError={setPathError}
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
  setPathError: (index: number, error: string) => void;
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
  setPathError,
}) => {
  const [projections, setProjections] = useState<string[]>([]);
  const [projectionError, setProjectionError] = useState("");

  const selectedEntityTypes = useMemo(() => {
    if (Array.isArray(item.entity_type)) {
      return item.entity_type.filter(Boolean);
    }
    return item.entity_type ? [item.entity_type] : [];
  }, [item.entity_type]);

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

  const handleEntityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const ormBase = event.target.value;
    const entityType = ENTITY_TYPES[ormBase]?.type || "";
    updatePathItem(index, {
      orm_base: ormBase,
      entity_type: entityType,
      filters: buildDefaultTypeFilter(ormBase, entityType),
      projections: [],
    });
  };

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
    let cancelled = false;

    const setsMatchExactly = (entries: string[][]) => {
      if (entries.length <= 1) return true;

      const normalize = (entry: string[]) =>
        Array.from(new Set(entry)).sort((a, b) => a.localeCompare(b));

      const baseline = normalize(entries[0]);
      return entries.slice(1).every((entry) => {
        const candidate = normalize(entry);
        if (candidate.length !== baseline.length) return false;
        return candidate.every((value, idx) => value === baseline[idx]);
      });
    };

    const fetchProjections = async () => {
      try {
        if (selectedEntityTypes.length > 1) {
          const projectionsByType = await Promise.all(
            selectedEntityTypes.map((type) =>
              getEntityProjections(item.orm_base, type),
            ),
          );

          if (cancelled) return;

          const mergedProjections = Array.from(
            new Set(projectionsByType.flat()),
          );
          const hasProjectionMismatch = !setsMatchExactly(projectionsByType);
          const validationError = hasProjectionMismatch
            ? "Selected types expose different projection sets. Select a compatible type combination."
            : "";

          setProjections(mergedProjections);
          setProjectionError(validationError);
          setPathError(index, validationError);
          return;
        }

        const projections = await getEntityProjections(
          item.orm_base,
          selectedEntityTypes[0],
        );

        if (cancelled) return;

        setProjections(projections);
        setProjectionError("");
        setPathError(index, "");
      } catch (error) {
        console.error("Failed to load projections:", error);
        if (cancelled) return;

        setProjections([]);
        setProjectionError("");
        setPathError(index, "");
      }
    };

    fetchProjections();

    return () => {
      cancelled = true;
    };
  }, [index, item.orm_base, selectedEntityTypes, setPathError]);

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
        <Col md={9}>
          <Form.Label>Entity</Form.Label>
          <Form.Select value={item.orm_base} onChange={handleEntityChange}>
            {Object.keys(ENTITY_TYPES).map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </Form.Select>
        </Col>
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
      {hasTypes && (
        <QbPathItemTypeEditor
          types={types}
          item={item}
          updatePathItem={updatePathItem}
          index={index}
          errorTypes={errorTypes}
          loadingTypes={loadingTypes}
        />
      )}
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
        validationError={projectionError}
      />
    </div>
  );
};

interface QbPathItemTypeEditorProps {
  types: string[];
  item: QbPathItem;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
  index: number;
  errorTypes: string;
  loadingTypes: boolean;
}

const QbPathItemTypeEditor: React.FC<QbPathItemTypeEditorProps> = ({
  types,
  item,
  updatePathItem,
  index,
  errorTypes,
  loadingTypes,
}) => {
  const [selectedType, setSelectedType] = useState("");

  const typeOptions = useMemo(
    () => (item.orm_base === "group" ? GROUP_TYPES : types),
    [item.orm_base, types],
  );

  const selectedTypes = useMemo(() => {
    if (item.orm_base === "group") {
      if (Array.isArray(item.entity_type)) {
        return item.entity_type.filter((type) => type !== "group.core");
      }
      return item.entity_type && item.entity_type !== "group.core"
        ? [item.entity_type]
        : [];
    }

    return Array.isArray(item.entity_type)
      ? item.entity_type
      : item.entity_type
        ? [item.entity_type]
        : [];
  }, [item.entity_type, item.orm_base]);

  const availableTypeOptions = useMemo(
    () => typeOptions.filter((type) => !selectedTypes.includes(type)),
    [typeOptions, selectedTypes],
  );

  const addType = () => {
    if (!selectedType) return;
    if (!availableTypeOptions.includes(selectedType)) return;

    const updatedEntityType = [...selectedTypes, selectedType];

    updatePathItem(index, {
      entity_type: updatedEntityType,
      filters: buildDefaultTypeFilter(item.orm_base, updatedEntityType),
      projections: [],
    });

    setSelectedType("");
  };

  const removeType = (typeToRemove: string) => {
    const updatedTypes = selectedTypes.filter((type) => type !== typeToRemove);
    const updatedEntityType =
      updatedTypes.length === 0
        ? ENTITY_TYPES[item.orm_base].type
        : updatedTypes;

    updatePathItem(index, {
      entity_type: updatedEntityType,
      filters: buildDefaultTypeFilter(item.orm_base, updatedEntityType),
      projections: [],
    });

    setSelectedType("");
  };

  return (
    <div className="qb-item-type">
      <Form.Label>Type</Form.Label>
      {typeOptions.length > 0 ? (
        <Row className="g-2">
          <Col sm={12}>
            <div className="qb-item-type-choices">
              <Form.Select
                value={selectedType}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedType(event.target.value)
                }
              >
                <option value="">Select specific type(s)</option>
                {availableTypeOptions.length > 0 ? (
                  availableTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No more type choices
                  </option>
                )}
              </Form.Select>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={addType}
                disabled={!selectedType}
              >
                Add
              </Button>
            </div>
          </Col>

          <Col sm={12}>
            <div className="qb-item-type-selected-list">
              {selectedTypes.length > 0 ? (
                selectedTypes.map((type) => (
                  <div key={type} className="qb-item-type-selected">
                    <span>{type}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline-danger"
                      className="qb-item-type-remove"
                      onClick={() => removeType(type)}
                      aria-label={`Remove ${type}`}
                    >
                      <IoMdClose />
                    </Button>
                  </div>
                ))
              ) : (
                <Form.Text className="text-muted">Any type</Form.Text>
              )}
            </div>
          </Col>
        </Row>
      ) : (
        <Form.Control
          className={errorTypes ? "is-invalid text-danger" : "text-muted"}
          value={loadingTypes ? "Loading types..." : errorTypes}
          readOnly
        />
      )}
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
  disabled: boolean;
}

const QbControls: React.FC<QbControlsProps> = ({
  limit,
  setLimit,
  offset,
  setOffset,
  distinct,
  setDistinct,
  disabled,
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
          <Button type="submit" size="lg" variant="dark" disabled={disabled}>
            Run Query
          </Button>
        </Col>
      </Row>
    </div>
  );
};

function buildDefaultTypeFilter(
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
