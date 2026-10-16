import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import DateTimePicker from "openstack-uicore-foundation/lib/components/inputs/datetimepicker";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Tooltip } from "react-tooltip";

import "./bannerstable.css";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import BannersActionsTableCell from "./BannersActionsTableCell";
import showConfirmDialog from "../../mui/showConfirmDialog";
import {
  deleteBanner,
  publishDate,
  saveBanner
} from "../../../actions/signage-actions";
import { MILLISECONDS_IN_SECOND, TWO } from "../../../utils/constants";

const NEW_ROW = {
  title: "",
  content: "",
  type: "Primary",
  start_date: "",
  end_date: "",
  class_name: "ScheduledSummitLocationBanner",
  enabled: true
};

const BannerRow = ({
  row,
  rowClass,
  summitTz,
  disabled,
  isSaving,
  onChange,
  onEdit,
  onDelete,
  onSave,
  onJump,
  onCancel
}) => (
  <tr id={row.id} role="row" className={rowClass}>
    <td>{row.id}</td>
    {row.is_edit ? (
      <>
        <td>
          <input
            id="title"
            className="form-control"
            value={row.title}
            onChange={(ev) => onChange(ev, row.id)}
          />
        </td>
        <td>
          <input
            id="content"
            className="form-control"
            value={row.content}
            onChange={(ev) => onChange(ev, row.id)}
          />
        </td>
        <td>{row.type}</td>
        <td>{row.floor_loc}</td>
        <td>
          <DateTimePicker
            id="start_date"
            onChange={(ev) => onChange(ev, row.id)}
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            timezone={summitTz}
            value={epochToMomentTimeZone(row.start_date, summitTz)}
          />
        </td>
        <td>
          <DateTimePicker
            id="end_date"
            onChange={(ev) => onChange(ev, row.id)}
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            timezone={summitTz}
            value={epochToMomentTimeZone(row.end_date, summitTz)}
          />
        </td>
      </>
    ) : (
      <>
        <td>{row.title}</td>
        <td>{row.content}</td>
        <td>{row.type}</td>
        <td>{row.floor_loc}</td>
        <td>{row.start_date_str}</td>
        <td>{row.end_date_str}</td>
      </>
    )}
    <BannersActionsTableCell
      id={row.id}
      isEditing={!!row.is_edit}
      disabled={disabled}
      isSaving={isSaving}
      onEdit={onEdit}
      onDelete={onDelete}
      onSave={onSave}
      onJump={onJump}
      onCancel={onCancel}
    />
  </tr>
);

const NewBannerRow = ({
  row,
  onChange,
  onSave,
  summitTz,
  roomName,
  disabled
}) => (
  <tr id="new_row" className="odd">
    <td>TBD</td>
    <td>
      <input
        id="title"
        className="form-control"
        value={row.title}
        onChange={onChange}
      />
    </td>
    <td>
      <input
        id="content"
        className="form-control"
        value={row.content}
        onChange={onChange}
      />
    </td>
    <td>Primary</td>
    <td>{roomName}</td>
    <td>
      <DateTimePicker
        id="start_date"
        onChange={onChange}
        format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
        timezone={summitTz}
        value={epochToMomentTimeZone(row.start_date, summitTz)}
      />
    </td>
    <td>
      <DateTimePicker
        id="end_date"
        onChange={onChange}
        format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
        timezone={summitTz}
        value={epochToMomentTimeZone(row.end_date, summitTz)}
      />
    </td>
    <td>
      <button
        type="button"
        className="btn btn-default"
        onClick={onSave}
        disabled={disabled}
      >
        {T.translate("general.add")}
      </button>
    </td>
  </tr>
);

// mirrors the API rules for scheduled banners, returns the i18n key of the first error
const validateBanner = (row) => {
  // API allows empty title and content on EDIT, only require them when adding
  if (!row.id && !row.title?.trim()) return "signage.title_required";
  if (!row.id && !row.content?.trim()) return "signage.content_required";
  if (!row.start_date || !row.end_date) return "signage.dates_required";
  if (row.end_date <= row.start_date) return "signage.invalid_date_range";
  return null;
};

const isValidBanner = (row) => {
  const error = validateBanner(row);
  if (error) {
    Swal.fire(T.translate("general.error"), T.translate(error), "warning");
  }
  return !error;
};

