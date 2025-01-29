/**
 * Copyright 2025 OpenStack Foundation
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
import { Switch, Route, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";
import EditFormTemplateItemPage from "../pages/sponsors_inventory/edit-form-template-item-page";
import FormTemplateItemListPage from "../pages/sponsors_inventory/form-template-item-list-page";
import NoMatchPage from "../pages/no-match-page";

const FormTemplateItemLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("form_template_item_list.form_template_items"),
        pathname: match.url
      }}
    />
    <Switch>
      <Route
        strict
        exact
        path={`${match.url}/new`}
        render={(props) => (
          <EditFormTemplateItemPage
            {...props}
            formTemplateId={match.params.form_template_id}
          />
        )}
      />
      <Route
        strict
        exact
        path={`${match.url}/:form_template_item_id(\\d+)`}
        render={(props) => (
          <EditFormTemplateItemPage
            {...props}
            formTemplateId={match.params.form_template_id}
          />
        )}
      />
      <Route
        strict
        exact
        path={`${match.url}`}
        render={(props) => (
          <FormTemplateItemListPage
            {...props}
            formTemplateId={match.params.form_template_id}
          />
        )}
      />
      <Route component={NoMatchPage} />
    </Switch>
  </div>
);

export default Restrict(
  withRouter(FormTemplateItemLayout),
  "form-template-item"
);
