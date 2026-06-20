import { useMemo, useState } from "react";

import { Button, Col, Form, Row } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";

import { ENTITY_TYPES, GROUP_TYPES } from "@/types/entities";
import type { QbPathItem } from "@/types/query";
import { buildDefaultTypeFilter } from "@/utils/query";

import "./QbPathItemTypeEditor.scss";

interface QbPathItemTypeEditorProps {
  types: string[];
  item: QbPathItem;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
  index: number;
  errorTypes: string;
  loadingTypes: boolean;
}

export const QbPathItemTypeEditor: React.FC<QbPathItemTypeEditorProps> = ({
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
