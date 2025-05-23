import React from "react";
import { connect } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
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
import { DEFAULT_100_PER_PAGE } from "../utils/constants";

class SelectionPlanIdLayout extends React.Component {
  componentDidMount() {
    const selectionPlanId = this.props.match.params.selection_plan_id;

    if (!selectionPlanId) {
      this.props.resetSelectionPlanForm();
    } else {
      this.props
        .getSelectionPlan(selectionPlanId)
        .then(() =>
          this.props.getMarketingSettingsBySelectionPlan(
            selectionPlanId,
            null,
            1,
            DEFAULT_100_PER_PAGE
          )
        );
    }
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.match.params.selection_plan_id;
    const newId = this.props.match.params.selection_plan_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetSelectionPlanForm();
      } else {
        this.props
          .getSelectionPlan(newId)
          .then(() =>
            this.props.getMarketingSettingsBySelectionPlan(
              newId,
              null,
              1,
              DEFAULT_100_PER_PAGE
            )
          );
      }
    }
  }

  render() {
    const { match, currentSelectionPlan, currentSummit } = this.props;
    const selectionPlanId = this.props.match.params.selection_plan_id;
    const breadcrumb = selectionPlanId
      ? currentSelectionPlan.name
      : T.translate("general.new");
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
  }
}

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
