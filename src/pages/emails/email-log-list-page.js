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
 **/

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Table,
  Dropdown,
  DateTimePicker
} from "openstack-uicore-foundation/lib/components";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { SegmentedControl } from "segmented-control";
import { getSentEmails } from "../../actions/email-actions";
import "../../styles/email-logs-page.less";
import EmailTemplateInput from "../../components/inputs/email-template-input";

const SentEmailListPage = ({
  emails,
  lastPage,
  currentPage,
  term,
  order,
  orderDir,
  totalEmails,
  match,
  perPage,
  filters,
  ...props
}) => {
  useEffect(() => {
    props.getSentEmails(term, currentPage, perPage, order, orderDir, filters);
  }, []);

  const defaultFilters = {
    is_sent_filter: null,
    sent_date_filter: Array(2).fill(null),
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

  const handlePageChange = (newPage) => {
    props.getSentEmails(term, newPage, perPage, order, orderDir, emailFilters);
  };

  const handleSort = (index, key, dir, func) => {
    props.getSentEmails(term, currentPage, perPage, key, dir, emailFilters);
  };

  const handleSearch = (newTerm) => {
    props.getSentEmails(newTerm, 1, perPage, order, orderDir, emailFilters);
  };

  const handleDDLSortByLabel = (ddlArray) => {
    return ddlArray.sort((a, b) => a.label.localeCompare(b.label));
  };

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
        let newEventFilters = {
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

  const handleChangeDateFilter = (ev, lastDate) => {
    const { value, id } = ev.target;
    const newDateFilter = emailFilters[id];

    setEmailFilters({
      ...emailFilters,
      [id]: lastDate
        ? [newDateFilter[0], value.unix()]
        : [value.unix(), newDateFilter[1]]
    });
  };

  const handleEmailFilterChange = (ev) => {
    let { value, type, id } = ev.target;
    if (type === "operatorinput") {
      value = Array.isArray(value)
        ? value
        : `${ev.target.operator}${ev.target.value}`;
      if (id === "duration_filter") {
        value = Array.isArray(value)
          ? value
          : `${ev.target.operator}${ev.target.value}`;
      }
    }
    if (type === "mediatypeinput") {
      value = {
        operator: ev.target.operator,
        value: ev.target.value
      };
    }
    setEmailFilters({ ...emailFilters, [id]: value });
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    let newColumns = value;

    setSelectedColumns(newColumns);
  };

  const handleSetSentFilter = (ev) => {
    setEmailFilters({ ...emailFilters, is_sent_filter: ev });
  };

  const handleApplyEmailFilters = () => {
    props.getSentEmails(
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      emailFilters
    );
  };

  const fieldNames = [
    { columnKey: "last_error", value: "last_error" },
    {
      columnKey: "payload",
      value: "payload",
      render: (row, data) => <div className="email-table-payload">{data}</div>
    }
  ];

  let showColumns = fieldNames
    .filter((f) => selectedColumns.includes(f.columnKey))
    .map((f2) => {
      let c = {
        columnKey: f2.columnKey,
        value: T.translate(`email_logs.${f2.value}`),
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
      value: T.translate("email_logs.email_templates"),
      styles: { wordBreak: "break-all" },
      sortable: true
    },
    { columnKey: "subject", value: T.translate("email_logs.subject") },
    { columnKey: "from_email", value: T.translate("email_logs.from_email") },
    {
      columnKey: "to_email",
      value: T.translate("email_logs.to_email"),
      styles: { wordBreak: "break-word" }
    },
    {
      columnKey: "sent_date",
      value: T.translate("email_logs.sent_date"),
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
      <h3>
        {" "}
        {T.translate("email_logs.email_list")} ({totalEmails})
      </h3>
      <div className={"row"}>
        <div className={"col-md-6"}>
          <FreeTextSearch
            value={term}
            placeholder={T.translate("emails.placeholders.search_emails")}
            onSearch={handleSearch}
          />
        </div>
      </div>
      <hr />
      <div className={"row"}>
        <div className={"col-md-6"}>
          <Dropdown
            id="enabled_filters"
            placeholder={"Enabled Filters"}
            value={enabledFilters}
            onChange={handleFiltersChange}
            options={handleDDLSortByLabel(filters_ddl)}
            isClearable={true}
            isMulti={true}
          />
        </div>
        <div className={"col-md-6"}>
          <button
            className="btn btn-primary right-space"
            onClick={handleApplyEmailFilters}
          >
            {T.translate("email_logs.apply_filters")}
          </button>
        </div>
      </div>
      <div className="filters-row">
        {enabledFilters.includes("is_sent_filter") && (
          <div className={"col-md-6"}>
            <SegmentedControl
              name="is_sent_filter"
              options={[
                {
                  label: "All",
                  value: null,
                  default: emailFilters.is_sent_filter === null
                },
                {
                  label: "Sent",
                  value: "1",
                  default: emailFilters.is_sent_filter === "1"
                },
                {
                  label: "Not Sent",
                  value: "0",
                  default: emailFilters.is_sent_filter === "0"
                }
              ]}
              setValue={(newValue) => handleSetSentFilter(newValue)}
              style={{
                width: "100%",
                height: 40,
                color: "#337ab7",
                fontSize: "10px"
              }}
            />
          </div>
        )}
        {enabledFilters.includes("sent_date_filter") && (
          <>
            <div className={"col-md-3"}>
              <DateTimePicker
                id="sent_date_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "email_logs.placeholders.sent_date_from"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, false)}
                timezone={"UTC"}
                value={epochToMomentTimeZone(
                  emailFilters.sent_date_filter[0],
                  "UTC"
                )}
                className={"event-list-date-picker"}
              />
            </div>
            <div className={"col-md-3"}>
              <DateTimePicker
                id="sent_date_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "email_logs.placeholders.sent_date_to"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, true)}
                timezone={"UTC"}
                value={epochToMomentTimeZone(
                  emailFilters.sent_date_filter[1],
                  "UTC"
                )}
                className={"event-list-date-picker"}
              />
            </div>
          </>
        )}
        {enabledFilters.includes("template_filter") && (
          <div className={"col-md-6"}>
            <EmailTemplateInput
              id="template_filter"
              value={emailFilters.template_filter}
              placeholder={T.translate("email_logs.placeholders.template")}
              onChange={handleEmailFilterChange}
              isClearable={true}
              cacheOptions
              defaultOptions
              plainValue
            />
          </div>
        )}
      </div>
      <div className={"row"} style={{ marginBottom: 15 }}>
        <div className={"col-md-12"}>
          <label>{T.translate("email_logs.select_fields")}</label>
          <Dropdown
            id="select_fields"
            placeholder={T.translate("email_logs.placeholders.select_fields")}
            value={selectedColumns}
            onChange={handleColumnsChange}
            options={handleDDLSortByLabel(ddl_columns)}
            isClearable={true}
            isMulti={true}
          />
        </div>
      </div>

      {emails.length === 0 && <div>{T.translate("emails.no_emails")}</div>}

      {emails.length > 0 && (
        <>
          <div className="email-logs-table-wrapper">
            <Table
              options={table_options}
              data={emails}
              columns={columns}
              onSort={handleSort}
            />
          </div>
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
