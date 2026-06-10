import { useMemo, useState } from "react";

import { Carousel, Container } from "react-bootstrap";

import { Button, Card, Col, Form, Row } from "react-bootstrap";

import {
  runQueryBuilder,
  type QueryBuilderError,
  type QueryBuilderPathItem,
} from "./api/querybuilder";

import { type QueryBuilderRequest } from "./api/querybuilder";

import { Alert, Badge, Table } from "react-bootstrap";

import "./App.scss";

type QueryItemEditor = {
  entity_type: string;
  orm_base: string;
  tag: string;
  joining_keyword: string;
  joining_value: string;
  edge_tag: string;
  outerjoin: boolean;
};

type ValueChangeEvent = {
  target: {
    value: string;
  };
};

type CheckChangeEvent = {
  target: {
    checked: boolean;
  };
};

function createItemEditor(
  item?: string | QueryBuilderPathItem,
): QueryItemEditor {
  return {
    entity_type:
      typeof item === "string"
        ? item
        : item?.entity_type
          ? Array.isArray(item.entity_type)
            ? item.entity_type[0]
            : item.entity_type
          : "",
    orm_base:
      typeof item === "object" && item.orm_base ? item.orm_base : "node",
    tag: typeof item === "object" && item.tag ? item.tag : "",
    joining_keyword:
      typeof item === "object" && item.joining_keyword
        ? item.joining_keyword
        : "",
    joining_value:
      typeof item === "object" && item.joining_value ? item.joining_value : "",
    edge_tag: typeof item === "object" && item.edge_tag ? item.edge_tag : "",
    outerjoin:
      typeof item === "object" && typeof item.outerjoin === "boolean"
        ? item.outerjoin
        : false,
  };
}

function parseJsonInput(input: string): {
  value?: Record<string, unknown>;
  error?: string;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Expected a JSON object." };
    }

    return { value: parsed as Record<string, unknown> };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

function serializeItem(item: QueryItemEditor): string | QueryBuilderPathItem {
  const entityType = item.entity_type
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const pathItem: QueryBuilderPathItem = {
    entity_type:
      entityType.length > 1 ? entityType : (entityType[0] ?? item.entity_type),
    orm_base: item.orm_base,
    tag: item.tag || undefined,
    joining_keyword: item.joining_keyword || undefined,
    joining_value: item.joining_value || undefined,
    edge_tag: item.edge_tag || undefined,
    outerjoin: item.outerjoin,
  };

  return pathItem;
}

function toTableData(results: unknown[]): Array<Record<string, string>> {
  return results.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { value: JSON.stringify(row) };
    }

    return Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    );
  });
}

