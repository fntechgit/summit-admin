import React, { useEffect, useState } from "react";
import {
  FreeTextSearch,
  AttendeeInput,
  SelectableTable,
  UploadInput
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import Swal from "sweetalert2";
import { Modal, Pagination } from "react-bootstrap";
import { connect } from "react-redux";
import {
  deleteEventRSVPInvitation,
  getEventRSVPInvitations,
  importRSVPInvitationsCSV,
  addEventRSVPInvitation,
  exportEventRsvpInvitationCSV,
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations,
  setCurrentEmailTemplate,
  sendEventRSVPInvitation
} from "../../actions/event-rsvp-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import { queryPaidAttendees } from "../../actions/attendee-actions";
import EventRSVPInvitationBlast from "./event-rsvp-invitation-blast";

const EventRSVPInvitationList = ({
  term,
  perPage,
  lastPage,
  currentPage,
  order,
  orderDir,
  eventRsvpInvitations,
  selectedCount,
  selectedAll,
  currentEmailTemplate,
  getEventRSVPInvitations,
  addEventRSVPInvitation,
  exportEventRsvpInvitationCSV,
  deleteEventRSVPInvitation,
  importRSVPInvitationsCSV,
  sendEventRSVPInvitation,
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations,
  setCurrentEmailTemplate,
  currentSummit
}) => {
  useEffect(() => {
    getEventRSVPInvitations(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
    setCurrentEmailTemplate("");
    clearAllSelectedInvitations();
  }, []);

  const [newAttendees, setNewAttendees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCSVFile, setImportCSVFile] = useState(null);

  const handledeleteEventRSVPInvitation = (rsvpId) => {
    const rsvp = eventRsvpInvitations.find((r) => r.id === rsvpId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("event_rsvp_list.delete_rsvp")} ${
        rsvp.attendee_full_name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteEventRSVPInvitation(rsvpId);
      }
    });
  };

  const rsvp_list_columns = [
    {
      columnKey: "attendee_full_name",
      value: T.translate("event_rsvp_list.attendee_full_name"),
      sortable: true
    },
    {
      columnKey: "is_sent",
      value: T.translate("event_rsvp_list.is_sent"),
      render: (row) => (row.is_sent ? "Yes" : "No")
    },
    {
      columnKey: "status",
      value: T.translate("event_rsvp_list.status"),
      sortable: true
    }
  ];

  const handleSort = (_, key, dir) => {
    getEventRSVPInvitations(term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getEventRSVPInvitations(term, page, perPage, order, orderDir);
  };

  const handleSearch = (newTerm) => {
    getEventRSVPInvitations(newTerm, currentPage, perPage, order, orderDir);
  };

  const handleSelected = (invitation_id, isSelected) => {
    if (isSelected) {
      selectInvitation(invitation_id);
      return;
    }
    unSelectInvitation(invitation_id);
  };

  const handleSelectedAll = (ev) => {
    const selectedAllCb = ev.target.checked;
    setSelectedAll(selectedAllCb);
    if (!selectedAllCb) {
      // clear all selected
      clearAllSelectedInvitations();
    }
  };

  const handleNewInvitation = () => {
    const attendeesIds = newAttendees.map((e) => e.id);
    addEventRSVPInvitation(attendeesIds).then(() => setShowAddModal(false));
  };

  const handleDisplayAddModal = () => {
    setNewAttendees([]);
    setShowAddModal(true);
  };

  const handleDisplayImportModal = () => {
    setImportCSVFile(null);
    setShowImportModal(true);
  };

  const handleImportInvitations = () => {
    importRSVPInvitationsCSV(importCSVFile);
    setShowImportModal(false);
  };

  const handleBlastInvitations = (testRecipient, excerptRecipient) => {
    sendEventRSVPInvitation(testRecipient, excerptRecipient, term).then(() => {
      setCurrentEmailTemplate("");
      clearAllSelectedInvitations();
    });
  };

  const handleExportEventRSVPInvitations = () => {
    exportEventRsvpInvitationCSV(term, order, orderDir);
  };

  const rsvp_list_table_options = {
    sortCol: order,
    sortDir: orderDir,
    selectedAll,
    actions: {
      edit: {
        onClick: () => {},
        onSelected: handleSelected,
        onSelectedAll: handleSelectedAll
      },
      delete: { onClick: handledeleteEventRSVPInvitation }
    }
  };

  return (
    <>
      <div className="row form-group">
        <div className="col-md-6">
          <strong>{T.translate("event_rsvp_list.rsvp_invitations")}</strong>
        </div>
      </div>
      <div className="row form-group">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "event_rsvp_list.placeholders.search_term"
            )}
            onSearch={handleSearch}
          />
        </div>
      </div>
      <div className="row form-group">
        <div className="col-md-12">
          <EventRSVPInvitationBlast
            selectedCount={selectedCount}
            onBlastInvitations={handleBlastInvitations}
            currentEmailTemplate={currentEmailTemplate}
            setCurrentEmailTemplate={setCurrentEmailTemplate}
          >
            <button
              className="btn btn-primary left-space pull-right"
              type="button"
              onClick={handleExportEventRSVPInvitations}
            >
              {T.translate("event_rsvp_list.export")}
            </button>
            <button
              className="btn btn-primary left-space pull-right"
              type="button"
              onClick={handleDisplayAddModal}
            >
              {T.translate("event_rsvp_list.add")}
            </button>
            <button
              className="btn btn-primary left-space pull-right"
              type="button"
              onClick={handleDisplayImportModal}
            >
              {T.translate("event_rsvp_list.import")}
            </button>
          </EventRSVPInvitationBlast>
        </div>
      </div>

      {eventRsvpInvitations.length === 0 && (
        <div>{T.translate("event_rsvp_list.no_rsvp_invitation")}</div>
      )}

      {eventRsvpInvitations.length > 0 && (
        <>
          {selectedCount > 0 && (
            <span>
              <b>
                {T.translate("event_rsvp_list.rsvp_invitations_qty", {
                  qty: selectedCount
                })}
              </b>
            </span>
          )}
          <SelectableTable
            options={rsvp_list_table_options}
            data={eventRsvpInvitations}
            columns={rsvp_list_columns}
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

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("event_rsvp_list.new_invitation")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              <label>{T.translate("event_rsvp_list.attendees")}</label>
              <AttendeeInput
                id="attendee"
                summitId={currentSummit.id}
                value={newAttendees}
                getOptionLabel={(attendee) =>
                  `${attendee.first_name || ""} ${attendee.last_name || ""} (${
                    attendee.email || attendee.id
                  })`
                }
                onChange={(ev) => setNewAttendees(ev.target.value)}
                queryFunction={queryPaidAttendees}
                isMulti
                isClearable
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            disabled={newAttendees.length === 0}
            className="btn btn-primary"
            onClick={handleNewInvitation}
          >
            {T.translate("event_rsvp_list.add")}
          </button>
        </Modal.Footer>
      </Modal>
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("event_rsvp_list.import_invitations")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              Format must be the following:
              <br />
              <b>email</b>: invitee email
              <br />
            </div>
            <div className="col-md-12 invitation-import-upload-wrapper">
              <UploadInput
                value={importCSVFile && importCSVFile.name}
                handleUpload={(file) => setImportCSVFile(file)}
                handleRemove={() => setImportCSVFile(null)}
                className="dropzone col-md-6"
                multiple={false}
                accept=".csv"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            disabled={!importCSVFile}
            className="btn btn-primary"
            onClick={handleImportInvitations}
          >
            {T.translate("event_rsvp_list.ingest")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventRsvpInvitationListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventRsvpInvitationListState
});

export default connect(mapStateToProps, {
  getEventRSVPInvitations,
  deleteEventRSVPInvitation,
  importRSVPInvitationsCSV,
  addEventRSVPInvitation,
  sendEventRSVPInvitation,
  exportEventRsvpInvitationCSV,
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations,
  setCurrentEmailTemplate
})(EventRSVPInvitationList);
