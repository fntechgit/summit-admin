/**
 * Copyright 2019 OpenStack Foundation
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
import { Modal } from "react-bootstrap";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Swal from "sweetalert2";
import { Table, Panel } from "openstack-uicore-foundation/lib/components";
import moment from "moment-timezone";
import { getSummitById } from "../../actions/summit-actions";
import {
  getTicket,
  saveTicket,
  reassignTicket,
  addBadgeToTicket,
  reSendTicketEmail,
  activateTicket,
  getTicketTypes,
  refundTicket,
  cancelRefundTicket
} from "../../actions/ticket-actions";

import TicketForm from "../../components/forms/ticket-form";
import BadgeForm from "../../components/forms/badge-form";
import {
  getBadgeFeatures,
  getBadgeTypes,
  deleteBadge,
  addFeatureToBadge,
  removeFeatureFromBadge,
  changeBadgeType,
  printBadge,
  getBadgePrints,
  exportBadgePrints,
  clearBadgePrints
} from "../../actions/badge-actions";
import AuditLogs from "../../components/audit-logs";
import Notes from "../../components/notes";
import { deleteTicket } from "../../actions/attendee-actions";
import { MILLISECONDS_IN_SECOND } from "../../utils/constants";

const EditTicketPage = ({
  entity,
  currentSummit,
  currentOrder,
  match,
  errors,
  currentBadgePrints,
  loading,
  ...props
}) => {
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundAmountError, setRefundAmountError] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRefundRejectModal, setShowRefundRejectModal] = useState(false);
  const [refundRejectNotes, setRefundRejectNotes] = useState("");
  const [printType, setPrintType] = useState(null);
  const [showSection, setShowSection] = useState("main");

  useEffect(() => {
    props.getBadgeFeatures();
    props.getBadgeTypes();
  }, []);

  useEffect(() => {
    props.getTicket(match.params.ticket_id);
  }, [match.params.ticket_id]);

  const shouldDisplayRejectRefundRequest = (id) => {
    const request = entity.refund_requests.find((r) => r.id === id);
    return request.status === "Requested";
  };

  const handleRefundChange = (ev) => {
    const val = ev.target.value;
    if (val !== "") {
      if (!/^\d*(\.\d{0,2})?$/.test(val)) return;
    }

    setRefundAmount(isNaN(val) ? 0.0 : parseFloat(val));
  };

  const handleSelectPrintType = (view_type) => {
    setPrintType(view_type);
  };

  const handlePrintBadge = (ev) => {
    ev.preventDefault();
    props.printBadge(entity.id, printType);
  };

  const handleGetBadgePrints = () => {
    props.getBadgePrints();
  };

  const handleBadgePrintQuery = (
    term,
    page,
    perPage,
    order,
    orderDir,
    filters
  ) => {
    props.getBadgePrints(term, page, perPage, order, orderDir, filters);
  };

  const handleBadgePrintExport = () => {
    const { term, order, orderDir } = currentBadgePrints;
    props.exportBadgePrints(term, order, orderDir);
  };

  const handleResendEmail = (ticket, ev) => {
    ev.preventDefault();

    if (ticket.owner.status === "Complete") {
      props.reSendTicketEmail(ticket.order_id, ticket.id);
    } else {
      Swal.fire({
        title: T.translate("edit_ticket.attendee_incomplete"),
        text: T.translate("edit_ticket.attendee_incomplete_msg"),
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        confirmButtonText: T.translate("general.yes_send")
      }).then((result) => {
        if (result.value) {
          props.reSendTicketEmail(ticket.order_id, ticket.id);
        }
      });
    }
  };

  const handleActivateDeactivate = (ticket, ev) => {
    ev.preventDefault();
    const activate = !ticket.is_active;

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: activate
        ? T.translate("edit_ticket.activate_warning")
        : T.translate("edit_ticket.deactivate_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: activate
        ? T.translate("edit_ticket.activate_yes")
        : T.translate("edit_ticket.deactivate_yes")
    }).then((result) => {
      if (result.value) {
        props.activateTicket(currentOrder.id, ticket.id, activate);
      }
    });
  };

  const handleDeleteBadge = (ticketId) => {
    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.remove_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        props.deleteBadge(ticketId);
      }
    });
  };

  const handleAddBadgeToTicket = (ev) => {
    ev.preventDefault();
    props.addBadgeToTicket(entity.id);
  };

  const handleRejectRefundRequest = () => {
    setRefundRejectNotes("");
    setShowRefundRejectModal(false);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.cancel_refund_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("edit_ticket.yes_cancel_refund")
    }).then((result) => {
      if (result.value) {
        props.cancelRefundTicket(currentOrder.id, entity.id, refundRejectNotes);
      }
    });
  };

  const handleRefundTicket = () => {
    const maxAllowedAmount2Refund =
      entity.net_selling_cost - entity.refunded_amount;

    if (refundAmount > maxAllowedAmount2Refund) {
      setRefundAmountError(true);
      return;
    }

    if (parseFloat(refundAmount) > 0) {
      setRefundAmount("");
      setRefundNotes("");
      setRefundAmountError(false);
      setShowRefundModal(false);

      Swal.fire({
        title: T.translate("general.are_you_sure"),
        text: T.translate("edit_ticket.refund_warning"),
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        confirmButtonText: T.translate("edit_ticket.yes_refund")
      }).then((result) => {
        if (result.value) {
          props.refundTicket(entity.id, parseFloat(refundAmount), refundNotes);
        }
      });
    }
  };

  const toggleSection = (section, ev) => {
    const newShowSection = showSection === section ? "main" : section;
    ev.preventDefault();

    setShowSection(newShowSection);
  };

  const twentychars = -20;
  const breadcrumb = `...${entity.number.slice(twentychars)}`;

  if (!entity || !entity.id) return <div />;
  if (entity.order_id !== currentOrder.id) return <div />;

  const taxColumnsMap = new Map();

  entity.refund_requests_taxes?.forEach((t) => {
    const columnKey = `tax_${t.tax.id}_refunded_amount`;
    if (!taxColumnsMap.has(columnKey)) {
      taxColumnsMap.set(columnKey, {
        columnKey,
        value: t.tax.name,
        render: (row, val) => val || "0"
      });
    }
  });

  const tax_columns = [...taxColumnsMap.values()];

  const refundRequestColumns = [
    { columnKey: "id", value: T.translate("edit_ticket.refund_request_id") },
    {
      columnKey: "requested_by_fullname",
      value: T.translate("edit_ticket.refund_request_requested_by")
    },
    {
      columnKey: "action_by_fullname",
      value: T.translate("edit_ticket.refund_request_action_by")
    },
    {
      columnKey: "action_date",
      value: T.translate("edit_ticket.refund_request_action_date"),
      render: (c) =>
        c.action_date
          ? moment(c.action_date * MILLISECONDS_IN_SECOND)
              .tz(currentSummit.time_zone_id)
              .format("MMMM Do YYYY, h:mm a (z)")
          : "TBD"
    },
    {
      columnKey: "status",
      value: T.translate("edit_ticket.refund_request_status")
    },
    {
      columnKey: "refunded_amount_formatted",
      value: T.translate("edit_ticket.refunded_amount")
    },
    ...tax_columns,
    {
      columnKey: "total_refunded_amount_formatted",
      value: T.translate("edit_ticket.refund_total_amount")
    },
    {
      columnKey: "notes",
      value: T.translate("edit_ticket.refund_request_notes")
    }
  ];

  const refundRequestOptions = {
    actions: {
      custom: [
        {
          name: "Reject",
          tooltip: T.translate("edit_ticket.cancel_refund"),
          icon: <i className="fa fa-ban" />,
          onClick: () => setShowRefundModal(true),
          display: shouldDisplayRejectRefundRequest
        }
      ]
    }
  };

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {T.translate("edit_ticket.ticket")}
        {entity.id !== 0 && (
          <div className="pull-right form-inline">
            {entity.status === "Paid" && (
              <button
                className="btn btn-sm btn-primary right-space"
                onClick={() => setShowRefundModal(true)}
              >
                {T.translate("edit_ticket.refund")}
              </button>
            )}
            {entity.status === "Paid" && entity.is_active && (
              <button
                className="btn btn-sm btn-primary left-space"
                onClick={(ev) => handleResendEmail(entity, ev)}
              >
                {T.translate("edit_ticket.resend_email")}
              </button>
            )}
            <button
              className={`btn btn-sm left-space ${
                entity.is_active ? "btn-danger" : "btn-primary"
              }`}
              onClick={(ev) => handleActivateDeactivate(entity, ev)}
            >
              {entity.is_active
                ? T.translate("edit_ticket.deactivate")
                : T.translate("edit_ticket.activate")}
            </button>
            <a href="new" className="btn btn-default pull-right">
              Add new
            </a>
          </div>
        )}
      </h3>
      <hr />

      <TicketForm
        history={props.history}
        currentSummit={currentSummit}
        entity={entity}
        order={currentOrder}
        errors={errors}
        onReassing={props.reassignTicket}
        onSaveTicket={props.saveTicket}
        onUnAssign={props.deleteTicket}
      />

      {entity?.refund_requests?.length > 0 && (
        <Panel
          show={showSection === "refund_requests"}
          title={T.translate("edit_ticket.refund_requests")}
          handleClick={() => toggleSection("refund_requests")}
        >
          <div>
            <div className="row">
              <div className="col-md-6">
                <label>{T.translate("edit_ticket.ticket_price")}</label>{" "}
                {`${entity.currency_symbol}${entity.raw_cost}`}
              </div>
              <div className="col-md-6">
                <label>{T.translate("edit_ticket.net_price")}</label>{" "}
                {`${entity.currency_symbol}${
                  entity.raw_cost - entity.discount
                }`}
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <label>{T.translate("edit_ticket.discount")}</label>{" "}
                {`${entity.discount_rate}% (${entity.currency_symbol}${entity.discount})`}
              </div>
            </div>
            {entity?.applied_taxes.map((at) => (
              <div className="row" key={`applied-taxes-${at.id}`}>
                <div className="col-md-6">
                  <label>
                    {T.translate("edit_ticket.tax_name_rate", {
                      tax_name: at.tax.name
                    })}
                  </label>
                  {` ${at.tax.rate}%`}
                </div>
                <div className="col-md-6">
                  <label>
                    {T.translate("edit_ticket.tax_name_price", {
                      tax_name: at.tax.name
                    })}
                  </label>
                  {` ${entity.currency_symbol}${at.amount}`}
                </div>
              </div>
            ))}
            <div className="row">
              <div className="col-md-6 col-md-offset-6">
                <label>
                  {T.translate("edit_ticket.purchase_ticket_price")}
                </label>{" "}
                {`${entity.currency_symbol}${entity.final_amount}`}
              </div>
            </div>
          </div>

          <Table
            options={refundRequestOptions}
            data={entity?.refund_requests}
            columns={refundRequestColumns}
          />

          <div className="row">
            <div className="col-md-12">
              <label>
                {T.translate(
                  "edit_ticket.adjusted_total_ticket_purchase_price"
                )}
              </label>{" "}
              {entity.adjusted_total_ticket_purchase_price_formatted}
            </div>
          </div>
        </Panel>
      )}

      {entity?.id > 0 && entity?.owner?.id > 0 && (
        <Panel
          show={showSection === "admin_notes"}
          title={T.translate("edit_ticket.admin_notes")}
          handleClick={() => toggleSection("admin_notes")}
        >
          <Notes attendeeId={entity?.owner?.id} ticketId={entity.id} />
        </Panel>
      )}
      <br />
      <br />
      <br />

      {entity.is_active && !entity.badge && (
        <button className="btn btn-primary" onClick={handleAddBadgeToTicket}>
          {T.translate("edit_ticket.add_badge")}
        </button>
      )}

      {entity.is_active && entity.badge && (
        <div>
          <h3>
            {T.translate("edit_ticket.badge")}
            <button
              className="btn btn-sm btn-danger pull-right"
              onClick={() => handleDeleteBadge(entity.id)}
            >
              {T.translate("edit_ticket.delete_badge")}
            </button>
          </h3>
          <hr />
          <BadgeForm
            history={props.history}
            currentSummit={currentSummit}
            entity={entity.badge}
            canPrint={entity.owner && entity.badge}
            selectedPrintType={printType}
            onSelectPrintType={handleSelectPrintType}
            onPrintBadge={handlePrintBadge}
            onBadgePrintQuery={handleBadgePrintQuery}
            onShowBadgePrints={handleGetBadgePrints}
            onBadgePrintExport={handleBadgePrintExport}
            clearBadgePrints={props.clearBadgePrints}
            badgePrints={currentBadgePrints}
            onTypeChange={props.changeBadgeType}
            onFeatureLink={props.addFeatureToBadge}
            onFeatureUnLink={props.removeFeatureFromBadge}
          />
        </div>
      )}
      <br />
      <Panel
        show={showSection === "audit_log"}
        title={T.translate("audit_log.title")}
        handleClick={() => toggleSection("audit_log")}
      >
        {entity.badge && (
          <AuditLogs
            entityFilter={[
              `event_id==${entity.badge.id}`,
              "class_name==SummitAttendeeBadgeAuditLog"
            ]}
            columns={["created", "action", "user"]}
          />
        )}
      </Panel>
      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("edit_ticket.refund_modal_title")}
          </Modal.Title>
          {`${T.translate("edit_ticket.net_selling_price")} ${
            entity.currency_symbol
          } ${entity.net_selling_cost}`}
        </Modal.Header>
        <Modal.Body>
          <div className="row form-group">
            <div className="col-md-12 refund-input-wrapper">
              <input
                className="form-control"
                type="number"
                min="0"
                step=".01"
                placeholder="0.00"
                value={refundAmount}
                onChange={handleRefundChange}
              />
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={T.translate("edit_ticket.refund_amount_info")}
              />
              {refundAmountError && (
                <span className="error-label">
                  {T.translate("edit_ticket.refund_amount_error")}
                </span>
              )}
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-12">
              <textarea
                className="form-control"
                id="refundNotes"
                placeholder={T.translate(
                  "edit_ticket.placeholders.refund_notes"
                )}
                value={refundNotes}
                onChange={(ev) => setRefundNotes(ev.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-primary"
            onClick={(ev) => handleRefundTicket(entity, ev)}
          >
            {T.translate("edit_ticket.refund")}
          </button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showRefundRejectModal}
        onHide={() => setShowRefundRejectModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {T.translate("edit_ticket.refund_reject_modal_title")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row form-group">
            <div className="col-md-12">
              <textarea
                className="form-control"
                id="refundRejectNotes"
                placeholder={T.translate(
                  "edit_ticket.placeholders.refund_reject_notes"
                )}
                value={refundRejectNotes}
                onChange={(ev) => setRefundRejectNotes(ev.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-primary"
            onClick={() => handleRejectRefundRequest()}
          >
            {T.translate("edit_ticket.refund_reject")}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const mapStateToProps = ({
  baseState,
  currentSummitState,
  currentPurchaseOrderState,
  currentTicketState,
  currentBadgePrintState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentOrder: currentPurchaseOrderState.entity,
  currentBadgePrints: currentBadgePrintState,
  loading: baseState.loading,
  ...currentTicketState
});

export default connect(mapStateToProps, {
  getSummitById,
  getTicket,
  saveTicket,
  reassignTicket,
  deleteBadge,
  getBadgeFeatures,
  getBadgeTypes,
  addFeatureToBadge,
  removeFeatureFromBadge,
  changeBadgeType,
  addBadgeToTicket,
  printBadge,
  getBadgePrints,
  clearBadgePrints,
  exportBadgePrints,
  reSendTicketEmail,
  activateTicket,
  refundTicket,
  cancelRefundTicket,
  getTicketTypes,
  deleteTicket
})(EditTicketPage);
