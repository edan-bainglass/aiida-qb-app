import { useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Carousel,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";

import { runQueryBuilder } from "./api/querybuilder";
import { QueryBuilderPathItem } from "./components/QueryBuilderPathItem";
import type {
  QueryBuilderError,
  QueryBuilderItemEditor,
  QueryBuilderRequest,
} from "./types/query";
import {
  createItemEditor,
  parseJsonInput,
  serializeItem,
  toTableData,
} from "./utils/query";

import "./App.scss";

const App = () => {
  // UI state
  const [index, setIndex] = useState(0);

  // Query state
  const [pathItems, setPathItems] = useState([createItemEditor()]);
  const [flat, setFlat] = useState(true);
  const [full, setFull] = useState(false);
  const [distinct, setDistinct] = useState(false);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [orderByJson, setOrderByJson] = useState("");

  // Results state
  const [results, setResults] = useState<unknown[]>([]);
  const [error, setError] = useState<QueryBuilderError | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);

  const request = useMemo<QueryBuilderRequest>(() => {
    return {
      path: pathItems.map(serializeItem),
      limit,
      offset,
      distinct,
    };
  }, [distinct, limit, offset, pathItems]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setIndex(1);

    try {
      const orderBy = parseJsonInput(orderByJson);
      if (orderBy.error) {
        throw {
          message: `Order by: ${orderBy.error}`,
        } satisfies QueryBuilderError;
      }

      const response = await runQueryBuilder(
        {
          ...request,
          order_by: orderBy.value,
        },
        { flat, full },
      );
      setResults(response.results);
      setMeta(response.meta);
    } catch (error) {
      setError(error as QueryBuilderError);
      setResults([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePathItem = (
    index: number,
    updatedItem: Partial<QueryBuilderItemEditor>,
  ) => {
    setPathItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...updatedItem } : item,
      ),
    );
  };

  const QueryOptions = () => {
    return (
      <div className="qb-query-options">
        <Row>
          <Col>
            <Form.Label>Order by</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={orderByJson}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setOrderByJson(event.target.value)
              }
              placeholder='{"pk": "desc"}'
            />
          </Col>
        </Row>
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

  const QuerySubmissionControls = () => {
    return (
      <div className="qb-submit">
        <Button type="submit" size="lg" variant="dark" disabled={loading}>
          {loading ? "Running..." : "Run query"}
        </Button>
      </div>
    );
  };

  const QueryBuilderWorkspace = () => {
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
                      <QueryBuilderPathItem
                        item={item}
                        index={index}
                        updatePathItem={updatePathItem}
                      />
                    </div>
                  ))}
                </div>
                <div className="qb-section">{QueryOptions()}</div>
                <div className="qb-section">{QuerySubmissionControls()}</div>
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

  const QueryBuilderResults = () => {
    return (
      <Card className="qb-card qb-results-card">
        <Card.Body>
          <div className="qb-section-head">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIndex(0)}
            >
              Back
            </button>
            <h2>Results</h2>
            {meta ? (
              <div className="qb-meta">
                <Badge bg="secondary">Total {meta.total}</Badge>
                <Badge bg="secondary">Page {meta.page}</Badge>
                <Badge bg="secondary">Size {meta.pageSize}</Badge>
              </div>
            ) : null}
          </div>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <h2 className="h6">QueryBuilder request failed</h2>
              <p className="mb-0">{error.message}</p>
            </Alert>
          ) : results.length > 0 ? (
            <div className="qb-table-wrap">
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    {Object.keys(toTableData(results)[0] ?? {}).map(
                      (column) => (
                        <th key={column}>{column}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {toTableData(results).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={`${rowIndex}-${valueIndex}`}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="qb-empty">Run a query to see results here.</div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container id="app-container">
      <header id="qb-header">
        <a
          href="https://www.aiida.net"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="src/assets/img/aiida-logo.svg" alt="AiiDA Logo" />
        </a>
        <div>
          <code>QueryBuilder</code>
        </div>
      </header>
      <Carousel indicators={false} controls={false} activeIndex={index}>
        <Carousel.Item>{QueryBuilderWorkspace()}</Carousel.Item>
        <Carousel.Item>{QueryBuilderResults()}</Carousel.Item>
      </Carousel>
    </Container>
  );
};

export default App;
