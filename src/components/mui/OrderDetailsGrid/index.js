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
import {
  FeeRow,
  NotesRow,
  PaymentRow,
  RefundRow,
  DiscountRow,
  TotalRow
} from "openstack-uicore-foundation/lib/components/mui/table/extra-rows";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
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
  const showActionCol = onCancelForm && onUndoCancelForm;
  const trailingCols = showActionCol ? 1 : 0;

  const columns = [
    {
      columnKey: "code",
      header: T.translate("order_details_grid.code")
    },
    {
      columnKey: "name",
      header: T.translate("order_details_grid.contents")
    },
    {
      columnKey: "addon_name",
      header: T.translate("order_details_grid.addon")
    },
    {
      columnKey: "item_name",
      header: T.translate("order_details_grid.details")
    },
    {
      columnKey: "rate",
      header: T.translate("order_details_grid.rate")
    },
    {
      columnKey: "amount",
      header: T.translate("order_details_grid.amount")
    }
  ];

  if (showActionCol) {
    columns.push(
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
    )
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={0} sx={{ width: "100%", mb: 2 }}>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 0, boxShadow: "none" }}
        >
          <Table>
            {/* TABLE HEADER */}
            <TableHead sx={{ backgroundColor: "#EAEAEA" }}>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.columnKey} align={col.align ?? "left"}>
                    {col.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((form) => {
                const rows = form.items.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      ...(row.cancelled && {
                        color: "text.secondary",
                        textDecoration: "line-through"
                      })
                    }}
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.columnKey}
                        align={col.align ?? "left"}
                        sx={{ fontWeight: "normal" }}
                      >
                        {col.render ? (
                          col.render(row)
                        ) : (
                          <span style={{ fontWeight: "normal" }}>
                            {row[col.columnKey]}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ));

                rows.push(
                  <DiscountRow
                    discount={form.discount}
                    discountTotal={form.discount_total}
                    trailing={trailingCols}
                  />
                );

                return rows;
              })}
              {fees &&
                fees.map((fee) => (
                  <FeeRow fee={fee} key={`fee-row-${fee.id}`} trailing={1} />
                ))}
              {refunds &&
                refunds.map((refund) => (
                  <RefundRow
                    refund={refund}
                    key={`refund-row-${refund.id}`}
                    trailing={trailingCols}
                  />
                ))}
              {payments &&
                payments.map((payment) => (
                  <PaymentRow
                    payment={payment}
                    key={`payment-row-${payment.id}`}
                    trailing={trailingCols}
                  />
                ))}
              {notes &&
                notes.map((note) => (
                  <NotesRow
                    note={note.content}
                    colCount={columns.length}
                    key={`note-row-${note.id}`}
                    showCode
                  />
                ))}
              <TotalRow
                columns={columns}
                total={total || amountDue}
                label={
                  amountDue
                    ? T.translate("order_details_grid.amount_due")
                    : null
                }
                targetCol="amount"
                rowSx={{ backgroundColor: "#F1F3F5" }}
              />

              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    {T.translate("mui_table.no_items")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default OrderDetailsGrid;
