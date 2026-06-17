import { useMemo } from "react";

import { Alert, Badge, Pagination, Spinner, Table } from "react-bootstrap";

import type {
  PaginationItem,
  QbError,
  QbResponseMeta,
  QbResult,
} from "@/types/query";

import "./QbResults.scss";

interface QbResultsProps {
  results: QbResult[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  error: QbError | null;
  loading: boolean;
  meta: QbResponseMeta | null;
  onBack: () => void;
}

interface TagTable {
  tag: string;
  columns: string[];
  rows: Record<string, string>[];
}

const TABLE_PAGE_SIZE = 10;

export const QbResults: React.FC<QbResultsProps> = ({
  results,
  page,
  setPage,
  error,
  loading,
  meta,
  onBack,
}) => {
  const totalHits = results.length;
  const totalPages = Math.ceil(totalHits / TABLE_PAGE_SIZE);

  const visibleHits = useMemo(() => {
    const start = (page - 1) * TABLE_PAGE_SIZE;
    return results.slice(start, start + TABLE_PAGE_SIZE);
  }, [results, page]);

  const tagTables = useMemo(() => toTagTables(visibleHits), [visibleHits]);

  const showingFrom = totalHits === 0 ? 0 : (page - 1) * TABLE_PAGE_SIZE + 1;
  const showingTo = Math.min(page * TABLE_PAGE_SIZE, totalHits);

  return (
    <div id="qb-results">
      <div className="qb-results-header">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          Back
        </button>

        <h2>Results</h2>

        <div id="qb-meta">
          {meta ? (
            <>
              <Badge bg="secondary">Matches {meta.total}</Badge>
              <Badge bg="secondary">Returned {results.length}</Badge>
            </>
          ) : null}

          {totalHits > 0 ? (
            <Badge bg="secondary">
              Showing hits {showingFrom}-{showingTo}
            </Badge>
          ) : null}
        </div>
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
      ) : tagTables.length > 0 ? (
        <>
          <div id="qb-tag-tables">
            {tagTables.map((tagTable) => (
              <section className="qb-tag-table" key={tagTable.tag}>
                <div className="qb-tag-table-header">
                  <h3>{tagTable.tag}</h3>
                  <Badge bg="secondary">{tagTable.rows.length} rows</Badge>
                </div>

                <div className="qb-table-wrap">
                  <Table striped bordered hover responsive size="sm">
                    <thead>
                      <tr>
                        {tagTable.columns.map((column) => (
                          <th key={column}>{formatColumnHeader(column)}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {tagTable.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {tagTable.columns.map((column) => (
                            <td key={column}>{row[column]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </section>
            ))}
          </div>

          <ResultsPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div id="qb-empty">No results found</div>
      )}
    </div>
  );
};

const ResultsPagination: React.FC<{
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <Pagination className="justify-content-center mt-3">
      <Pagination.First disabled={page === 1} onClick={() => onPageChange(1)} />

      <Pagination.Prev
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      />

      {paginationItems.map((item) => {
        if (item.type === "ellipsis") {
          return <Pagination.Ellipsis key={item.key} disabled />;
        }

        return (
          <Pagination.Item
            key={item.page}
            active={item.active}
            onClick={() => onPageChange(item.page)}
          >
            {item.page}
          </Pagination.Item>
        );
      })}

      <Pagination.Next
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      />

      <Pagination.Last
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
      />
    </Pagination>
  );
};

function toTagTables(hits: QbResult[]): TagTable[] {
  const tables = new Map<
    string,
    {
      columns: string[];
      rows: Record<string, string>[];
      seenRows: Set<string>;
    }
  >();

  for (const hit of hits) {
    for (const [tag, projections] of Object.entries(hit)) {
      if (!tables.has(tag)) {
        tables.set(tag, {
          columns: [],
          rows: [],
          seenRows: new Set(),
        });
      }

      const table = tables.get(tag)!;
      const row: Record<string, string> = {};

      for (const [projectionKey, value] of Object.entries(projections)) {
        if (!table.columns.includes(projectionKey)) {
          table.columns.push(projectionKey);
        }

        row[projectionKey] = formatCellValue(value);
      }

      const rowKey = stableStringify(row);

      table.seenRows.add(rowKey);
      table.rows.push(row);
    }
  }

  return Array.from(tables.entries()).map(([tag, table]) => ({
    tag,
    columns: table.columns,
    rows: table.rows,
  }));
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatColumnHeader(column: string): string {
  return column.replace(/_/g, " ");
}

function stableStringify(value: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = value[key];
        return acc;
      }, {}),
  );
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 2,
): PaginationItem[] {
  const items: PaginationItem[] = [];

  const firstPage = 1;
  const lastPage = totalPages;

  const startPage = Math.max(currentPage - siblingCount, firstPage + 1);
  const endPage = Math.min(currentPage + siblingCount, lastPage - 1);

  items.push({
    type: "page",
    page: firstPage,
    active: currentPage === firstPage,
  });

  if (startPage > firstPage + 1) {
    items.push({ type: "ellipsis", key: "start-ellipsis" });
  }

  for (let page = startPage; page <= endPage; page += 1) {
    items.push({
      type: "page",
      page,
      active: currentPage === page,
    });
  }

  if (endPage < lastPage - 1) {
    items.push({ type: "ellipsis", key: "end-ellipsis" });
  }

  if (lastPage > firstPage) {
    items.push({
      type: "page",
      page: lastPage,
      active: currentPage === lastPage,
    });
  }

  return items;
}
