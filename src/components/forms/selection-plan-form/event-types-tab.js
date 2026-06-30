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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import { queryEventTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { PresentationTypeClassName } from "../../../utils/constants";

function renderEventTypeInput(params) {
  const placeholder = T.translate(
    "edit_selection_plan.placeholders.event_type_search"
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <TextField {...params} size="small" placeholder={placeholder} />;
}

const eventTypesColumns = [
  { columnKey: "name", header: T.translate("edit_selection_plan.name") }
];

const EventTypesTab = ({
  hidden,
  currentSummit,
  onAddEventType,
  onDeleteEventType
}) => {
  const { values } = useFormikContext();
  const [selection, setSelection] = useState(null);
  const [searchOptions, setSearchOptions] = useState([]);

  const handleAdd = () => {
    onAddEventType(values.id, selection);
    setSelection(null);
    setSearchOptions([]);
  };

  return (
    <div role="tabpanel" id="tabpanel-event_types" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
          <Autocomplete
            size="small"
            value={selection}
            options={searchOptions}
            getOptionLabel={(opt) => opt.name ?? ""}
            filterOptions={(x) => x}
            onInputChange={(_, val) => {
              if (val)
                queryEventTypes(
                  currentSummit.id,
                  val,
                  setSearchOptions,
                  PresentationTypeClassName
                );
            }}
            onChange={(_, val) => setSelection(val)}
            renderInput={renderEventTypeInput}
            sx={{ width: 320 }}
          />
          <Button
            type="button"
            variant="outlined"
            disabled={!selection}
            onClick={handleAdd}
          >
            {T.translate("general.add")}
          </Button>
        </Box>
        {values.event_types.length === 0 && (
          <div>{T.translate("edit_selection_plan.no_event_types")}</div>
        )}
        {values.event_types.length > 0 && (
          <Table
            data={values.event_types}
            columns={eventTypesColumns}
            options={{}}
            onDelete={(id) => onDeleteEventType(values.id, id)}
            confirmButtonColor="error"
            deleteDialogBody={(name) =>
              `${T.translate(
                "edit_selection_plan.delete_confirm.event_type"
              )} ${name}`
            }
          />
        )}
      </Box>
    </div>
  );
};

EventTypesTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number.isRequired })
    .isRequired,
  onAddEventType: PropTypes.func.isRequired,
  onDeleteEventType: PropTypes.func.isRequired
};

export default EventTypesTab;
