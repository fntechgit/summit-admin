import React, { useEffect, useState } from "react";
import { Input } from "openstack-uicore-foundation/lib/components";
import T from "i18n-react/dist/i18n-react";
import history from "../../../history";

const EditableTableRow = (props) => {
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
  } = props;
  const [checked, setChecked] = useState(false);  
  const [editData, setEditData] = useState(row);  

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
  }, [editData])
  useEffect(() => {    
    if (!editEnabled) {
      setEditData(row);
    }
  }, [editEnabled]);

  const onRowChange = (ev) => {
    const {value, id, type} = ev.target;    
    if(type === 'speakerinput') {
      const newSpeakers = {...editData, [id]: [...row[id], value]};
      setEditData(newSpeakers);
    } else {
      const newEventData = {...editData, [id]: value };
      setEditData(newEventData);
    }

  };

  const onRemoveOption = (rowId, id) => {    
    const newOptions = row[id].filter(s => s.id !== rowId);
    const newEventData = {...editData, [id]: newOptions};
    setEditData(newEventData);
  };  
  
  return (
    <>
      <td className="bulk-edit-col-checkbox">
        <input
          type="checkbox"
          onChange={() => setChecked(!checked)}
          checked={checked}
        />
      </td>
      <td className="bulk-edit-col-id">{row.id}</td>
      {selected.find((s) => s.id === row.id) && editEnabled && checked ? (
        <>
          {columns.map((col, index) => {
            if(col.columnKey === "id") {
              return;
            }
            else if(col.editableField === true) {
              // Default field as text
              return (
                <td key={`row-edit-${col.columnKey}-${index}`} className="bulk-edit-col">                  
                  <Input
                    type="text"
                    id={col.columnKey}
                    placeholder={T.translate(
                      `bulk_actions_page.placeholders.${col.columnKey}`
                    )}
                    onChange={onRowChange}
                    value={row[col.columnKey]}
                  />                    
                </td>
            )}
            else if (col.editableField) {
              return (
                <td key={`row-edit-${col.columnKey}-${index}`} className="bulk-edit-col">
                  {col.editableField({value: "", placeholder: row[col.columnKey].name, onChange: onRowChange, rowData: editData[col.columnKey], onRemoveOption: onRemoveOption})}
                </td>
              )
            }          
            else {return (<td key={`row-edit-${col.columnKey}-${index}`} className="bulk-edit-col">{row[col.columnKey]}</td>)}
          })}         
        </>
      ) : columns.map((col, i) => 
            col.columnKey !== "id" && <td key={`${row.id}${i}`}>{col.render ? col.render(row[col.columnKey]) : row[col.columnKey]}</td>)
      }
      {(actions.edit || actions.delete) && (
        <td className="action-display-tc">
          {actions.edit && (
            <span onClick={() => history.push(`/app/summits/${currentSummit.id}/events/${row.id}`)}>
              <i className="fa fa-pencil-square-o edit-icon"></i>
            </span>
          )}
          {actions.delete && (
            <span onClick={() => deleteRow(row.id)}>
              <i className="fa fa-trash-o delete-icon"></i>
            </span>
          )}
        </td>
      )}
    </>
  );
};

export default EditableTableRow;
