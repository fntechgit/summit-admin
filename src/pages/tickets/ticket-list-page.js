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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  FreeTextSearch,
  UploadInput,
  SelectableTable,
  Dropdown,
  PromocodeInput,
  TagInput,
  CompanyInput
} from "openstack-uicore-foundation/lib/components";
import { Modal, Pagination } from "react-bootstrap";
import { Breadcrumb } from "react-breadcrumbs";
import { SegmentedControl } from "segmented-control";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  getTickets,
  ingestExternalTickets,
  importTicketsCSV,
  exportTicketsCSV,
  selectTicket,
  unSelectTicket,
  clearAllSelectedTicket,
  setSelectedAll,
  printTickets,
  getTicket
} from "../../actions/ticket-actions";
import { getSummitById } from "../../actions/summit-actions";
import QrReaderInput from "../../components/inputs/qr-reader-input";
import "../../styles/ticket-list-page.less";
import OrAndFilter from "../../components/filters/or-and-filter";
import {
  ALL_FILTER,
  DEFAULT_CURRENT_PAGE,
  DEFAULT_EXPORT_PAGE_SIZE,
  DEFAULT_PER_PAGE,
  LETTERS_IN_ALPHABET,
  UPPERCASE_A_IN_ASCII
} from "../../utils/constants";
import { getBadgeTypes } from "../../actions/badge-actions";
import SelectFilterCriteria from "../../components/filters/select-filter-criteria";
import SaveFilterCriteria from "../../components/filters/save-filter-criteria";
import { CONTEXT_TICKETS } from "../../utils/filter-criteria-constants";
import {
  saveFilterCriteria,
  deleteFilterCriteria
} from "../../actions/filter-criteria-actions";
import { handleDDLSortByLabel } from "../../utils/methods";

const BatchSize = 25;

const fieldNames = (badge_types) => [
  {
    columnKey: "number",
    value: "number",
    sortable: true,
    render: (item, val) => {
      const hasRequested = item.refund_requests.some(
        (r) => r.status === "Requested"
      );
      return `${val}${
        hasRequested
          ? "&nbsp;<span class=\"label label-danger\">Refund Requested</span>"
          : ""
      }`;
    }
  },
  { columnKey: "promo_code", value: "promo_code", sortable: true, title: true },
  { columnKey: "bought_date", value: "bought_date", sortable: true },
  { columnKey: "owner_email", value: "owner_email", sortable: true },
  { columnKey: "owner_company", value: "owner_company", sortable: true },
  { columnKey: "status", value: "status", sortable: true },
  { columnKey: "refunded_amount", value: "refunded_amount", sortable: true },
  {
    columnKey: "final_amount_adjusted",
    value: "paid_amount_adjusted",
    sortable: true
  },
  { columnKey: "promo_code_tags", value: "promo_code_tags" },
  {
    columnKey: "badge_type_id",
    value: "badge_type",
    sortable: true,
    render: (row) =>
      badge_types.find((bt) => bt.id === row.badge_type_id)?.name || "N/A"
  },
  {
    columnKey: "badge_prints_count",
    value: "badge_prints_count",
    sortable: true
  },
  {
    columnKey: "owner_first_name",
    value: "owner_first_name",
    sortable: true
  },
  {
    columnKey: "owner_last_name",
    value: "owner_last_name",
    sortable: true
  }
];

const defaultFilters = {
  showOnlyPendingRefundRequests: false,
  ticketTypesFilter: [],
  ownerFullNameStartWithFilter: [],
  viewTypesFilter: [],
  ownerCompany: [],
  hasOwnerFilter: null,
  completedFilter: null,
  amountFilter: null,
  hasBadgeFilter: null,
  showOnlyPrintable: false,
  excludeFreeUnassigned: false,
  promocodesFilter: [],
  promocodeTagsFilter: [],
  orAndFilter: ALL_FILTER
};

class TicketListPage extends React.Component {
  constructor(props) {
    super(props);
    const { currentSummit } = props;
    this.handleEdit = this.handleEdit.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleIngestTickets = this.handleIngestTickets.bind(this);
    this.handleImportTickets = this.handleImportTickets.bind(this);
    this.handleExportTickets = this.handleExportTickets.bind(this);
    this.handleSelected = this.handleSelected.bind(this);
    this.handleSelectedAll = this.handleSelectedAll.bind(this);
    this.handleSendTickets2Print = this.handleSendTickets2Print.bind(this);
    this.handleDoPrinting = this.handleDoPrinting.bind(this);
    this.handleScanQR = this.handleScanQR.bind(this);
    this.handleColumnsChange = this.handleColumnsChange.bind(this);
    this.handleFiltersChange = this.handleFiltersChange.bind(this);
    this.handleFilterCriteriaSave = this.handleFilterCriteriaSave.bind(this);
    this.handleFilterCriteriaChange =
      this.handleFilterCriteriaChange.bind(this);
    this.handleFilterCriteriaDelete =
      this.handleFilterCriteriaDelete.bind(this);

    this.state = {
      showIngestModal: false,
      showImportModal: false,
      importFile: null,
      showPrintModal: false,
      doCheckIn: false,
      selectedViewType: null,
      selectedColumns: [],
      enabledFilters: [],
      ticketFilters: {
        ...defaultFilters
      },
      selectedFilterCriteria: null
    };

    if (currentSummit && !currentSummit.badge_types) {
      props.getBadgeTypes();
    }
  }

