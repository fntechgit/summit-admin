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
import Grid2 from "@mui/material/Grid2";
import Many2ManyDropDown from "../../inputs/many-2-many-dropdown";
import { querySummitProgressFlags } from "../../../actions/track-chair-actions";

const actionTypesColumns = [
  { columnKey: "label", header: T.translate("progress_flags.label") }
];

const PresentationActionTypesTab = ({
  hidden,
  currentSummit,
  actionTypesOrder,
  actionTypesOrderDir,
  onAssignProgressFlag2SelectionPlan,
  onUnassignProgressFlag,
  onUpdateProgressFlagOrder
}) => {
  const { values } = useFormikContext();

  const fetchOptions = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    return querySummitProgressFlags(currentSummit.id, input, callback);
  };

  const handleLink = (progressFlag) => {
    onAssignProgressFlag2SelectionPlan(
      currentSummit.id,
      values.id,
      progressFlag.id
    );
  };

  return (
    <div
      role="tabpanel"
      id="tabpanel-presentation_action_types"
      hidden={hidden}
    >
      <Box sx={{ pt: 2 }}>
        <Grid2 container spacing={2} sx={{ mb: 2 }}>
          <Grid2 size={{ xs: 12, md: 9 }}>
            <Many2ManyDropDown
              id="addAllowedPresentationActionType"
              isClearable
              CSSClass=""
              placeholder={T.translate(
                "edit_selection_plan.placeholders.link_presentation_action_type"
              )}
              fetchOptions={fetchOptions}
              onAdd={handleLink}
            />
          </Grid2>
        </Grid2>
        {values.allowed_presentation_action_types.length === 0 && (
          <div>
            {T.translate("edit_selection_plan.no_presentation_action_types")}
          </div>
        )}
        {values.allowed_presentation_action_types.length > 0 && (
          <SortableTable
            options={{
              sortCol: actionTypesOrder,
              sortDir: actionTypesOrderDir
            }}
            data={values.allowed_presentation_action_types}
            columns={actionTypesColumns}
            onReorder={onUpdateProgressFlagOrder}
            updateOrderKey="order"
            onDelete={onUnassignProgressFlag}
            confirmButtonColor="error"
          />
        )}
      </Box>
    </div>
  );
};

PresentationActionTypesTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  currentSummit: PropTypes.shape({ id: PropTypes.number.isRequired })
    .isRequired,
  actionTypesOrder: PropTypes.string.isRequired,
  actionTypesOrderDir: PropTypes.number.isRequired,
  onAssignProgressFlag2SelectionPlan: PropTypes.func.isRequired,
  onUnassignProgressFlag: PropTypes.func.isRequired,
  onUpdateProgressFlagOrder: PropTypes.func.isRequired
};

export default PresentationActionTypesTab;
