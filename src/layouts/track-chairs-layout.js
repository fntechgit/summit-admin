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
import { Switch, Route, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Restrict from "../routes/restrict";

const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));
const TrackChairListPage = React.lazy(() =>
  import("../pages/track_chairs/track-chair-list-page")
);
const ProgressFlagsPage = React.lazy(() =>
  import("../pages/track_chairs/progress-flags-page")
);
const TrackTimeframeListPage = React.lazy(() =>
  import("../pages/track_chairs/track-timeframe-list-page")
);
const TrackTimeframePage = React.lazy(() =>
  import("../pages/track_chairs/track-timeframe-page")
);
const TeamListsPage = React.lazy(() =>
  import("../pages/track_chairs/team-lists-page")
);

const TrackChairsLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("track_chairs.track_chairs"),
        pathname: match.url
      }}
    />

    <Suspense fallback={<AjaxLoader show relative size={120} />}>
      <Switch>
        <Route strict exact path={match.url} component={TrackChairListPage} />
        <Route
          strict
          exact
          path={`${match.url}/progress-flags`}
          component={ProgressFlagsPage}
        />
        <Route
          strict
          exact
          path={`${match.url}/team-lists`}
          component={TeamListsPage}
        />
        <Route
          path={`${match.url}/track-timeframes`}
          render={(props) => (
            <div>
              <Breadcrumb
                data={{
                  title: T.translate("track_timeframes.track_timeframes"),
                  pathname: props.match.url
                }}
              />
              <Switch>
                <Route
                  strict
                  exact
                  path={props.match.url}
                  component={TrackTimeframeListPage}
                />
                <Route
                  strict
                  exact
                  path={`${props.match.url}/:track_id(\\d+)`}
                  component={TrackTimeframePage}
                />
                <Route
                  strict
                  exact
                  path={`${props.match.url}/new`}
                  component={TrackTimeframePage}
                />
                <Route component={NoMatchPage} />
              </Switch>
            </div>
          )}
        />
        <Route component={NoMatchPage} />
      </Switch>
    </Suspense>
  </div>
);

export default Restrict(withRouter(TrackChairsLayout), "track-chairs");
