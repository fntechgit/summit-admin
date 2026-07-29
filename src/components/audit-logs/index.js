import React, { useEffect, useState } from "react";
import { Grid2 } from "@mui/material";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  GridFilter,
  useGridFilter,
  OPERATORS
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { queryMembers } from "openstack-uicore-foundation/lib/utils/query-actions";
import T from "i18n-react";
import { connect } from "react-redux";
import {
  clearAuditLogParams as clearAuditLogParamsAction,
  getAuditLog as getAuditLogAction
} from "../../actions/audit-log-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const FILTER_ID = "audit_log_list";

const getCriterias = () => [
  {
    key: "user_id",
    label: T.translate("audit_log.placeholders.user_id"),
    operators: [OPERATORS.IS],
    values: {
      type: "asyncSelect",
      props: {
        queryFunction: queryMembers,
        formatOption: (m) => ({
          value: m.id,
          label: `${m.first_name} ${m.last_name} (${m.email})`
        }),
        multiple: true
      }
    },
    customParser: (f) => [`user_id==${f.value.map((s) => s.value).join("||")}`]
  },
  {
    key: "created",
    label: T.translate("audit_log.date"),
    operators: [OPERATORS.BEFORE, OPERATORS.AFTER],
    values: {
      type: "datetime",
      props: {
        mode: "datetime"
      }
    }
  }
];

const AuditLogs = ({
  entityFilter = [],
  term,
  logEntries,
  perPage,
  currentPage,
  totalLogEntries,
  order,
  orderDir,
  columns,
  getAuditLog,
  clearAuditLogParams
}) => {
  const [searchTerm, setSearchTerm] = useState(term);
  const { parsedFilter, resetFilters } = useGridFilter(FILTER_ID);

  const auditLogColumns = [
    {
      columnKey: "created",
      header: T.translate("audit_log.date"),
      sortable: true
    },
    {
      columnKey: "action_description",
      header: T.translate("audit_log.action"),
      sortable: false,
      width: 600,
      truncateText: true
    },
    {
      columnKey: "event_id",
      header: T.translate("audit_log.event"),
      sortable: true
    },
    {
      columnKey: "user",
      header: T.translate("audit_log.user"),
      sortable: false
    }
  ];

  const showColumns = columns
    ? auditLogColumns.filter((c) => columns.includes(c.columnKey))
    : auditLogColumns;

  const handleSort = (key, dir) => {
    getAuditLog(
      entityFilter,
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      parsedFilter
    );
  };

  const handlePageChange = (newPage) => {
    getAuditLog(
      entityFilter,
      searchTerm,
      newPage,
      perPage,
      order,
      orderDir,
      parsedFilter
    );
  };

  const handlePerPageChange = (newPerPage) => {
    getAuditLog(
      entityFilter,
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      parsedFilter
    );
  };

  const handleSearch = (newTerm) => {
    setSearchTerm(newTerm);
    getAuditLog(
      entityFilter,
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      parsedFilter
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
      parsedFilter
    );
  }, [parsedFilter.join(",")]);

  // AuditLogs is reused in different contexts (the standalone audit log
  // page, an event's edit form, a ticket's edit page) sharing one Redux-
  // backed FILTER_ID, so a filter applied in one context must not leak into
  // another mount — reset it along with the log params on unmount.
  useEffect(
    () => () => {
      clearAuditLogParams();
      resetFilters();
    },
    []
  );

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <>
      <Grid2
        container
        spacing={2}
        sx={{ justifyContent: "end", alignItems: "center", mb: 2 }}
      >
        <Grid2
          container
          size={{ xs: 12, md: 6 }}
          sx={{ flexWrap: "nowrap", alignItems: "center", gap: 1 }}
        >
          <SearchInput
            term={searchTerm ?? ""}
            placeholder={T.translate("audit_log.placeholders.search_log")}
            onSearch={handleSearch}
          />
          <GridFilter id={FILTER_ID} criterias={getCriterias()} />
        </Grid2>
      </Grid2>

      {logEntries.length === 0 && (
        <div>{T.translate("audit_log.no_log_entries")}</div>
      )}

      {logEntries.length > 0 && (
        <MuiTable
          columns={showColumns}
          data={logEntries}
          tableSx={{ tableLayout: "auto", minWidth: 910 }}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalLogEntries}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
        />
      )}
    </>
  );
};

const mapStateToProps = ({ currentSummitState, auditLogState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...auditLogState
});

export default connect(mapStateToProps, {
  getAuditLog: getAuditLogAction,
  clearAuditLogParams: clearAuditLogParamsAction
})(AuditLogs);
