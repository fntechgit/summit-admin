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
 * */

import React from "react";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  PaymentRow,
  RefundRow,
  FeeRow,
  NotesRow,
  TotalRow
} from "openstack-uicore-foundation/lib/components/mui/table/extra-rows";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { mapOrderData } from "./helpers";

const OrderDetailsGrid = ({
  lines,
  notes,
  payments,
  refunds,
  fees,
  total,
  amountDue,
  withDescription = false,
  onCancelForm,
  onUndoCancelForm
}) => {
  const data = mapOrderData(lines, withDescription);

  const columns = [
    {
      columnKey: "code",
      header: T.translate("order_details_grid.code")
    },
    { columnKey: "name", header: T.translate("order_details_grid.content") },
    { columnKey: "item_name", header: "" },
    {
      columnKey: "addon_name",
      header: T.translate("order_details_grid.addon")
    },
    {
      columnKey: "discount",
      header: T.translate("order_details_grid.discount")
    },
    { columnKey: "amount", header: T.translate("order_details_grid.amount") },
    {
      columnKey: "actions",
      header: T.translate("order_details_grid.action"),
      align: "center",
      render: (row) => {
        if (row.cancelled) {
          return (
            <IconButton size="large" onClick={() => onUndoCancelForm(row)}>
              <ArrowBackIcon fontSize="large" sx={{ mr: 2 }} />{" "}
              {T.translate("general.undo").toUpperCase()}
            </IconButton>
          );
        }

        return (
          <IconButton size="large" onClick={() => onCancelForm(row)}>
            <DeleteIcon fontSize="large" />
          </IconButton>
        );
      }
    }
  ];

  return (
    <MuiTable
      data={data}
      columns={columns}
      options={{ disableProp: "cancelled" }}
    >
      {notes &&
        notes.map((note) => (
          <NotesRow
            note={note.content}
            colCount={7}
            key={`note-row-${note.id}`}
          />
        ))}
      {payments &&
        payments.map((payment) => (
          <PaymentRow
            payment={payment}
            key={`payment-row-${payment.id}`}
            trailing={1}
          />
        ))}
      {refunds &&
        refunds.map((refund) => (
          <RefundRow
            refund={refund}
            key={`refund-row-${refund.id}`}
            trailing={1}
          />
        ))}
      {fees &&
        fees.map((fee) => (
          <FeeRow fee={fee} key={`fee-row-${fee.id}`} trailing={1} />
        ))}
      <TotalRow
        columns={columns}
        total={total || amountDue}
        label={amountDue ? T.translate("order_details_grid.amount_due") : null}
        targetCol="amount"
        rowSx={{ backgroundColor: "#F1F3F5" }}
      />
    </MuiTable>
  );
};

export default OrderDetailsGrid;
