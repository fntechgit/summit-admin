import React, { useEffect, useState } from "react";
import { TextArea } from "openstack-uicore-foundation/lib/components";
import T from "i18n-react/dist/i18n-react";
import history from "../../../history";

import styles from "./index.module.less";

function EditableTableRow(props) {
  const {
    row,
    columns,
    editEnabled,
    selected,
    updateSelected,
    deleteRow,
    selectAll,
    currentSummit,
    actions,
    formattingFunction
  } = props;
  const [checked, setChecked] = useState(false);
  const [editData, setEditData] = useState(row);

  const formattedData = formattingFunction(row, currentSummit);

  useEffect(() => {
    updateSelected(editData, checked);
  }, [checked, row]);
  useEffect(() => {
    setChecked(selectAll);
  }, [selectAll]);
  useEffect(() => {
    if (selected.length === 0) {
      setChecked(false);
    }
  }, [selected]);
  useEffect(() => {
    updateSelected(editData, checked);
  }, [editData]);
  useEffect(() => {
    if (!editEnabled) {
      setEditData(row);
    }
  }, [editEnabled]);

  const onRowChange = (ev) => {
    const { value, id, type } = ev.target;
    const newEventData = { ...editData, [id]: value };
    setEditData(newEventData);
  };

  const onRemoveOption = (rowId, id) => {
    const currentRow = selected.find((r) => r.id === row.id);
    const newOptions = currentRow[id].filter((s) => s.id !== rowId);
    const newEventData = { ...editData, [id]: newOptions };
    setEditData(newEventData);
  };

  return (
    <>
      <td className={styles.colCheckbox}>
        <input
          type="checkbox"
          onChange={() => setChecked(!checked)}
          checked={checked}
        />
      </td>
      <td className={styles.colId}>{row.id}</td>
      {selected.find((s) => s.id === row.id) && editEnabled && checked ? (
        <>
          {columns.map((col, index) => {
            if (col.columnKey === "id") {
              return null;
            }
            if (col.editableField === true) {
              // Default field as text
              return (
                <td
                  key={`row-edit-${col.columnKey}-${col.id}`}
                  className={styles.bulkEditCol}
                >
                  <TextArea
                    type="text"
                    id={col.columnKey}
                    placeholder={T.translate(
                      `bulk_actions_page.placeholders.${col.columnKey}`
                    )}
                    rows={2}
                    onChange={onRowChange}
                    value={editData[col.columnKey]}
                  />
                </td>
              );
            }
            if (col.editableField) {
              return (
                <td
                  key={`row-edit-${col.columnKey}-${col.id}`}
                  className={styles.bulkEditCol}
                  style={col.customStyle}
                >
                  {col.editableField({
                    value:
                      editData[col.columnKey]?.id ||
                      editData[col.columnKey]?.value ||
                      editData[col.columnKey],
                    onChange: onRowChange,
                    row,
                    rowData: editData[col.columnKey],
                    onRemoveOption
                  })}
                </td>
              );
            }
            return (
              <td
                key={`row-edit-${col.columnKey}-${row.id}`}
                className={styles.bulkEditCol}
              >
                {col.render
                  ? col.render(row[col.columnKey])
                  : formattedData[col.columnKey]}
              </td>
            );
          })}
        </>
      ) : (
        columns.map(
          (col, i) =>
            col.columnKey !== "id" && (
              <td key={`${row.id}_${col.columnKey}`}>
                {col.render
                  ? col.render(row[col.columnKey])
                  : formattedData[col.columnKey]}
              </td>
            )
        )
      )}
      {(actions.edit || actions.delete) && (
        <td className={styles.actionColumn}>
          <div className={styles.editButtonWrapper}>
            {actions.edit && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  history.push(
                    `/app/summits/${currentSummit.id}/events/${row.id}`
                  )
                }
                aria-label={`Edit event ${row.id}`} // Provide an appropriate aria-label
              >
                <i className="fa fa-pencil-square-o edit-icon" />
              </button>
            )}
            {actions.delete && (
              <button
                type="button"
                className="text-button"
                onClick={() => deleteRow(row.id)}
                aria-label={`Delete event ${row.id}`} // Provide an appropriate aria-label
              >
                <i className="fa fa-trash-o delete-icon" />
              </button>
            )}
          </div>
        </td>
      )}
    </>
  );
}

export default EditableTableRow;
