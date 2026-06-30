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

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid2 from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import { DEFAULT_PER_PAGE } from "../../utils/constants";
import useScrollToError from "../../hooks/useScrollToError";

const MAX_TAX_RATE = 100;

const validationSchema = yup.object({
  name: yup.string().required(T.translate("validation.required")),
  rate: yup
    .number()
    .typeError(T.translate("validation.number"))
    .min(0, T.translate("validation.minimum", { minimum: 0 }))
    .max(
      MAX_TAX_RATE,
      T.translate("validation.maximum", { maximum: MAX_TAX_RATE })
    )
    .test(
      "max-3-decimals",
      T.translate("validation.max_decimals", { count: 3 }),
      (v) => v == null || /^\d+(\.\d{1,3})?$/.test(String(v))
    )
    .required(T.translate("validation.required")),
  tax_id: yup.string().nullable().optional()
});

const ticketColumns = [
  { columnKey: "name", header: T.translate("edit_tax_type.name") },
  { columnKey: "description", header: T.translate("edit_tax_type.description") }
];

const TaxTypeForm = ({
  entity: entityProp,
  currentSummit,
  onTicketLink,
  onTicketUnLink,
  onSubmit,
  isSaving = false
}) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketOptions, setTicketOptions] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketTypes, setTicketTypes] = useState(entityProp.ticket_types ?? []);

  const initialValues = {
    id: entityProp.id,
    name: entityProp.name || "",
    rate: entityProp.rate ?? "",
    tax_id: entityProp.tax_id || ""
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      onSubmit({ ...entityProp, ...values });
    },
    validateOnChange: false
  });

  useScrollToError(formik);

  // queryTicketTypes is already debounced at 500ms internally
  const fetchTickets = (term) => {
    setLoadingTickets(true);
    queryTicketTypes(
      currentSummit.id,
      { name: term },
      (results) => {
        setTicketOptions(results);
        setLoadingTickets(false);
      },
      "v2"
    );
  };

  useEffect(() => {
    if (formik.values.id) fetchTickets("");
  }, [formik.values.id]);

  const linkedIds = useMemo(
    () => new Set(ticketTypes.map((t) => t.id)),
    [ticketTypes]
  );

  const filteredOptions = useMemo(
    () => ticketOptions.filter((t) => !linkedIds.has(t.id)),
    [ticketOptions, linkedIds]
  );

  const handleTicketUnLink = (ticketId) => {
    const ticket = ticketTypes.find((t) => t.id === ticketId);
    setTicketTypes((prev) => prev.filter((t) => t.id !== ticketId));
    onTicketUnLink(formik.values.id, ticketId).catch(() => {
      setTicketTypes((prev) => [...prev, ticket]);
    });
  };

  const handleAdd = () => {
    if (!selectedTicket) return;
    const ticket = selectedTicket;
    setSelectedTicket(null);
    setTicketTypes((prev) => [...prev, ticket]);
    onTicketLink(formik.values.id, ticket).catch(() => {
      setTicketTypes((prev) => prev.filter((t) => t.id !== ticket.id));
    });
  };

  return (
    <FormikProvider value={formik}>
      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        noValidate
        autoComplete="off"
      >
        <input type="hidden" name="id" value={formik.values.id} />
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
            <MuiFormikTextField
              name="name"
              label={T.translate("edit_tax_type.name")}
              required
              fullWidth
            />
          </Grid2>
        </Grid2>
        <Grid2 container spacing={2} sx={{ mb: 3 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
            <MuiFormikTextField
              name="rate"
              label={T.translate("edit_tax_type.rate")}
              type="number"
              inputProps={{ step: "0.001" }}
              fullWidth
            />
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
            <MuiFormikTextField
              name="tax_id"
              label={T.translate("edit_tax_type.tax_id")}
              fullWidth
            />
          </Grid2>
        </Grid2>
        {formik.values.id !== 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {T.translate("edit_tax_type.ticket_types")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Autocomplete
                sx={{ flex: 1 }}
                options={filteredOptions}
                value={selectedTicket}
                loading={loadingTickets}
                filterOptions={(x) => x}
                getOptionLabel={(opt) => opt.name || ""}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                onInputChange={(_, input) => fetchTickets(input)}
                onChange={(_, val) => setSelectedTicket(val)}
                renderInput={(params) => (
                  <TextField
                    {...params} // eslint-disable-line react/jsx-props-no-spreading
                    size="small"
                    placeholder={T.translate("edit_tax_type.ticket_types")}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingTickets && <CircularProgress size={20} />}
                            {params.InputProps?.endAdornment}
                          </>
                        )
                      }
                    }}
                  />
                )}
              />
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={!selectedTicket}
              >
                {T.translate("general.add")}
              </Button>
            </Box>
            {ticketTypes.length > 0 && (
              <MuiTable
                data={ticketTypes}
                columns={ticketColumns}
                totalRows={ticketTypes.length}
                perPage={ticketTypes.length || DEFAULT_PER_PAGE}
                currentPage={1}
                getName={(item) => item.name}
                onDelete={handleTicketUnLink}
                deleteDialogBody={(name) =>
                  T.translate("edit_tax_type.remove_ticket_warning", { name })
                }
                confirmButtonColor="error"
              />
            )}
          </Box>
        )}
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" type="submit" disabled={isSaving}>
            {T.translate("general.save")}
          </Button>
        </Stack>
      </Box>
    </FormikProvider>
  );
};

TaxTypeForm.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    rate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tax_id: PropTypes.string,
    ticket_types: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number }).isRequired,
  onTicketLink: PropTypes.func.isRequired,
  onTicketUnLink: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSaving: PropTypes.bool
};

TaxTypeForm.defaultProps = {
  isSaving: false
};

export default TaxTypeForm;
