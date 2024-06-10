import React, { useState, useEffect } from "react";
import EditableTableHeading from "./EditableTableHeading";
import EditableTableRow from "./EditableTableRow";
import ReactTooltip from "react-tooltip";
import T from "i18n-react/dist/i18n-react";

const defaults = {
  sortFunc: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: "",
};

const EditableTable = (props) => {
  const { 
    options, 
    columns, 
    currentSummit,
    page,
    data,
    handleSort,
    updateData,
    handleDeleteRow,
    resetData,
  } = props;
  let tableClass = options.hasOwnProperty("className") ? options.className : "";
  const [editButton, setEditButton] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  tableClass += options.actions?.edit ? " table-hover" : "";  

  const getSortDir = (columnKey, columnIndex, sortCol, sortDir) => {
    if (columnKey && columnKey === sortCol) {
      return sortDir;
    }
    if (sortCol === columnIndex) {
      return sortDir;
    }
    return null;
  };

  const resetState = () => {
    setSelectAll(false);
    setEditButton(false);
    setEditEnabled(false);
    setSelected([]);
    resetData();
  };

  // reseting states on data changes/pagination
  useEffect(() => {
    resetState();
  }, [page]);

  useEffect(() => { 
    if (selected.length > 0) {
      setEditButton(true);
    } else {
      setEditButton(false);
      setEditEnabled(false);
    }
  }, [selected]);

  useEffect(() => {
    if (selectAll) {
      setSelected(data);
      setSelectAll(true);
    } else {
      setSelectAll(false);
      setSelected([]);
    }
  }, [selectAll]);

  const updateSelected = (row, checked) => { 
    let selectedRow = row;
    const rowIndex = selected.findIndex((s) => s.id === selectedRow.id);
    let exists = rowIndex !== -1;

    if (checked) {
      if (exists) {
        // if already on selected list, replace with new data
        const updatedSelected = Object.assign({}, selectedRow);
        const newSelected = selected.slice();
        newSelected[rowIndex] = updatedSelected;
        setSelected(newSelected);
      } else {
        // append to list
        setSelected((currSelected) => [...currSelected, selectedRow]);
      }
    } else {
      setSelected(selected.filter((se) => se.id !== selectedRow.id));
    }
  };

  const onUpdateEvents = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    updateData(currentSummit.id, selected);
    resetState();
  };

  return (
    <div>
      <hr />
      <div className="events-list-actions">
        <div>
          {editEnabled ? (
            <>
              <button
                className={`btn btn-primary right-space save-publish-button`}
                onClick={onUpdateEvents}
              >
                {T.translate("bulk_actions_page.btn_apply_changes")}
              </button>
              <button
                className={`btn btn-secondary right-space cancel-button`}
                onClick={resetState}
              >
                {T.translate("general.cancel")}
              </button>
            </>
          ) : (
            <button
              className={`btn btn-primary right-space edit-button ${
                editButton ? "" : "disabled"
              }`}
              onClick={() => setEditEnabled(!editEnabled)}
            >
              {T.translate("event_list.edit_selected")}
            </button>
          )}
        </div>
      </div>
      <table className={"table table-striped selectableTable events-editable-table " + tableClass}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                id="select_all"
                name="select_all"
                onChange={() => setSelectAll(!selectAll)}
                checked={selectAll}
              />
            </th>
            {columns.map((col, i) => {
              let sortCol =
                typeof options.sortCol != "undefined"
                  ? options.sortCol
                  : defaults.sortCol;
              let sortDir =
                typeof options.sortDir != "undefined"
                  ? options.sortDir
                  : defaults.sortDir;
              let sortFunc =
                typeof options.sortFunc != "undefined"
                  ? options.sortFunc
                  : defaults.sortFunc;
              let sortable =
                typeof col.sortable != "undefined"
                  ? col.sortable
                  : defaults.sortable;
              let colWidth =
                typeof col.width != "undefined" ? col.width : defaults.colWidth;

              return (
                <EditableTableHeading
                  editEnabled={editEnabled}
                  onSort={handleSort}
                  sortDir={getSortDir(col.columnKey, i, sortCol, sortDir)}
                  sortable={sortable}
                  sortFunc={sortFunc}
                  columnIndex={i}
                  columnKey={col.columnKey}
                  width={colWidth}
                  key={"heading_" + i}
                >
                  {col.value}
                </EditableTableHeading>
              );
            })}
            {options.actions && (
              <EditableTableHeading key="actions_heading">
                {options.actionsHeader || " "}
              </EditableTableHeading>
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
                return <tr key={"row_" + i} />;
              }

              return (
                <tr role="row" key={`row_${row["id"]}`}>
                  <EditableTableRow
                    row={row}
                    currentSummit={currentSummit}
                    editEnabled={editEnabled}
                    selected={selected}
                    updateSelected={updateSelected}
                    selectAll={selectAll}
                    deleteRow={handleDeleteRow}
                    columns={columns}
                    actions={options.actions}
                  />
                </tr>
              );
            })}
        </tbody>
      </table>
      <ReactTooltip delayShow={10} />
    </div>
  );
};

export default EditableTable;
