import { useCallback, useState } from 'react';

export function useTable(props) {
  const [dense, setDense] = useState(!!props?.defaultDense);
  const [page, setPage] = useState(props?.defaultCurrentPage ?? 0);
  const [orderBy, setOrderBy] = useState(props?.defaultOrderBy ?? 'name');
  const [rowsPerPage, setRowsPerPage] = useState(props?.defaultRowsPerPage ?? 10);
  const [order, setOrder] = useState(props?.defaultOrder ?? 'asc');

  const onSort = useCallback(
    (id) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((_event, newPage) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  const onChangeDense = useCallback((event) => {
    setDense(event.target.checked);
  }, []);

  return {
    dense,
    order,
    page,
    orderBy,
    rowsPerPage,
    onSort,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
    onChangeDense,
    setPage,
    setDense,
    setOrder,
    setOrderBy,
    setRowsPerPage,
  };
}

export function emptyRows(page, rowsPerPage, arrayLength) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}
