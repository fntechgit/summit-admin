/**
 * Copyright 2020 OpenStack Foundation
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
import {
  Box,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select
} from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  GridFilter,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { getSentEmails } from "../../actions/email-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import { buildEmailFilters, getCriterias } from "./email-log-list-page.helpers";

const FILTER_ID = "email_log_list";

const SentEmailListPage = ({
  emails,
  currentPage,
  term,
  order,
  orderDir,
  totalEmails,
  perPage,
  getSentEmails
}) => {
  const { parsedFilter, filterValues } = useGridFilter(FILTER_ID);
  const emailFilters = buildEmailFilters(filterValues);

  useEffect(() => {
    getSentEmails(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      emailFilters
    );
  }, [parsedFilter.join(",")]);

  const [selectedColumns, setSelectedColumns] = useState([]);

  const handlePageChange = (newPage) => {
    getSentEmails(term, newPage, perPage, order, orderDir, emailFilters);
  };

  const handleSort = (key, dir) => {
    getSentEmails(term, DEFAULT_CURRENT_PAGE, perPage, key, dir, emailFilters);
  };

  const handlePerPageChange = (newPerPage) => {
    getSentEmails(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      emailFilters
    );
  };

  const handleSearch = (newTerm) => {
    getSentEmails(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      emailFilters
    );
  };

  const handleDDLSortByLabel = (ddlArray) =>
    ddlArray.sort((a, b) => a.label.localeCompare(b.label));

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    setSelectedColumns(value);
  };

  const fieldNames = [
    { columnKey: "last_error", header: "last_error" },
    {
      columnKey: "payload",
      header: "payload",
      width: 300,
      render: (row) => row.payload
    }
  ];

  const showColumns = fieldNames
    .filter((f) => selectedColumns.includes(f.columnKey))
    .map((f2) => {
      let c = {
        columnKey: f2.columnKey,
        header: T.translate(`email_logs.${f2.header}`),
        sortable: f2.sortable
      };
      // optional fields
      if (f2.hasOwnProperty("title")) c = { ...c, title: f2.title };

      if (f2.hasOwnProperty("render")) c = { ...c, render: f2.render };

      if (f2.hasOwnProperty("width")) c = { ...c, width: f2.width };

      return c;
    });

  let columns = [
    { columnKey: "id", header: T.translate("general.id"), sortable: true },
    {
      columnKey: "template",
      header: T.translate("email_logs.email_templates"),
      sortable: true
    },
    { columnKey: "subject", header: T.translate("email_logs.subject") },
    { columnKey: "from_email", header: T.translate("email_logs.from_email") },
    {
      columnKey: "to_email",
      header: T.translate("email_logs.to_email")
    },
    {
      columnKey: "sent_date",
      header: T.translate("email_logs.sent_date"),
      sortable: true
    }
  ];

  const ddl_columns = [
    { value: "last_error", label: T.translate("email_logs.last_error") },
    { value: "payload", label: T.translate("email_logs.payload") }
  ];

  columns = [...columns, ...showColumns];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3> {T.translate("email_logs.email_list")}</h3>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalEmails} {T.translate("emails.emails")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          spacing={1}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={6}>
            <SearchInput
              term={term}
              onSearch={handleSearch}
              placeholder={T.translate("emails.placeholders.search_emails")}
            />
          </Grid2>
          <GridFilter
            id={FILTER_ID}
            criterias={getCriterias()}
            hideJoinOperators
          />
        </Grid2>
      </Grid2>
      <Grid2 sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="select_fields-label">
            {T.translate("email_logs.select_fields")}
          </InputLabel>
          <Select
            labelId="select_fields-label"
            id="select_fields"
            multiple
            value={selectedColumns}
            onChange={handleColumnsChange}
            input={
              <OutlinedInput label={T.translate("email_logs.select_fields")} />
            }
            renderValue={(selected) =>
              handleDDLSortByLabel(ddl_columns)
                .filter((option) => selected.includes(option.value))
                .map((option) => option.label)
                .join(", ")
            }
          >
            {handleDDLSortByLabel(ddl_columns).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid2>

      {emails.length === 0 && <div>{T.translate("emails.no_emails")}</div>}

      {emails.length > 0 && (
        <MuiTable
          options={table_options}
          data={emails}
          columns={columns}
          onSort={handleSort}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalEmails}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, emailLogListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...emailLogListState
});

export default connect(mapStateToProps, {
  getSentEmails
})(SentEmailListPage);
