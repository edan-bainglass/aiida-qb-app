import { useEffect, useMemo, useState } from "react";

import { Button, Col, Form, Row } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";

import { getEntityProjections } from "@/api/querybuilder";
import { ENTITY_TYPES } from "@/types/entities";
import type { QbPathItem } from "@/types/query";
import { buildDefaultTypeFilter } from "@/utils/query";

import { QbFiltersEditor } from "./QbFiltersEditor";
import { QbPathItemTypeEditor } from "./QbPathItemTypeEditor";
import { QbProjectionsEditor } from "./QbProjectionsEditor";

import "./QbPathItemEditor.scss";

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

export const QbPathItemEditor: React.FC<QbPathItemEditorProps> = ({
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
