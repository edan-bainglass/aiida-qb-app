import { Alert, Badge, Card, Spinner, Table } from "react-bootstrap";

import type { QueryBuilderError } from "../types/query";
import { toTableData } from "../utils/query";

interface QueryBuilderResultsProps {
  results: unknown[];
  error: QueryBuilderError | null;
  loading: boolean;
  meta: {
    total: number;
    page: number;
    pageSize: number;
  } | null;
  onBack: () => void;
}

export const QueryBuilderResults: React.FC<QueryBuilderResultsProps> = ({
  results,
  error,
  loading,
  meta,
  onBack,
}) => {
  return (
    <Card className="qb-card qb-results-card">
      <Card.Body>
        <div className="qb-section-head">
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
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
                  {Object.keys(toTableData(results)[0] ?? {}).map((column) => (
                    <th key={column}>{column}</th>
                  ))}
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
