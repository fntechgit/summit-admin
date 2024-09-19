import React from "react";
import OccupancyTableHeading from "./OccupancyTableHeading";
import OccupancyTableCell from "./OccupancyTableCell";
import OccupancyTableRow from "./OccupancyTableRow";
import OccupancyActionsTableCell from "./OccupancyActionsTableCell";
import { TWO } from "../../../utils/constants";

import "./occupancy-table.css";

const defaults = {
  sortFunc: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: ""
};

const createRow = (row, columns, actions) => {
  const action_buttons = "";
  const cells = columns.map((col, i) => {
    const colClass = col.hasOwnProperty("className") ? col.className : "";

    return (
      <OccupancyTableCell key={`cell_${row + i}`} className={colClass}>
        {row[col.columnKey]}
      </OccupancyTableCell>
    );
  });

  if (actions) {
    cells.push(
      <OccupancyActionsTableCell
        key="actions_cell"
        id={row.id}
        value={row[actions.valueRow]}
        actions={actions}
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
  const { options, columns } = props;

  return (
    <div className="occupancyTableWrapper">
      <table className="table table-striped table-hover occupancyTable">
        <thead>
          <tr>
            {columns.map((col, i) => {
              const sortCol = options.hasOwnProperty("sortCol")
                ? options.sortCol
                : defaults.sortCol;
              const sortDir = options.hasOwnProperty("sortDir")
                ? options.sortDir
                : defaults.sortDir;
              const sortFunc = options.hasOwnProperty("sortFunc")
                ? options.sortFunc
                : defaults.sortFunc;
              const sortable = col.hasOwnProperty("sortable")
                ? col.sortable
                : defaults.sortable;
              const colWidth = col.hasOwnProperty("width")
                ? col.width
                : defaults.colWidth;
              const colClass = col.hasOwnProperty("className")
                ? col.className
                : "";

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
                  key={`heading_${row + i}`}
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
                return <tr key={`row_${row + i}`} />;
              }

              return (
                <OccupancyTableRow even={i % TWO === 0} key={`row_${row + i}`}>
                  {createRow(row, columns, options.actions)}
                </OccupancyTableRow>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default OccupancyTable;
