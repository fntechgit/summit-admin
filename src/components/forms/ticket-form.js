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

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { FormikProvider, useField, useFormik, useFormikContext } from "formik";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid2,
  InputLabel,
  Link,
  TextField,
  Typography
} from "@mui/material";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiForm from "openstack-uicore-foundation/lib/components/mui/form";
import {
  queryMembers,
  queryTicketTypes
} from "openstack-uicore-foundation/lib/utils/query-actions";
import MuiFormikAsyncAutocomplete from "../mui/formik-inputs/mui-formik-async-select";
import showConfirmDialog from "../mui/showConfirmDialog";
import CopyClipboard from "../buttons/copy-clipboard";
import { HUNDRED_PER_PAGE } from "../../utils/constants";

const BOLD_LABEL_SX = { fontWeight: "bold" };

const toTicketTypeOption = (ticketType) =>
  ticketType ? { value: String(ticketType.id), label: ticketType.name } : null;

const buildInitialValues = (entity) => ({
  ticket_type: toTicketTypeOption(entity.ticket_type),
  attendee: {
    email: entity.attendee?.email || "",
    first_name: entity.attendee?.first_name || "",
    last_name: entity.attendee?.last_name || ""
  },
  attendee_company: entity.attendee_company || ""
});

const LabeledValue = ({ label, children, size }) => (
  <Grid2 size={size}>
    <Typography component="span" sx={{ fontWeight: "bold" }}>
      {label}:
    </Typography>{" "}
    {children}
  </Grid2>
);

