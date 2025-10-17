import React, { useEffect, useState } from "react";
import {
  FreeTextSearch,
  Table,
  Dropdown,
  MemberInput,
  DateTimePicker
} from "openstack-uicore-foundation/lib/components";
import T from "i18n-react";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { Pagination } from "react-bootstrap";
import { connect } from "react-redux";
import {
  clearAuditLogParams,
  getAuditLog
} from "../../actions/audit-log-actions";
import {
  DATE_FILTER_ARRAY_SIZE,
  DEFAULT_CURRENT_PAGE
} from "../../utils/constants";

const AuditLogs = function ({
  entityFilter = [],
  currentSummit,
  term,
  logEntries,
  perPage,
  lastPage,
  currentPage,
  order,
  orderDir,
  columns,
  getAuditLog,
  clearAuditLogParams,
  filters
}) {
  const [page, setPage] = useState(currentPage);
  const [searchTerm, setSearchTerm] = useState(term);
  const defaultFilters = {
    user_id_filter: [],
    created_date_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null)
  };

  const [enabledFilters, setEnabledFilters] = useState(
    Object.keys(filters).filter((e) =>
      Array.isArray(filters[e])
        ? filters[e]?.some((e) => e !== null)
        : filters[e]?.length > 0
    )
  );
  const [auditLogFilters, setAuditLogFilters] = useState({
    ...defaultFilters,
    ...filters
  });

  const filters_ddl = [
    { label: "Created", value: "created_date_filter" },
    { label: "Member", value: "user_id_filter" }
  ];

  const audit_log_table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {}
  };

  const audit_log_columns = [
    {
      columnKey: "created",
      value: T.translate("audit_log.date"),
      sortable: true
    },
    {
      columnKey: "action",
      value: T.translate("audit_log.action"),
      sortable: false
    },
    {
      columnKey: "event_id",
      value: T.translate("audit_log.event"),
      sortable: true
    },
    { columnKey: "user", value: T.translate("audit_log.user"), sortable: false }
  ];

  const show_columns = columns
    ? audit_log_columns.filter((c) => columns.includes(c.columnKey))
    : audit_log_columns;

  const handleSort = (_index, key, dir) => {
    setPage(1);
    getAuditLog(
      entityFilter,
      searchTerm,
      1,
      perPage,
      key,
      dir,
      auditLogFilters
    );
  };

  const handlePageChange = (page) => {
    setPage(page);
    getAuditLog(
      entityFilter,
      searchTerm,
      page,
      perPage,
      order,
      orderDir,
      auditLogFilters
    );
  };

  const handleSearch = (newTerm) => {
    setSearchTerm(newTerm);
    setPage(1);
    getAuditLog(
      entityFilter,
      newTerm,
      1,
      perPage,
      order,
      orderDir,
      auditLogFilters
    );
  };

  const handleDDLSortByLabel = (ddlArray) =>
    ddlArray.sort((a, b) => a.label.localeCompare(b.label));

  const handleFiltersChange = (ev) => {
    const { value } = ev.target;
    if (value.length < enabledFilters.length) {
      if (value.length === 0) {
        setEnabledFilters(value);
        setAuditLogFilters(defaultFilters);
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        const defaultValue = Array.isArray(auditLogFilters[removedFilter])
          ? []
          : "";
        const newEventFilters = {
          ...auditLogFilters,
          [removedFilter]: defaultValue
        };
        setEnabledFilters(value);
        setAuditLogFilters(newEventFilters);
      }
    } else {
      setEnabledFilters(value);
    }
  };

  const handleChangeDateFilter = (ev, lastDate) => {
    const { value, id } = ev.target;
    const newDateFilter = auditLogFilters[id];

    setAuditLogFilters({
      ...auditLogFilters,
      [id]: lastDate
        ? [newDateFilter[0], value.unix()]
        : [value.unix(), newDateFilter[1]]
    });
  };

  const handleAuditLogFilterChange = (ev) => {
    const { value, id } = ev.target;
    setAuditLogFilters({ ...auditLogFilters, [id]: value });
  };

  const handleApplyAuditLogFilters = () => {
    setPage(1);
    getAuditLog(
      entityFilter,
      searchTerm,
      1,
      perPage,
      order,
      orderDir,
      auditLogFilters
    );
  };

  useEffect(() => {
    getAuditLog(
      entityFilter,
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters
    );

    return () => {
      clearAuditLogParams();
    };
  }, []);

  return (
    <>
      <div className="row">
        <div className="col-md-8">
          <FreeTextSearch
            value={searchTerm ?? ""}
            placeholder={T.translate("audit_log.placeholders.search_log")}
            onSearch={handleSearch}
          />
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-md-6">
          <Dropdown
            id="enabled_filters"
            placeholder="Enabled Filters"
            value={enabledFilters}
            onChange={handleFiltersChange}
            options={handleDDLSortByLabel(filters_ddl)}
            isClearable
            isMulti
          />
        </div>
        <div className="col-md-6">
          <button
            className="btn btn-primary right-space"
            onClick={handleApplyAuditLogFilters}
            type="button"
          >
            {T.translate("audit_log.apply_filters")}
          </button>
        </div>
      </div>
      <div className="filters-row">
        {enabledFilters.includes("user_id_filter") && (
          <div className="col-md-6">
            <MemberInput
              id="user_id_filter"
              getOptionLabel={(member) =>
                member.hasOwnProperty("email")
                  ? `${member.first_name} ${member.last_name} (${member.email})`
                  : `${member.first_name} ${member.last_name} (${member.id})`
              }
              placeholder={T.translate("audit_log.placeholders.user_id")}
              value={auditLogFilters.user_id_filter}
              isMulti
              isClearable
              onChange={handleAuditLogFilterChange}
            />
          </div>
        )}
        {enabledFilters.includes("created_date_filter") && (
          <>
            <div className="col-md-3">
              <DateTimePicker
                id="created_date_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "audit_log.placeholders.created_date_from"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, false)}
                timezone={currentSummit.time_zone_id}
                value={epochToMomentTimeZone(
                  auditLogFilters.created_date_filter[0],
                  currentSummit.time_zone_id
                )}
                className="event-list-date-picker"
              />
            </div>
            <div className="col-md-3">
              <DateTimePicker
                id="created_date_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "audit_log.placeholders.created_date_to"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, true)}
                timezone={currentSummit.time_zone_id}
                value={epochToMomentTimeZone(
                  auditLogFilters.created_date_filter[1],
                  currentSummit.time_zone_id
                )}
                className="event-list-date-picker"
              />
            </div>
          </>
        )}
      </div>

      {logEntries.length === 0 && (
        <div>{T.translate("audit_log.no_log_entries")}</div>
      )}

      {logEntries.length > 0 && (
        <>
          <Table
            options={audit_log_table_options}
            data={logEntries}
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
            activePage={page}
            onSelect={handlePageChange}
          />
        </>
      )}
    </>
  );
};

const mapStateToProps = ({ currentSummitState, auditLogState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...auditLogState
});

export default connect(mapStateToProps, {
  getAuditLog,
  clearAuditLogParams
})(AuditLogs);
