import React, {useEffect, useState} from "react";
import {FreeTextSearch, Table} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import {connect} from "react-redux";
import {clearNotesParams, getNotes, saveNote, deleteNote} from "../../actions/notes-actions";
import {Pagination} from "react-bootstrap";
import Swal from "sweetalert2";

const Notes = ({
                 attendeeId,
                 ticketId,
                 notes,
                 term,
                 currentPage,
                 perPage,
                 lastPage,
                 order,
                 orderDir,
                 columns,
                 getNotes,
                 saveNote,
                 deleteNote,
                 clearNotesParams
               }) => {
  const [newNote, setNewNote] = useState('');

  const handleSaveNote = () => {
    saveNote(attendeeId, ticketId, newNote).then(() => setNewNote(''));
  }

  const handleDeleteNote = (noteId) => {
    const msg = {
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("notes.remove_warning")} ${noteId}`,
      type: 'warning'
    };

    Swal.fire(msg).then(function(){
      deleteNote(attendeeId, noteId);
    });
  }
  const handleSort = (index, key, dir, func) => {
    getNotes(attendeeId, ticketId, term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getNotes(attendeeId, ticketId, term, page, perPage, order, orderDir);
  };

  const handleSearch = (newTerm) => {
    getNotes(attendeeId, ticketId, newTerm, currentPage, perPage, order, orderDir);
  };

  useEffect(() => {
    getNotes(attendeeId, ticketId, term, 1, perPage, order, orderDir);

    return () => {
      clearNotesParams();
    }
  }, []);

  const table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      delete: {onClick: handleDeleteNote}
    }
  };

  const table_columns = [
    {columnKey: 'id', value: T.translate("notes.id"), sortable: true},
    {columnKey: 'created', value: T.translate("notes.created"), sortable: true},
    {columnKey: 'author_fullname', value: T.translate("notes.author_fullname"), sortable: true},
    {columnKey: 'author_email', value: T.translate("notes.author_email"), sortable: true},
    {columnKey: 'ticket_id', value: T.translate("notes.ticket_id")},
    {columnKey: 'content', value: T.translate("notes.content")}
  ];

  const show_columns = columns ? table_columns.filter(c => columns.include(c.columnKey)) : table_columns;



  return (
    <>
      <div className={'row'}>
        <div className={'col-md-6'}>
          <FreeTextSearch
            value={term ?? ''}
            placeholder={T.translate("notes.placeholders.search")}
            onSearch={handleSearch}
          />
        </div>
        <div className={'col-md-6'}>
          <div className="input-group">
            <input
              className="form-control"
              value={newNote} onChange={ev => setNewNote(ev.target.value)}
            />
            <span className="input-group-btn">
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

      {notes.length === 0 &&
        <div>{T.translate("notes.no_entries")}</div>
      }

      {notes.length > 0 &&
        <>
          <Table
            options={table_options}
            data={notes}
            columns={show_columns}
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
      }
    </>
  )
}

const mapStateToProps = ({notesState}) => ({
  ...notesState,
});

export default connect(
  mapStateToProps,
  {
    getNotes,
    saveNote,
    deleteNote,
    clearNotesParams
  }
)(Notes);