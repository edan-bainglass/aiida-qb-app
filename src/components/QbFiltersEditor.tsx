import { useMemo, useState } from "react";

import { json } from "@codemirror/lang-json";
import ReactCodeMirror from "@uiw/react-codemirror";
import { Accordion, Form } from "react-bootstrap";

import type { QbPathItem } from "@/types/query";

import "./QbFiltersEditor.scss";

interface FiltersEditorProps {
  index: number;
  item: QbPathItem;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
}

export const FiltersEditor: React.FC<FiltersEditorProps> = ({
  index,
  item,
  updatePathItem,
}) => {
  const extensions = useMemo(() => [json()], []);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const handleFilterChange = (value: string) => {
    const parsedFilters = parseJsonSafe(value);
    if (parsedFilters !== null) {
      updatePathItem(index, { filters: parsedFilters });
      setFiltersError(null);
    } else {
      setFiltersError("Invalid JSON format");
    }
  };

  return (
    <div id="qb-item-filters">
      <Form.Label>Filters</Form.Label>
      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header as={Form.Label} className="qb-accordion-header">
            Define filtering criteria
          </Accordion.Header>
          <Accordion.Body>
            <Form.Text className="qb-filters-editor-help">
              e.g. <code>{'{ "pk": 42 }'}</code> to find the {item.orm_base}{" "}
              with primary key 42
            </Form.Text>
            <ReactCodeMirror
              className="qb-filters-editor"
              extensions={extensions}
              onChange={handleFilterChange}
              basicSetup={{
                lineNumbers: false,
                bracketMatching: true,
                closeBrackets: true,
                indentOnInput: true,
              }}
            />
            <Form.Text className="qb-filters-editor-error">
              {filtersError}
            </Form.Text>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

function parseJsonSafe(jsonString: string): Record<string, unknown> | null {
  try {
    return JSON.parse(jsonString || "{}");
  } catch {
    return null;
  }
}
