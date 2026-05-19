import React, { Suspense, useEffect } from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import {
  getSelectionPlan,
  resetSelectionPlanForm
} from "../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../actions/marketing-actions";
import { MAX_PER_PAGE } from "../utils/constants";

const SelectionPlanExtraQuestionsLayout = React.lazy(() =>
  import("./selection-plan-extra-questions-layout")
);
const SelectionPlanRatingTypesLayout = React.lazy(() =>
  import("./selection-plan-rating-types-layout")
);

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
      <Suspense fallback={<AjaxLoader show relative size={120} />}>
        <Switch>
          <Route
            path={`${match.url}/extra-questions`}
            component={SelectionPlanExtraQuestionsLayout}
          />
          <Route
            path={`${match.url}/rating-types`}
            component={SelectionPlanRatingTypesLayout}
          />
          <Redirect to={`/app/summits/${currentSummit.id}/selection-plans`} />
        </Switch>
      </Suspense>
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
