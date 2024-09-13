import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import T from "i18n-react";
import OccupancyTableHeading from "./OccupancyTableHeading";
import OccupancyTableCell from "./OccupancyTableCell";
import OccupancyTableRow from "./OccupancyTableRow";
import OccupancyActionsTableCell from "./OccupancyActionsTableCell";

import "./occupancy-table.css";

const defaults = {
  sortFunc: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: ""
};

const createRow = (row, columns, actions) => {
  const cells = columns.map((col, i) => {
    const colClass = col.hasOwnProperty("className") ? col.className : "";

    return (
      <OccupancyTableCell key={`cell_${i}`} className={colClass}>
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
  const [showOFModal, setShowOFModal] = useState(false);
  const { options, columns } = props;
  const sortCol = options?.sortCol || defaults.sortCol;
  const sortDir = options?.sortDir || defaults.sortDir;
  const sortFunc = options?.sortFunc || defaults.sortFunc;
  options.actions.setOverflowStream = () => setShowOFModal(true);

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
                  key={`heading_${i}`}
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
                return <tr key={`row_${i}`} />;
              }

              return (
                <OccupancyTableRow even={i % 2 === 0} key={`row_${i}`}>
                  {createRow(row, columns, options.actions)}
                </OccupancyTableRow>
              );
            })}
        </tbody>
      </table>
      <Modal show={showOFModal} onHide={() => setShowOFModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Overflow Stream</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
          <div className="row">
            <div className="col-md-12">STREAM</div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={console.log}>
            {T.translate("general.save")}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default OccupancyTable;
