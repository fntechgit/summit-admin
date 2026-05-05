/* *
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

import React, { Suspense } from "react";
import { Switch, Route, withRouter } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import Restrict from "../routes/restrict";

const ScheduleBuilderPage = React.lazy(() =>
  import("../pages/events/schedule-builder-page")
);
const SummitEventListPage = React.lazy(() =>
  import("../pages/events/summit-event-list-page")
);
const EventIdLayout = React.lazy(() => import("./event-id-layout"));
const SummitEventsBulkActionsPage = React.lazy(() =>
  import("../pages/events/summit-events-bulk-actions-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));

const EventLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("event_list.events"),
        pathname: match.url
      }}
    />

    <Suspense fallback={<AjaxLoader show relative size={120} />}>
      <Switch>
        <Route exact strict path={match.url} component={SummitEventListPage} />
        <Route
          strict
          exact
          path={`${match.url}/schedule`}
          component={ScheduleBuilderPage}
        />
        <Route
          strict
          exact
          path={`${match.url}/bulk-actions`}
          component={SummitEventsBulkActionsPage}
        />
        <Route
          strict
          exact
          path={`${match.url}/new`}
          component={EventIdLayout}
        />
        <Route
          path={`${match.url}/:event_id(\\d+)`}
          component={EventIdLayout}
        />
        <Route component={NoMatchPage} />
      </Switch>
    </Suspense>
  </div>
);

export default Restrict(withRouter(EventLayout), "events");
