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
import { queryTrackGroups } from "openstack-uicore-foundation/lib/utils/query-actions";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { stripTags } from "../../../utils/methods";

const trackGroupsColumns = [
  { columnKey: "name", header: T.translate("edit_selection_plan.name") },
  {
    columnKey: "description",
    header: T.translate("edit_selection_plan.description")
  }
];

// Regular function declaration: eslint-disable-next-line must precede the line with {...params}
function renderTrackGroupInput(params) {
  const placeholder = T.translate(
    "edit_selection_plan.placeholders.track_groups_search"
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <TextField {...params} size="small" placeholder={placeholder} />;
}

const TrackGroupsTab = ({
  hidden,
  currentSummit,
  onTrackGroupLink,
  onTrackGroupUnLink
}) => {
  const { values } = useFormikContext();
  const [selection, setSelection] = useState(null);
  const [searchOptions, setSearchOptions] = useState([]);

  const handleLink = () => {
    onTrackGroupLink(values.id, selection);
    setSelection(null);
    setSearchOptions([]);
  };

  return (
    <div role="tabpanel" id="tabpanel-track_groups" hidden={hidden}>
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
                queryTrackGroups(currentSummit.id, val, setSearchOptions);
            }}
            onChange={(_, val) => setSelection(val)}
            renderInput={renderTrackGroupInput}
            sx={{ width: 320 }}
          />
          <Button
            type="button"
            variant="outlined"
            disabled={!selection}
            onClick={handleLink}
          >
            {T.translate("general.add")}
          </Button>
        </Box>
        {values.track_groups.length === 0 && (
          <div>{T.translate("edit_selection_plan.no_track_groups")}</div>
        )}
        {values.track_groups.length > 0 && (
          <Table
            data={values.track_groups.map((tg) => ({
              ...tg,
              description: stripTags(tg.description ?? "")
            }))}
            columns={trackGroupsColumns}
            options={{}}
            onDelete={(id) => onTrackGroupUnLink(values.id, id)}
            confirmButtonColor="error"
            deleteDialogBody={(name) =>
              `${T.translate(
                "edit_selection_plan.delete_confirm.track_group"
              )} ${name}`
            }
          />
        )}
      </Box>
    </div>
  );
};

TrackGroupsTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number.isRequired })
    .isRequired,
  onTrackGroupLink: PropTypes.func.isRequired,
  onTrackGroupUnLink: PropTypes.func.isRequired
};

export default TrackGroupsTab;
