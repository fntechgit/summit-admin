import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import moment from "moment-timezone";
import FreeTextSearch from "openstack-uicore-foundation/lib/components/free-text-search";
import Table from "openstack-uicore-foundation/lib/components/table";
import Panel from "openstack-uicore-foundation/lib/components/sections/panel";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import DateTimePicker from "openstack-uicore-foundation/lib/components/inputs/datetimepicker";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { Pagination } from "react-bootstrap";
import {
  clearAttendeeCheckInLogs,
  exportAttendeeCheckInLogs,
  getAttendeeCheckInLogs
} from "../../../actions/attendee-check-in-log-actions";
import { TWO } from "../../../utils/constants";
import "./check-in-log-panel.less";

const ACTIONS = ["CHECKED_IN", "CHECKED_OUT"];

const CheckInLogPanel = ({
  attendeeId,
  refreshKey,
  open,
  onToggle,
  logs,
  term,
  currentPage,
  lastPage,
  perPage,
  order,
  orderDir,
  getAttendeeCheckInLogs,
  exportAttendeeCheckInLogs,
  clearAttendeeCheckInLogs
}) => {
  const [filters, setFilters] = useState({
    action: null,
    dateFilter: Array(TWO).fill(0)
  });
  const userTimeZone = moment.tz.guess();

  const fetchLogs = (
    newTerm = term,
    page = currentPage,
    newOrder = order,
    newOrderDir = orderDir,
    newFilters = filters
  ) =>
    getAttendeeCheckInLogs(
      attendeeId,
      newTerm,
      page,
      perPage,
      newOrder,
      newOrderDir,
      newFilters
    );

  // reload on mount and every time the attendee is saved (refreshKey changes)
  useEffect(() => {
    fetchLogs(term, 1);
  }, [attendeeId, refreshKey]);

  useEffect(() => () => clearAttendeeCheckInLogs(), []);

  const handleDateChange = (value, isEnd) => {
    const epoch = value ? value.unix() : 0;
    setFilters((prev) => ({
      ...prev,
      dateFilter: isEnd
        ? [prev.dateFilter[0], epoch]
        : [epoch, prev.dateFilter[1]]
    }));
  };

  const handleActionChange = (ev) => {
    const newFilters = { ...filters, action: ev.target.value || null };
    setFilters(newFilters);
    fetchLogs(term, 1, order, orderDir, newFilters);
  };

  const rows = logs.map((l) => ({
    ...l,
    action: T.translate(`check_in_log_panel.actions.${l.action}`),
    source: T.translate(`check_in_log_panel.sources.${l.source}`)
  }));

  const columns = [
    {
      columnKey: "action",
      value: T.translate("check_in_log_panel.action"),
      sortable: true
    },
    {
      columnKey: "source",
      value: T.translate("check_in_log_panel.source"),
      sortable: true
    },
    {
      columnKey: "actor_email",
      value: T.translate("check_in_log_panel.actor"),
      sortable: true
    },
    { columnKey: "reason", value: T.translate("check_in_log_panel.reason") },
    {
      columnKey: "ip_address",
      value: T.translate("check_in_log_panel.ip_address")
    },
    {
      columnKey: "created",
      value: T.translate("check_in_log_panel.date"),
      sortable: true
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <Panel
      show={open}
      title={T.translate("check_in_log_panel.title")}
      handleClick={onToggle}
    >
      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term ?? ""}
            placeholder={T.translate("check_in_log_panel.placeholders.search")}
            onSearch={(newTerm) => fetchLogs(newTerm, 1)}
          />
        </div>
        <div className="col-md-6">
          <button
            type="button"
            className="btn btn-default pull-right"
            onClick={() =>
              exportAttendeeCheckInLogs(
                attendeeId,
                term,
                order,
                orderDir,
                filters
              )
            }
          >
            {T.translate("general.export")}
          </button>
        </div>
      </div>
      <div className="row check-in-log-filters">
        <div className="col-md-3">
          <Dropdown
            id="action"
            value={filters.action}
            onChange={handleActionChange}
            placeholder={T.translate(
              "check_in_log_panel.placeholders.action_filter"
            )}
            options={ACTIONS.map((a) => ({
              label: T.translate(`check_in_log_panel.actions.${a}`),
              value: a
            }))}
            clearable
          />
        </div>
        <div className="col-md-9 check-in-log-dates">
          <DateTimePicker
            id="checkInLogDateFrom"
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            inputProps={{
              placeholder: T.translate(
                "check_in_log_panel.placeholders.date_from"
              )
            }}
            timezone={userTimeZone}
            onChange={(ev) => handleDateChange(ev.target.value, false)}
            value={epochToMomentTimeZone(filters.dateFilter[0], userTimeZone)}
          />
          <DateTimePicker
            id="checkInLogDateTo"
            format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
            inputProps={{
              placeholder: T.translate(
                "check_in_log_panel.placeholders.date_to"
              )
            }}
            timezone={userTimeZone}
            onChange={(ev) => handleDateChange(ev.target.value, true)}
            value={epochToMomentTimeZone(filters.dateFilter[1], userTimeZone)}
          />
          <button
            type="button"
            className="btn btn-default"
            onClick={() => fetchLogs(term, 1)}
          >
            {T.translate("check_in_log_panel.apply_filters")}
          </button>
        </div>
      </div>

      {rows.length === 0 && (
        <div>{T.translate("check_in_log_panel.no_entries")}</div>
      )}

      {rows.length > 0 && (
        <>
          <Table
            options={tableOptions}
            data={rows}
            columns={columns}
            onSort={(index, key, dir) => fetchLogs(term, currentPage, key, dir)}
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
            onSelect={(page) => fetchLogs(term, page)}
          />
        </>
      )}
    </Panel>
  );
};

const mapStateToProps = ({ attendeeCheckInLogState }) => ({
  ...attendeeCheckInLogState
});

export default connect(mapStateToProps, {
  getAttendeeCheckInLogs,
  exportAttendeeCheckInLogs,
  clearAttendeeCheckInLogs
})(CheckInLogPanel);
