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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import moment from "moment-timezone";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid2,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import AddNewButton from "openstack-uicore-foundation/lib/components/mui/add-new-button";
import { useSnackbarMessage } from "openstack-uicore-foundation/lib/components/mui/snackbar-notification";
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
import NotesPanel from "../../components/notes/notes-panel";
import showConfirmDialog from "../../components/mui/showConfirmDialog";
import RefundTicketDialog from "./components/refund-ticket-dialog";
import RejectRefundDialog from "./components/reject-refund-dialog";
import { deleteTicket } from "../../actions/attendee-actions";
import { MILLISECONDS_IN_SECOND } from "../../utils/constants";

const CollapsibleSection = ({ title, expanded, onToggle, children }) => (
  <Accordion expanded={expanded} onChange={onToggle} sx={{ mb: 2 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography sx={{ fontWeight: "bold" }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const LabeledValue = ({
  label,
  children,
  size = { xs: 12, md: 6 },
  offset
}) => (
  <Grid2 size={size} offset={offset}>
    <Typography component="span" sx={{ fontWeight: "bold" }}>
      {label}
    </Typography>{" "}
    {children}
  </Grid2>
);

const EditTicketPage = ({
  entity,
  currentSummit,
  currentOrder,
  match,
  currentBadgePrints,
  loading,
  ...props
}) => {
  const { errorMessage } = useSnackbarMessage();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRefundRejectModal, setShowRefundRejectModal] = useState(false);
  const [printType, setPrintType] = useState(null);
  const [openSections, setOpenSections] = useState({
    refund_requests: false,
    admin_notes: false,
    audit_log: false
  });

  useEffect(() => {
    props.getBadgeFeatures();
    props.getBadgeTypes().catch(() => {});
  }, []);

  useEffect(() => {
    props.getTicket(match.params.ticket_id).catch(() => {});
  }, [match.params.ticket_id]);

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

    if (!ticket.owner) {
      errorMessage(T.translate("edit_ticket.no_attendee"));
      return;
    }

    if (ticket.owner.status === "Complete") {
      props.reSendTicketEmail(ticket.order_id, ticket.id).catch(() => {});
    } else {
      showConfirmDialog({
        title: T.translate("edit_ticket.attendee_incomplete"),
        text: T.translate("edit_ticket.attendee_incomplete_msg"),
        iconType: "warning",
        confirmButtonText: T.translate("general.yes_send")
      }).then((confirmed) => {
        if (confirmed) {
          props.reSendTicketEmail(ticket.order_id, ticket.id).catch(() => {});
        }
      });
    }
  };

  const handleActivateDeactivate = (ticket, ev) => {
    ev.preventDefault();
    const activate = !ticket.is_active;

    showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: activate
        ? T.translate("edit_ticket.activate_warning")
        : T.translate("edit_ticket.deactivate_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: activate
        ? T.translate("edit_ticket.activate_yes")
        : T.translate("edit_ticket.deactivate_yes")
    }).then((confirmed) => {
      if (confirmed) {
        props
          .activateTicket(currentOrder.id, ticket.id, activate)
          .catch(() => {});
      }
    });
  };

  const handleDeleteBadge = (ticketId) => {
    showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.remove_warning"),
      iconType: "warning",
      confirmButtonColor: "error",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((confirmed) => {
      if (confirmed) {
        props.deleteBadge(ticketId).catch(() => {});
      }
    });
  };

  const handleAddBadgeToTicket = (ev) => {
    ev.preventDefault();
    props.addBadgeToTicket(entity.id).catch(() => {});
  };

  // the ticket reducer ignores the reassign response, so refetch the new owner
  const handleReassignTicket = (...args) =>
    props.reassignTicket(...args).then(() => {
      props.getTicket(entity.id).catch(() => {});
    });

  // the dialogs confirm and close themselves
  const handleRejectRefundRequest = (notes) =>
    props.cancelRefundTicket(currentOrder.id, entity.id, notes);

  const handleRefundTicket = (amount, notes) =>
    props.refundTicket(entity.id, amount, notes);

  const toggleSection = (section, ev) => {
    ev?.preventDefault();
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenNotes = () => {
    setOpenSections((prev) =>
      prev.admin_notes ? prev : { ...prev, admin_notes: true }
    );
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
        header: t.tax.name,
        render: (row) => row[columnKey] || "0"
      });
    }
  });

  const tax_columns = [...taxColumnsMap.values()];

  const refundRequestColumns = [
    { columnKey: "id", header: T.translate("edit_ticket.refund_request_id") },
    {
      columnKey: "requested_by_fullname",
      header: T.translate("edit_ticket.refund_request_requested_by")
    },
    {
      columnKey: "action_by_fullname",
      header: T.translate("edit_ticket.refund_request_action_by")
    },
    {
      columnKey: "action_date",
      header: T.translate("edit_ticket.refund_request_action_date"),
      render: (c) =>
        c.action_date
          ? moment(c.action_date * MILLISECONDS_IN_SECOND)
              .tz(currentSummit.time_zone_id)
              .format("MMMM Do YYYY, h:mm a (z)")
          : "TBD"
    },
    {
      columnKey: "status",
      header: T.translate("edit_ticket.refund_request_status")
    },
    {
      columnKey: "refunded_amount_formatted",
      header: T.translate("edit_ticket.refunded_amount")
    },
    ...tax_columns,
    {
      columnKey: "total_refunded_amount_formatted",
      header: T.translate("edit_ticket.refund_total_amount")
    },
    {
      columnKey: "notes",
      header: T.translate("edit_ticket.refund_request_notes")
    },
    {
      columnKey: "reject",
      header: "",
      render: (row) =>
        row.status === "Requested" && (
          <Tooltip title={T.translate("edit_ticket.cancel_refund")}>
            <IconButton
              aria-label={T.translate("edit_ticket.cancel_refund")}
              size="small"
              onClick={() => setShowRefundRejectModal(true)}
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
    }
  ];

  const ticketsUrl = match.url.substring(0, match.url.lastIndexOf("/"));

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>{T.translate("edit_ticket.ticket")}</h3>
        {entity.id !== 0 && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {entity.status === "Paid" && (
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowRefundModal(true)}
              >
                {T.translate("edit_ticket.refund")}
              </Button>
            )}
            {entity.status === "Paid" && entity.is_active && (
              <Button
                variant="contained"
                size="small"
                onClick={(ev) => handleResendEmail(entity, ev)}
              >
                {T.translate("edit_ticket.resend_email")}
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              color={entity.is_active ? "error" : "primary"}
              onClick={(ev) => handleActivateDeactivate(entity, ev)}
            >
              {entity.is_active
                ? T.translate("edit_ticket.deactivate")
                : T.translate("edit_ticket.activate")}
            </Button>
            <AddNewButton
              onClick={() => props.history.push(`${ticketsUrl}/new`)}
            />
          </Box>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      <TicketForm
        history={props.history}
        currentSummit={currentSummit}
        entity={entity}
        order={currentOrder}
        onReassing={handleReassignTicket}
        onSaveTicket={props.saveTicket}
        onUnAssign={props.deleteTicket}
      />

      {entity?.refund_requests?.length > 0 && (
        <CollapsibleSection
          title={T.translate("edit_ticket.refund_requests")}
          expanded={openSections.refund_requests}
          onToggle={() => toggleSection("refund_requests")}
        >
          <Grid2 container rowSpacing={1} columnSpacing={2} sx={{ mb: 2 }}>
            <LabeledValue label={T.translate("edit_ticket.ticket_price")}>
              {`${entity.currency_symbol}${entity.raw_cost}`}
            </LabeledValue>
            <LabeledValue label={T.translate("edit_ticket.net_price")}>
              {`${entity.currency_symbol}${entity.raw_cost - entity.discount}`}
            </LabeledValue>
            <LabeledValue label={T.translate("edit_ticket.discount")} size={12}>
              {`${entity.discount_rate}% (${entity.currency_symbol}${entity.discount})`}
            </LabeledValue>
            {entity?.applied_taxes.map((at) => (
              <React.Fragment key={`applied-taxes-${at.id}`}>
                <LabeledValue
                  label={T.translate("edit_ticket.tax_name_rate", {
                    tax_name: at.tax.name
                  })}
                >
                  {`${at.tax.rate}%`}
                </LabeledValue>
                <LabeledValue
                  label={T.translate("edit_ticket.tax_name_price", {
                    tax_name: at.tax.name
                  })}
                >
                  {`${entity.currency_symbol}${at.amount}`}
                </LabeledValue>
              </React.Fragment>
            ))}
            <LabeledValue
              label={T.translate("edit_ticket.purchase_ticket_price")}
              offset={{ md: 6 }}
            >
              {`${entity.currency_symbol}${entity.final_amount}`}
            </LabeledValue>
          </Grid2>

          <MuiTable
            data={entity?.refund_requests}
            columns={refundRequestColumns}
          />

          <Grid2 container>
            <LabeledValue
              label={T.translate(
                "edit_ticket.adjusted_total_ticket_purchase_price"
              )}
              size={12}
            >
              {entity.adjusted_total_ticket_purchase_price_formatted}
            </LabeledValue>
          </Grid2>
        </CollapsibleSection>
      )}

      {entity?.id && entity?.owner?.id && (
        <NotesPanel
          key={`${entity.owner.id}-${entity.id}`}
          attendeeId={entity?.owner?.id}
          ticketId={entity.id}
          open={openSections.admin_notes}
          onToggle={(ev) => toggleSection("admin_notes", ev)}
          onOpen={handleOpenNotes}
        />
      )}

      {entity.is_active && !entity.badge && (
        <Box sx={{ my: 3 }}>
          <Button variant="contained" onClick={handleAddBadgeToTicket}>
            {T.translate("edit_ticket.add_badge")}
          </Button>
        </Box>
      )}

      {entity.is_active && entity.badge && (
        <Box sx={{ my: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <h3>{T.translate("edit_ticket.badge")}</h3>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDeleteBadge(entity.id)}
            >
              {T.translate("edit_ticket.delete_badge")}
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
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
        </Box>
      )}

      <CollapsibleSection
        title={T.translate("audit_log.title")}
        expanded={openSections.audit_log}
        onToggle={() => toggleSection("audit_log")}
      >
        {entity.badge && (
          <AuditLogs
            filterId="badge"
            entityFilter={[
              `event_id==${entity.badge.id}`,
              "class_name==SummitAttendeeBadge"
            ]}
            columns={["created", "action_description", "user"]}
          />
        )}
      </CollapsibleSection>

      {showRefundModal && (
        <RefundTicketDialog
          currencySymbol={entity.currency_symbol}
          netSellingCost={entity.net_selling_cost}
          refundedAmount={entity.refunded_amount}
          onRefund={handleRefundTicket}
          onClose={() => setShowRefundModal(false)}
        />
      )}

      {showRefundRejectModal && (
        <RejectRefundDialog
          onReject={handleRejectRefundRequest}
          onClose={() => setShowRefundRejectModal(false)}
        />
      )}
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
