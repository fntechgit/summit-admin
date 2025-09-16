import React, { useEffect, useState } from "react";
import {
  AttendeeInput,
  FreeTextSearch,
  SelectableTable
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import Swal from "sweetalert2";
import Select from "react-select";
import { Modal, Pagination } from "react-bootstrap";
import { connect } from "react-redux";
import moment from "moment-timezone";
import {
  addEventRSVP,
  deleteEventRSVP,
  exportEventRsvpsCSV,
  getEventRSVPInvitations,
  getEventRSVPS,
  selectRSVP,
  unSelectRSVP,
  clearAllSelectedRSVP,
  setSelectedAllRSVP,
  reSendRSVPConfirmation
} from "../../actions/event-rsvp-actions";
import {
  DEFAULT_CURRENT_PAGE,
  MILLISECONDS_IN_SECOND
} from "../../utils/constants";
import { queryPaidAttendees } from "../../actions/attendee-actions";
import EventRSVPReSend from "./event-rsvp-resend";

const EventRSVPList = ({
  term,
  perPage,
  lastPage,
  currentPage,
  order,
  orderDir,
  eventRsvp,
  selectedCount,
  getEventRSVPS,
  addEventRSVP,
  deleteEventRSVP,
  exportEventRsvpsCSV,
  getEventRSVPInvitations,
  selectRSVP,
  unSelectRSVP,
  clearAllSelectedRSVP,
  setSelectedAllRSVP,
  reSendRSVPConfirmation,
  currentSummit,
  currentEvent,
  history
}) => {
  const [newAttendee, setNewAttendee] = useState("");
  const [newSeat, setNewSeat] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDeleteEventRSVP = (rsvpId) => {
    const rsvp = eventRsvp.find((r) => r.id === rsvpId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("event_rsvp_list.delete_rsvp")} ${
        rsvp.owner_full_name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteEventRSVP(rsvpId).then(() => getEventRSVPInvitations());
      }
    });
  };

  const handleEventRSVPEdit = (rsvpId) => {
    history.push(
      `/app/summits/${currentSummit.id}/events/${currentEvent}/rsvp/${rsvpId}`
    );
  };

  const handleSelected = (rsvp_id, isSelected) => {
    if (isSelected) {
      selectRSVP(rsvp_id);
      return;
    }
    unSelectRSVP(rsvp_id);
  };

  const handleSelectedAll = (ev) => {
    const selectedAllCb = ev.target.checked;
    setSelectedAllRSVP(selectedAllCb);
    if (!selectedAllCb) {
      // clear all selected
      clearAllSelectedRSVP();
    }
  };

  const rsvp_list_table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: {
        onClick: handleEventRSVPEdit,
        onSelected: handleSelected,
        onSelectedAll: handleSelectedAll
      },
      delete: { onClick: handleDeleteEventRSVP }
    }
  };

  const rsvp_list_columns = [
    {
      columnKey: "owner_full_name",
      value: T.translate("event_rsvp_list.attendee_full_name"),
      sortable: true
    },
    {
      columnKey: "created",
      value: T.translate("event_rsvp_list.created"),
      render: (row) =>
        moment(row.created * MILLISECONDS_IN_SECOND)
          .tz(currentSummit.time_zone_id)
          .format("MMMM Do YYYY, h:mm a (z)")
    },
    {
      columnKey: "seat_type",
      value: T.translate("event_rsvp_list.seat_type"),
      sortable: true
    },
    {
      columnKey: "status",
      value: T.translate("event_rsvp_list.status")
    },
    {
      columnKey: "confirmation_number",
      value: T.translate("event_rsvp_list.confirmation_number")
    },
    {
      columnKey: "action_source",
      value: T.translate("event_rsvp_list.action_source")
    },
    {
      columnKey: "action_date",
      value: T.translate("event_rsvp_list.action_date"),
      render: (row) =>
        moment(row.action_date * MILLISECONDS_IN_SECOND)
          .tz(currentSummit.time_zone_id)
          .format("MMMM Do YYYY, h:mm a (z)")
    }
  ];

  const handleSort = (_, key, dir) => {
    getEventRSVPS(term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getEventRSVPS(term, page, perPage, order, orderDir);
  };

  const handleSearch = (newTerm) => {
    getEventRSVPS(newTerm, currentPage, perPage, order, orderDir);
  };

  const handleDisplayAddModal = () => {
    setNewAttendee("");
    setNewSeat("");
    setShowAddModal(true);
  };

  const handleReSend = (testRecipient, excerptRecipient) => {
    reSendRSVPConfirmation(testRecipient, excerptRecipient, term).then(() => {
      clearAllSelectedRSVP();
    });
  };

  const handleExportEventRSVPS = () => {
    exportEventRsvpsCSV(term, order, orderDir);
  };

  const handleNewRSVP = () => {
    const rsvp = {
      attendee_id: newAttendee.id,
      seat_type: newSeat.value
    };
    addEventRSVP(rsvp).finally(() => setShowAddModal(false));
  };

  const seat_type_ddl = [
    { label: T.translate("event_rsvp_list.seat_regular"), value: "Regular" },
    { label: T.translate("event_rsvp_list.seat_wait"), value: "WaitList" }
  ];

  useEffect(() => {
    getEventRSVPS("", DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  }, []);

  return (
    <>
      <div className="row form-group">
        <div className="col-md-6">
          <strong>{T.translate("event_rsvp_list.rsvp")}</strong>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate(
              "event_rsvp_list.placeholders.search_term"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-offset-3 col-md-3">
          <button
            className="btn btn-primary left-space pull-right"
            type="button"
            onClick={handleExportEventRSVPS}
          >
            {T.translate("event_rsvp_list.export")}
          </button>
          <button
            className="btn btn-primary pull-right"
            type="button"
            onClick={handleDisplayAddModal}
          >
            {T.translate("event_rsvp_list.add")}
          </button>
        </div>
      </div>

      {eventRsvp.length === 0 && (
        <div>{T.translate("event_rsvp_list.no_rsvp")}</div>
      )}

      {eventRsvp.length > 0 && (
        <>
          <EventRSVPReSend
            selectedCount={selectedCount}
            onReSend={handleReSend}
          />
          {selectedCount > 0 && (
            <span>
              <b>
                {T.translate("event_rsvp_list.rsvp_qty", {
                  qty: selectedCount
                })}
              </b>
            </span>
          )}
          <SelectableTable
            options={rsvp_list_table_options}
            data={eventRsvp}
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
          <Modal.Title>{T.translate("event_rsvp_list.new_rsvp")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              <label>{T.translate("event_rsvp_list.attendee_full_name")}</label>
              <AttendeeInput
                id="attendee_id"
                summitId={currentSummit.id}
                value={newAttendee}
                getOptionLabel={(attendee) =>
                  `${attendee.first_name || ""} ${attendee.last_name || ""} (${
                    attendee.email || attendee.id
                  })`
                }
                onChange={(ev) => setNewAttendee(ev.target.value)}
                queryFunction={queryPaidAttendees}
                placeholder={T.translate(
                  "event_rsvp_list.placeholders.attendee"
                )}
                isClearable
              />
            </div>
            <div className="col-md-12 acceptance-criteria-wrapper">
              <label>{T.translate("event_rsvp_list.seat_type")}</label>
              <Select
                id="seat_type"
                value={newSeat}
                options={seat_type_ddl}
                onChange={setNewSeat}
                placeholder={T.translate(
                  "event_rsvp_list.placeholders.seat_type"
                )}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            disabled={!newAttendee || !newSeat}
            className="btn btn-primary"
            onClick={handleNewRSVP}
          >
            {T.translate("event_rsvp_list.add")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventRsvpListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventRsvpListState
});

export default connect(mapStateToProps, {
  getEventRSVPS,
  deleteEventRSVP,
  addEventRSVP,
  exportEventRsvpsCSV,
  getEventRSVPInvitations,
  selectRSVP,
  unSelectRSVP,
  clearAllSelectedRSVP,
  setSelectedAllRSVP,
  reSendRSVPConfirmation
})(EventRSVPList);
