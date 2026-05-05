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

import React, { Suspense } from "react";
import { connect } from "react-redux";
import { Switch, Route, Redirect } from "react-router-dom";
import { Breadcrumbs, Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Restrict from "../routes/restrict";
import Menu from "../components/menu";

const SummitLayout = React.lazy(() => import("./summit-layout"));
const SummitDirectoryPage = React.lazy(() =>
  import("../pages/summits/summit-directory-page")
);
const SpeakerLayout = React.lazy(() => import("./speaker-layout"));
const CompanyLayout = React.lazy(() => import("./company-layout"));
const InventoryItemLayout = React.lazy(() => import("./inventory-item-layout"));
const FormTemplateLayout = React.lazy(() => import("./form-template-layout"));
const EmailLayout = React.lazy(() => import("./email-layout"));
const AdminAccessLayout = React.lazy(() => import("./admin-access-layout"));
const MediaFileTypeLayout = React.lazy(() =>
  import("./media-file-type-layout")
);
const SponsoredProjectLayout = React.lazy(() =>
  import("./sponsored-project-layout")
);
const TagLayout = React.lazy(() => import("./tag-layout"));
const SponsorshipLayout = React.lazy(() => import("./sponsorship-layout"));
const PageTemplateLayout = React.lazy(() => import("./page-template-layout"));

const PrimaryLayout = ({ match, currentSummit, location, member }) => {
  let extraClass = "container";

  // full width pages
  if (
    location.pathname.includes("schedule") ||
    location.pathname.includes("bulk-actions")
  ) {
    extraClass = "";
  }

  return (
    <div className="primary-layout">
      <Menu currentSummit={currentSummit} member={member} />
      <main id="page-wrap">
        <Breadcrumbs
          className={`breadcrumbs-wrapper ${extraClass}`}
          separator="/"
        />

        <Breadcrumb
          data={{ title: <i className="fa fa-home" />, pathname: match.url }}
        />

        <Suspense fallback={<AjaxLoader show relative size={120} />}>
          <Switch>
            <Route
              strict
              exact
              path="/app/directory"
              component={SummitDirectoryPage}
            />
            <Route path="/app/speakers" component={SpeakerLayout} />
            <Route path="/app/companies" component={CompanyLayout} />
            <Route path="/app/inventory" component={InventoryItemLayout} />
            <Route path="/app/form-templates" component={FormTemplateLayout} />
            <Route path="/app/page-templates" component={PageTemplateLayout} />
            <Route
              path="/app/sponsorship-types"
              component={SponsorshipLayout}
            />
            <Route path="/app/tags" component={TagLayout} />
            <Route
              path="/app/sponsored-projects"
              component={SponsoredProjectLayout}
            />
            <Route path="/app/emails" component={EmailLayout} />
            <Route path="/app/admin-access" component={AdminAccessLayout} />
            <Route
              path="/app/media-file-types"
              component={MediaFileTypeLayout}
            />
            <Route path="/app/summits" component={SummitLayout} />
            <Route render={() => <Redirect to="/app/directory" />} />
          </Switch>
        </Suspense>
      </main>
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, loggedUserState }) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member
});

export default Restrict(connect(mapStateToProps, {})(PrimaryLayout), "general");