  componentDidMount() {
    const {
      currentSummit,
      term,
      order,
      orderDir,
      filters,
      extraColumns,
      getTickets
    } = this.props;

    if (currentSummit) {
      const { ticketFilters } = this.state;
      const enabledFilters = Object.keys(filters).filter(
        (e) => filters[e]?.length > 0
      );
      this.setState((prevState) => ({
        ...prevState,
        selectedColumns: extraColumns,
        enabledFilters,
        ticketFilters: { ...ticketFilters, ...filters }
      }));
      if (currentSummit) {
        getTickets(
          term,
          DEFAULT_CURRENT_PAGE,
          DEFAULT_PER_PAGE,
          order,
          orderDir,
          filters,
          extraColumns
        );
      }
    }
  }

  handleSelected(attendee_id, isSelected) {
    const { selectTicket, unSelectTicket } = this.props;
    if (isSelected) {
      selectTicket(attendee_id);
      return;
    }
    unSelectTicket(attendee_id);
  }

  handleSelectedAll(ev) {
    const selectedAll = ev.target.checked;
    const { setSelectedAll, clearAllSelectedTicket } = this.props;
    setSelectedAll(selectedAll);
    if (!selectedAll) {
      // clear all selected
      clearAllSelectedTicket();
    }
  }

  handleSearch(term) {
    const { order, orderDir, getTickets } = this.props;
    const { selectedColumns, ticketFilters } = this.state;
    getTickets(
      term,
      DEFAULT_CURRENT_PAGE,
      DEFAULT_PER_PAGE,
      order,
      orderDir,
      ticketFilters,
      selectedColumns
    );
  }

  handleEdit(ticket_id) {
    const { currentSummit, history, tickets } = this.props;
    const ticket = tickets.find((t) => t.id === ticket_id);
    history.push(
      `/app/summits/${currentSummit.id}/purchase-orders/${ticket.order_id}/tickets/${ticket_id}`
    );
  }

  handleSort(index, key, dir) {
    const { term, page, perPage, getTickets } = this.props;
    const { selectedColumns, ticketFilters } = this.state;
    getTickets(term, page, perPage, key, dir, ticketFilters, selectedColumns);
  }

  handlePageChange(page) {
    const { term, order, orderDir, perPage, getTickets } = this.props;
    const { selectedColumns, ticketFilters } = this.state;
    getTickets(
      term,
      page,
      perPage,
      order,
      orderDir,
      ticketFilters,
      selectedColumns
    );
  }

  handleIngestTickets() {
    const { ingestExternalTickets } = this.props;
    const email = this.ingestEmailRef.value;
    this.setState({ showIngestModal: false });
    ingestExternalTickets(email);
  }

  handleImportTickets() {
    const { importTicketsCSV } = this.props;
    const { importFile } = this.state;
    this.setState({ showImportModal: false });
    const formData = new FormData();
    if (importFile) {
      formData.append("file", importFile);
      importTicketsCSV(formData);
    }
  }

  handleExportTickets() {
    const { term, order, orderDir, exportTicketsCSV } = this.props;
    const { selectedColumns, ticketFilters } = this.state;

    exportTicketsCSV(
      term,
      DEFAULT_EXPORT_PAGE_SIZE,
      order,
      orderDir,
      ticketFilters,
      selectedColumns
    );
  }

  handleFilterChange(key, value) {
    const { term, order, orderDir, getTickets } = this.props;
    const { selectedColumns } = this.state;
    this.setState(
      (prevState) => ({
        ...prevState,
        ticketFilters: { ...prevState.ticketFilters, [key]: value }
      }),
      () => {
        const { ticketFilters } = this.state;
        getTickets(
          term,
          DEFAULT_CURRENT_PAGE,
          DEFAULT_PER_PAGE,
          order,
          orderDir,
          ticketFilters,
          selectedColumns
        );
      }
    );
  }

