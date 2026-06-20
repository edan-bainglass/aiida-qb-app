import { useCallback, useMemo, useState } from "react";

import { Form } from "react-bootstrap";

import type { QbPathItem } from "@/types/query";
import { createPathItem } from "@/utils/query";

import { QbControls } from "./QbControls";
import { QbPathEditor } from "./QbPathEditor";

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