const getFieldValue = (ev) => {
  const { value, type } = ev.target;
  return type === "datetime" ? value.valueOf() / MILLISECONDS_IN_SECOND : value;
};

const BannersTable = ({
  data,
  room,
  summitTz,
  saveBanner,
  deleteBanner,
  publishDate
}) => {
  const [rows, setRows] = useState(data);
  const [newRow, setNewRow] = useState(NEW_ROW);
  const [editingRow, setEditingRow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(data);
    setEditingRow(null);
  }, [data]);

  const updateRow = (id, changes) => {
    setRows((prevRows) =>
      prevRows.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );
  };

  const saveRow = (id) => {
    if (isSaving) return;
    const row = rows.find((r) => r.id === id);
    if (!isValidBanner(row)) return;

    setIsSaving(true);
    saveBanner(row)
      .then(() => {
        setEditingRow(null);
        updateRow(id, { is_edit: false });
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const deleteClick = async (id) => {
    const row = rows.find((r) => r.id === id);
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("general.row_remove_warning")} ${row.title}`,
      iconType: "warning",
      confirmButtonText: T.translate("general.yes_delete"),
      confirmButtonColor: "error"
    });

    if (isConfirmed) deleteBanner(id);
  };

  const editRow = (id) => {
    // save editing row for cancel
    setEditingRow(rows.find((r) => r.id === id));
    updateRow(id, { is_edit: true });
  };

  const editRowCancel = (id) => {
    setRows(rows.map((r) => (r.id === id ? editingRow : r)));
    setEditingRow(null);
  };

  const onChangeCell = (ev, id) => {
    updateRow(id, { [ev.target.id]: getFieldValue(ev) });
  };

  const onChangeNewCell = (ev) => {
    setNewRow({ ...newRow, [ev.target.id]: getFieldValue(ev) });
  };

  const saveNewRow = (ev) => {
    ev.preventDefault();
    // the draft is kept until the save succeeds, so block a second submit of the same draft
    if (isSaving) return;
    if (!isValidBanner(newRow)) return;

    setIsSaving(true);
    saveBanner(newRow)
      .then(() => {
        setNewRow(NEW_ROW);
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const jumpTo = async (id) => {
    const row = rows.find((r) => r.id === id);
    const isConfirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("signage.jump_warning", { title: row.title }),
      iconType: "warning",
      confirmButtonText: T.translate("signage.yes_jump")
    });

    if (isConfirmed) publishDate(row.start_date);
  };

  return (
    <div>
      <table className="table table-striped table-bordered table-hover bannersTable">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>{T.translate("signage.id")}</th>
            <th style={{ width: "15%" }}>{T.translate("signage.title")}</th>
            <th style={{ width: "20%" }}>{T.translate("signage.content")}</th>
            <th style={{ width: "10%" }}>{T.translate("signage.type")}</th>
            <th style={{ width: "15%" }}>{T.translate("signage.floor_loc")}</th>
            <th style={{ width: "15%" }}>
              {T.translate("signage.start_date")}
            </th>
            <th style={{ width: "15%" }}>{T.translate("signage.end_date")}</th>
            <th style={{ width: "5%" }}>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <BannerRow
              key={`row_${row.id}`}
              row={row}
              rowClass={i % TWO === 0 ? "even" : "odd"}
              summitTz={summitTz}
              // only one row can be edited at a time, lock the rest
              disabled={!!editingRow && editingRow.id !== row.id}
              isSaving={isSaving}
              onChange={onChangeCell}
              onEdit={editRow}
              onDelete={deleteClick}
              onSave={saveRow}
              onJump={jumpTo}
              onCancel={editRowCancel}
            />
          ))}
          <NewBannerRow
            row={newRow}
            onChange={onChangeNewCell}
            onSave={saveNewRow}
            summitTz={summitTz}
            roomName={room.name}
            disabled={!!editingRow || isSaving}
          />
        </tbody>
      </table>
      <Tooltip delayShow={10} />
    </div>
  );
};

const mapStateToProps = ({ currentSummitState }) => ({
  summitTz: currentSummitState.currentSummit.time_zone_id
});

export default connect(mapStateToProps, {
  saveBanner,
  deleteBanner,
  publishDate
})(BannersTable);
