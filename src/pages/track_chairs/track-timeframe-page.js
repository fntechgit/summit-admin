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
 **/

import React, {useEffect, useState} from 'react'
import {connect} from 'react-redux';
import T from 'i18n-react/dist/i18n-react';
import {Breadcrumb} from "react-breadcrumbs";
import {getTrackTimeframe, resetTrackTimeframeForm} from "../../actions/track-timeframes-actions";
import TrackDropdown from "../../components/inputs/track-dropdown";
import TrackTimeframeTable from "../../components/tables/track-timeframes";

import styles from "../../styles/track-timeframes-page.less"
import {getSummitDays} from "../../utils/methods";


const TrackTimeframePage = ({summit, match, track, ...props}) => {
  const [entity, setEntity] = useState(props.entity);
  const [errors, setErrors] = useState(props.errors);
  const title = (entity.id) ? T.translate("general.edit") : T.translate("general.add");
  const breadcrumb = (entity.id) ? entity.name : T.translate("general.new");
  const summitDays = getSummitDays(summit);
  
  useEffect(() => {
    const {params} = match;
    if (params.track_id) {
      props.getTrackTimeframe(params.track_id);
    } else {
      props.resetTrackTimeframeForm()
    }
  }, [match.params.track_id]);
  
  useEffect(() => {
    setEntity(props.entity);
  }, [props.entity]);
  
  const handleChange = (ev) => {
    const _entity = {...entity};
    const _errors = {...errors};
    let {value, id} = ev.target;
    
    if (ev.target.type === 'checkbox') {
      value = ev.target.checked;
    }
    
    if (ev.target.type === 'number') {
      value = parseInt(ev.target.value);
    }
    
    if (ev.target.type === 'datetime') {
      value = value.valueOf() / 1000;
    }
    
    _errors[id] = '';
    _entity[id] = value;
    
    setEntity(_entity);
    setErrors(_errors);
  }
  
  if (!entity) return null;
  
  console.log('ENTITY', entity.proposed_schedule_allowed_locations);
  
  const trackIdsWithTF = props.tracksTimeframes.map(t => t.id);
  const tracksWithoutTimeframe = summit.tracks.filter(t => !trackIdsWithTF.includes(t.id));
  const trackOptions = entity.id ? summit.tracks : tracksWithoutTimeframe; // we need this so we can edit
  
  return (
    <>
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <div className="container">
        <h3>{title} Timeframes for {track?.name || 'track'}</h3>
        <hr/>
        <div className="row">
          <div className="col-md-6">
            <label>{T.translate("track_timeframes.track")}</label>
            <TrackDropdown id="id" value={entity.id} onChange={handleChange} tracks={trackOptions} disabled={!!entity.id} />
          </div>
        </div>
        {!!entity.id &&
          <TrackTimeframeTable
            days={summitDays}
            trackId={entity.id}
            summitTZ={summit.time_zone_id}
            locations={summit.locations}
            data={entity.proposed_schedule_allowed_locations}
          />
        }
      </div>
    </>
  )
}

const mapStateToProps = ({currentSummitState, currentEventCategoryState, trackTimeframeState, trackTimeframesListState}) => ({
  summit: currentSummitState.currentSummit,
  track: currentEventCategoryState.entity,
  tracksTimeframes: trackTimeframesListState.tracksTimeframes,
    ...trackTimeframeState
});

export default connect(
  mapStateToProps,
  {getTrackTimeframe, resetTrackTimeframeForm}
)(TrackTimeframePage);
