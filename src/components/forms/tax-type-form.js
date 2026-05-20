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

import React from "react";
import T from "i18n-react/dist/i18n-react";
import { useFormik, FormikProvider } from "formik";
import * as yup from "yup";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import MuiFormikTextField from "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield";
import SimpleLinkList from "openstack-uicore-foundation/lib/components/simple-link-list";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import useScrollToError from "../../hooks/useScrollToError";

const validationSchema = yup.object({
  name: yup.string().required(T.translate("validation.required")),
  rate: yup
    .number()
    .typeError(T.translate("validation.number"))
    .min(0, T.translate("validation.min", { min: 0 }))
    .required(T.translate("validation.required")),
  tax_id: yup.string().required(T.translate("validation.required"))
});

const TaxTypeForm = ({
  entity: entityProp,
  currentSummit,
  onTicketLink,
  onTicketUnLink,
  onSubmit
}) => {
  const initialValues = {
    id: entityProp.id,
    name: entityProp.name || "",
    rate: entityProp.rate ?? "",
    tax_id: entityProp.tax_id || "",
    ticket_types: entityProp.ticket_types ?? []
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSubmit({ ...entityProp, ...values });
    },
    validateOnChange: false
  });

  useScrollToError(formik);

  const handleTicketLink = (value) => {
    onTicketLink(formik.values.id, value);
  };
  const handleTicketUnLink = (valueId) => {
    onTicketUnLink(formik.values.id, valueId);
  };

  const ticketColumns = [
    { columnKey: "name", value: T.translate("edit_tax_type.name") },
    {
      columnKey: "description",
      value: T.translate("edit_tax_type.description")
    }
  ];
  const ticketOptions = {
    title: T.translate("edit_tax_type.ticket_types"),
    valueKey: "name",
    labelKey: "name",
    defaultOptions: true,
    actions: {
      search: (ev, callback) =>
        queryTicketTypes(currentSummit.id, { name: ev }, callback, "v2"),
      delete: { onClick: handleTicketUnLink },
      add: { onClick: handleTicketLink }
    }
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
            <SimpleLinkList
              values={formik.values.ticket_types}
              columns={ticketColumns}
              options={ticketOptions}
            />
          </Box>
        )}
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" type="submit">
            {T.translate("general.save")}
          </Button>
        </Stack>
      </Box>
    </FormikProvider>
  );
};

export default TaxTypeForm;
