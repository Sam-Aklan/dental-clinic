import { useState, useMemo, useCallback } from "react";

export function usePagination(total: number, initialPageSize = 10) {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [page, setPageState] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const clampedPage = useMemo(() => Math.min(Math.max(page, 1), totalPages), [page, totalPages]);

  const setPage = useCallback(
    (n: number) => {
      setPageState(Math.min(Math.max(n, 1), totalPages));
    },
    [totalPages],
  );

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPageState(1);
  }, []);

  const reset = useCallback(() => {
    setPageState(1);
    setPageSizeState(initialPageSize);
  }, [initialPageSize]);

  const offset = useMemo(() => (clampedPage - 1) * pageSize, [clampedPage, pageSize]);

  return {
    page: clampedPage,
    pageSize,
    total,
    totalPages,
    offset,
    setPage,
    setPageSize,
    reset,
  };
}
