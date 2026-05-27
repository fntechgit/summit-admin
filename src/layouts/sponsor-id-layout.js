/**
 * Copyright 2026 OpenStack Foundation
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

import React, { Suspense, useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Route, Switch } from "react-router-dom";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import { getSponsor, resetSponsorForm } from "../actions/sponsor-actions";
import { INT_BASE } from "../utils/constants";

const SponsorPage = React.lazy(() => import("../pages/sponsors/sponsor-page"));
const EditAdSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-advertisement-sponsor-page")
);
const EditMaterialSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-material-sponsor-page")
);
const EditSocialNetworkSponsorPage = React.lazy(() =>
  import("../pages/sponsors/edit-social-network-sponsor-page")
);
const EditSponsorExtraQuestion = React.lazy(() =>
  import("../pages/sponsors/edit-sponsor-extra-question-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));

const SponsorIdLayout = ({
  currentSponsor,
  match,
  resetSponsorForm,
  getSponsor
}) => {
  const sponsorId = match.params.sponsor_id;

  useEffect(() => {
    if (!sponsorId) {
      resetSponsorForm();
    } else {
      getSponsor(sponsorId);
    }
  }, [sponsorId]);

  if (!currentSponsor || parseInt(sponsorId, INT_BASE) !== currentSponsor.id)
    return <div />;

  const breadcrumb = currentSponsor.id
    ? currentSponsor.company?.name
    : T.translate("general.new");

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Suspense fallback={<AjaxLoader show relative size={120} />}>
        <Switch>
          <Route
            path={`${match.url}/ads`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{ title: "Advertisements", pathname: match.url }}
                />
                <Switch>
                  <Route
                    exact
                    strict
                    path={`${props.match.url}/new`}
                    component={EditAdSponsorPage}
                  />
                  <Route
                    path={`${props.match.url}/:advertisement_id(\\d+)`}
                    component={EditAdSponsorPage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/materials`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{ title: "Materials", pathname: match.url }}
                />
                <Switch>
                  <Route
                    exact
                    strict
                    path={`${props.match.url}/new`}
                    component={EditMaterialSponsorPage}
                  />
                  <Route
                    path={`${props.match.url}/:material_id(\\d+)`}
                    component={EditMaterialSponsorPage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/social-networks`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{ title: "Social Networks", pathname: match.url }}
                />
                <Switch>
                  <Route
                    exact
                    strict
                    path={`${props.match.url}/new`}
                    component={EditSocialNetworkSponsorPage}
                  />
                  <Route
                    path={`${props.match.url}/:social_network_id(\\d+)`}
                    component={EditSocialNetworkSponsorPage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/extra-questions`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{ title: "Extra Questions", pathname: match.url }}
                />
                <Switch>
                  <Route
                    exact
                    strict
                    path={`${props.match.url}/new`}
                    component={EditSponsorExtraQuestion}
                  />
                  <Route
                    path={`${props.match.url}/:extra_question_id(\\d+)`}
                    component={EditSponsorExtraQuestion}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route path={match.url} component={SponsorPage} />
          <Route component={NoMatchPage} />
        </Switch>
      </Suspense>
    </div>
  );
};

const mapStateToProps = ({ currentSponsorState }) => ({
  currentSponsor: currentSponsorState.entity
});

export default connect(mapStateToProps, {
  getSponsor,
  resetSponsorForm
})(SponsorIdLayout);
