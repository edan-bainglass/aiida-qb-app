import { useMemo, useState } from "react";

import { Carousel, Container } from "react-bootstrap";

import { submitRequest } from "@/api/querybuilder";
import aiidaLogo from "@/assets/img/aiida-logo.svg";
import { QueryBuilderEditor, QueryBuilderResults } from "@/components";
import type {
  QueryBuilderError,
  QueryBuilderPathItem,
  QueryBuilderRequest,
} from "@/types/query";
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
  const [flat, setFlat] = useState(true);
  const [full, setFull] = useState(false);

  // Results state
  const [results, setResults] = useState<unknown[]>([]);
  const [error, setError] = useState<QueryBuilderError | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);

  const updatePathItem = (
    index: number,
    updatedItem: Partial<QueryBuilderPathItem>,
  ) => {
    setPathItems((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...updatedItem } : item,
      ),
    );
  };

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
      const response = await submitRequest(request, { flat, full });
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
          <QueryBuilderEditor
            pathItems={pathItems}
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
            updatePathItem={updatePathItem}
            handleSubmit={handleSubmit}
            request={request}
          />
        </Carousel.Item>
        <Carousel.Item>
          <QueryBuilderResults
            results={results}
            error={error}
            loading={loading}
            meta={meta}
            onBack={() => setIndex(0)}
          />
        </Carousel.Item>
      </Carousel>
    </Container>
  );
};

export default App;
