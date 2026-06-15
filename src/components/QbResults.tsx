import { useMemo } from "react";

import { Alert, Badge, Pagination, Spinner, Table } from "react-bootstrap";

import type { QbError } from "@/types/query";

import "./QbResults.scss";

interface QbResultsProps {
  results: unknown[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  error: QbError | null;
  loading: boolean;
  meta: {
    total: number;
    page: number;
    pageSize: number;
  } | null;
  onBack: () => void;
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
  const tableData = useMemo(() => toTableData(results), [results]);

  const columns = useMemo(() => Object.keys(tableData[0] ?? {}), [tableData]);

  const totalTableRows = tableData.length;
  const totalTablePages = Math.ceil(totalTableRows / TABLE_PAGE_SIZE);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * TABLE_PAGE_SIZE;
    return tableData.slice(start, start + TABLE_PAGE_SIZE);
  }, [tableData, page]);

  const showingFrom =
    totalTableRows === 0 ? 0 : (page - 1) * TABLE_PAGE_SIZE + 1;

  const showingTo = Math.min(page * TABLE_PAGE_SIZE, totalTableRows);

  return (
    <div id="qb-results">
      <div id="qb-results-header">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          Back
        </button>

        <h2>Results</h2>

        <div id="qb-meta">
          {meta ? (
            <>
              <Badge bg="secondary">Matches {meta.total}</Badge>
              <Badge bg="secondary">Returned {meta.pageSize}</Badge>
            </>
          ) : null}

          {totalTableRows > 0 ? (
            <Badge bg="secondary">
              Showing {showingFrom}-{showingTo}
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
      ) : tableData.length > 0 ? (
        <>
          <div id="qb-table-wrap">
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column}>{formatColumnHeader(column)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td key={column}>{row[column]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <ResultsPagination
            page={page}
            totalPages={totalTablePages}
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

function toTableData(results: unknown[]): Array<Record<string, string>> {
  return results.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { value: formatCellValue(row) };
    }

    return Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, value]) => [
        key,
        formatCellValue(value),
      ]),
    );
  });
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

type PaginationItem =
  | { type: "page"; page: number; active?: boolean }
  | { type: "ellipsis"; key: string };

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
