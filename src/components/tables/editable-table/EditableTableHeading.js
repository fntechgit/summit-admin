import React from "react";
import PropTypes from "prop-types";
import { SORT_ASCENDING, SORT_DESCENDING } from "../../../utils/constants";

function EditableTableHeading(props) {
  const {
    editEnabled,
    sortable,
    sortDir,
    onSort,
    columnIndex,
    columnKey,
    sortFunc,
    width,
    children
  } = props;
  const getSortClass = () => {
    // disable sorting if on edit mode
    if (!sortable || editEnabled) return null;

    switch (sortDir) {
      case SORT_ASCENDING:
        return "sorting_asc";
      case SORT_DESCENDING:
        return "sorting_desc";
      default:
        return sortable ? "sorting" : null;
    }
  };

  const handleSort = (e) => {
    e.preventDefault();

    if (!onSort || !sortable) return;

    onSort(
      columnIndex,
      columnKey,
      sortDir ? sortDir * SORT_DESCENDING : SORT_ASCENDING,
      sortFunc
    );
  };

  return (
    <th onClick={handleSort} className={getSortClass()} width={width}>
      {children}
    </th>
  );
}

EditableTableHeading.propTypes = {
  onSort: PropTypes.func,
  sortDir: PropTypes.number,
  columnIndex: PropTypes.number,
  columnKey: PropTypes.any,
  sortable: PropTypes.bool,
  sortFunc: PropTypes.func
};

export default EditableTableHeading;
