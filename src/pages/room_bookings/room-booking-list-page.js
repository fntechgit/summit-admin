/**
 * Copyright 2018 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EditIcon from "@mui/icons-material/Edit";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  GridFilter,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  getRoomBookings,
  exportRoomBookings,
  refundRoomBooking,
  cancelRoomBooking
} from "../../actions/room-booking-actions";
import {
  DEFAULT_CURRENT_PAGE,
  ReservationStatusPaid,
  ReservationStatusRequestedRefund
} from "../../utils/constants";
import GridToolbar from "../../components/mui/grid-toolbar";
import RefundBookingPopup from "./components/refund-booking-popup";
import {
  buildRoomBookingFilters,
  getCriterias
} from "./room-booking-list-page.helpers";

const FILTER_ID = "room_booking_list";

const RoomBookingListPage = ({
  currentSummit,
  roomBookings,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalRoomBookings,
  history,
  getRoomBookings,
  exportRoomBookings,
  refundRoomBooking,
  cancelRoomBooking
}) => {
  const [refundBooking, setRefundBooking] = useState(null);
  const { parsedFilter, filterValues } = useGridFilter(FILTER_ID);
  const roomBookingFilters = buildRoomBookingFilters(filterValues);

  useEffect(() => {
    if (currentSummit?.id) {
      getRoomBookings(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        roomBookingFilters
      );
    }
  }, [currentSummit?.id, parsedFilter.join(",")]);

  const findBooking = (bookingId) =>
    roomBookings.find((rb) => rb.id === bookingId);

  const handleEdit = (roomBookingId) => {
    history.push(
      `/app/summits/${currentSummit.id}/room-bookings/${roomBookingId}`
    );
  };

  const handleAddRoomBooking = () => {
    history.push(`/app/summits/${currentSummit.id}/room-bookings/new`);
  };

  const handleCancelBooking = (bookingId) => {
    const roomBooking = findBooking(bookingId);

    cancelRoomBooking(roomBooking.room_id, bookingId)
      .then(() =>
        getRoomBookings(
          term,
          DEFAULT_CURRENT_PAGE,
          perPage,
          order,
          orderDir,
          roomBookingFilters
        )
      )
      .catch(() => {});
  };

  const handlePageChange = (page) => {
    getRoomBookings(term, page, perPage, order, orderDir, roomBookingFilters);
  };

  const handleSort = (key, dir) => {
    getRoomBookings(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      roomBookingFilters
    );
  };

  const handlePerPageChange = (newPerPage) => {
    getRoomBookings(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      roomBookingFilters
    );
  };

  const handleSearch = (newTerm) => {
    getRoomBookings(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      roomBookingFilters
    );
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    exportRoomBookings(term, order, orderDir, roomBookingFilters);
  };

  const handleRefundClick = (bookingId) => {
    setRefundBooking(findBooking(bookingId));
  };

  const hasPaid = (bookingId) => {
    const roomBooking = findBooking(bookingId);
    return (
      (roomBooking.status === ReservationStatusPaid ||
        roomBooking.status === ReservationStatusRequestedRefund) &&
      roomBooking.amount > 0
    );
  };

  const isEditable = (bookingId) =>
    findBooking(bookingId).status === ReservationStatusPaid;

  const handleRefund = (booking, amount) =>
    refundRoomBooking(booking.room_id, booking.id, amount);

  if (!currentSummit.id) return <div />;

  const roomBookingsFormatted = roomBookings.map((rb) => ({
    ...rb,
    start_datetime: epochToMomentTimeZone(
      rb.start_datetime,
      currentSummit.time_zone_id
    ).format("YYYY-MM-DD h:mm a"),
    end_datetime: epochToMomentTimeZone(
      rb.end_datetime,
      currentSummit.time_zone_id
    ).format("YYYY-MM-DD h:mm a")
  }));

  const columns = [
    {
      columnKey: "created",
      header: T.translate("room_booking_list.created"),
      sortable: true
    },
    {
      columnKey: "room_name",
      header: T.translate("room_booking_list.room"),
      sortable: true
    },
    {
      columnKey: "start_datetime",
      header: T.translate("room_booking_list.start"),
      sortable: true
    },
    {
      columnKey: "end_datetime",
      header: T.translate("room_booking_list.end"),
      sortable: true
    },
    {
      columnKey: "owner_name",
      header: T.translate("room_booking_list.owner_name"),
      sortable: true
    },
    {
      columnKey: "owner_email",
      header: T.translate("room_booking_list.owner_email"),
      sortable: true
    },
    {
      columnKey: "status",
      header: T.translate("room_booking_list.status"),
      sortable: true
    },
    { columnKey: "amount_str", header: T.translate("room_booking_list.paid") },
    {
      columnKey: "refunded_amount_str",
      header: T.translate("room_booking_list.refunded")
    },
    {
      columnKey: "refund",
      header: "",
      width: 40,
      align: "center",
      dottedBorder: true,
      headSx: { p: 0 },
      cellSx: { p: 0 },
      render: (row) =>
        hasPaid(row.id) && (
          <Tooltip title={T.translate("room_booking_list.refund")}>
            <IconButton
              size="medium"
              sx={{ padding: 0 }}
              onClick={() => handleRefundClick(row.id)}
            >
              <AttachMoneyIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        )
    },
    {
      columnKey: "edit",
      header: "",
      width: 40,
      align: "center",
      dottedBorder: true,
      headSx: { p: 0 },
      cellSx: { p: 0 },
      render: (row) =>
        isEditable(row.id) && (
          <Tooltip title={T.translate("general.edit")}>
            <IconButton
              size="medium"
              sx={{ padding: 0 }}
              onClick={() => handleEdit(row.id)}
            >
              <EditIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        )
    }
  ];

  return (
    <div className="container">
      <h3>{T.translate("room_booking_list.room_booking_list")}</h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate(
            "room_booking_list.placeholders.search_bookings"
          )
        }}
      >
        <GridFilter
          id={FILTER_ID}
          criterias={getCriterias()}
          hideJoinOperators
        />
        <Button variant="contained" onClick={handleAddRoomBooking}>
          {T.translate("room_booking_list.add_room_booking")}
        </Button>
        <Button variant="outlined" onClick={handleExport}>
          {T.translate("general.export")}
        </Button>
      </GridToolbar>

      <Box sx={{ mb: 2 }}>
        {totalRoomBookings} {T.translate("room_bookings.room_bookings")}
      </Box>

      {roomBookings.length === 0 && (
        <div>{T.translate("room_booking_list.no_room_bookings")}</div>
      )}

      {roomBookings.length > 0 && (
        <MuiTable
          options={{ sortCol: order, sortDir: orderDir }}
          data={roomBookingsFormatted}
          columns={columns}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalRoomBookings}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onDelete={handleCancelBooking}
          getName={(row) => row.owner_name}
          deleteDialogBody={(name) =>
            T.translate("room_booking_list.delete_booking_warning", { name })
          }
          confirmButtonColor="error"
        />
      )}

      {refundBooking && (
        <RefundBookingPopup
          booking={refundBooking}
          onClose={() => setRefundBooking(null)}
          onSave={handleRefund}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentRoomBookingListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentRoomBookingListState
});

export default connect(mapStateToProps, {
  getRoomBookings,
  exportRoomBookings,
  refundRoomBooking,
  cancelRoomBooking
})(RoomBookingListPage);
