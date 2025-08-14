import React, { useEffect } from "react";
import {
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import { connect } from "react-redux";
import {
  deleteEventRSVP,
  editEventRSVP,
  getEventRSVPS
} from "../../actions/event-rsvp-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const EventRSVPList = ({
  term,
  perPage,
  lastPage,
  currentPage,
  order,
  orderDir,
  eventRsvp,
  getEventRSVPS,
  // editEventRSVP,
  deleteEventRSVP
}) => {
  const handleEditEventRSVP = () => {};
  const handleDeleteEventRSVP = (rsvpId) => {
    const rsvp = eventRsvp.find((r) => r.id === rsvpId);

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
        deleteEventRSVP(rsvpId);
      }
    });
  };

  const rsvp_list_table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: { onClick: handleEditEventRSVP },
      delete: { onClick: handleDeleteEventRSVP }
    }
  };

  const rsvp_list_columns = [
    {
      columnKey: "attendee_full_name",
      value: T.translate("event_rsvp_list.attendee_full_name"),
      sortable: true
    },
    {
      columnKey: "created",
      value: T.translate("event_rsvp_list.created"),
      sortable: true
    },
    {
      columnKey: "seat_type",
      value: T.translate("event_rsvp_list.seat_type"),
      sortable: true
    },
    {
      columnKey: "status",
      value: T.translate("event_rsvp_list.status"),
      sortable: true
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

  useEffect(() => {
    getEventRSVPS(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  }, []);

  return (
    <>
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
        <div className="col-md-offset-5 col-md-1">
          <button className="btn btn-primary right-space" type="button">
            {T.translate("event_rsvp_list.add")}
          </button>
        </div>
      </div>

      {eventRsvp.length === 0 && (
        <div>{T.translate("event_rsvp_list.no_rsvp")}</div>
      )}

      {eventRsvp.length > 0 && (
        <>
          <Table
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
    </>
  );
};

const mapStateToProps = ({ currentEventRsvpListState }) => ({
  ...currentEventRsvpListState
});

export default connect(mapStateToProps, {
  getEventRSVPS,
  editEventRSVP,
  deleteEventRSVP
})(EventRSVPList);