const App = () => {
  const [index, setIndex] = useState(0);
  const [pathItems, setPathItems] = useState([createItemEditor()]);
  const [flat, setFlat] = useState(true);
  const [full, setFull] = useState(false);
  const [distinct, setDistinct] = useState(false);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [project, setProject] = useState("id, uuid, label");
  const [filtersJson, setFiltersJson] = useState("");
  const [orderByJson, setOrderByJson] = useState("");
  const [results, setResults] = useState<unknown[]>([]);
  const [error, setError] = useState<QueryBuilderError | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);

  const request = useMemo<QueryBuilderRequest>(() => {
    const projectFields = project
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      path: pathItems.map(serializeItem),
      project: {
        [pathItems[0]?.tag || "nodes"]: projectFields,
      },
      limit,
      offset,
      distinct,
    };
  }, [distinct, limit, offset, pathItems, project]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const filters = parseJsonInput(filtersJson);
      if (filters.error) {
        throw {
          message: `Filters: ${filters.error}`,
        } satisfies QueryBuilderError;
      }

      const orderBy = parseJsonInput(orderByJson);
      if (orderBy.error) {
        throw {
          message: `Order by: ${orderBy.error}`,
        } satisfies QueryBuilderError;
      }

      const response = await runQueryBuilder(
        {
          ...request,
          filters: filters.value,
          order_by: orderBy.value,
        },
        { flat, full },
      );
      setResults(response.results);
      setMeta(response.meta);
    } catch (caught) {
      setError(caught as QueryBuilderError);
      setResults([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const QueryBuilderWorkspace = () => {
    return (
      <Row>
        <Col xl={7}>
          <Card className="qb-card">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <div className="qb-section">
                  <div className="qb-section-head">
                    <h2 className="d-flex align-items-center">
                      <span className="me-2">Path</span>
                      <Button
                        size="sm"
                        variant="primary"
                        type="button"
                        onClick={() =>
                          setPathItems([...pathItems, createItemEditor()])
                        }
                      >
                        +
                      </Button>
                    </h2>
                  </div>
                  {pathItems.map((item, index) => (
                    <div key={`${item.tag}-${index}`} className="qb-path-item">
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Label>Entity type</Form.Label>
                          <Form.Select
                            value={item.entity_type}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        entity_type: event.target.value,
                                      }
                                    : current,
                                ),
                              )
                            }
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>ORM base</Form.Label>
                          <Form.Select
                            value={item.orm_base}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        orm_base: event.target.value,
                                      }
                                    : current,
                                ),
                              )
                            }
                          >
                            <option value="node">node</option>
                            <option value="group">group</option>
                            <option value="computer">computer</option>
                            <option value="user">user</option>
                          </Form.Select>
                        </Col>
                        <Col md={3}>
                          <Form.Label>Tag</Form.Label>
                          <Form.Control
                            value={item.tag}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? { ...current, tag: event.target.value }
                                    : current,
                                ),
                              )
                            }
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Label>Joining keyword</Form.Label>
                          <Form.Control
                            value={item.joining_keyword}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        joining_keyword: event.target.value,
                                      }
                                    : current,
                                ),
                              )
                            }
                            placeholder="with_incoming"
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Label>Joining value</Form.Label>
                          <Form.Control
                            value={item.joining_value}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        joining_value: event.target.value,
                                      }
                                    : current,
                                ),
                              )
                            }
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Label>Edge tag</Form.Label>
                          <Form.Control
                            value={item.edge_tag}
                            onChange={(event: ValueChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        edge_tag: event.target.value,
                                      }
                                    : current,
                                ),
                              )
                            }
                          />
                        </Col>
                        <Col md={1} className="d-flex align-items-end">
                          <Form.Check
                            type="switch"
                            id={`outerjoin-${index}`}
                            checked={item.outerjoin}
                            onChange={(event: CheckChangeEvent) =>
                              setPathItems(
                                pathItems.map((current, currentIndex) =>
                                  currentIndex === index
                                    ? {
                                        ...current,
                                        outerjoin: event.target.checked,
                                      }
                                    : current,
                                ),
                              )
                            }
                            label="Outer"
                          />
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
                <div className="qb-section">
                  <h2>Projection</h2>
                  <Form.Control
                    value={project}
                    onChange={(event: ValueChangeEvent) =>
                      setProject(event.target.value)
                    }
                    placeholder="id, uuid, label"
                  />
                </div>
                <div className="qb-section">
                  <h2>Filters</h2>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={filtersJson}
                    onChange={(event: ValueChangeEvent) =>
                      setFiltersJson(event.target.value)
                    }
                    placeholder='{"attributes.value": {"<": 42}}'
                  />
                </div>
                <div className="qb-section">
                  <h2>Order by</h2>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={orderByJson}
                    onChange={(event: ValueChangeEvent) =>
                      setOrderByJson(event.target.value)
                    }
                    placeholder='{"pk": "desc"}'
                  />
                </div>
                <div className="qb-section">
                  <h2>Options</h2>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Label>Limit</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={limit}
                        onChange={(event: ValueChangeEvent) =>
                          setLimit(Number(event.target.value))
                        }
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Label>Offset</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={offset}
                        onChange={(event: ValueChangeEvent) =>
                          setOffset(Number(event.target.value))
                        }
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Form.Check
                        type="switch"
                        label="Distinct"
                        checked={distinct}
                        onChange={(event: CheckChangeEvent) =>
                          setDistinct(event.target.checked)
                        }
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Form.Check
                        type="switch"
                        label="Flat results"
                        checked={flat}
                        onChange={(event: CheckChangeEvent) =>
                          setFlat(event.target.checked)
                        }
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Form.Check
                        type="switch"
                        label="Full serialization"
                        checked={full}
                        onChange={(event: CheckChangeEvent) =>
                          setFull(event.target.checked)
                        }
                      />
                    </Col>
                  </Row>
                </div>
                <div className="qb-actions">
                  <Button
                    type="submit"
                    size="lg"
                    variant="dark"
                    disabled={loading}
                  >
                    {loading ? "Running..." : "Run query"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
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
          {error ? (
            <Alert variant="danger">
              <h2 className="h6">QueryBuilder request failed</h2>
              <p className="mb-0">{error.message}</p>
            </Alert>
          ) : null}
          {!error && results.length === 0 && !loading ? (
            <div className="qb-empty">Run a query to see results here.</div>
          ) : null}
          {results.length > 0 ? (
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
          ) : null}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="app-container">
      <header id="qb-header">
        <h1>
          <a
            href="https://www.aiida.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="src/assets/aiida-icon.svg" alt="AiiDA Logo" />
          </a>
          <span>
            AiiDA <code>QueryBuilder</code> App
          </span>
        </h1>
      </header>
      <Carousel indicators={false} controls={false} activeIndex={index}>
        <Carousel.Item>{QueryBuilderWorkspace()}</Carousel.Item>
        <Carousel.Item>{QueryBuilderResults()}</Carousel.Item>
      </Carousel>
    </Container>
  );
};

export default App;
