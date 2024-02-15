import React, { useState, useEffect } from "react";
import EditableTableHeading from "./EventsEditableTableHeading";
import EventsEditableTableRow from "./EventsEditableTableRow";
import ReactTooltip from "react-tooltip";
import {
  getAllEventTypes,
  getAllTrackCategory,
  getAllLocations,
  getAllSelectionPlans,
} from "../../../utils/summitUtils";
import T from "i18n-react/dist/i18n-react";

const defaults = {
  sortFunc: (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  sortable: false,
  sortCol: 0,
  sortDir: 1,
  colWidth: "",
};

const EventsEditableTable = (props) => {
  const { 
    options, 
    columns, 
    currentSummit, 
    data,
    updateEventTitleLocal,
    updateEventSelectionPlanLocal,
    updateEventActivityTypeLocal,
    updateEventActivityCategoryLocal,
    updateEventStreamingURLLocal,
    updateEventMeetingURLLocal,
    updateEventEtherpadURLLocal,
    updateEventSpeakersLocal,
    setSelectedEvents,
    eventBulkList
  } = props;
  let tableClass = options.hasOwnProperty("className") ? options.className : "";
  const [allEvents, setAllEvents] = useState(data);
  const [editButton, setEditButton] = useState(false);
  const [editEnabled, setEditEnabled] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  tableClass += options.actions?.edit ? " table-hover" : "";

  const venuesOptions = getAllLocations(currentSummit);
  const activityTypeOptions = getAllEventTypes(currentSummit);
  const activtyCategoryOptions = getAllTrackCategory(currentSummit);
  const selectionPlanOptions = getAllSelectionPlans(currentSummit);

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
  };

  // reseting states on data changes/pagination
  useEffect(() => {
    resetState();
  }, [data]);

  useEffect(() => {
    // console.log('selected', selected);
    if (selected.length > 0) {
      setSelectedEvents(selected);
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

  const updateSelected = (event, checked) => { 
    let selectedEvent = event;
    const eventIndex = selected.findIndex((s) => s.id === selectedEvent.id);
    let exists = eventIndex !== -1;

    if (checked) {
      if (exists) {
        // if already on selected list, replace with new data
        const updatedSelected = Object.assign({}, selectedEvent);
        const newSelected = selected.slice();
        newSelected[eventIndex] = updatedSelected;
        setSelected(newSelected);
      } else {
        // append to list
        setSelected((currSelected) => [...currSelected, selectedEvent]);
      }
    } else {
      setSelected(selected.filter((s) => s.id !== event.id));
    }
  };

  const onSavePublish = () => {};

  const onDelete = () => {};

  return (
    <div>
      <hr />
      <div className="events-list-actions">
        <div>
          {editEnabled ? (
            <>
              <button
                className={`btn btn-primary right-space save-publish-button`}
                onClick={onSavePublish}
              >
                {T.translate("bulk_actions_page.btn_apply_publish_changes")}
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
        <div>
          <button
            className={`btn btn-danger right-space delete-button ${
              editButton ? "" : "disabled"
            }`}
            onClick={onDelete}
          >
            {T.translate("event_list.delete_selected")}
          </button>
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
                  onSort={props.onSort}
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
            allEvents.map((event, i) => {
              if (Array.isArray(event) && event.length !== columns.length) {
                console.warn(
                  `Data at row ${i} is ${event.length}. It should be ${columns.length}.`
                );
                return <tr key={"row_" + i} />;
              }

              return (
                <tr role="row" key={`row_${event["id"]}`}>
                  <EventsEditableTableRow
                    index={i}
                    event={event}
                    eventBulkList={eventBulkList}
                    currentSummit={currentSummit}
                    editEnabled={editEnabled}
                    selected={selected}
                    updateSelected={updateSelected}
                    selectAll={selectAll}
                    venuesOptions={venuesOptions}
                    activityTypeOptions={activityTypeOptions}
                    activtyCategoryOptions={activtyCategoryOptions}
                    selectionPlanOptions={selectionPlanOptions}
                    columns={columns}
                    actions={options.actions}
                    updateEventTitleLocal={updateEventTitleLocal}
                    updateEventSelectionPlanLocal={updateEventSelectionPlanLocal}
                    updateEventActivityTypeLocal={updateEventActivityTypeLocal}
                    updateEventActivityCategoryLocal={updateEventActivityCategoryLocal}
                    updateEventStreamingURLLocal={updateEventStreamingURLLocal}
                    updateEventMeetingURLLocal={updateEventMeetingURLLocal}
                    updateEventEtherpadURLLocal={updateEventEtherpadURLLocal}
                    updateEventSpeakersLocal={updateEventSpeakersLocal}
                    setSelectedEvents={setSelectedEvents}
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

export default EventsEditableTable;
