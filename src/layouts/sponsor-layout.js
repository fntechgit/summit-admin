/**
 * Copyright 2019 OpenStack Foundation
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
import { Route, Switch, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";
import SponsorListPage from "../pages/sponsors/sponsor-list-page";
import NoMatchPage from "../pages/no-match-page";
import SponsorIdLayout from "./sponsor-id-layout";
import SponsorPromocodesListPage from "../pages/sponsors/sponsor-promocodes-list-page";
import EditPromocodePage from "../pages/promocodes/edit-promocode-page";
import SponsorSettingsPage from "../pages/sponsor_settings/sponsor-settings-page";
import SponsorFormsListPage from "../pages/sponsors/sponsor-forms-list-page";
import SponsorFormItemListPage from "../pages/sponsors/sponsor-form-item-list-page";
import SponsorUsersListPage from "../pages/sponsors/sponsor-users-list-page";
import sponsorPagesListPage from "../pages/sponsors/sponsor-pages-list-page";

const SponsorLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("sponsor_list.sponsors"),
        pathname: match.url
      }}
    />
    <Switch>
      <Route strict exact path={match.url} component={SponsorListPage} />
      <Route
        path={`${match.url}/forms`}
        render={(props) => (
          <div>
            <Breadcrumb
              data={{
                title: T.translate("sponsor_forms.forms"),
                pathname: props.match.url
              }}
            />
            <Switch>
              <Route
                strict
                exact
                path={props.match.url}
                component={SponsorFormsListPage}
              />
              <Route
                strict
                exact
                path={`${props.match.url}/:form_id(\\d+)/items`}
                component={SponsorFormItemListPage}
              />
            </Switch>
          </div>
        )}
      />
      <Route
        path={`${match.url}/pages`}
        render={(props) => (
          <div>
            <Breadcrumb
              data={{
                title: T.translate("sponsor_pages.pages"),
                pathname: props.match.url
              }}
            />
            <Switch>
              <Route
                strict
                exact
                path={props.match.url}
                component={sponsorPagesListPage}
              />
            </Switch>
          </div>
        )}
      />
      <Route
        strict
        exact
        path={`${match.url}/users`}
        component={SponsorUsersListPage}
      />
      <Route
        strict
        exact
        path={`${match.url}/settings`}
        component={SponsorSettingsPage}
      />
      <Route
        strict
        exact
        path={`${match.url}/promocodes`}
        component={SponsorPromocodesListPage}
      />
      <Route
        path={`${match.url}/promocodes`}
        render={(props) => (
          <div>
            <Breadcrumb
              data={{
                title: T.translate("sponsor_promocodes_list.promocodes"),
                pathname: props.match.url
              }}
            />
            <Switch>
              <Route
                strict
                exact
                path={props.match.url}
                component={SponsorPromocodesListPage}
              />
              <Route
                path={`${props.match.url}/new`}
                component={EditPromocodePage}
              />
              <Route
                path={`${props.match.url}/:promocode_id(\\d+)`}
                component={EditPromocodePage}
              />
            </Switch>
          </div>
        )}
      />
      <Route
        strict
        exact
        path={`${match.url}/new`}
        component={SponsorIdLayout}
      />
      <Route
        path={`${match.url}/:sponsor_id(\\d+)`}
        component={SponsorIdLayout}
      />
      <Route component={NoMatchPage} />
    </Switch>
  </div>
);

export default Restrict(withRouter(SponsorLayout), "sponsors");
