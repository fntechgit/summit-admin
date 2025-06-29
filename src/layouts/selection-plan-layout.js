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
import { connect } from "react-redux";
import { Redirect, Route, Switch } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import EditSelectionPlanPage from "../pages/selection-plans/edit-selection-plan-page";
import SelectionPlanListPage from "../pages/selection-plans/selection-plan-list-page";
import SelectionPlanIdLayout from "./selection-plan-id-layout";

const SelectionPlanLayout = ({ match, currentSummit }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("edit_selection_plan.selection_plans"),
        pathname: match.url
      }}
    />
    <Switch>
      <Route
        strict
        exact
        path={`${match.url}`}
        component={SelectionPlanListPage}
      />
      <Route
        strict
        exact
        path={`${match.url}/new`}
        component={EditSelectionPlanPage}
      />
      <Route
        path={`${match.url}/:selection_plan_id(\\d+)`}
        component={SelectionPlanIdLayout}
      />
      <Redirect to={`/app/summits/${currentSummit.id}`} />
    </Switch>
  </div>
);

const mapStateToProps = ({ currentSummitState }) => ({
  ...currentSummitState
});

export default connect(mapStateToProps, {})(SelectionPlanLayout);
