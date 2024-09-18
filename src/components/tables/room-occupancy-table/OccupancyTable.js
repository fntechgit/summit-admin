import React, { useState } from "react";
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
      <OccupancyTableCell key={`cell_${row.id}`} className={colClass}>
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

function OccupancyTable(props) {
  const [overflowRoom, setOverflowRoom] = useState(null);
  const { options, columns } = props;
  const sortCol = options?.sortCol || defaults.sortCol;
  const sortDir = options?.sortDir || defaults.sortDir;
  const sortFunc = options?.sortFunc || defaults.sortFunc;
  options.actions.setOverflowStream = (room) => setOverflowRoom(room);

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
                  onSort={props.onSort}
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
            props.data.map((row, i) => {
              if (Array.isArray(row) && row.length !== columns.length) {
                console.warn(
                  `Data at row ${i} is ${row.length}. It should be ${columns.length}.`
                );
                return <tr key={`row_${row.id}`} />;
              }

              return (
                <OccupancyTableRow even={i % TWO === 0} key={`row_${row.id}`}>
                  {createRow(row, columns, options.actions)}
                </OccupancyTableRow>
              );
            })}
        </tbody>
      </table>
      <OverflowModal
        room={overflowRoom}
        show={!!overflowRoom}
        onHide={() => setOverflowRoom(null)}
        onSave={console.log}
        onDelete={console.log}
      />
    </div>
  );
}

export default OccupancyTable;