  // eslint-disable-next-line consistent-return
  handleSendTickets2Print(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    const { selectedIds, selectedAll } = this.props;
    const { selectedViewType } = this.state;

    if (selectedViewType == null) {
      Swal.fire(
        "Validation error",
        T.translate("ticket_list.select_view_2_print"),
        "warning"
      );
      return false;
    }

    if (!selectedAll && selectedIds?.length === 0) {
      Swal.fire(
        "Validation error",
        T.translate("ticket_list.select_items"),
        "warning"
      );
      return false;
    }

    if (!selectedAll && selectedIds?.length > BatchSize) {
      Swal.fire(
        "Validation error",
        `You can not select more than ${BatchSize} Tickets To print.`,
        "warning"
      );
      return false;
    }

    this.setState((prevState) => ({ ...prevState, showPrintModal: true }));
  }

  handleDoPrinting(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const { printTickets } = this.props;
    const { ticketFilters, doCheckIn, selectedViewType } = this.state;
    printTickets(ticketFilters, doCheckIn, selectedViewType);
  }

  handleScanQR(qrCode) {
    const { currentSummit, history, getTicket } = this.props;
    getTicket(btoa(qrCode)).then((data) => {
      history.push(
        `/app/summits/${currentSummit.id}/purchase-orders/${data.order_id}/tickets/${data.id}`
      );
    });
  }

  handleColumnsChange(ev) {
    const { value } = ev.target;
    this.setState((prevState) => ({ ...prevState, selectedColumns: value }));
  }

  handleFiltersChange(ev) {
    const { value } = ev.target;
    const { enabledFilters, ticketFilters } = this.state;
    const { term, order, orderDir, getTickets } = this.props;
    if (value?.length < enabledFilters?.length) {
      if (value?.length === 0) {
        const resetFilters = {
          showOnlyPendingRefundRequests: false,
          ticketTypesFilter: [],
          ownerFullNameStartWithFilter: [],
          ownerCompany: [],
          viewTypesFilter: [],
          hasOwnerFilter: null,
          completedFilter: null,
          amountFilter: null,
          hasBadgeFilter: null,
          showOnlyPrintable: false,
          excludeFreeUnassigned: false,
          promocodesFilter: [],
          promocodeTagsFilter: [],
          badgeTypesFilter: [],
          orAndFilter: ticketFilters.orAndFilter
        };
        this.setState(
          (prevState) => ({
            ...prevState,
            enabledFilters: value,
            ticketFilters: resetFilters
          }),
          () => {
            const { ticketFilters, selectedColumns } = this.state;
            getTickets(
              term,
              DEFAULT_CURRENT_PAGE,
              DEFAULT_PER_PAGE,
              order,
              orderDir,
              ticketFilters,
              selectedColumns
            );
          }
        );
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        let defaultValue;
        if (removedFilter === "published_filter") {
          defaultValue = null;
        } else if (Array.isArray(ticketFilters[removedFilter])) {
          defaultValue = [];
        } else {
          defaultValue = "";
        }
        const newEventFilters = {
          ...ticketFilters,
          [removedFilter]: defaultValue
        };
        this.setState(
          (prevState) => ({
            ...prevState,
            enabledFilters: value,
            ticketFilters: newEventFilters
          }),
          () => {
            const { ticketFilters, selectedColumns } = this.state;
            getTickets(
              term,
              DEFAULT_CURRENT_PAGE,
              DEFAULT_PER_PAGE,
              order,
              orderDir,
              ticketFilters,
              selectedColumns
            );
          }
        );
      }
    } else {
      this.setState((prevState) => ({ ...prevState, enabledFilters: value }));
    }
  }

  handleFilterCriteriaSave(filterData) {
    const { enabledFilters, ticketFilters } = this.state;
    const { currentSummit, saveFilterCriteria } = this.props;
    const filterToSave = {
      id: filterData.id,
      show_id: currentSummit.id,
      name: filterData.name,
      enabled_filters: enabledFilters,
      // only save criteria for enabled filters
      criteria: Object.fromEntries(
        Object.entries(ticketFilters).filter(([key]) =>
          enabledFilters.includes(key)
        )
      ),
      context: CONTEXT_TICKETS,
      visibility: filterData.visibility
    };
    saveFilterCriteria(filterToSave);
  }

  handleFilterCriteriaChange(filterCriteria) {
    const { term, order, orderDir, getTickets } = this.props;
    let newEventFilters = {};
    if (filterCriteria) {
      Object.entries(filterCriteria.criteria).forEach(([key, values]) => {
        newEventFilters = { ...newEventFilters, [key]: values };
      });
    }

    this.setState(
      (prevState) => ({
        ...prevState,
        ticketFilters: { ...defaultFilters, ...newEventFilters },
        enabledFilters: filterCriteria ? filterCriteria.enabled_filters : [],
        selectedFilterCriteria: filterCriteria || null
      }),
      () => {
        const { ticketFilters, selectedColumns } = this.state;
        getTickets(
          term,
          DEFAULT_CURRENT_PAGE,
          DEFAULT_PER_PAGE,
          order,
          orderDir,
          ticketFilters,
          selectedColumns
        );
      }
    );
  }

