/**
 * Copyright 2018 OpenStack Foundation
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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Button, Grid2 } from "@mui/material";
import AddNewButtonMui from "../../components/buttons/add-new-button-mui";
import SelectionPlanForm from "../../components/forms/selection-plan-form";
import {
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../actions/selection-plan-actions";

const EditSelectionPlanPage = ({
  currentSummit,
  entity,
  history,
  saveSelectionPlan,
  saveSelectionPlanSettings
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const onSave = (values) => {
    if (isSaving) return Promise.resolve();
    setIsSaving(true);
    return saveSelectionPlan(values)
      .then((savedEntity) => {
        if (!savedEntity?.id) return null;
        return saveSelectionPlanSettings(
          values.marketing_settings ?? {},
          savedEntity.id
        )
          .catch(() => {})
          .then(() =>
            history.push(`/app/summits/${currentSummit.id}/selection-plans`)
          );
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const title = entity?.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  return (
    <div className="container">
      <Grid2
        container
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Grid2>
          <h3>
            {title} {T.translate("edit_selection_plan.selection_plan")}
          </h3>
        </Grid2>
        {entity?.id > 0 && (
          <Grid2>
            <AddNewButtonMui entity={entity} />
          </Grid2>
        )}
      </Grid2>
      <hr />
      <SelectionPlanForm history={history} onSave={onSave} />
      <Grid2
        size={12}
        sx={{ p: 3, pt: 0, display: "flex", justifyContent: "flex-end" }}
      >
        <Button
          type="submit"
          form="selection-plan-form"
          variant="contained"
          disabled={isSaving}
        >
          {T.translate("general.save")}
        </Button>
      </Grid2>
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSelectionPlanState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  entity: currentSelectionPlanState.entity
});

export default connect(mapStateToProps, {
  saveSelectionPlan,
  saveSelectionPlanSettings
})(EditSelectionPlanPage);
