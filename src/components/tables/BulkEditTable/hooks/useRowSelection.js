import { useState } from "react";

const useRowSelection = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [editEnabled, setEditEnabled] = useState(false);

  const isSelected = (rowId) => selectedRows.some((row) => row.id === rowId);

  const toggleRow = (row) => {
    setSelectedRows((current) =>
      isSelected(row.id)
        ? current.filter((r) => r.id !== row.id)
        : [...current, row]
    );
  };

  const isAllSelected = (rows) =>
    rows.length > 0 && rows.every((row) => isSelected(row.id));

  const toggleAll = (rows) => {
    setSelectedRows(isAllSelected(rows) ? [] : rows);
  };

  const editField = (rowId, key, value) => {
    setSelectedRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const reset = () => {
    setSelectedRows([]);
    setEditEnabled(false);
  };

  return {
    selectedRows,
    isSelected,
    toggleRow,
    isAllSelected,
    toggleAll,
    editField,
    editEnabled,
    enterEditMode: () => setEditEnabled(true),
    cancel: reset,
    reset
  };
};

export default useRowSelection;
