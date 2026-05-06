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

import React, { useCallback, useEffect, useState } from "react";
import T from "i18n-react/dist/i18n-react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SimpleLinkList from "openstack-uicore-foundation/lib/components/simple-link-list";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import { scrollToError, shallowEqual } from "../../utils/methods";

const TaxTypeForm = ({
  entity: entityProp,
  errors: errorsProp,
  currentSummit,
  onTicketLink,
  onTicketUnLink,
  onSubmit
}) => {
  const [entity, setEntity] = useState({ ...entityProp });
  const [errors, setErrors] = useState(errorsProp);

  useEffect(() => {
    setEntity({ ...entityProp });
    setErrors({});
  }, [entityProp.id]);

  useEffect(() => {
    const nextTicketTypes = entityProp.ticket_types ?? [];

    setEntity((prev) => {
      if (prev.id !== entityProp.id) return prev;
      if (shallowEqual(prev.ticket_types ?? [], nextTicketTypes)) return prev;

      return {
        ...prev,
        ticket_types: [...nextTicketTypes]
      };
    });
  }, [entityProp.id, entityProp.ticket_types]);

  useEffect(() => {
    scrollToError(errorsProp);
    if (!shallowEqual(errors, errorsProp)) {
      setErrors({ ...errorsProp });
    }
  }, [errorsProp]);

  const handleChange = useCallback(
    (ev) => {
      const { value, id } = ev.target;
      const newEntity = { ...entity, [id]: value };
      const newErrors = { ...errors, [id]: "" };
      setEntity(newEntity);
      setErrors(newErrors);
    },
    [entity, errors]
  );

  const handleSubmit = useCallback(
    (ev) => {
      ev.preventDefault();
      onSubmit({ ...entity });
    },
    [entity, onSubmit]
  );

  const hasErrors = useCallback(
    (field) => {
      if (field in errors) {
        return errors[field];
      }

      return "";
    },
    [errors]
  );

  const handleTicketLink = useCallback(
    (value) => {
      onTicketLink(entity.id, value);
    },
    [entity.id, onTicketLink]
  );

  const handleTicketUnLink = useCallback(
    (valueId) => {
      onTicketUnLink(entity.id, valueId);
    },
    [entity.id, onTicketUnLink]
  );

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
    <Box component="form" onSubmit={handleSubmit}>
      <input type="hidden" id="id" value={entity.id} />

      <Grid2 container spacing={2} sx={{ mb: 2 }}>
        <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            id="name"
            label={T.translate("edit_tax_type.name")}
            value={entity.name}
            onChange={handleChange}
            error={!!hasErrors("name")}
            helperText={hasErrors("name")}
            fullWidth
            required
          />
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2} sx={{ mb: 3 }}>
        <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            id="rate"
            label={T.translate("edit_tax_type.rate")}
            type="number"
            value={entity.rate}
            onChange={handleChange}
            error={!!hasErrors("rate")}
            helperText={hasErrors("rate")}
            fullWidth
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            id="tax_id"
            label={T.translate("edit_tax_type.tax_id")}
            value={entity.tax_id}
            onChange={handleChange}
            error={!!hasErrors("tax_id")}
            helperText={hasErrors("tax_id")}
            fullWidth
          />
        </Grid2>
      </Grid2>

      {entity.id !== 0 && (
        <Box sx={{ mb: 3 }}>
          <SimpleLinkList
            values={entity.ticket_types}
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
  );
};

export default TaxTypeForm;
