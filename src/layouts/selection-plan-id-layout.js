import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react";
import EditSelectionPlanPage from "../pages/selection-plans/edit-selection-plan-page";
import {
  getSelectionPlan,
  resetSelectionPlanForm
} from "../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../actions/marketing-actions";
import SelectionPlanExtraQuestionsLayout from "./selection-plan-extra-questions-layout";
import SelectionPlanRatingTypesLayout from "./selection-plan-rating-types-layout";
import { MAX_PER_PAGE } from "../utils/constants";

const SelectionPlanIdLayout = ({
  match,
  currentSelectionPlan,
  currentSummit,
  getSelectionPlan,
  resetSelectionPlanForm,
  getMarketingSettingsBySelectionPlan
}) => {
  const selectionPlanId = match.params.selection_plan_id;
  const breadcrumb = selectionPlanId
    ? currentSelectionPlan.name
    : T.translate("general.new");

  useEffect(() => {
    if (!selectionPlanId) {
      resetSelectionPlanForm();
    } else {
      getSelectionPlan(selectionPlanId).then(() =>
        getMarketingSettingsBySelectionPlan(
          selectionPlanId,
          null,
          1,
          MAX_PER_PAGE
        )
      );
    }
  }, [selectionPlanId]);

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Switch>
        <Route
          strict
          exact
          path={`${match.url}`}
          component={EditSelectionPlanPage}
        />
        <Route
          path={`${match.url}/extra-questions`}
          component={SelectionPlanExtraQuestionsLayout}
        />
        <Route
          path={`${match.url}/rating-types`}
          component={SelectionPlanRatingTypesLayout}
        />
        <Redirect
          to={`/app/summits/${currentSummit.id}/selection-plans/${selectionPlanId}`}
        />
      </Switch>
    </div>
  );
};

const mapStateToProps = ({
  currentSelectionPlanState,
  currentSummitState
}) => ({
  currentSelectionPlan: currentSelectionPlanState.entity,
  ...currentSummitState
});

export default connect(mapStateToProps, {
  getSelectionPlan,
  resetSelectionPlanForm,
  getMarketingSettingsBySelectionPlan
})(SelectionPlanIdLayout);
