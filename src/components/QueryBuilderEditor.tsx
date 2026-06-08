import { Button, Card, Col, Form, Row } from "react-bootstrap";

import type { QueryBuilderPathItem, QueryBuilderRequest } from "../types/query";
import { QueryBuilderPathItemEditor } from "./QueryBuilderPathItemEditor";

interface QueryBuilderWorkspaceProps {
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
  request: QueryBuilderRequest;
}

export const QueryBuilderEditor: React.FC<QueryBuilderWorkspaceProps> = ({
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
  request,
}) => {
  return (
    <Row>
      <Col xl={7}>
        <Card className="qb-card">
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <h2>Query</h2>
              <div className="qb-section">
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
          </Card.Body>
        </Card>
      </Col>
      <Col xl={5}>
        <Card className="qb-card qb-preview-card">
          <Card.Body>
            <h2>Request preview</h2>
            <pre>{JSON.stringify(request, null, 2)}</pre>
          </Card.Body>
        </Card>
      </Col>
    </Row>
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
