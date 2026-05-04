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
import { Switch, Route } from "react-router-dom";
import T from "i18n-react/dist/i18n-react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";
import { getEvent, resetEventForm } from "../actions/event-actions";
import { getRsvpTemplates } from "../actions/rsvp-template-actions";

const EditSummitEventPage = React.lazy(() =>
  import("../pages/events/edit-summit-event-page")
);
const EditEventMaterialPage = React.lazy(() =>
  import("../pages/events/edit-event-material-page")
);
const EditEventCommentPage = React.lazy(() =>
  import("../pages/events/edit-event-comment-page")
);
const EditEventRsvpPage = React.lazy(() =>
  import("../pages/events/edit-event-rsvp-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));

class EventIdLayout extends React.Component {
  constructor(props) {
    super(props);

    const eventId = props.match.params.event_id;

    if (!eventId) {
      props.resetEventForm();
    } else {
      props.getEvent(eventId);
    }

    props.getRsvpTemplates();
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.match.params.event_id;
    const newId = this.props.match.params.event_id;

    if (oldId !== newId) {
      if (!newId) {
        this.props.resetEventForm();
      } else {
        this.props.getEvent(newId);
      }
    }
  }

  render() {
    const { match, entity } = this.props;
    const eventId = this.props.match.params.event_id;
    const breadcrumb = entity.id ? entity.title : T.translate("general.new");

    if (eventId && entity.id !== parseInt(eventId)) return <div />;

    return (
      <div>
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />

        <Suspense fallback={<AjaxLoader show relative size={120} />}>
          <Switch>
            <Route
              exact
              strict
              path={match.url}
              component={EditSummitEventPage}
            />
            <Route
              path={`${match.url}/materials`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{
                      title: T.translate("edit_event.materials"),
                      pathname: match.url
                    }}
                  />
                  <Switch>
                    <Route
                      strict
                      exact
                      path={`${props.match.url}/new`}
                      component={EditEventMaterialPage}
                    />
                    <Route
                      strict
                      exact
                      path={`${props.match.url}/:material_id`}
                      component={EditEventMaterialPage}
                    />
                    <Route
                      strict
                      exact
                      path={`${props.match.url}/:comment_id`}
                      component={EditEventCommentPage}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route
              path={`${match.url}/rsvp`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{
                      title: T.translate("edit_event.rsvp"),
                      pathname: match.url
                    }}
                  />
                  <Switch>
                    <Route
                      strict
                      exact
                      path={`${props.match.url}/:rsvp_id`}
                      component={EditEventRsvpPage}
                    />
                    <Route component={NoMatchPage} />
                  </Switch>
                </div>
              )}
            />
            <Route
              path={`${match.url}/comments`}
              render={(props) => (
                <div>
                  <Breadcrumb
                    data={{
                      title: T.translate("edit_event.comments"),
                      pathname: match.url
                    }}
                  />
                  <Switch>
                    <Route
                      strict
                      exact
                      path={`${props.match.url}/:comment_id`}
                      component={EditEventCommentPage}
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
  }
}

const mapStateToProps = ({ currentSummitEventState }) => ({
  ...currentSummitEventState
});

export default connect(mapStateToProps, {
  getEvent,
  resetEventForm,
  getRsvpTemplates
})(EventIdLayout);
