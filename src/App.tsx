import { useMemo, useState } from "react";

import { Card, Carousel, Col, Container, Row } from "react-bootstrap";

import { submitRequest } from "@/api/querybuilder";
import aiidaLogo from "@/assets/img/aiida-logo.svg";
import {
  QueryBuilderEditor,
  QueryBuilderPreview,
  QueryBuilderResults,
} from "@/components";
import type { QbError, QbRequest } from "@/types/query";
import { createPathItem, serializeItem } from "@/utils/query";

import "./App.scss";

const App = () => {
  // UI state
  const [index, setIndex] = useState(0);

  // Query state
  const [pathItems, setPathItems] = useState([createPathItem()]);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [distinct, setDistinct] = useState(false);

  // Options state
  const [flat, setFlat] = useState(true);
  const [full, setFull] = useState(false);

  // Results state
  const [results, setResults] = useState<unknown[]>([]);
  const [error, setError] = useState<QbError | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);

  const request = useMemo<QbRequest>(() => {
    const project = pathItems.reduce(
      (acc, item, index) => {
        const defaultKey = `${item.orm_base}_${index + 1}`;
        acc[item.tag || defaultKey] = item.projections || [];
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return {
      path: pathItems.map((item, index) => serializeItem(item, index)),
      project,
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
      const response = await submitRequest(request, { flat, full });
      setResults(response.results);
      setMeta(response.meta);
    } catch (error) {
      setError(error as QbError);
      setResults([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container id="app-container">
      <header id="qb-header">
        <a
          href="https://www.aiida.net"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={aiidaLogo} alt="AiiDA Logo" />
        </a>
        <div>
          <code>QueryBuilder</code>
        </div>
      </header>
      <Carousel indicators={false} controls={false} activeIndex={index}>
        <Carousel.Item>
          <Row>
            <Col xl={7}>
              <Card className="qb-card">
                <Card.Body>
                  <QueryBuilderEditor
                    pathItems={pathItems}
                    setPathItems={setPathItems}
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
                    loading={loading}
                    handleSubmit={handleSubmit}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col xl={5}>
              <Card className="qb-card">
                <Card.Body>
                  <QueryBuilderPreview request={request} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Carousel.Item>
        <Carousel.Item>
          <Card className="qb-card">
            <Card.Body>
              <QueryBuilderResults
                results={results}
                error={error}
                loading={loading}
                meta={meta}
                onBack={() => setIndex(0)}
              />
            </Card.Body>
          </Card>
        </Carousel.Item>
      </Carousel>
    </Container>
  );
};

export default App;