// a typed email is allowed; picking a member also fills name and company
const AttendeeEmailInput = () => {
  const [field, meta, helpers] = useField("attendee.email");
  const { setFieldValue } = useFormikContext();
  const [options, setOptions] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!input) {
      setLoading(false);
      return undefined;
    }
    // queryMembers doesn't cancel, so an older search can answer last
    let active = true;
    setLoading(true);
    queryMembers(input, (res) => {
      if (!active) return;
      setOptions(Array.isArray(res) ? res : []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [input]);

  const handleChange = (_ev, selected) => {
    if (selected && typeof selected === "object") {
      helpers.setValue(selected.email);
      setFieldValue("attendee.first_name", selected.first_name ?? "");
      setFieldValue("attendee.last_name", selected.last_name ?? "");
      setFieldValue("attendee_company", selected.company || "");
      return;
    }
    helpers.setValue(selected ?? "");
  };

  return (
    <Autocomplete
      id="attendee_email"
      freeSolo
      options={options}
      value={field.value}
      loading={loading}
      onChange={handleChange}
      onInputChange={(_ev, value, reason) => {
        if (reason !== "input") return;
        setInput(value);
        helpers.setValue(value);
      }}
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => option.email ?? option}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {`${option.first_name} ${option.last_name} (${option.email})`}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name="attendee.email"
          size="small"
          error={meta.touched && Boolean(meta.error)}
          helperText={meta.touched && meta.error}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

const TicketForm = ({
  entity,
  order,
  currentSummit,
  history,
  onSaveTicket,
  onReassing,
  onUnAssign
}) => {
  const [canReassign, setCanReassign] = useState(false);
  const { owner } = entity;

  const formik = useFormik({
    initialValues: buildInitialValues(entity),
    enableReinitialize: true,
    // the saved ticket reinitializes the form, which hides the save button
    onSubmit: (values) =>
      onSaveTicket(order.id, {
        ...entity,
        ticket_type: { id: Number(values.ticket_type.value) },
        attendee: values.attendee,
        attendee_company: values.attendee_company,
        attendee_email: owner?.email
      }).catch(() => {})
  });

  const ticketTypeChanged =
    !!formik.values.ticket_type &&
    formik.values.ticket_type.value !== String(entity.ticket_type?.id);

  const goTo = (path) => (ev) => {
    ev.preventDefault();
    history.push(`/app/summits/${currentSummit.id}/${path}`);
  };

  const handleAssign = () => {
    const { attendee, attendee_company, ticket_type } = formik.values;

    if (canReassign) {
      onReassing(
        entity.id,
        owner.id,
        attendee.first_name,
        attendee.last_name,
        attendee.email,
        attendee_company
      )
        .then(() => setCanReassign(false))
        .catch(() => {});
      return;
    }

    onSaveTicket(entity.order_id, {
      ...entity,
      ticket_type: ticket_type
        ? { id: Number(ticket_type.value) }
        : entity.ticket_type,
      attendee,
      attendee_company
    }).catch(() => {});
  };

  const handleUnassign = async () => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("edit_ticket.unassign_warning"),
      iconType: "warning",
      confirmButtonText: T.translate("edit_ticket.unassign_yes"),
      confirmButtonColor: "error"
    });

    if (confirmed) {
      onUnAssign(owner.id, entity.id)
        .then(() => window.location.reload())
        .catch(() => {});
    }
  };

  if (!currentSummit) return null;

  return (
    <FormikProvider value={formik}>
      <MuiForm onSubmit={formik.handleSubmit} noValidate autoComplete="off">
        {!canReassign && owner && (
          <Grid2 container spacing={2} sx={{ mb: 2 }} alignItems="center">
            <LabeledValue
              label={T.translate("edit_ticket.attendee")}
              size={{ xs: 12, md: 3 }}
            >
              <Link href="" onClick={goTo(`attendees/${owner.id}`)}>
                {entity.attendee_full_name || entity.attendee_email}
              </Link>
            </LabeledValue>
            <LabeledValue
              label={T.translate("edit_ticket.company")}
              size={{ xs: 12, md: 2 }}
            >
              {owner.company}
            </LabeledValue>
            <LabeledValue
              label={T.translate("edit_ticket.email")}
              size={{ xs: 12, md: 3 }}
            >
              <Link
                href={`mailto:${owner.email}`}
                target="_blank"
                rel="noreferrer"
              >
                {owner.email}
              </Link>
            </LabeledValue>
            {entity.is_active && (
              <Grid2 size={{ xs: 12, md: 4 }} sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCanReassign(true)}
                >
                  {T.translate("edit_ticket.reassign")}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleUnassign}
                >
                  {T.translate("edit_ticket.unassign")}
                </Button>
              </Grid2>
            )}
          </Grid2>
        )}

        {(canReassign || !owner) && (
          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <Grid2 size={{ xs: 12, md: 3 }}>
              <InputLabel sx={BOLD_LABEL_SX} htmlFor="attendee_email">
                {T.translate("edit_purchase_order.owner_email")} *
              </InputLabel>
              <AttendeeEmailInput />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 3 }}>
              <InputLabel sx={BOLD_LABEL_SX} htmlFor="attendee_first_name">
                {T.translate("edit_purchase_order.owner_first_name")} *
              </InputLabel>
              <MuiFormikTextField
                id="attendee_first_name"
                name="attendee.first_name"
                size="small"
                margin="none"
                fullWidth
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 3 }}>
              <InputLabel sx={BOLD_LABEL_SX} htmlFor="attendee_last_name">
                {T.translate("edit_purchase_order.owner_last_name")} *
              </InputLabel>
              <MuiFormikTextField
                id="attendee_last_name"
                name="attendee.last_name"
                size="small"
                margin="none"
                fullWidth
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 2 }}>
              <InputLabel sx={BOLD_LABEL_SX} htmlFor="attendee_company">
                {T.translate("edit_ticket.company")}
              </InputLabel>
              <MuiFormikTextField
                id="attendee_company"
                name="attendee_company"
                size="small"
                margin="none"
                fullWidth
              />
            </Grid2>
            <Grid2
              size={{ xs: 12, md: 1 }}
              sx={{ display: "flex", alignItems: "flex-start", pt: 3 }}
            >
              <Button variant="contained" onClick={handleAssign}>
                {T.translate("edit_ticket.assign")}
              </Button>
            </Grid2>
          </Grid2>
        )}

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <InputLabel sx={BOLD_LABEL_SX} htmlFor="ticket_type">
              {T.translate("edit_ticket.type")}
            </InputLabel>
            <MuiFormikAsyncAutocomplete
              id="ticket_type"
              name="ticket_type"
              size="small"
              placeholder={T.translate(
                "edit_ticket.placeholders.select_ticket_type"
              )}
              queryFunction={(input, callback) =>
                queryTicketTypes(
                  currentSummit.id,
                  { name: input },
                  callback,
                  "v2",
                  HUNDRED_PER_PAGE
                )
              }
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <InputLabel sx={BOLD_LABEL_SX}>
                {T.translate("edit_ticket.number")}
              </InputLabel>
              <CopyClipboard
                text={entity.number}
                tooltipText={T.translate("edit_ticket.copy_ticket_number")}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", minHeight: 40 }}>
              <Typography>{entity.number}</Typography>
            </Box>
          </Grid2>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <LabeledValue
            label={T.translate("edit_ticket.status")}
            size={{ xs: 12, md: 3 }}
          >
            {entity.status}
          </LabeledValue>
          <LabeledValue
            label={T.translate("edit_ticket.promocode")}
            size={{ xs: 12, md: 3 }}
          >
            {entity.promo_code ? (
              <Link
                href=""
                onClick={goTo(`promocodes/${entity.promo_code.id}`)}
              >
                {entity.promocode_name}
              </Link>
            ) : (
              entity.promocode_name
            )}
          </LabeledValue>
          <LabeledValue
            label={T.translate("edit_ticket.bought_date")}
            size={{ xs: 12, md: 6 }}
          >
            {entity.bought_date}
          </LabeledValue>
        </Grid2>

        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <LabeledValue
            label={T.translate("edit_ticket.paid_amount")}
            size={{ xs: 12, md: 3 }}
          >
            {entity.final_amount_formatted}
          </LabeledValue>
          <LabeledValue
            label={T.translate("edit_ticket.order_number")}
            size={{ xs: 12, md: 9 }}
          >
            <Link href="" onClick={goTo(`purchase-orders/${entity.order_id}`)}>
              {order.number}
            </Link>
          </LabeledValue>
        </Grid2>

        {entity.refunded_amount > 0.0 && (
          <Grid2 container spacing={2} sx={{ mb: 2 }}>
            <LabeledValue
              label={T.translate("edit_ticket.refund_total_amount")}
              size={12}
            >
              {entity.refunded_amount_formatted}
            </LabeledValue>
            <LabeledValue
              label={T.translate(
                "edit_ticket.adjusted_total_ticket_purchase_price"
              )}
              size={12}
            >
              {entity.adjusted_total_ticket_purchase_price_formatted}
            </LabeledValue>
          </Grid2>
        )}

        {entity.id > 0 && !canReassign && ticketTypeChanged && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {T.translate("general.save")}
            </Button>
          </Box>
        )}
      </MuiForm>
    </FormikProvider>
  );
};

TicketForm.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number,
    order_id: PropTypes.number
  }).isRequired,
  order: PropTypes.shape({
    id: PropTypes.number,
    number: PropTypes.string
  }).isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number }),
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  onSaveTicket: PropTypes.func.isRequired,
  onReassing: PropTypes.func.isRequired,
  onUnAssign: PropTypes.func.isRequired
};

TicketForm.defaultProps = {
  currentSummit: null
};

export default TicketForm;
