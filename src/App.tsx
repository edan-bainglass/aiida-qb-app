import { useMemo, useState } from "react";

import { Card, Carousel, Col, Container, Row } from "react-bootstrap";

import { submitRequest } from "@/api/querybuilder";
import aiidaLogo from "@/assets/img/aiida-logo.svg";
import { QbEditor, QbPreview, QbResults } from "@/components";
import type {
  QbError,
  QbPathItem,
  QbRequest,
  QbResponseMeta,
  QbResult,
} from "@/types/query";
import { createPathItem } from "@/utils/query";
import { ENTITY_TYPES } from "./types/entities";

import "./App.scss";

const App = () => {
  // UI state
  const [index, setIndex] = useState(0);

  // Query state
  const [pathItems, setPathItems] = useState([createPathItem()]);

  // Options state
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [distinct, setDistinct] = useState(false);
  const [full, setFull] = useState(false);

  // Results state
  const [results, setResults] = useState<QbResult[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<QbError | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<QbResponseMeta | null>(null);

  const tags = useMemo(() => {
    const tagRegistry: Record<string, string[]> = {
      ...Object.keys(ENTITY_TYPES).reduce(
        (acc, type) => {
          acc[type] = [];
          return acc;
        },
        {} as Record<string, string[]>,
      ),
      ordered: [],
    };

    let tag: string | undefined;
    for (const item of pathItems) {
      if (item.tag) {
        tag = item.tag;
      } else {
        const fragment = getLastFragment(item.entity_type) || item.orm_base;
        const currentCount = tagRegistry[item.orm_base].filter((tag) =>
          tag.startsWith(fragment),
        ).length;
        tag = `${fragment}_${currentCount + 1}`;
      }
      tagRegistry[item.orm_base].push(tag);
      tagRegistry.ordered.push(tag);
    }

    return tagRegistry;
  }, [pathItems]);

  const request = useMemo<QbRequest>(() => {
    const serializeItem = (item: QbPathItem, index: number): QbPathItem => {
      const tag = tags.ordered[index];

      let joiningKeyword, joiningValue, edgeTag;
      if (index > 0) {
        joiningKeyword = item.joining_keyword
          ? `with_${item.joining_keyword}`
          : null;
        joiningValue =
          joiningKeyword && item.joining_value ? item.joining_value : null;
        edgeTag =
          item.edge_tag ||
          (joiningKeyword && joiningValue ? `${tag}--${joiningValue}` : null);
      } else {
        joiningKeyword = null;
        joiningValue = null;
        edgeTag = null;
      }

      return {
        entity_type: item.entity_type,
        orm_base: item.orm_base,
        tag: tag,
        joining_keyword: joiningKeyword,
        joining_value: joiningValue,
        edge_tag: edgeTag,
        outerjoin: item.outerjoin,
      };
    };

    const path = pathItems.map((item, index) => serializeItem(item, index));

    const filters = pathItems.reduce(
      (acc, item, index) => {
        acc[path[index].tag] = item.filters || {};
        return acc;
      },
      {} as Record<string, Record<string, unknown>>,
    );

    const project = pathItems.reduce(
      (acc, item, index) => {
        acc[path[index].tag] = item.projections || [];
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return {
      path,
      filters,
      project,
      limit,
      offset,
      distinct,
    };
  }, [distinct, limit, offset, pathItems, tags]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setIndex(1);

    try {
      const response = await submitRequest(request, { full });
      setResults(response.data?.attributes?.results || []);
      setMeta(response.meta || null);
      setPage(1);
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
                  <QbEditor
                    pathItems={pathItems}
                    setPathItems={setPathItems}
                    tags={tags}
                    limit={limit}
                    setLimit={setLimit}
                    offset={offset}
                    setOffset={setOffset}
                    distinct={distinct}
                    setDistinct={setDistinct}
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
                  <QbPreview request={request} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Carousel.Item>
        <Carousel.Item>
          <Card className="qb-card">
            <Card.Body>
              <QbResults
                results={results}
                page={page}
                setPage={setPage}
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

function getLastFragment(str: string) {
  const slice = str.startsWith("group") ? -1 : -2;
  return str.split(".").slice(slice)[0];
}
