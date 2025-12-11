/**
 * Copyright 2024 OpenStack Foundation
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
import NoMatchPage from "../pages/no-match-page";
import EditPageTemplatePage from "../pages/sponsors_inventory/edit-page-template-page";
import PageTemplateListPage from "../pages/sponsors_inventory/page-template-list-page";

const PageTemplateLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("page_template_list.page_templates"),
        pathname: match.url
      }}
    />
    <Switch>
      <Route
        strict
        exact
        path={`${match.url}/new`}
        component={EditPageTemplatePage}
      />
      <Route
        strict
        exact
        path={`${match.url}/:page_template_id(\\d+)`}
        component={EditPageTemplatePage}
      />
      <Route
        strict
        exact
        path={`${match.url}`}
        component={PageTemplateListPage}
      />
      <Route component={NoMatchPage} />
    </Switch>
  </div>
);

export default Restrict(withRouter(PageTemplateLayout), "page-template");
