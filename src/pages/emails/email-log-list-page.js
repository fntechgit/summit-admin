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

import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { getSentEmails, queryTemplates } from "../../actions/email-actions";
import {
  DATE_FILTER_ARRAY_SIZE,
  DEFAULT_CURRENT_PAGE
} from "../../utils/constants";

const SentEmailListPage = ({
  emails,
  currentPage,
  term,
  order,
  orderDir,
  totalEmails,
  perPage,
  filters,
  getSentEmails
}) => {
  useEffect(() => {
    getSentEmails(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters
    );
  }, []);

  const defaultFilters = {
    is_sent_filter: null,
    sent_date_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
    template_filter: ""
  };

  const [enabledFilters, setEnabledFilters] = useState(
    Object.keys(filters).filter((e) =>
      Array.isArray(filters[e])
        ? filters[e]?.some((e) => e !== null)
        : filters[e]?.length > 0
    )
  );
  const [emailFilters, setEmailFilters] = useState({
    ...defaultFilters,
    ...filters
  });
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [templateOptions, setTemplateOptions] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const templateRequestSeqRef = useRef(0);

  const fetchTemplateOptions = (input) => {
    const seq = ++templateRequestSeqRef.current;
    setTemplateLoading(true);
    queryTemplates(
      input,
      (results) => {
        if (seq !== templateRequestSeqRef.current) return;
        setTemplateOptions(
          results.map((t) => ({ value: t.identifier, label: t.identifier }))
        );
        setTemplateLoading(false);
      },
      () => {
        if (seq !== templateRequestSeqRef.current) return;
        setTemplateLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchTemplateOptions("");
  }, []);

  const handlePageChange = (newPage) => {
    getSentEmails(term, newPage, perPage, order, orderDir, emailFilters);
  };

  const handleSort = (index, key, dir) => {
    getSentEmails(term, currentPage, perPage, key, dir, emailFilters);
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

  const handleFiltersChange = (ev) => {
    const { value } = ev.target;
    if (value.length < enabledFilters.length) {
      if (value.length === 0) {
        setEnabledFilters(value);
        setEmailFilters(defaultFilters);
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        const defaultValue = Array.isArray(emailFilters[removedFilter])
          ? []
          : "";
        const newEventFilters = {
          ...emailFilters,
          [removedFilter]: defaultValue
        };
        setEnabledFilters(value);
        setEmailFilters(newEventFilters);
      }
    } else {
      setEnabledFilters(value);
    }
  };

  const handleChangeDateFilter = (value, lastDate) => {
    const newDateFilter = emailFilters.sent_date_filter;

    setEmailFilters({
      ...emailFilters,
      sent_date_filter: lastDate
        ? [newDateFilter[0], value ? value.unix() : null]
        : [value ? value.unix() : null, newDateFilter[1]]
    });
  };

  const handleEmailFilterChange = (ev) => {
    const { id, value } = ev.target;
    setEmailFilters({ ...emailFilters, [id]: value });
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    const newColumns = value;

    setSelectedColumns(newColumns);
  };

  const handleSetSentFilter = (ev) => {
    setEmailFilters({ ...emailFilters, is_sent_filter: ev });
  };

  const handleApplyEmailFilters = () => {
    getSentEmails(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      emailFilters
    );
  };

  const fieldNames = [
    { columnKey: "last_error", header: "last_error" },
    {
      columnKey: "payload",
      header: "payload",
      render: (row, data) => <Box sx={{ maxWidth: 300 }}>{data}</Box>
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

      return c;
    });

  let columns = [
    { columnKey: "id", value: T.translate("general.id"), sortable: true },
    {
      columnKey: "template",
      header: T.translate("email_logs.email_templates"),
      styles: { wordBreak: "break-all" },
      sortable: true
    },
    { columnKey: "subject", header: T.translate("email_logs.subject") },
    { columnKey: "from_email", header: T.translate("email_logs.from_email") },
    {
      columnKey: "to_email",
      header: T.translate("email_logs.to_email"),
      styles: { wordBreak: "break-word" }
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

  const filters_ddl = [
    { label: "Is Sent?", value: "is_sent_filter" },
    { label: "Sent Date", value: "sent_date_filter" },
    { label: "Template", value: "template_filter" }
  ];

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
        </Grid2>
      </Grid2>
      <Grid2 container spacing={1} sx={{ alignItems: "center", my: 2 }}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="enabled_filters-label">
              {T.translate("email_logs.enabled_filters")}
            </InputLabel>
            <Select
              labelId="enabled_filters-label"
              id="enabled_filters"
              multiple
              value={enabledFilters}
              onChange={handleFiltersChange}
              input={
                <OutlinedInput
                  label={T.translate("email_logs.enabled_filters")}
                />
              }
              renderValue={(selected) =>
                handleDDLSortByLabel(filters_ddl)
                  .filter((option) => selected.includes(option.value))
                  .map((option) => option.label)
                  .join(", ")
              }
            >
              {handleDDLSortByLabel(filters_ddl).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>
        <Grid2>
          <Button
            variant="contained"
            onClick={handleApplyEmailFilters}
            sx={{ height: 36 }}
          >
            {T.translate("email_logs.apply_filters")}
          </Button>
        </Grid2>
      </Grid2>
      <Grid2 container spacing={2} sx={{ alignItems: "center", mb: 4 }}>
        {enabledFilters.includes("is_sent_filter") && (
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <ToggleButtonGroup
              exclusive
              value={emailFilters.is_sent_filter}
              onChange={(ev, newValue) => handleSetSentFilter(newValue)}
              sx={(theme) => ({
                width: "100%",
                height: 40,
                "& .MuiToggleButtonGroup-grouped": {
                  flex: 1,
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark
                    }
                  }
                }
              })}
            >
              <ToggleButton value={null}>
                {T.translate("email_logs.all")}
              </ToggleButton>
              <ToggleButton value="1">
                {T.translate("emails.sent")}
              </ToggleButton>
              <ToggleButton value="0">
                {T.translate("email_logs.not_sent")}
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid2>
        )}
        {enabledFilters.includes("sent_date_filter") && (
          <>
            <Grid2 size={{ xs: 12, sm: 3 }}>
              <DateTimePicker
                label={T.translate("email_logs.placeholders.sent_date_from")}
                format="YYYY-MM-DD hh:mm A"
                ampm
                onChange={(value) => handleChangeDateFilter(value, false)}
                timezone="UTC"
                value={epochToMomentTimeZone(
                  emailFilters.sent_date_filter[0],
                  "UTC"
                )}
                slotProps={{
                  textField: { fullWidth: true, size: "small" }
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 3 }}>
              <DateTimePicker
                label={T.translate("email_logs.placeholders.sent_date_to")}
                format="YYYY-MM-DD hh:mm A"
                ampm
                onChange={(value) => handleChangeDateFilter(value, true)}
                timezone="UTC"
                value={epochToMomentTimeZone(
                  emailFilters.sent_date_filter[1],
                  "UTC"
                )}
                slotProps={{
                  textField: { fullWidth: true, size: "small" }
                }}
              />
            </Grid2>
          </>
        )}
        {enabledFilters.includes("template_filter") && (
          <Grid2 size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={templateOptions}
              value={
                emailFilters.template_filter
                  ? {
                      value: emailFilters.template_filter,
                      label: emailFilters.template_filter
                    }
                  : null
              }
              loading={templateLoading}
              fullWidth
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, val) => option.value === val.value}
              onInputChange={(ev, newInput) => fetchTemplateOptions(newInput)}
              onChange={(ev, selected) =>
                handleEmailFilterChange({
                  target: {
                    id: "template_filter",
                    value: selected?.value ?? ""
                  }
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={T.translate("email_logs.placeholders.template")}
                  size="small"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {templateLoading && (
                            <CircularProgress color="inherit" size={16} />
                          )}
                          {params.InputProps?.endAdornment}
                        </>
                      )
                    }
                  }}
                />
              )}
            />
          </Grid2>
        )}
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
