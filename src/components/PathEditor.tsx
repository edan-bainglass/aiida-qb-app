import { useEffect, useState } from "react";

import { Button } from "react-bootstrap";

import { getNodeTypes } from "@/api/querybuilder";
import type { QbPathItem } from "@/types/query";

import { PathItemEditor } from "./PathItemEditor";

import "./PathEditor.scss";

interface PathEditorProps {
  pathItems: QbPathItem[];
  tags: Record<string, string[]>;
  addPathItem: () => void;
  removePathItem: (index: number) => void;
  updatePathItem: (index: number, updatedItem: Partial<QbPathItem>) => void;
  setPathError: (index: number, error: string) => void;
}

export const PathEditor: React.FC<PathEditorProps> = ({
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
          <PathItemEditor
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
