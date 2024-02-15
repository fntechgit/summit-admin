import React from "react";
import PropTypes from "prop-types";

const EventsEditableTableHeading = (props) => {
  const {
    editEnabled,
    sortable,
    sortDir,
    onSort,
    columnIndex,
    columnKey,
    sortFunc,
    width,
    children,
  } = props;
  const getSortClass = () => {
    // disable sorting if on edit mode
    if (!sortable || editEnabled) return null;

    switch (sortDir) {
      case 1:
        return "sorting_asc";
      case -1:
        return "sorting_desc";
      default:
        return sortable ? "sorting" : null;
    }
  };

  const handleSort = (e) => {
    e.preventDefault();
    if (!props.hasOwnProperty("onSort") || sortable) return;

    onSort(columnIndex, columnKey, sortDir ? sortDir * -1 : 1, sortFunc);
  };

  return (
    <th onClick={handleSort} className={getSortClass()} width={width}>
      {children}
    </th>
  );
};

EventsEditableTableHeading.propTypes = {
  onSort: PropTypes.func,
  sortDir: PropTypes.number,
  columnIndex: PropTypes.number,
  columnKey: PropTypes.any,
  sortable: PropTypes.bool,
  sortFunc: PropTypes.func,
};

export default EventsEditableTableHeading;
