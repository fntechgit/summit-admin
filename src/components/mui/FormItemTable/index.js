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

import React, { useCallback, useMemo } from "react";
import {
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import ErrorIcon from "@mui/icons-material/Error";
import T from "i18n-react/dist/i18n-react";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  DISCOUNT_TYPES,
  MILLISECONDS_IN_SECOND,
  ONE_HUNDRED
} from "../../../utils/constants";
import GlobalQuantityField from "./components/GlobalQuantityField";
import ItemTableField from "./components/ItemTableField";
import MuiFormikSelect from "../formik-inputs/mui-formik-select";
import MuiFormikPriceField from "../formik-inputs/mui-formik-pricefield";
import MuiFormikDiscountField from "../formik-inputs/mui-formik-discountfield";

const FormItemTable = ({
  data,
  rateDates,
  timeZone,
  values,
  onNotesClick,
  onSettingsClick
}) => {
  const valuesStr = JSON.stringify(values);
  const extraColumns =
    data[0]?.meta_fields?.filter((mf) => mf.class_field === "Form") || [];
  const fixedColumns = 10;
  const totalColumns = extraColumns.length + fixedColumns;

  const currentApplicableRate = useMemo(() => {
    const now = epochToMomentTimeZone(
      Math.floor(new Date() / MILLISECONDS_IN_SECOND),
      timeZone
    );

    const earlyBirdEndOfDay = epochToMomentTimeZone(
      rateDates.early_bird_end_date,
      timeZone
    )?.endOf("day");
    const standardEndOfDay = epochToMomentTimeZone(
      rateDates.standard_price_end_date,
      timeZone
    )?.endOf("day");
    const onsiteEndOfDay = epochToMomentTimeZone(
      rateDates.onsite_price_end_date,
      timeZone
    )?.endOf("day");

    if (earlyBirdEndOfDay && now.isSameOrBefore(earlyBirdEndOfDay))
      return "early_bird";
    if (standardEndOfDay && now.isSameOrBefore(standardEndOfDay))
      return "standard";
    if (!onsiteEndOfDay || now.isSameOrBefore(onsiteEndOfDay)) return "onsite";
    return "expired";
  }, [rateDates, timeZone]);

  const calculateQuantity = useCallback(
    (row) => {
      const qtyEXC = extraColumns.filter((exc) => exc.type === "Quantity");
      return qtyEXC.reduce((res, exc) => {
        const start = res > 0 ? res : 1;
        return (
          start *
          (values?.[
            `i-${row.form_item_id}-c-${exc.class_field}-f-${exc.type_id}`
          ] || 0)
        );
      }, 0);
    },
    [valuesStr]
  );

  const calculateRowTotal = (row) => {
    const qty =
      values[`i-${row.form_item_id}-c-global-f-quantity`] ||
      calculateQuantity(row);
    if (currentApplicableRate === "expired") return 0;
    const customRate = values[`i-${row.form_item_id}-c-global-f-custom_rate`];
    const rate = customRate || row.rates[currentApplicableRate];
    return qty * rate;
  };

  const hasItemFields = (row) =>
    row.meta_fields.filter((mf) => mf.class_field === "Item").length > 0;

  const totalAmount = useMemo(() => {
    const subtotal = data.reduce((acc, row) => acc + calculateRowTotal(row), 0);
    const discount =
      values.discount_type === DISCOUNT_TYPES.AMOUNT
        ? values.discount_amount
        : subtotal * (values.discount_amount / ONE_HUNDRED / ONE_HUNDRED); // bps to fraction

    return subtotal - Math.round(discount);
  }, [data, valuesStr]);

  const handleEdit = (row) => {
    onNotesClick(row);
  };

  const handleEditItemFields = (row) => {
    onSettingsClick(row);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#EAEDF4" }}>
            <TableCell>
              {T.translate("edit_sponsor.cart_tab.edit_form.code")}
            </TableCell>
            <TableCell>
              {T.translate("edit_sponsor.cart_tab.edit_form.description")}
            </TableCell>
            <TableCell sx={{ minWidth: 80 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.custom_rate")}
            </TableCell>
            <TableCell>
              {T.translate("edit_sponsor.cart_tab.edit_form.early_bird_rate")}
            </TableCell>
            <TableCell>
              {T.translate("edit_sponsor.cart_tab.edit_form.standard_rate")}
            </TableCell>
            <TableCell>
              {T.translate("edit_sponsor.cart_tab.edit_form.onsite_rate")}
            </TableCell>
            {extraColumns.map((exc) => (
              <TableCell key={`colhead-${exc.type_id}`}>{exc.name}</TableCell>
            ))}
            <TableCell sx={{ minWidth: 120 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.qty")}
            </TableCell>
            <TableCell sx={{ minWidth: 40 }} />
            {/* item level extra field */}
            <TableCell sx={{ minWidth: 120 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.total")}
            </TableCell>
            <TableCell sx={{ minWidth: 120 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.notes")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={`datarow-${row.form_item_id}`}>
              <TableCell>{row.code}</TableCell>
              <TableCell sx={{ position: "relative" }}>
                <div>{row.name}</div>
                {hasItemFields(row) && (
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{
                      color: "warning.main",
                      fontSize: "0.6em",
                      position: "absolute"
                    }}
                  >
                    <ErrorIcon
                      color="warning"
                      sx={{
                        fontSize: "1.4em",
                        top: "0.2em",
                        position: "relative"
                      }}
                    />{" "}
                    {T.translate(
                      "edit_sponsor.cart_tab.edit_form.additional_info"
                    )}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <MuiFormikPriceField
                  name={`i-${row.form_item_id}-c-global-f-custom_rate`}
                  fullWidth
                  label=""
                  size="small"
                  inCents
                  inputProps={{ step: 1 }}
                />
              </TableCell>
              <TableCell
                sx={{
                  opacity: currentApplicableRate === "early_bird" ? 1 : "38%"
                }}
              >
                {currencyAmountFromCents(row.rates.early_bird)}
              </TableCell>
              <TableCell
                sx={{
                  opacity: currentApplicableRate === "standard" ? 1 : "38%"
                }}
              >
                {currencyAmountFromCents(row.rates.standard)}
              </TableCell>
              <TableCell
                sx={{ opacity: currentApplicableRate === "onsite" ? 1 : "38%" }}
              >
                {currencyAmountFromCents(row.rates.onsite)}
              </TableCell>
              {extraColumns.map((exc) => (
                <TableCell key={`datacell-${row.form_item_id}-${exc.type_id}`}>
                  <ItemTableField
                    field={exc}
                    rowId={row.form_item_id}
                    timeZone={timeZone}
                  />
                </TableCell>
              ))}
              <TableCell>
                <GlobalQuantityField
                  row={row}
                  extraColumns={extraColumns}
                  value={calculateQuantity(row)}
                />
              </TableCell>
              <TableCell align="center">
                {hasItemFields(row) && (
                  <IconButton
                    size="small"
                    onClick={() => handleEditItemFields(row)}
                  >
                    <SettingsIcon fontSize="large" color="warning" />
                  </IconButton>
                )}
              </TableCell>
              <TableCell>
                {currencyAmountFromCents(calculateRowTotal(row))}
              </TableCell>
              <TableCell align="center">
                <IconButton size="large" onClick={() => handleEdit(row)}>
                  <EditIcon fontSize="large" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.discount")}
            </TableCell>
            {/* eslint-disable-next-line */}
            {new Array(totalColumns - 5).fill(0).map((_, i) => (
              <TableCell
                // eslint-disable-next-line
                key={`${i}-discountcell`}
              />
            ))}
            <TableCell>
              <MuiFormikSelect name="discount_type" label="" size="small">
                {Object.values(DISCOUNT_TYPES).map((p) => (
                  <MenuItem key={`ddopt-${p}`} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </MuiFormikSelect>
            </TableCell>
            <TableCell />
            <TableCell>
              <MuiFormikDiscountField
                name="discount_amount"
                discountType={values.discount_type}
                fullWidth
                label=""
                size="small"
                inCents
              />
            </TableCell>
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>
              {T.translate("edit_sponsor.cart_tab.edit_form.total_on_caps")}
            </TableCell>
            {/* eslint-disable-next-line */}
            {new Array(totalColumns - 3).fill(0).map((_, i) => (
              <TableCell
                // eslint-disable-next-line
                key={`${i}-totalcell`}
              />
            ))}
            <TableCell sx={{ fontWeight: 500 }}>
              {currencyAmountFromCents(totalAmount)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FormItemTable;
