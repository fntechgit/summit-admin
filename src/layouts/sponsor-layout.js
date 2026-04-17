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

import React, { Suspense } from "react";
import { Route, Switch, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Restrict from "../routes/restrict";

const SponsorListPage = React.lazy(() =>
  import("../pages/sponsors/sponsor-list-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));
const SponsorIdLayout = React.lazy(() => import("./sponsor-id-layout"));
const SponsorPromocodesListPage = React.lazy(() =>
  import("../pages/sponsors/sponsor-promocodes-list-page")
);
const EditPromocodePage = React.lazy(() =>
  import("../pages/promocodes/edit-promocode-page")
);
const SponsorSettingsPage = React.lazy(() =>
  import("../pages/sponsor_settings/sponsor-settings-page")
);
const SponsorFormsListPage = React.lazy(() =>
  import("../pages/sponsors/sponsor-forms-list-page")
);
const SponsorFormItemListPage = React.lazy(() =>
  import("../pages/sponsors/sponsor-form-item-list-page")
);
const SponsorUsersListPage = React.lazy(() =>
  import("../pages/sponsors/sponsor-users-list-page")
);
const ShowPagesListPage = React.lazy(() =>
  import("../pages/sponsors/show-pages-list-page")
);

const SponsorLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("sponsor_list.sponsors"),
        pathname: match.url
      }}
    />
    <Suspense fallback={<AjaxLoader show relative size={120} />}>
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
                  title: T.translate("show_pages.pages"),
                  pathname: props.match.url
                }}
              />
            </div>
          )}
          strict
          exact
          component={ShowPagesListPage}
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
    </Suspense>
  </div>
);

export default Restrict(withRouter(SponsorLayout), "sponsors");
