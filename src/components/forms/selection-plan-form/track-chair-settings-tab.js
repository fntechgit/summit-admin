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

import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import SortableTable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

const ratingTypesColumns = [
  { columnKey: "name", header: T.translate("rating_type_list.name") },
  { columnKey: "weight", header: T.translate("rating_type_list.weight") }
];

const TrackChairSettingsTab = ({
  hidden,
  onAddRatingType,
  onEditRatingType,
  onDeleteRatingType,
  onUpdateRatingTypeOrder
}) => {
  const { values, setFieldValue } = useFormikContext();

  const handleChange = (ev) => setFieldValue(ev.target.id, ev.target.checked);

  return (
    <div role="tabpanel" id="tabpanel-track_chair_settings" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              id="allow_track_change_requests"
              checked={values.allow_track_change_requests}
              onChange={handleChange}
            />
          }
          label={T.translate("track_chair_settings.allow_change_requests")}
        />
        <hr />
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button type="button" variant="contained" onClick={onAddRatingType}>
            {T.translate("track_chair_settings.add_rating_type")}
          </Button>
        </Box>
        <SortableTable
          options={{}}
          data={values.track_chair_rating_types}
          columns={ratingTypesColumns}
          onReorder={onUpdateRatingTypeOrder}
          updateOrderKey="order"
          onEdit={(item) => onEditRatingType(item.id)}
          onDelete={onDeleteRatingType}
          confirmButtonColor="error"
        />
      </Box>
    </div>
  );
};

TrackChairSettingsTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onAddRatingType: PropTypes.func.isRequired,
  onEditRatingType: PropTypes.func.isRequired,
  onDeleteRatingType: PropTypes.func.isRequired,
  onUpdateRatingTypeOrder: PropTypes.func.isRequired
};

export default TrackChairSettingsTab;
