import React, { Suspense, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import NoMatchPage from "../pages/no-match-page";
import {
  getSelectionPlan,
  resetSelectionPlanForm
} from "../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../actions/marketing-actions";
import { MAX_PER_PAGE } from "../utils/constants";

const EditSelectionPlanPage = React.lazy(() =>
  import("../pages/selection-plans/edit-selection-plan-page")
);
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const selectionPlanId = match.params.selection_plan_id;
  const breadcrumb = selectionPlanId
    ? currentSelectionPlan.name
    : T.translate("general.new");

  useEffect(() => {
    // Set on cleanup (param change / unmount): getSelectionPlan resolves even
    // when superseded, so a stale effect must not chain the settings fetch.
    let ignore = false;
    setHasLoaded(false);
    setHasError(false);
    if (!selectionPlanId) {
      resetSelectionPlanForm();
      setHasLoaded(true);
    } else {
      getSelectionPlan(selectionPlanId)
        .then(() =>
          ignore
            ? null
            : getMarketingSettingsBySelectionPlan(
                selectionPlanId,
                null,
                1,
                MAX_PER_PAGE
              )
        )
        .then(() => {
          if (!ignore) setHasLoaded(true);
        })
        .catch(() => {
          if (!ignore) setHasError(true);
        });
    }
    return () => {
      ignore = true;
    };
  }, [selectionPlanId]);

  if (hasError) {
    return <Redirect to={`/app/summits/${currentSummit.id}/selection-plans`} />;
  }

  if (!hasLoaded || currentSelectionPlan.id !== Number(selectionPlanId || 0)) {
    return null;
  }

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Suspense fallback={<AjaxLoader show relative size={120} />}>
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
          <Route component={NoMatchPage} />
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
