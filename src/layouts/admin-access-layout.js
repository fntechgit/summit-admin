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
import { Switch, Route, Redirect } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";
import AdminAccessListPage from "../pages/admin_access/admin-access-list-page";

const AdminAccessLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("admin_access.admin_access"),
        pathname: match.url
      }}
    />

    <Switch>
      <Route strict exact path={match.url} component={AdminAccessListPage} />
      <Route
        strict
        exact
        path={`${match.url}/new`}
        component={AdminAccessListPage}
      />
      <Route
        strict
        exact
        path={`${match.url}/:access_id(\\d+)`}
        component={AdminAccessListPage}
      />
      <Redirect to={match.url} />
    </Switch>
  </div>
);

export default Restrict(AdminAccessLayout, "admin-access");
