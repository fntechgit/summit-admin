/**
 * Copyright 2026 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import {
  ActionDropdown,
  FreeTextSearch,
  Dropdown,
  Table,
  DateTimePicker
} from "openstack-uicore-foundation/lib/components";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { getSummitById } from "../../actions/summit-actions";
import {
  getTicketTypes,
  deleteTicketType,
  seedTicketTypes,
  changeTicketTypesCurrency
} from "../../actions/ticket-actions";
import { getBadgeTypes } from "../../actions/badge-actions";
import { handleDDLSortByLabel } from "../../utils/methods";
import { DATE_FILTER_ARRAY_SIZE } from "../../utils/constants";

const TicketTypeListPage = function ({
  ticketTypes,
  currentSummit,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  lastPage,
  filters,
  totalTicketTypes,
  ...props
}) {
  const defaultFilters = {
    audience_filter: [],
    badge_type_filter: [],
    sale_period_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null)
  };

  const [enabledFilters, setEnabledFilters] = useState(
    Object.keys(filters).filter((e) =>
      Array.isArray(filters[e])
        ? filters[e]?.some((e) => e !== null)
        : filters[e]?.length > 0
    )
  );
  const [ticketTypeFilters, setTicketTypeFilters] = useState({
    ...defaultFilters,
    ...filters
  });

  const [selectedColumns, setSelectedColumns] = useState([]);

  useEffect(() => {
    if (currentSummit) {
      props.getTicketTypes(
        term,
        order,
        orderDir,
        currentPage,
        perPage,
        ticketTypeFilters
      );
      if (!currentSummit.badge_types) {
        props.getBadgeTypes();
      }
    }
  }, [currentSummit?.id]);

  const handlePageChange = (page) => {
    props.getTicketTypes(
      term,
      order,
      orderDir,
      page,
      perPage,
      ticketTypeFilters
    );
  };

  const handleEdit = (ticket_type_id) => {
    props.history.push(
      `/app/summits/${currentSummit.id}/ticket-types/${ticket_type_id}`
    );
  };

  const handleSeedTickets = (ev) => {
    ev.preventDefault();
    props.seedTicketTypes();
  };

  const handleDelete = (ticketTypeId) => {
    const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("ticket_type_list.remove_warning")} ${
        ticketType.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        props.deleteTicketType(ticketTypeId);
      }
    });
  };

  const handleSort = (index, key, dir) => {
    props.getTicketTypes(
      term,
      key,
      dir,
      currentPage,
      perPage,
      ticketTypeFilters
    );
  };

  const handleNewTicketType = () => {
    props.history.push(`/app/summits/${currentSummit.id}/ticket-types/new`);
  };

  const handleSearch = (newTerm) => {
    props.getTicketTypes(
      newTerm,
      order,
      orderDir,
      currentPage,
      perPage,
      ticketTypeFilters
    );
  };

  const handleFiltersChange = (ev) => {
    const { value } = ev.target;
    if (value.length < enabledFilters.length) {
      if (value.length === 0) {
        setEnabledFilters(value);
        setTicketTypeFilters(defaultFilters);
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        const defaultValue = Array.isArray(ticketTypeFilters[removedFilter])
          ? []
          : "";
        const newTicketTypeFilter = {
          ...ticketTypeFilters,
          [removedFilter]: defaultValue
        };
        setEnabledFilters(value);
        setTicketTypeFilters(newTicketTypeFilter);
      }
    } else {
      setEnabledFilters(value);
    }
  };

  const handleChangeDateFilter = (ev, lastDate) => {
    const { value, id } = ev.target;
    const newDateFilter = ticketTypeFilters[id];

    setTicketTypeFilters({
      ...ticketTypeFilters,
      [id]: lastDate
        ? [newDateFilter[0], value.unix()]
        : [value.unix(), newDateFilter[1]]
    });
  };

  const handleTicketTypeFilterChange = (ev) => {
    const { value, id } = ev.target;
    setTicketTypeFilters({ ...ticketTypeFilters, [id]: value });
  };

  const handleApplyTicketTypeFilters = () => {
    props.getTicketTypes(
      term,
      order,
      orderDir,
      currentPage,
      perPage,
      ticketTypeFilters
    );
  };

  const handleChangeCurrency = (currency) => {
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "ticket_type_list.change_currency_warning"
      )} ${currency}`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: T.translate("ticket_type_list.yes_change")
    }).then((result) => {
      if (result.value) {
        props.changeTicketTypesCurrency(currency);
      }
    });
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    const newColumns = value;

    setSelectedColumns(newColumns);
  };

  const fieldNames = [
    { columnKey: "audience", value: "audience" },
    { columnKey: "external_id", value: "external_id" },
    { columnKey: "badge_type_name", value: "badge_type_name" },
    { columnKey: "cost", value: "cost" },
    { columnKey: "quantity_2_sell", value: "quantity_2_sell" },
    { columnKey: "sales_start_date", value: "sales_start_date" },
    { columnKey: "sales_end_date", value: "sales_end_date" }
  ];

  const showColumns = fieldNames
    .filter((f) => selectedColumns.includes(f.columnKey))
    .map((f2) => {
      let c = {
        columnKey: f2.columnKey,
        value: T.translate(`ticket_type_list.${f2.value}`),
        sortable: f2.sortable
      };
      // optional fields
      if (f2.hasOwnProperty("title")) c = { ...c, title: f2.title };

      if (f2.hasOwnProperty("render")) c = { ...c, render: f2.render };

      return c;
    });

  let columns = [
    {
      columnKey: "id",
      value: T.translate("ticket_type_list.id"),
      sortable: true
    },
    {
      columnKey: "name",
      value: T.translate("ticket_type_list.name"),
      sortable: true
    },
    {
      columnKey: "description",
      value: T.translate("ticket_type_list.description")
    }
  ];

  const ddl_columns = [
    {
      value: "audience",
      label: T.translate("ticket_type_list.audience"),
      sortable: true
    },
    {
      value: "external_id",
      label: T.translate("ticket_type_list.external_id")
    },
    {
      value: "badge_type_name",
      label: T.translate("ticket_type_list.badge_type_name")
    },
    { value: "cost", label: T.translate("ticket_type_list.cost") },
    {
      value: "quantity_2_sell",
      label: T.translate("ticket_type_list.quantity_2_sell")
    },
    {
      value: "sales_start_date",
      label: T.translate("ticket_type_list.sales_start_date")
    },
    {
      value: "sales_end_date",
      label: T.translate("ticket_type_list.sales_end_date")
    }
  ];

  columns = [...columns, ...showColumns];

  const table_options = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  const filters_ddl = [
    { label: "Audience", value: "audience_filter" },
    { label: "Badge Type", value: "badge_type_filter" },
    { label: "Sale Period", value: "sale_period_filter" }
  ];

  const audienceDDL = [
    { label: "All", value: "All" },
    { label: "With Invitation", value: "WithInvitation" },
    { label: "Without Invitation", value: "WithoutInvitation" }
  ];

  const badge_types_ddl = currentSummit.badge_types?.map((bt) => ({
    value: bt.id,
    label: bt.name
  }));

  const currencyOptions = currentSummit.supported_currencies.map((c) => ({
    value: c,
    label: c
  }));
  const defaultCurrency =
    currentSummit.default_ticket_type_currency ||
    ticketTypes?.[0]?.currency ||
    "USD";

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("ticket_type_list.ticket_type_list")} ({totalTicketTypes})
      </h3>
      <div className="row">
        <div className="col-md-5">
          <FreeTextSearch
            value={term}
            placeholder={T.translate(
              "ticket_type_list.placeholders.search_ticket_types"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-7 text-right">
          {ticketTypes?.length > 0 && (
            <span className="right-space">
              <ActionDropdown
                value={{ value: defaultCurrency, label: defaultCurrency }}
                options={currencyOptions}
                actionLabel={T.translate("ticket_type_list.apply")}
                placeholder={T.translate(
                  "ticket_type_list.placeholders.select_currency"
                )}
                onClick={handleChangeCurrency}
              />
            </span>
          )}
          <button
            className="btn btn-primary right-space"
            onClick={handleNewTicketType}
            type="button"
          >
            {T.translate("ticket_type_list.add_ticket_type")}
          </button>
          {currentSummit.external_registration_feed_type === "Eventbrite" && (
            <button
              className="btn btn-default"
              onClick={handleSeedTickets}
              type="button"
            >
              {T.translate("ticket_type_list.seed_tickets")}
            </button>
          )}
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
            onClick={handleApplyTicketTypeFilters}
            type="button"
          >
            {T.translate("ticket_type_list.apply_filters")}
          </button>
        </div>
      </div>
      <div className="filters-row">
        {enabledFilters.includes("audience_filter") && (
          <div className="col-md-6">
            <Dropdown
              id="audience_filter"
              value={ticketTypeFilters.audience_filter}
              onChange={handleTicketTypeFilterChange}
              options={audienceDDL}
              isClearable
              placeholder="Filter By Audience"
              isMulti
            />
          </div>
        )}
        {enabledFilters.includes("badge_type_filter") && (
          <div className="col-md-6">
            <Dropdown
              id="badge_type_filter"
              value={ticketTypeFilters.badge_type_filter}
              onChange={handleTicketTypeFilterChange}
              options={badge_types_ddl}
              isClearable
              placeholder="Filter By Badge Type"
              isMulti
            />
          </div>
        )}
        {enabledFilters.includes("sale_period_filter") && (
          <>
            <div className="col-md-3">
              <DateTimePicker
                id="sale_period_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "ticket_type_list.placeholders.sale_period_from"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, false)}
                timezone={currentSummit.time_zone_id}
                value={epochToMomentTimeZone(
                  ticketTypeFilters.sale_period_filter[0],
                  currentSummit.time
                )}
                className="event-list-date-picker"
              />
            </div>
            <div className="col-md-3">
              <DateTimePicker
                id="sale_period_filter"
                format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                inputProps={{
                  placeholder: T.translate(
                    "ticket_type_list.placeholders.sale_period_to"
                  )
                }}
                onChange={(ev) => handleChangeDateFilter(ev, true)}
                timezone={currentSummit.time_zone_id}
                value={epochToMomentTimeZone(
                  ticketTypeFilters.sale_period_filter[1],
                  currentSummit.time_zone_id
                )}
                className="event-list-date-picker"
              />
            </div>
          </>
        )}
      </div>
      <hr />
      <div className="row" style={{ marginBottom: 15 }}>
        <div className="col-md-12">
          <label htmlFor="select_fields">
            {T.translate("ticket_type_list.select_fields")}
          </label>
          <Dropdown
            id="select_fields"
            placeholder={T.translate(
              "ticket_type_list.placeholders.select_fields"
            )}
            value={selectedColumns}
            onChange={handleColumnsChange}
            options={handleDDLSortByLabel(ddl_columns)}
            isClearable
            isMulti
          />
        </div>
      </div>

      {ticketTypes.length === 0 && (
        <div>{T.translate("ticket_type_list.no_ticket_types")}</div>
      )}

      {ticketTypes.length > 0 && (
        <div>
          <Table
            options={table_options}
            data={ticketTypes}
            columns={columns}
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
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentTicketTypeListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentTicketTypeListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getBadgeTypes,
  getTicketTypes,
  deleteTicketType,
  seedTicketTypes,
  changeTicketTypesCurrency
})(TicketTypeListPage);
