/**
 * Copyright 2017 OpenStack Foundation
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
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Dropdown,
  DateTimePicker,
  CompanyInput,
  Table
} from "openstack-uicore-foundation/lib/components";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { SegmentedControl } from "segmented-control";
import { getPurchaseOrders } from "../../actions/order-actions";
import QrReaderInput from "../../components/inputs/qr-reader-input";
import QrReader from "../../components/qr-reader";
import { getTicket } from "../../actions/ticket-actions";
import { handleDDLSortByLabel } from "../../utils/methods";
import { DATE_FILTER_ARRAY_SIZE } from "../../utils/constants";

const defaultFilters = {
  amount_paid_filter: null,
  company_filter: [],
  purchase_date_filter: Array(DATE_FILTER_ARRAY_SIZE).fill(null),
  payment_method_filter: ""
};

class PurchaseOrderListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleQRScan = this.handleQRScan.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleNewOrder = this.handleNewOrder.bind(this);
    this.handleFiltersChange = this.handleFiltersChange.bind(this);
    this.handleApplyOrdersFilters = this.handleApplyOrdersFilters.bind(this);
    this.handleExtraFilterChange = this.handleExtraFilterChange.bind(this);
    this.handleChangeDateFilter = this.handleChangeDateFilter.bind(this);
    this.handleSetAmountFilter = this.handleSetAmountFilter.bind(this);

    this.state = {
      enabledFilters: [],
      purchaseOrderFilters: defaultFilters,
      scanQr: false
    };
  }

  componentDidMount() {
    const {
      currentSummit,
      term,
      currentPage,
      perPage,
      order,
      orderDir,
      filters,
      getPurchaseOrders
    } = this.props;
    if (currentSummit) {
      getPurchaseOrders(term, currentPage, perPage, order, orderDir, filters);
    }
  }

  handleQRScan(qrCode) {
    const { currentSummit, history, getTicket } = this.props;
    console.log("CHECK QR CODE...", qrCode);
    // getTicket(btoa(qrCode)).then((data) => {
    //   history.push(
    //     `/app/summits/${currentSummit.id}/purchase-orders/${data.order_id}/tickets/${data.id}`
    //   );
    // });
  }

  handleEdit(purchaseOrderId) {
    const { currentSummit, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/purchase-orders/${purchaseOrderId}`
    );
  }

  handlePageChange(page) {
    const { term, order, orderDir, perPage, filters, getPurchaseOrders } =
      this.props;
    getPurchaseOrders(term, page, perPage, order, orderDir, filters);
  }

  handleSort(index, key, dir, func) {
    const { term, page, perPage, filters, getPurchaseOrders } = this.props;
    if (key === "name") key = "last_name";
    if (key === "company") key = "owner_company";
    getPurchaseOrders(term, page, perPage, key, dir, filters);
  }

  handleSearch(term) {
    const { order, orderDir, page, perPage, getPurchaseOrders } = this.props;
    getPurchaseOrders(term, page, perPage, order, orderDir);
  }

  handleNewOrder(ev) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/purchase-orders/new`);
  }

  handleFiltersChange(ev) {
    const { value } = ev.target;
    const { enabledFilters, purchaseOrderFilters } = this.state;
    if (value.length < enabledFilters.length) {
      if (value.length === 0) {
        this.setState((prevState) => ({
          ...prevState,
          enabledFilters: value,
          purchaseOrderFilters: defaultFilters
        }));
      } else {
        const removedFilter = enabledFilters.filter(
          (e) => !value.includes(e)
        )[0];
        const newEventFilters = {
          ...purchaseOrderFilters,
          [removedFilter]: defaultFilters[removedFilter]
        };
        this.setState((prevState) => ({
          ...prevState,
          enabledFilters: value,
          purchaseOrderFilters: newEventFilters
        }));
      }
    } else {
      this.setState((prevState) => ({
        ...prevState,
        enabledFilters: value
      }));
    }
  }

  handleApplyOrdersFilters() {
    const { order, orderDir, page, perPage, term, getPurchaseOrders } =
      this.props;
    const { purchaseOrderFilters } = this.state;
    getPurchaseOrders(
      term,
      page,
      perPage,
      order,
      orderDir,
      purchaseOrderFilters
    );
    this.setState((prevState) => ({
      ...prevState,
      selectedFilterCriteria: null
    }));
  }

  handleExtraFilterChange(ev) {
    const { purchaseOrderFilters } = this.state;
    const { value, id } = ev.target;
    this.setState((prevState) => ({
      ...prevState,
      purchaseOrderFilters: { ...purchaseOrderFilters, [id]: value }
    }));
  }

  handleChangeDateFilter(ev, lastDate) {
    const { value, id } = ev.target;
    const { purchaseOrderFilters } = this.state;
    const newDateFilter = purchaseOrderFilters[id];

    this.setState((prevState) => ({
      ...prevState,
      purchaseOrderFilters: {
        ...purchaseOrderFilters,
        [id]: lastDate
          ? [newDateFilter[0], value.unix()]
          : [value.unix(), newDateFilter[1]]
      }
    }));
  }

  handleSetAmountFilter(ev) {
    const { purchaseOrderFilters } = this.state;
    this.setState((prevState) => ({
      ...prevState,
      purchaseOrderFilters: { ...purchaseOrderFilters, amount_paid_filter: ev }
    }));
  }

  render() {
    const {
      currentSummit,
      purchaseOrders,
      lastPage,
      currentPage,
      term,
      order,
      orderDir,
      totalPurchaseOrders
    } = this.props;

    const { enabledFilters, purchaseOrderFilters, scanQr } = this.state;

    const columns = [
      {
        columnKey: "number",
        value: T.translate("purchase_order_list.number"),
        sortable: true
      },
      {
        columnKey: "owner_id",
        value: T.translate("purchase_order_list.owner_id"),
        sortable: true
      },
      {
        columnKey: "owner_name",
        value: T.translate("general.name"),
        sortable: true
      },
      {
        columnKey: "owner_email",
        value: T.translate("general.email"),
        sortable: true
      },
      {
        columnKey: "company",
        value: T.translate("purchase_order_list.company"),
        sortable: true
      },
      {
        columnKey: "bought_date",
        value: T.translate("purchase_order_list.bought_date"),
        sortable: true
      },
      {
        columnKey: "amount",
        value: T.translate("purchase_order_list.price"),
        sortable: true
      },
      {
        columnKey: "payment_method",
        value: T.translate("purchase_order_list.payment_method"),
        sortable: true
      },
      {
        columnKey: "status",
        value: T.translate("purchase_order_list.status"),
        sortable: true
      }
    ];

    const table_options = {
      sortCol: order === "last_name" ? "name" : order,
      sortDir: orderDir,
      actions: {
        edit: { onClick: this.handleEdit }
      }
    };

    const filters_ddl = [
      { label: "Amount Paid", value: "amount_paid_filter" },
      { label: "Company", value: "company_filter" },
      { label: "Purchase Date", value: "purchase_date_filter" },
      { label: "Payment Methods", value: "payment_method_filter" }
    ];

    const payment_method_ddl = [
      { label: "Online", value: "Online" },
      { label: "Offline", value: "Offline" }
    ];

    console.log("FILTERS", purchaseOrderFilters);

    if (!currentSummit.id) return <div />;

    return (
      <div className="container large">
        <h3>
          {" "}
          {T.translate("purchase_order_list.purchase_orders")} (
          {totalPurchaseOrders})
        </h3>
        <div className="row">
          <div className="col-md-6">
            <FreeTextSearch
              value={term ?? ""}
              placeholder={T.translate(
                "purchase_order_list.placeholders.search_orders"
              )}
              onSearch={this.handleSearch}
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-default"
              type="button"
              onClick={() =>
                this.setState((prevState) => ({
                  ...prevState,
                  scanQr: !prevState.scanQr
                }))
              }
            >
              {T.translate("purchase_order_list.scan_qr")}
            </button>
          </div>
          <div className="col-md-4 text-right">
            <button
              className="btn btn-primary"
              onClick={this.handleNewOrder}
              type="button"
            >
              {T.translate("purchase_order_list.add_order")}
            </button>
          </div>
        </div>
        {scanQr && (
          <div className="row">
            <QrReader onScan={this.handleQRScan} />
          </div>
        )}
        <hr />
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
          <div className="col-md-6">
            <button
              className="btn btn-primary right-space"
              onClick={this.handleApplyOrdersFilters}
              type="button"
            >
              {T.translate("purchase_order_list.apply_filters")}
            </button>
          </div>
        </div>
        <div className="row filters-row">
          {enabledFilters.includes("amount_paid_filter") && (
            <div className="col-md-6">
              <SegmentedControl
                name="amount_paid_filter"
                id="amount_paid_filter"
                options={[
                  {
                    label: "All",
                    value: null,
                    default: purchaseOrderFilters.amount_paid_filter === null
                  },
                  {
                    label: "Paid",
                    value: "paid",
                    default: purchaseOrderFilters.amount_paid_filter === "paid"
                  },
                  {
                    label: "Free",
                    value: "free",
                    default: purchaseOrderFilters.amount_paid_filter === "free"
                  }
                ]}
                setValue={(newValue) => this.handleSetAmountFilter(newValue)}
                style={{
                  width: "100%",
                  height: 40,
                  color: "#337ab7",
                  fontSize: "10px"
                }}
              />
            </div>
          )}
          {enabledFilters.includes("company_filter") && (
            <div className="col-md-6">
              <CompanyInput
                id="company_filter"
                value={purchaseOrderFilters.company_filter}
                placeholder={T.translate(
                  "purchase_order_list.placeholders.company_filter"
                )}
                onChange={this.handleExtraFilterChange}
                multi
              />
            </div>
          )}
          {enabledFilters.includes("purchase_date_filter") && (
            <>
              <div className="col-md-3">
                <DateTimePicker
                  id="purchase_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "purchase_order_list.placeholders.purchased_from"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, false)}
                  value={epochToMomentTimeZone(
                    purchaseOrderFilters.purchase_date_filter[0],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
              <div className="col-md-3">
                <DateTimePicker
                  id="purchase_date_filter"
                  format={{ date: "YYYY-MM-DD", time: "HH:mm" }}
                  inputProps={{
                    placeholder: T.translate(
                      "purchase_order_list.placeholders.purchased_to"
                    )
                  }}
                  timezone={currentSummit.time_zone.name}
                  onChange={(ev) => this.handleChangeDateFilter(ev, true)}
                  value={epochToMomentTimeZone(
                    purchaseOrderFilters.purchase_date_filter[1],
                    currentSummit.time_zone_id
                  )}
                  className="event-list-date-picker"
                />
              </div>
            </>
          )}
          {enabledFilters.includes("payment_method_filter") && (
            <div className="col-md-6">
              <Dropdown
                id="payment_method_filter"
                placeholder={T.translate(
                  "purchase_order_list.placeholders.payment_method_filter"
                )}
                value={purchaseOrderFilters.payment_method_filter}
                onChange={this.handleExtraFilterChange}
                options={payment_method_ddl}
                isClearable
                isMulti
              />
            </div>
          )}
        </div>

        {purchaseOrders.length === 0 && (
          <div>{T.translate("purchase_order_list.no_orders")}</div>
        )}

        {purchaseOrders.length > 0 && (
          <div>
            <Table
              options={table_options}
              data={purchaseOrders}
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
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentPurchaseOrderListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPurchaseOrderListState
});

export default connect(mapStateToProps, {
  getPurchaseOrders,
  getTicket
})(PurchaseOrderListPage);
