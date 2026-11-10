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

const NEW_PLAN_KEY = "new";

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
  // Route the completed load belongs to (NEW_PLAN_KEY for /new), so a render
  // for a different route never shows the previous route's entity.
  const [loadedFor, setLoadedFor] = useState(null);
  const [hasError, setHasError] = useState(false);
  const selectionPlanId = match.params.selection_plan_id;
  const routeKey = selectionPlanId ?? NEW_PLAN_KEY;
  const breadcrumb = selectionPlanId
    ? currentSelectionPlan.name
    : T.translate("general.new");

  useEffect(() => {
    // Set on cleanup (param change / unmount): getSelectionPlan resolves even
    // when superseded, so a stale effect must not chain the settings fetch.
    let ignore = false;
    setLoadedFor(null);
    setHasError(false);
    if (!selectionPlanId) {
      resetSelectionPlanForm();
      setLoadedFor(NEW_PLAN_KEY);
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
          if (!ignore) setLoadedFor(selectionPlanId);
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

  // On /new the entity id only changes when the plan is created from this
  // editor; keep it mounted so a failed settings save can be retried.
  if (
    loadedFor !== routeKey ||
    (selectionPlanId && currentSelectionPlan.id !== Number(selectionPlanId))
  ) {
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
            path={`${match.url}/:tab?`}
            render={({ history, match: routeMatch }) => (
              <EditSelectionPlanPage
                history={history}
                tab={routeMatch.params.tab}
              />
            )}
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
