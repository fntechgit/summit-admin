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
import { Redirect } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Button, Grid2 } from "@mui/material";
import AddNewButton from "openstack-uicore-foundation/lib/components/mui/add-new-button";
import SelectionPlanForm from "../../components/forms/selection-plan-form";
import {
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";
import {
  DEFAULT_CURRENT_PAGE,
  MAX_PER_PAGE,
  SELECTION_PLAN_TAB_SLUGS
} from "../../utils/constants";

const EditSelectionPlanPage = ({
  currentSummit,
  entity,
  history,
  tab,
  saveSelectionPlan,
  saveSelectionPlanSettings,
  getMarketingSettingsBySelectionPlan
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const onSave = (values) => {
    if (isSaving) return Promise.resolve();
    setIsSaving(true);
    // After a create whose settings save failed, the plan is already in the
    // store while the form still carries id 0: update it, don't create another.
    const planValues = values.id ? values : { ...values, id: entity?.id ?? 0 };
    return saveSelectionPlan(planValues)
      .then((savedEntity) => {
        if (!savedEntity?.id) return null;
        return saveSelectionPlanSettings(
          values.marketing_settings ?? {},
          savedEntity.id
        )
          .then(() =>
            history.push(`/app/summits/${currentSummit.id}/selection-plans`)
          )
          .catch(() =>
            // Stay on the editor. Refetch so the ids of settings this attempt
            // did create reach the form, and a retry updates them instead of
            // re-POSTing (412).
            getMarketingSettingsBySelectionPlan(
              savedEntity.id,
              null,
              DEFAULT_CURRENT_PAGE,
              MAX_PER_PAGE
            )
          );
      })
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const onTabChange = (slug) => {
    const tabPath = slug ? `/${slug}` : "";
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${entity.id}${tabPath}`
    );
  };

  const isUnknownTab =
    tab && !Object.values(SELECTION_PLAN_TAB_SLUGS).includes(tab);
  if (isUnknownTab) {
    return (
      <Redirect
        to={`/app/summits/${currentSummit.id}/selection-plans/${entity.id}`}
      />
    );
  }

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
            <AddNewButton
              onClick={() =>
                history.push(
                  `/app/summits/${currentSummit.id}/selection-plans/new`
                )
              }
            />
          </Grid2>
        )}
      </Grid2>
      <hr />
      <SelectionPlanForm
        history={history}
        tabSlug={tab}
        onTabChange={onTabChange}
        onSave={onSave}
      />
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
  saveSelectionPlanSettings,
  getMarketingSettingsBySelectionPlan
})(EditSelectionPlanPage);
