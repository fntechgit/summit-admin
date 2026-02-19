import React, { useCallback, useMemo } from "react";
import {
  IconButton,
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
import { MILLISECONDS_IN_SECOND } from "../../../utils/constants";
import GlobalQuantityField from "./components/GlobalQuantityField";
import ItemTableField from "./components/ItemTableField";

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
  const fixedColumns = 9;
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

  const calculateTotal = (row) => {
    const qty =
      values[`i-${row.form_item_id}-c-global-f-quantity`] ||
      calculateQuantity(row);
    if (currentApplicableRate === "expired") return 0;
    return qty * row.rates[currentApplicableRate];
  };

  const hasItemFields = (row) =>
    row.meta_fields.filter((mf) => mf.class_field === "Item").length > 0;

  const totalAmount = useMemo(
    () => data.reduce((acc, row) => acc + calculateTotal(row), 0),
    [data, valuesStr]
  );

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
            <TableCell>{T.translate("edit_form.code")}</TableCell>
            <TableCell>{T.translate("edit_form.description")}</TableCell>
            <TableCell>{T.translate("edit_form.early_bird_rate")}</TableCell>
            <TableCell>{T.translate("edit_form.standard_rate")}</TableCell>
            <TableCell>{T.translate("edit_form.onsite_rate")}</TableCell>
            {extraColumns.map((exc) => (
              <TableCell key={`colhead-${exc.type_id}`}>{exc.name}</TableCell>
            ))}
            <TableCell>{T.translate("edit_form.qty")}</TableCell>
            <TableCell />
            {/* item level extra field */}
            <TableCell>{T.translate("edit_form.total")}</TableCell>
            <TableCell>{T.translate("edit_form.notes")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={`datarow-${row.form_item_id}`}>
              <TableCell>{row.code}</TableCell>
              <TableCell>
                <div>{row.name}</div>
                {hasItemFields(row) && (
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{ color: "warning.main", fontSize: "0.8rem" }}
                  >
                    <ErrorIcon
                      color="warning"
                      sx={{
                        fontSize: "1rem",
                        top: "0.2rem",
                        position: "relative"
                      }}
                    />{" "}
                    {T.translate("edit_form.additional_info")}
                  </Typography>
                )}
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
              <TableCell align="center" sx={{ width: 40 }}>
                {hasItemFields(row) && (
                  <IconButton
                    size="large"
                    onClick={() => handleEditItemFields(row)}
                  >
                    <SettingsIcon color="warning" />
                  </IconButton>
                )}
              </TableCell>
              <TableCell>
                {currencyAmountFromCents(calculateTotal(row))}
              </TableCell>
              <TableCell align="center" sx={{ width: 40 }}>
                <IconButton size="large" onClick={() => handleEdit(row)}>
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>
              {T.translate("edit_form.total_on_caps")}
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
