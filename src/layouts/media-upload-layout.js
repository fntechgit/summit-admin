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
import PropTypes from "prop-types";
import { Switch, Route, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import Restrict from "../routes/restrict";

import MediaUploadListPage from "../pages/media_uploads/media-upload-list-page";
import NoMatchPage from "../pages/no-match-page";

const MediaUploadLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("media_upload.media_uploads"),
        pathname: match.url
      }}
    />

    <Switch>
      <Route exact strict path={match.url} component={MediaUploadListPage} />
      <Route component={NoMatchPage} />
    </Switch>
  </div>
);

MediaUploadLayout.propTypes = {
  match: PropTypes.shape({ url: PropTypes.string }).isRequired
};

export default Restrict(withRouter(MediaUploadLayout), "events");
