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
import { Switch, Route, Redirect } from "react-router-dom";
import { Breadcrumbs, Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";
import Menu from "../components/menu";
import SummitLayout from "./summit-layout";
import SummitDirectoryPage from "../pages/summits/summit-directory-page";
import SpeakerLayout from "./speaker-layout";
import CompanyLayout from "./company-layout";
import InventoryItemLayout from "./inventory-item-layout";
import FormTemplateLayout from "./form-template-layout";
import EmailLayout from "./email-layout";
import AdminAccessLayout from "./admin-access-layout";
import MediaFileTypeLayout from "./media-file-type-layout";
import SponsoredProjectLayout from "./sponsored-project-layout";
import TagLayout from "./tag-layout";
import SponsorshipLayout from "./sponsorship-layout";

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
          <Route path="/app/sponsorship-types" component={SponsorshipLayout} />
          <Route path="/app/tags" component={TagLayout} />
          <Route
            path="/app/sponsored-projects"
            component={SponsoredProjectLayout}
          />
          <Route path="/app/emails" component={EmailLayout} />
          <Route path="/app/admin-access" component={AdminAccessLayout} />
          <Route path="/app/media-file-types" component={MediaFileTypeLayout} />
          <Route path="/app/summits" component={SummitLayout} />
          <Route render={() => <Redirect to="/app/directory" />} />
        </Switch>
      </main>
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, loggedUserState }) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member
});

export default Restrict(connect(mapStateToProps, {})(PrimaryLayout), "general");