  handleFilterCriteriaDelete(filterCriteriaId) {
    const { term, order, orderDir, deleteFilterCriteria, getTickets } =
      this.props;
    deleteFilterCriteria(filterCriteriaId).then(() =>
      this.setState(
        (prevState) => ({
          ...prevState,
          ticketFilters: { ...defaultFilters },
          enabledFilters: [],
          selectedFilterCriteria: null
        }),
        () => {
          const { ticketFilters, selectedColumns } = this.state;
          getTickets(
            term,
            DEFAULT_CURRENT_PAGE,
            DEFAULT_PER_PAGE,
            order,
            orderDir,
            ticketFilters,
            selectedColumns
          );
        }
      )
    );
  }

  render() {
    const {
      currentSummit,
      tickets,
      term,
      order,
      orderDir,
      totalTickets,
      lastPage,
      currentPage,
      match,
      selectedCount,
      selectedAll
    } = this.props;

    const {
      doCheckIn,
      showIngestModal,
      showImportModal,
      importFile,
      showPrintModal,
      selectedViewType,
      enabledFilters,
      ticketFilters,
      selectedColumns,
      selectedFilterCriteria
    } = this.state;

    const { badge_types } = currentSummit;

    let columns = [
      { columnKey: "id", value: T.translate("ticket_list.id"), sortable: true },
      {
        columnKey: "ticket_type",
        value: T.translate("ticket_list.ticket_type"),
        sortable: true
      },
      {
        columnKey: "owner_name",
        value: T.translate("ticket_list.owner_name"),
        sortable: true
      },
      {
        columnKey: "final_amount",
        value: T.translate("ticket_list.paid_amount"),
        sortable: true
      }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      actions: {
        edit: {
          onClick: this.handleEdit,
          onSelected: this.handleSelected,
          onSelectedAll: this.handleSelectedAll
        }
      },
      selectedAll
    };

    if (!currentSummit.id) return <div />;

    const ticketTypesOptions = [
      ...currentSummit.ticket_types.map((t) => ({ label: t.name, value: t.id }))
    ];

    const alpha = Array.from(Array(LETTERS_IN_ALPHABET)).map(
      (e, i) => i + UPPERCASE_A_IN_ASCII
    );
    const alphabet = alpha.map((x) => ({
      label: String.fromCharCode(x),
      value: String.fromCharCode(x)
    }));

    // adds 'All' option to the print type dropdown
    const badge_view_type_ddl = [
      { label: "All", value: 0 },
      ...currentSummit.badge_view_types.map((vt) => ({
        label: vt.name,
        value: vt.id
      }))
    ];

    const viewTypesOptions = [
      ...currentSummit.badge_view_types.map((vt) => ({
        label: vt.name,
        value: vt.id
      }))
    ];

    const badgeTypesOptions = [
      ...(currentSummit.badge_types?.map((t) => ({
        label: t.name,
        value: t.id
      })) ?? [])
    ];

    const ddl_columns = [
      { value: "number", label: T.translate("ticket_list.number") },
      { value: "promo_code", label: T.translate("ticket_list.promo_code") },
      { value: "bought_date", label: T.translate("ticket_list.bought_date") },
      { value: "owner_email", label: T.translate("ticket_list.owner_email") },
      {
        value: "owner_company",
        label: T.translate("ticket_list.owner_company")
      },
      { value: "status", label: T.translate("ticket_list.status") },
      {
        value: "refunded_amount",
        label: T.translate("ticket_list.refunded_amount")
      },
      {
        value: "final_amount_adjusted",
        label: T.translate("ticket_list.paid_amount_adjusted")
      },
      {
        value: "promo_code_tags",
        label: T.translate("ticket_list.promo_code_tags")
      },
      { value: "badge_type_id", label: T.translate("ticket_list.badge_type") },
      {
        value: "badge_prints_count",
        label: T.translate("ticket_list.badge_prints_count")
      },
      {
        value: "owner_first_name",
        label: T.translate("ticket_list.owner_first_name")
      },
      {
        value: "owner_last_name",
        label: T.translate("ticket_list.owner_last_name")
      }
    ];

    const filters_ddl = [
      { label: "Has Assignee?", value: "hasOwnerFilter" },
      { label: "Completed", value: "completedFilter" },
      { label: "Badge", value: "hasBadgeFilter" },
      { label: "Amount", value: "amountFilter" },
      { label: "Assignee First Name", value: "ownerFullNameStartWithFilter" },
      { label: "Assignee Last Name", value: "ownerLastNameStartWithFilter" },
      { label: "Owner Company", value: "ownerCompany" },
      { label: "View Type", value: "viewTypesFilter" },
      { label: "Ticket Type", value: "ticketTypesFilter" },
      { label: "Promo Code", value: "promocodesFilter" },
      { label: "Promo Code Tags", value: "promocodeTagsFilter" },
      { label: "Refund Requested", value: "show_refund_request_pending" },
      { label: "Printable", value: "show_printable" },
      {
        label: "Exclude Free Unassigned Tickets",
        value: "exclude_free_unassigned"
      },
      { label: "Badge Type", value: "badgeTypesFilter" }
    ];

    const showColumns = fieldNames(badge_types)
      .filter((f) => selectedColumns.includes(f.columnKey))
      .map((f2) => ({
        columnKey: f2.columnKey,
        value: T.translate(`ticket_list.${f2.value}`),
        sortable: f2.sortable,
        render: f2.render ? f2.render : (item) => item[f2.columnKey]
      }));

    columns = [...columns, ...showColumns];

    return (
      <div className="ticket-list-wrapper">
        <Breadcrumb
          data={{
            title: T.translate("ticket_list.ticket_list"),
            pathname: match.url
          }}
        />
        <div className="container">
          <h3>
            {" "}
            {T.translate("ticket_list.ticket_list")} ({totalTickets})
          </h3>
          <div className="row">
            <div className="col-md-6 search-section">
              <FreeTextSearch
                value={term}
                placeholder={T.translate(
                  "ticket_list.placeholders.search_tickets"
                )}
                onSearch={this.handleSearch}
              />
              <QrReaderInput onScan={this.handleScanQR} />
            </div>
            <div className="col-md-6 text-right" style={{ marginBottom: 20 }}>
              <div className="row">
                <div className="col-md-8">
                  <Dropdown
                    id="view_type_id"
                    placeholder={T.translate(
                      "ticket_list.placeholders.view_type"
                    )}
                    value={selectedViewType}
                    onChange={(ev) =>
                      this.setState((prevState) => ({
                        ...prevState,
                        selectedViewType: ev.target.value
                      }))
                    }
                    options={badge_view_type_ddl}
                  />
                </div>
                <div className="col-md-4 text-right">
                  <button
                    className="btn btn-primary right-space"
                    onClick={this.handleSendTickets2Print}
                    type="button"
                  >
                    {T.translate("ticket_list.print")}
                  </button>
                </div>
              </div>
              <br />
              <div className="row" />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12 buttons-wrapper">
              <button
                className="btn btn-primary"
                onClick={() => this.setState({ showIngestModal: true })}
                type="button"
              >
                {T.translate("ticket_list.ingest")}
              </button>
              <button
                className="btn btn-default"
                onClick={() => this.setState({ showImportModal: true })}
                type="button"
              >
                {T.translate("ticket_list.import")}
              </button>
              <button
                className="btn btn-default"
                onClick={this.handleExportTickets}
                type="button"
              >
                {T.translate("ticket_list.export")}
              </button>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-6">
              <OrAndFilter
                value={ticketFilters.orAndFilter}
                entity="tickets"
                onChange={(filter) =>
                  this.handleFilterChange("orAndFilter", filter)
                }
              />
            </div>
            <div className="col-md-6">
              <SelectFilterCriteria
                summitId={currentSummit.id}
                context={CONTEXT_TICKETS}
                onDelete={this.handleFilterCriteriaDelete}
                selectedFilterCriteria={selectedFilterCriteria}
                onChange={this.handleFilterCriteriaChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <Dropdown
                id="enabled_filters"
                placeholder="Enabled Filters"
                value={enabledFilters}
                onChange={this.handleFiltersChange}
                options={handleDDLSortByLabel(filters_ddl)}
                isClearable
                isMulti
              />
            </div>
          </div>
          <SaveFilterCriteria
            onSave={this.handleFilterCriteriaSave}
            selectedFilterCriteria={selectedFilterCriteria}
          />
          <div className="row filtersWrapper">
            {enabledFilters.includes("hasOwnerFilter") && (
              <div className="col-md-6">
                <SegmentedControl
                  name="hasOwnerFilter"
                  options={[
                    {
                      label: T.translate("ticket_list.all"),
                      value: null,
                      default: ticketFilters.hasOwnerFilter === null
                    },
                    {
                      label: T.translate("ticket_list.has_owner"),
                      value: "HAS_OWNER",
                      default: ticketFilters.hasOwnerFilter === "HAS_OWNER"
                    },
                    {
                      label: T.translate("ticket_list.has_no_owner"),
                      value: "HAS_NO_OWNER",
                      default: ticketFilters.hasOwnerFilter === "HAS_NO_OWNER"
                    }
                  ]}
                  setValue={(val) =>
                    this.handleFilterChange("hasOwnerFilter", val)
                  }
                  className="segmentFilter"
                />
              </div>
            )}
            {enabledFilters.includes("completedFilter") && (
              <div className="col-md-6">
                <SegmentedControl
                  name="completedFilter"
                  options={[
                    {
                      label: T.translate("ticket_list.all"),
                      value: null,
                      default: ticketFilters.completedFilter === null
                    },
                    {
                      label: T.translate("ticket_list.complete"),
                      value: "Complete",
                      default: ticketFilters.completedFilter === "Complete"
                    },
                    {
                      label: T.translate("ticket_list.incomplete"),
                      value: "Incomplete",
                      default: ticketFilters.completedFilter === "Incomplete"
                    }
                  ]}
                  setValue={(val) =>
                    this.handleFilterChange("completedFilter", val)
                  }
                  className="segmentFilter"
                />
              </div>
            )}
            {enabledFilters.includes("hasBadgeFilter") && (
              <div className="col-md-6">
                <SegmentedControl
                  name="hasBadgeFilter"
                  options={[
                    {
                      label: T.translate("ticket_list.all"),
                      value: null,
                      default: ticketFilters.hasBadgeFilter === null
                    },
                    {
                      label: T.translate("ticket_list.has_badge"),
                      value: "HAS_BADGE",
                      default: ticketFilters.hasBadgeFilter === "HAS_BADGE"
                    },
                    {
                      label: T.translate("ticket_list.has_no_badge"),
                      value: "HAS_NO_BADGE",
                      default: ticketFilters.hasBadgeFilter === "HAS_NO_BADGE"
                    }
                  ]}
                  setValue={(newValue) =>
                    this.handleFilterChange("hasBadgeFilter", newValue)
                  }
                  className="segmentFilter"
                />
              </div>
            )}
            {enabledFilters.includes("amountFilter") && (
              <div className="col-md-6">
                <SegmentedControl
                  name="amountFilter"
                  options={[
                    {
                      label: T.translate("ticket_list.all"),
                      value: null,
                      default: ticketFilters.amountFilter === null
                    },
                    {
                      label: T.translate("ticket_list.paid"),
                      value: "Paid",
                      default: ticketFilters.amountFilter === "Paid"
                    },
                    {
                      label: T.translate("ticket_list.free"),
                      value: "Free",
                      default: ticketFilters.amountFilter === "Free"
                    }
                  ]}
                  setValue={(val) =>
                    this.handleFilterChange("amountFilter", val)
                  }
                  className="segmentFilter"
                />
              </div>
            )}
            {enabledFilters.includes("ownerFullNameStartWithFilter") && (
              <div className="col-md-6">
                <Select
                  placeholder={T.translate(
                    "ticket_list.placeholders.owner_first_name"
                  )}
                  name="ownerFullNameStartWithFilter"
                  value={ticketFilters.ownerFullNameStartWithFilter}
                  onChange={(val) =>
                    this.handleFilterChange("ownerFullNameStartWithFilter", val)
                  }
                  options={alphabet}
                  isClearable
                  isMulti
                  className="dropdownFilter"
                />
              </div>
            )}
            {enabledFilters.includes("ownerLastNameStartWithFilter") && (
              <div className="col-md-6">
                <Select
                  placeholder={T.translate(
                    "ticket_list.placeholders.owner_last_name"
                  )}
                  name="ownerLastNameStartWithFilter"
                  value={ticketFilters.ownerLastNameStartWithFilter}
                  onChange={(val) =>
                    this.handleFilterChange("ownerLastNameStartWithFilter", val)
                  }
                  options={alphabet}
                  isClearable
                  isMulti
                  className="dropdownFilter"
                />
              </div>
            )}
            {enabledFilters.includes("ownerCompany") && (
              <div className="col-md-6">
                <CompanyInput
                  id="ownerCompany"
                  className="dropdownFilter"
                  value={ticketFilters.ownerCompany}
                  placeholder={T.translate(
                    "ticket_list.placeholders.owner_company"
                  )}
                  onChange={(ev) =>
                    this.handleFilterChange("ownerCompany", ev.target.value)
                  }
                  extraOptions={[{ value: "NULL", label: "TBD" }]}
                  multi
                />
              </div>
            )}
            {enabledFilters.includes("viewTypesFilter") && (
              <div className="col-md-6">
                <Select
                  placeholder={T.translate(
                    "ticket_list.placeholders.view_types"
                  )}
                  name="viewTypesFilter"
                  value={ticketFilters.viewTypesFilter}
                  onChange={(val) =>
                    this.handleFilterChange("viewTypesFilter", val)
                  }
                  options={viewTypesOptions}
                  isClearable
                  isMulti
                  className="dropdownFilter"
                />
              </div>
            )}
            {enabledFilters.includes("ticketTypesFilter") && (
              <div className="col-md-6">
                <Select
                  placeholder={T.translate(
                    "ticket_list.placeholders.ticket_types"
                  )}
                  name="ticketTypesFilter"
                  value={ticketFilters.ticketTypesFilter}
                  onChange={(val) =>
                    this.handleFilterChange("ticketTypesFilter", val)
                  }
                  options={ticketTypesOptions}
                  isClearable
                  isMulti
                  className="dropdownFilter"
                />
              </div>
            )}
            {enabledFilters.includes("promocodesFilter") && (
              <div className="col-md-6">
                <PromocodeInput
                  id="promocodesFilter"
                  value={ticketFilters.promocodesFilter}
                  onChange={(ev) =>
                    this.handleFilterChange("promocodesFilter", ev.target.value)
                  }
                  summitId={currentSummit.id}
                  className="dropdownFilter"
                  placeholder={T.translate(
                    "ticket_list.placeholders.promocodes"
                  )}
                  isClearable
                  multi
                />
              </div>
            )}
            {enabledFilters.includes("promocodeTagsFilter") && (
              <div className="col-md-6">
                <TagInput
                  id="promocodeTagsFilter"
                  value={ticketFilters.promocodeTagsFilter}
                  onChange={(ev) =>
                    this.handleFilterChange(
                      "promocodeTagsFilter",
                      ev.target.value
                    )
                  }
                  className="dropdownFilter"
                  placeholder={T.translate(
                    "ticket_list.placeholders.promocodes_tags"
                  )}
                  isClearable
                  multi
                />
              </div>
            )}
            {enabledFilters.includes("show_refund_request_pending") && (
              <div className="col-md-6">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="show_refund_request_pending"
                    checked={ticketFilters.showOnlyPendingRefundRequests}
                    onChange={(ev) =>
                      this.handleFilterChange(
                        "showOnlyPendingRefundRequests",
                        ev.target.checked
                      )
                    }
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="show_refund_request_pending"
                  >
                    {T.translate("ticket_list.show_refund_request_pending")}
                  </label>
                </div>
              </div>
            )}
            {enabledFilters.includes("show_printable") && (
              <div className="col-md-6">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="show_printable"
                    checked={ticketFilters.showOnlyPrintable}
                    onChange={(ev) =>
                      this.handleFilterChange(
                        "showOnlyPrintable",
                        ev.target.checked
                      )
                    }
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="show_printable">
                    {T.translate("ticket_list.show_printable")} &nbsp;
                    <i
                      className="fa fa-info-circle"
                      aria-hidden="true"
                      title={T.translate("ticket_list.show_printable_info")}
                    />
                  </label>
                </div>
              </div>
            )}
            {enabledFilters.includes("exclude_free_unassigned") && (
              <div className="col-md-6">
                <div className="form-check abc-checkbox">
                  <input
                    type="checkbox"
                    id="exclude_free_unassigned"
                    checked={ticketFilters.excludeFreeUnassigned}
                    onChange={(ev) =>
                      this.handleFilterChange(
                        "excludeFreeUnassigned",
                        ev.target.checked
                      )
                    }
                    className="form-check-input"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="exclude_free_unassigned"
                  >
                    {T.translate("ticket_list.exclude_free_unassigned")} &nbsp;
                  </label>
                </div>
              </div>
            )}
            {enabledFilters.includes("badgeTypesFilter") && (
              <div className="col-md-6">
                <Select
                  placeholder={T.translate(
                    "ticket_list.placeholders.badge_type"
                  )}
                  name="badgeTypesFilter"
                  value={ticketFilters.badgeTypesFilter}
                  onChange={(val) =>
                    this.handleFilterChange("badgeTypesFilter", val)
                  }
                  options={badgeTypesOptions}
                  isClearable
                  isMulti
                  className="dropdownFilter"
                />
              </div>
            )}
          </div>
          <hr />

          <div className="row" style={{ marginBottom: 15 }}>
            <div className="col-md-12">
              <label htmlFor="select_fields">
                {T.translate("ticket_list.select_fields")}
              </label>
              <Dropdown
                id="select_fields"
                placeholder={T.translate(
                  "ticket_list.placeholders.select_fields"
                )}
                value={selectedColumns}
                onChange={this.handleColumnsChange}
                options={handleDDLSortByLabel(ddl_columns)}
                isClearable
                isMulti
              />
            </div>
          </div>

          <hr />

          {tickets?.length === 0 && (
            <div>{T.translate("ticket_list.no_tickets")}</div>
          )}

          {tickets?.length > 0 && (
            <div className="ticket-list-table">
              {selectedCount > 0 && (
                <span>
                  <b>
                    {T.translate("ticket_list.items_qty", {
                      qty: selectedCount
                    })}
                  </b>
                </span>
              )}
              <SelectableTable
                options={table_options}
                data={tickets}
                columns={columns}
                onSort={this.handleSort}
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
                onSelect={this.handlePageChange}
              />
            </div>
          )}
        </div>
        <Modal
          className="modal_ingest"
          show={showIngestModal}
          onHide={() =>
            this.setState((prevState) => ({
              ...prevState,
              showIngestModal: false
            }))
          }
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {T.translate("ticket_list.ingest_tickets", {
                source: currentSummit.external_registration_feed_type
              })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                {T.translate("ticket_list.ingest_tickets_text", {
                  source: currentSummit.external_registration_feed_type
                })}
              </div>
              <br />
              <br />
              <br />
              <div className="col-md-12 ticket-ingest-email-wrapper">
                <label htmlFor="ingest_email">
                  {T.translate("ticket_list.send_email")}
                </label>
                <br />
                <input
                  id="ingest_email"
                  className="form-control"
                  ref={(node) => {
                    this.ingestEmailRef = node;
                  }}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-primary"
              onClick={this.handleIngestTickets}
              type="button"
            >
              {T.translate("ticket_list.ingest")}
            </button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showImportModal}
          onHide={() =>
            this.setState((prevState) => ({
              ...prevState,
              showImportModal: false
            }))
          }
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {T.translate("ticket_list.import_tickets")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                {T.translate("ticket_list.import_tickets_format")}
                <br />
                <b>{T.translate("ticket_list.import_tickets_id")}</b>
                {T.translate("ticket_list.import_tickets_id_text")}
                <br />
                <b>{T.translate("ticket_list.import_tickets_number")}</b>
                {T.translate("ticket_list.import_tickets_number_text")}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_attendee_email")}
                </b>
                {T.translate("ticket_list.import_tickets_attendee_email_text")}
                <br />
                <b>
                  {T.translate(
                    "ticket_list.import_tickets_attendee_first_name"
                  )}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_attendee_first_name_text"
                )}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_attendee_last_name")}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_attendee_last_name_text"
                )}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_attendee_company")}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_attendee_company_text"
                )}
                <br />
                <b>{T.translate("ticket_list.import_tickets_attendee_tags")}</b>
                {T.translate("ticket_list.import_tickets_attendee_tags_text")}
                <br />
                <b>
                  {T.translate(
                    "ticket_list.import_tickets_attendee_company_id"
                  )}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_attendee_company_id_text"
                )}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_ticket_type_name")}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_ticket_type_name_text"
                )}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_ticket_type_id")}
                </b>
                {T.translate("ticket_list.import_tickets_ticket_type_id_text")}
                <br />
                <b>{T.translate("ticket_list.import_tickets_promo_code_id")}</b>
                {T.translate("ticket_list.import_tickets_promo_code_id_text")}
                <br />
                <b>{T.translate("ticket_list.import_tickets_promo_code")}</b>
                {T.translate("ticket_list.import_tickets_promo_code_text")}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_ticket_promo_code")}
                </b>
                {T.translate(
                  "ticket_list.import_tickets_ticket_promo_code_text"
                )}
                <br />
                <b>{T.translate("ticket_list.import_tickets_badge_type_id")}</b>
                {T.translate("ticket_list.import_tickets_badge_type_id_text")}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_badge_type_name")}
                </b>
                {T.translate("ticket_list.import_tickets_badge_type_name_text")}
                <br />
                <b>
                  {T.translate("ticket_list.import_tickets_badge_features")}
                </b>
                {T.translate("ticket_list.import_tickets_badge_features_text")}
                <br />
              </div>
              <div className="col-md-12 ticket-import-upload-wrapper">
                <UploadInput
                  value={importFile && importFile.name}
                  handleUpload={(file) => this.setState({ importFile: file })}
                  handleRemove={() => this.setState({ importFile: null })}
                  className="dropzone col-md-6"
                  multiple={false}
                  accept=".csv"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              disabled={!importFile}
              className="btn btn-primary"
              onClick={this.handleImportTickets}
              type="button"
            >
              {T.translate("ticket_list.ingest")}
            </button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showPrintModal}
          onHide={() =>
            this.setState((prevState) => ({
              ...prevState,
              showPrintModal: false
            }))
          }
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {T.translate("ticket_list.print_modal_title")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                {T.translate("ticket_list.print_modal_body")}
              </div>
              <br />
              <br />
              <br />
              <div className="form-check abc-checkbox">
                <input
                  type="checkbox"
                  id="check_in"
                  checked={doCheckIn}
                  onChange={(ev) => {
                    if (!ev.target) return;
                    const doCheckIn = ev?.target?.checked || false;
                    this.setState((prevState) => ({
                      ...prevState,
                      doCheckIn
                    }));
                  }}
                  className="form-check-input"
                />
                <label className="form-check-label" htmlFor="check_in">
                  {T.translate("ticket_list.check_in")}
                </label>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-primary"
              onClick={this.handleDoPrinting}
              type="button"
            >
              {T.translate("ticket_list.print")}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ currentSummitState, currentTicketListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentTicketListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getTickets,
  ingestExternalTickets,
  importTicketsCSV,
  exportTicketsCSV,
  selectTicket,
  unSelectTicket,
  clearAllSelectedTicket,
  setSelectedAll,
  printTickets,
  getTicket,
  getBadgeTypes,
  saveFilterCriteria,
  deleteFilterCriteria
})(TicketListPage);
