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
 */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Select
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import {
  GridFilter,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import { getSummitById } from "../../actions/summit-actions";
import {
  getTicketTypes,
  deleteTicketType,
  seedTicketTypes,
  changeTicketTypesCurrency
} from "../../actions/ticket-actions";
import { getBadgeTypes } from "../../actions/badge-actions";
import { handleDDLSortByLabel } from "../../utils/methods";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import showConfirmDialog from "../../components/mui/showConfirmDialog";
import GridToolbar from "../../components/mui/grid-toolbar";
import {
  getCriterias,
  buildTicketTypeFilters
} from "./ticket-type-list-page.helpers";

const FILTER_ID = "ticket_type_list";

const TicketTypeListPage = function ({
  ticketTypes,
  currentSummit,
  term,
  order,
  orderDir,
  currentPage,
  perPage,
  totalTicketTypes,
  ...props
}) {
  const { parsedFilter, filterValues } = useGridFilter(FILTER_ID);
  const ticketTypeFilters = buildTicketTypeFilters(filterValues);

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    if (currentSummit?.id) {
      props.getTicketTypes(
        term,
        order,
        orderDir,
        DEFAULT_CURRENT_PAGE,
        perPage,
        ticketTypeFilters
      );
      if (!currentSummit.badge_types) {
        props.getBadgeTypes();
      }
    }
  }, [currentSummit?.id, parsedFilter.join(",")]);

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

  const handlePerPageChange = (newPerPage) => {
    props.getTicketTypes(
      term,
      order,
      orderDir,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      ticketTypeFilters
    );
  };

  const handleEdit = (ticket_type) => {
    props.history.push(
      `/app/summits/${currentSummit.id}/ticket-types/${ticket_type.id}`
    );
  };

  const handleSeedTickets = () => {
    props.seedTicketTypes();
  };

  const handleDelete = (ticketTypeId) => {
    props.deleteTicketType(ticketTypeId);
  };

  const handleSort = (key, dir) => {
    props.getTicketTypes(
      term,
      key,
      dir,
      DEFAULT_CURRENT_PAGE,
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
      DEFAULT_CURRENT_PAGE,
      perPage,
      ticketTypeFilters
    );
  };

  const handleChangeCurrency = async (newCurrency) => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate(
        "ticket_type_list.change_currency_warning"
      )} ${newCurrency}`,
      confirmButtonText: T.translate("ticket_type_list.yes_change")
    });

    if (confirmed) {
      props.changeTicketTypesCurrency(newCurrency);
    }
  };

  const handleColumnsChange = (ev) => {
    setSelectedColumns(ev.target.value);
  };

  const fieldNames = [
    { columnKey: "audience", header: "audience" },
    { columnKey: "external_id", header: "external_id" },
    { columnKey: "badge_type_name", header: "badge_type_name" },
    { columnKey: "cost", header: "cost" },
    { columnKey: "quantity_2_sell", header: "quantity_2_sell" },
    { columnKey: "sales_start_date", header: "sales_start_date" },
    { columnKey: "sales_end_date", header: "sales_end_date" }
  ];

  const showColumns = fieldNames
    .filter((f) => selectedColumns.includes(f.columnKey))
    .map((f) => ({
      columnKey: f.columnKey,
      header: T.translate(`ticket_type_list.${f.header}`),
      sortable: f.sortable
    }));

  const columns = [
    {
      columnKey: "id",
      header: T.translate("ticket_type_list.id"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("ticket_type_list.name"),
      sortable: true
    },
    {
      columnKey: "description",
      header: T.translate("ticket_type_list.description")
    },
    ...showColumns
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

  const table_options = { sortCol: order, sortDir: orderDir };

  const audienceDDL = [
    { label: "All", value: "All" },
    { label: "With Invitation", value: "WithInvitation" },
    { label: "Without Invitation", value: "WithoutInvitation" },
    // Additive audience added with the domain-authorized promo code feature.
    // See sds/promo-codes-for-early-registration-access-summit-admin.md.
    {
      label: T.translate("edit_ticket_type.audience_with_promo_code"),
      value: "WithPromoCode"
    }
  ];

  const badge_types_ddl =
    currentSummit.badge_types?.map((bt) => ({
      value: bt.id,
      label: bt.name
    })) ?? [];

  const currencyOptions = currentSummit.supported_currencies.map((c) => ({
    value: c,
    label: c
  }));
  const defaultCurrency =
    currentSummit.default_ticket_type_currency ||
    ticketTypes?.[0]?.currency ||
    "USD";
  const selectedCurrency = currency ?? defaultCurrency;

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("ticket_type_list.ticket_type_list")}</h3>
      <GridToolbar
        searchProps={{
          term,
          placeholder: T.translate(
            "ticket_type_list.placeholders.search_ticket_types"
          ),
          onSearch: handleSearch
        }}
      >
        <GridFilter
          id={FILTER_ID}
          criterias={getCriterias(
            audienceDDL,
            badge_types_ddl,
            currentSummit.time_zone_id
          )}
          hideJoinOperators
        />
        {ticketTypes?.length > 0 && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={selectedCurrency}
                onChange={(ev) => setCurrency(ev.target.value)}
              >
                {currencyOptions.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => handleChangeCurrency(selectedCurrency)}
            >
              {T.translate("ticket_type_list.apply")}
            </Button>
          </Box>
        )}
        <Button
          variant="contained"
          onClick={handleNewTicketType}
          startIcon={<AddIcon />}
        >
          {T.translate("ticket_type_list.add_ticket_type")}
        </Button>
        {currentSummit.external_registration_feed_type === "Eventbrite" && (
          <Button variant="outlined" onClick={handleSeedTickets}>
            {T.translate("ticket_type_list.seed_tickets")}
          </Button>
        )}
      </GridToolbar>
      <Grid2 size={2}>
        <Box component="span">
          {totalTicketTypes} {T.translate("ticket_type_list.ticket_types")}
        </Box>
      </Grid2>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ my: 2 }}>
        <MuiDropdown
          id="select_fields"
          label={T.translate("ticket_type_list.select_fields")}
          placeholder={T.translate(
            "ticket_type_list.placeholders.select_fields"
          )}
          value={selectedColumns}
          onChange={handleColumnsChange}
          options={handleDDLSortByLabel(ddl_columns)}
          multiple
        />
      </Box>

      {ticketTypes.length === 0 ? (
        <div>{T.translate("ticket_type_list.no_ticket_types")}</div>
      ) : (
        <MuiTable
          options={table_options}
          data={ticketTypes}
          columns={columns}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalTicketTypes}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteDialogBody={(name) =>
            `${T.translate("ticket_type_list.remove_warning")} ${name}`
          }
        />
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
