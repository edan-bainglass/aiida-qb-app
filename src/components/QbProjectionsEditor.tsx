import { useMemo, useState } from "react";

import { Accordion, Button, Col, Form, Row } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";

import type { QbPathItem } from "@/types/query";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./QbProjectionsEditor.scss";

interface QbProjectionsEditorProps {
  index: number;
  item: QbPathItem;
  options: string[];
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

const QbProjectionsEditor: React.FC<QbProjectionsEditorProps> = ({
  index,
  item,
  options,
  updatePathItem,
}) => {
  const [customProjection, setCustomProjection] = useState("");

  const selectedProjections = useMemo(
    () => item.projections ?? [],
    [item.projections],
  );

  const availableOptions = useMemo(
    () => options.filter((option) => !selectedProjections.includes(option)),
    [options, selectedProjections],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const setSelectedProjections = (projections: string[]) => {
    updatePathItem(index, { projections });
  };

  const addProjection = (projection: string) => {
    const cleanProjection = projection.trim();
    if (!cleanProjection) return;
    if (selectedProjections.includes(cleanProjection)) return;
    setSelectedProjections([...selectedProjections, cleanProjection]);
  };

  const removeProjection = (projection: string) => {
    setSelectedProjections(
      selectedProjections.filter((selected) => selected !== projection),
    );
  };

  const addAllProjections = () => {
    if (availableOptions.length === 0) return;
    setSelectedProjections([...selectedProjections, ...availableOptions]);
  };

  const removeAllProjections = () => {
    if (selectedProjections.length === 0) return;
    setSelectedProjections([]);
  };

  const addCustomProjection = () => {
    addProjection(customProjection);
    setCustomProjection("");
  };

  const handleCustomProjectionKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCustomProjection();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedProjections.indexOf(String(active.id));
    const newIndex = selectedProjections.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    setSelectedProjections(arrayMove(selectedProjections, oldIndex, newIndex));
  };

  return (
    <div id="qb-item-projections">
      <Form.Label>Projections</Form.Label>

      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header as={Form.Label} className="qb-accordion-header">
            Select properties to include
          </Accordion.Header>

          <Accordion.Body>
            <Row className="g-3 qb-projections-picker">
              <Col lg={6} xl={12}>
                <div className="qb-projections-box">
                  <div className="qb-projections-box-header">
                    <strong>Choices</strong>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      type="button"
                      onClick={addAllProjections}
                      disabled={availableOptions.length === 0}
                    >
                      Add all
                    </Button>
                  </div>

                  <div className="qb-projection-choices-list">
                    {availableOptions.length > 0 ? (
                      availableOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className="qb-projection-choice"
                          onClick={() => addProjection(option)}
                        >
                          <span>{option}</span>
                          <span aria-hidden="true">+</span>
                        </button>
                      ))
                    ) : (
                      <Form.Text className="text-muted">
                        No more predefined choices available
                      </Form.Text>
                    )}
                  </div>

                  <div className="qb-custom-projection-input">
                    <Form.Control
                      size="sm"
                      placeholder="Custom projection, e.g. attributes.foo"
                      value={customProjection}
                      onChange={(event) =>
                        setCustomProjection(event.target.value)
                      }
                      onKeyDown={handleCustomProjectionKeyDown}
                    />
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      type="button"
                      onClick={addCustomProjection}
                      disabled={!customProjection.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Col>

              <Col lg={6} xl={12}>
                <div className="qb-projections-box">
                  <div className="qb-projections-box-header">
                    <strong>Selected</strong>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      type="button"
                      onClick={removeAllProjections}
                      disabled={selectedProjections.length === 0}
                    >
                      Remove all
                    </Button>
                  </div>

                  {selectedProjections.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedProjections}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="qb-selected-projections-list">
                          {selectedProjections.map((projection) => (
                            <SortableSelectedProjection
                              key={projection}
                              projection={projection}
                              onRemove={removeProjection}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <Form.Text className="text-muted">
                      No projections selected
                    </Form.Text>
                  )}
                </div>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default QbProjectionsEditor;

interface SortableSelectedProjectionProps {
  projection: string;
  onRemove: (projection: string) => void;
}

const SortableSelectedProjection: React.FC<SortableSelectedProjectionProps> = ({
  projection,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: projection });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="qb-selected-projection">
      <button
        type="button"
        className="qb-projection-drag-handle"
        aria-label={`Reorder ${projection}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <span className="qb-selected-projection-label">{projection}</span>

      <Button
        type="button"
        size="sm"
        variant="outline-danger"
        className="qb-remove-projection"
        onClick={() => onRemove(projection)}
        aria-label={`Remove ${projection}`}
      >
        <IoMdClose />
      </Button>
    </div>
  );
};
