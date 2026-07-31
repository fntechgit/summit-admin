import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import T from "i18n-react";
import FreeTextSearch from "openstack-uicore-foundation/lib/components/free-text-search";
import Table from "openstack-uicore-foundation/lib/components/table";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import { Pagination } from "react-bootstrap";
import TextArea from "openstack-uicore-foundation/lib/components/inputs/textarea-input";
import {
  clearNotesParams,
  getNotes,
  exportNotes,
  saveNote,
  deleteNote
} from "../../actions/notes-actions";

import styles from "./index.module.less";

const NotesPanel = ({
  attendeeId,
  ticketId,
  open,
  onToggle,
  notes,
  term,
  currentPage,
  perPage,
  lastPage,
  order,
  orderDir,
  columns,
  getNotes,
  exportNotes,
  saveNote,
  deleteNote,
  clearNotesParams
}) => {
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    getNotes(attendeeId, ticketId, term, 1, perPage, order, orderDir).then(
      () => {
        if (!open) onToggle();
      }
    );

    return () => {
      clearNotesParams();
    };
  }, []);

  const handleSaveNote = () => {
    saveNote(attendeeId, ticketId, newNote).then(() => setNewNote(""));
  };

  const handleDeleteNote = (noteId) => {
    const msg = {
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("notes_panel.remove_warning")} ${noteId}`,
      type: "warning"
    };

    Swal.fire(msg).then(() => {
      deleteNote(attendeeId, noteId);
    });
  };

  const handleSort = (index, key, dir) => {
    getNotes(attendeeId, ticketId, term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getNotes(attendeeId, ticketId, term, page, perPage, order, orderDir);
  };

  const handleSearch = (newTerm) => {
    getNotes(
      attendeeId,
      ticketId,
      newTerm,
      currentPage,
      perPage,
      order,
      orderDir
    );
  };

  const handleExport = () => {
    exportNotes(attendeeId, ticketId, term, order, orderDir);
  };

  const tableOptions = {
    className: styles.notesTable,
    sortCol: order,
    sortDir: orderDir,
    actions: {
      delete: { onClick: handleDeleteNote }
    }
  };

  const tableColumns = [
    { columnKey: "id", value: T.translate("notes_panel.id"), sortable: true },
    {
      columnKey: "created",
      value: T.translate("notes_panel.created"),
      sortable: true
    },
    {
      columnKey: "author_fullname",
      value: T.translate("notes_panel.author_fullname"),
      sortable: true
    },
    {
      columnKey: "author_email",
      value: T.translate("notes_panel.author_email"),
      sortable: true
    },
    { columnKey: "ticket_link", value: T.translate("notes_panel.ticket_id") },
    { columnKey: "content", value: T.translate("notes_panel.content") }
  ];

  const showColumns = columns
    ? tableColumns.filter((c) => columns.include(c.columnKey))
    : tableColumns;

  return (
    <Panel
      show={open}
      title={T.translate("notes_panel.title")}
      handleClick={onToggle}
    >
      <div className="row">
        <div className={`col-md-12 ${styles.addNewNote}`}>
          <div>
            <label>Add new note</label>
          </div>
          <div className="input-group">
            <TextArea
              className="form-control"
              value={newNote}
              onChange={(ev) => setNewNote(ev.target.value)}
              maxLength={1024}
            />
            <span className="input-group-btn" style={{ verticalAlign: "top" }}>
              <input
                type="button"
                className="btn btn-default"
                onClick={handleSaveNote}
                value={T.translate("general.add")}
              />
            </span>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate("notes_panel.placeholders.search")}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6">
          <button
            className="btn btn-default exportButton pull-right"
            onClick={handleExport}
          >
            {T.translate("general.export")}
          </button>
        </div>
      </div>

      {notes.length === 0 && <div>{T.translate("notes_panel.no_entries")}</div>}

      {notes.length > 0 && (
        <>
          <Table
            options={tableOptions}
            data={notes}
            columns={showColumns}
            onSort={handleSort}
          />
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
          />
        </>
      )}
    </Panel>
  );
};

const mapStateToProps = ({ notesState }) => ({
  ...notesState
});

export default connect(mapStateToProps, {
  getNotes,
  exportNotes,
  saveNote,
  deleteNote,
  clearNotesParams
})(NotesPanel);
