import React, { useState } from "react";
import PropTypes from "prop-types";
import OccupancyTableHeading from "./OccupancyTableHeading";
import OccupancyTableCell from "./OccupancyTableCell";
import OccupancyTableRow from "./OccupancyTableRow";
import OccupancyActionsTableCell from "./OccupancyActionsTableCell";

import "./occupancy-table.css";
import OverflowModal from "./overflow-modal";
import { TWO } from "../../../utils/constants";

const defaults = {
  sortFunc: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: ""
};

const createRow = (row, columns, actions) => {
  const cells = columns.map((col) => {
    const colClass = col.hasOwnProperty("className") ? col.className : "";

    return (
      <OccupancyTableCell
        key={`cell_${col.columnKey}_${row.id}`}
        className={colClass}
      >
        {row[col.columnKey]}
      </OccupancyTableCell>
    );
  });

  if (actions) {
    cells.push(
      <OccupancyActionsTableCell
        key={`actions_cell_${row.id}`}
        id={row.id}
        value={row[actions.valueRow]}
        actions={actions}
        row={row}
      />
    );
  }

  return cells;
};

const getSortDir = (columnKey, columnIndex, sortCol, sortDir) => {
  if (columnKey && columnKey === sortCol) {
    return sortDir;
  }
  if (sortCol === columnIndex) {
    return sortDir;
  }
  return null;
};

const OccupancyTable = ({
  options,
  columns,
  data,
  onSort,
  onSaveOverflow,
  onDeleteOverflow
}) => {
  const [overflowEvent, setOverflowEvent] = useState(null);
  const sortCol = options?.sortCol || defaults.sortCol;
  const sortDir = options?.sortDir || defaults.sortDir;
  const sortFunc = options?.sortFunc || defaults.sortFunc;

  const handleSaveOverflow = (eventId, streamUrl, isSecure) => {
    onSaveOverflow(eventId, streamUrl, isSecure);
    setOverflowEvent(null);
  };

  const handleDeleteOverflow = (eventId) => {
    onDeleteOverflow(eventId);
    setOverflowEvent(null);
  };

  return (
    <div className="occupancyTableWrapper">
      <table className="table table-striped table-hover occupancyTable">
        <thead>
          <tr>
            {columns.map((col, i) => {
              const sortable = col?.sortable || defaults.sortable;
              const colWidth = col?.width || defaults.colWidth;
              const colClass = col?.className || "";

              return (
                <OccupancyTableHeading
                  className={colClass}
                  onSort={onSort}
                  sortDir={getSortDir(col.columnKey, i, sortCol, sortDir)}
                  sortable={sortable}
                  sortFunc={sortFunc}
                  columnIndex={i}
                  columnKey={col.columnKey}
                  width={colWidth}
                  key={`heading_${col.columnKey}`}
                >
                  {col.value}
                </OccupancyTableHeading>
              );
            })}
            {options.actions && (
              <OccupancyTableHeading key="actions_heading">
                &nbsp;
              </OccupancyTableHeading>
            )}
          </tr>
        </thead>
        <tbody>
          {columns.length > 0 &&
            data.map((row, i) => {
              if (Array.isArray(row) && row.length !== columns.length) {
                console.warn(
                  `Data at row ${i} is ${row.length}. It should be ${columns.length}.`
                );
                return <tr key={`row_${row.id}`} />;
              }

              return (
                <OccupancyTableRow even={i % TWO === 0} key={`row_${row.id}`}>
                  {createRow(row, columns, {
                    ...options.actions,
                    onOverflow: setOverflowEvent
                  })}
                </OccupancyTableRow>
              );
            })}
        </tbody>
      </table>
      <OverflowModal
        event={overflowEvent}
        show={!!overflowEvent}
        onHide={() => setOverflowEvent(null)}
        onSave={handleSaveOverflow}
        onDelete={handleDeleteOverflow}
      />
    </div>
  );
};

OccupancyTable.propTypes = {
  options: PropTypes.object,
  columns: PropTypes.array,
  data: PropTypes.array,
  onSort: PropTypes.func,
  onSaveOverflow: PropTypes.func,
  onDeleteOverflow: PropTypes.func
};

export default OccupancyTable;
