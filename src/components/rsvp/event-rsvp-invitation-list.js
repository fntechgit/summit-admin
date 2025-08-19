import React, { useEffect, useState } from "react";
import {
  Dropdown,
  FreeTextSearch,
  Input,
  AttendeeInput,
  SelectableTable,
  UploadInput
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import { Modal, Pagination } from "react-bootstrap";
import { connect } from "react-redux";
import {
  deleteEventRSVPInvitation,
  getEventRSVPInvitations,
  importRSVPInvitationsCSV,
  addEventRSVPInvitation,
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations
} from "../../actions/event-rsvp-actions";
import {
  DEFAULT_CURRENT_PAGE,
  MILLISECONDS_IN_SECOND
} from "../../utils/constants";
import { queryPaidAttendees } from "../../actions/attendee-actions";

const EventRSVPInvitationList = ({
  term,
  perPage,
  lastPage,
  currentPage,
  order,
  orderDir,
  eventRsvpInvitations,
  getEventRSVPInvitations,
  addEventRSVPInvitation,
  deleteEventRSVPInvitation,
  importRSVPInvitationsCSV,
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations,
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
  }, []);

  const [testRecipient, setTestRecipient] = useState("");
  const [flowEvent, setFlowEvent] = useState(null);
  const [newAttendee, setNewAttendee] = useState("");
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
      columnKey: "created",
      value: T.translate("event_rsvp_list.sent_date"),
      sortable: true,
      render: (row) =>
        moment(row.created * MILLISECONDS_IN_SECOND)
          .tz(currentSummit.time_zone_id)
          .format("MMMM Do YYYY, h:mm a (z)")
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
    addEventRSVPInvitation(newAttendee.id).then(() => setShowAddModal(false));
  };

  const handleDisplayAddModal = () => {
    setNewAttendee("");
    setShowAddModal(true);
  };

  const handleDisplayImportModal = () => {
    setImportCSVFile(null);
    setShowImportModal(true);
  };

  const handleImportInvitations = () => {
    importRSVPInvitationsCSV(importCSVFile).then(() => {});
    setShowImportModal(false);
  };

  const rsvp_list_table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: {
        onSelected: handleSelected,
        onSelectedAll: handleSelectedAll
      },
      delete: { onClick: handledeleteEventRSVPInvitation }
    }
  };

  const flowEventsDDL = [
    { label: "-- SELECT EMAIL EVENT --", value: "" },
    {
      label: "SUMMIT_REGISTRATION_INVITE_REGISTRATION",
      value: "SUMMIT_REGISTRATION_INVITE_REGISTRATION"
    },
    {
      label: "SUMMIT_REGISTRATION_REINVITE_REGISTRATION",
      value: "SUMMIT_REGISTRATION_REINVITE_REGISTRATION"
    }
  ];

  return (
    <>
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
        <div className="col-md-5">
          <Dropdown
            id="flow_event"
            value={flowEvent}
            onChange={setFlowEvent}
            options={flowEventsDDL}
          />
        </div>
        <div className="col-md-3">
          <Input
            id="testRecipient"
            value={testRecipient}
            onChange={(ev) => setTestRecipient(ev.target.value)}
            placeholder={T.translate(
              "event_rsvp_list.placeholders.test_recipient"
            )}
            className="form-control"
          />
        </div>
        <div className="col-md-4">
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
          <button className="btn btn-primary pull-right" type="button">
            {T.translate("event_rsvp_list.send_blast")}
          </button>
        </div>
      </div>

      {eventRsvpInvitations.length === 0 && (
        <div>{T.translate("event_rsvp_list.no_rsvp_invitation")}</div>
      )}

      {eventRsvpInvitations.length > 0 && (
        <>
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
            <div className="col-md-12">Attendee</div>
            <div className="col-md-12 acceptance-criteria-wrapper">
              <AttendeeInput
                id="attendee"
                summitId={currentSummit.id}
                value={newAttendee}
                getOptionLabel={(attendee) =>
                  `${attendee.first_name || ""} ${attendee.last_name || ""} (${
                    attendee.email || attendee.id
                  })`
                }
                onChange={(ev) => setNewAttendee(ev.target.value)}
                queryFunction={queryPaidAttendees}
                isClearable
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            disabled={!newAttendee}
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
  selectInvitation,
  unSelectInvitation,
  setSelectedAll,
  clearAllSelectedInvitations
})(EventRSVPInvitationList);
