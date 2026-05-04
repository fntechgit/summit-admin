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

import React, { Suspense, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Switch, Route } from "react-router-dom";
import { Breadcrumb } from "react-breadcrumbs";
import AjaxLoader from "openstack-uicore-foundation/lib/components/ajaxloader";

import {
  getLocation,
  resetLocationForm,
  getLocationMeta
} from "../actions/location-actions";

const EditLocationPage = React.lazy(() =>
  import("../pages/locations/edit-location-page")
);
const EditFloorPage = React.lazy(() =>
  import("../pages/locations/edit-floor-page")
);
const EditRoomPage = React.lazy(() =>
  import("../pages/locations/edit-room-page")
);
const EditLocationImagePage = React.lazy(() =>
  import("../pages/locations/edit-location-image-page")
);
const EditLocationMapPage = React.lazy(() =>
  import("../pages/locations/edit-location-map-page")
);
const NoMatchPage = React.lazy(() => import("../pages/no-match-page"));

const LocationIdLayout = ({ match, entity, allClasses, ...props }) => {
  const locationId = match.params.location_id;
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  useEffect(() => {
    props.getLocationMeta();
  }, []);

  useEffect(() => {
    if (!locationId) {
      props.resetLocationForm();
    } else {
      props.getLocation(locationId);
    }
  }, [locationId]);

  if (!allClasses.length) return <div />;
  if (locationId && !entity.id) return <div />;

  return (
    <div>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <Suspense fallback={<AjaxLoader show relative size={120} />}>
        <Switch>
          <Route exact strict path={match.url} component={EditLocationPage} />
          <Route
            path={`${match.url}/floors`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{
                    title: T.translate("edit_floor.floors"),
                    pathname: match.url
                  }}
                />
                <Switch>
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/new`}
                    component={EditFloorPage}
                  />
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/:floor_id(\\d+)`}
                    component={EditFloorPage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/rooms`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{
                    title: T.translate("edit_room.rooms"),
                    pathname: match.url
                  }}
                />
                <Switch>
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/new`}
                    component={EditRoomPage}
                  />
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/:room_id`}
                    component={EditRoomPage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/images`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{
                    title: T.translate("edit_location_image.images"),
                    pathname: match.url
                  }}
                />
                <Switch>
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/new`}
                    component={EditLocationImagePage}
                  />
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/:image_id`}
                    component={EditLocationImagePage}
                  />
                  <Route component={NoMatchPage} />
                </Switch>
              </div>
            )}
          />
          <Route
            path={`${match.url}/maps`}
            render={(props) => (
              <div>
                <Breadcrumb
                  data={{
                    title: T.translate("edit_location_map.maps"),
                    pathname: match.url
                  }}
                />
                <Switch>
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/new`}
                    component={EditLocationMapPage}
                  />
                  <Route
                    strict
                    exact
                    path={`${props.match.url}/:map_id`}
                    component={EditLocationMapPage}
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
};

LocationIdLayout.propTypes = {
  match: PropTypes.object,
  entity: PropTypes.object,
  allClasses: PropTypes.array
};

const mapStateToProps = ({ currentLocationState }) => ({
  ...currentLocationState
});

export default connect(mapStateToProps, {
  getLocation,
  resetLocationForm,
  getLocationMeta
})(LocationIdLayout);
