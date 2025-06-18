import React from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import { Redirect, Route, Switch } from "react-router-dom";
import EditSelectionPlanExtraQuestionPage from "../pages/selection-plans/edit-selection-plan-extra-question-page";

const SelectionPlanExtraQuestionsLayout = ({
  match,
  currentSummit,
  currentSelectionPlan
}) => (
  <div>
    <Breadcrumb data={{ title: "Extra Questions", pathname: match.url }} />
    <Switch>
      <Route
        path={`${match.url}/:extra_question_id(\\d+)`}
        component={EditSelectionPlanExtraQuestionPage}
      />
      <Route
        exact
        strict
        path={`${match.url}/new`}
        component={EditSelectionPlanExtraQuestionPage}
      />
      <Redirect
        to={`/app/summits/${currentSummit.id}/selection-plans/${currentSelectionPlan.id}`}
      />
    </Switch>
  </div>
);

const mapStateToProps = ({
  currentSelectionPlanState,
  currentSummitState
}) => ({
  currentSelectionPlan: currentSelectionPlanState.entity,
  ...currentSummitState
});
export default connect(mapStateToProps, {})(SelectionPlanExtraQuestionsLayout);
