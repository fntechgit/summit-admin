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
import React, {useState} from 'react';
import { connect } from 'react-redux';
import { getSummitById }  from '../../actions/summit-actions';
import T from "i18n-react/dist/i18n-react";
import { FormGroup, InputGroup, FormControl, ButtonToolbar, ToggleButtonGroup, ToggleButton, Button } from "react-bootstrap";
import { Breadcrumb } from 'react-breadcrumbs';
import {DateTimePicker, Dropdown, GroupedDropdown} from "openstack-uicore-foundation/lib/components";
import LocationDropdown from "../../components/inputs/location-dropdown";
import styles from '../../styles/signage-page.module.less';
import {hasErrors} from "../../utils/methods";

const SignagePage = ({summit, match}) => {
  const [location, setLocation] = useState(null);
  const [template, setTemplate] = useState(null);
  const [jumpDate, setJumpDate] = useState(null);
  const [view, setView] = useState('activities');
  const [staticBanner, setStaticBanner] = useState('');
  const templateOptions = [];
  
  const venues = summit.locations.filter(v => (v.class_name === 'SummitVenue')).map(l => {
    let options = [];
    if (l.rooms) {
      options = l.rooms.map(r => ({ label: r.name, value: r.id }));
    }
    return { label: l.name, value: l.id, options: options };
  });
  
  const locations_ddl = [
    { label: 'TBD', value: 0 },
    ...venues
  ];
  
  const jumpToDate = () => {
  
  };
  
  const saveStaticBanner = () => {
  
  };
  
  const viewSign = () => {
  
  };
  
  const pushUpdates = () => {
  
  };
  
  
  if(!summit.id) return(<div />);
  
  return (
    <div className="signage-wrapper">
      <Breadcrumb data={{ title: T.translate("signage.signs"), pathname: match.url }} />
      <div className="container">
        <div className={styles.header}>
          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("signage.location")} </label>
              <GroupedDropdown
                value={location}
                options={locations_ddl}
                placeholder={T.translate("signage.placeholders.locations")}
                onChange={setLocation}
              />
            </div>
            <div className="col-md-4">
              <label> {T.translate("signage.template")} </label>
              <Dropdown
                placeholder={T.translate("signage.placeholders.template")}
                value={template}
                onChange={setTemplate}
                options={templateOptions}
              />
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("signage.date")} </label>
              <DateTimePicker
                format={{date:"YYYY-MM-DD", time: "HH:mm"}}
                inputProps={{placeholder: T.translate("signage.placeholders.date")}}
                timezone={summit.time_zone.name}
                onChange={setJumpDate}
                value={jumpDate}
              />
              <button className="btn btn-default" onClick={jumpToDate}>
                {T.translate(`signage.jump`)}
              </button>
            </div>
            <div className="col-md-4">
              <label> {T.translate("signage.static_banner")} </label>
              <FormGroup>
                <InputGroup>
                  <FormControl type="text" value={staticBanner} onChange={setStaticBanner} />
                  <InputGroup.Button>
                    <Button onClick={saveStaticBanner}>Set</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </div>
            <div className="col-md-4">
              <button className="btn btn-default" onClick={viewSign}>
                {T.translate(`signage.view_sign`)}
              </button>
              <button className="btn btn-default" onClick={pushUpdates}>
                {T.translate(`signage.push_updates`)}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.list}>
          <div>
            <ButtonToolbar>
              <ToggleButtonGroup type="radio" name="views" value={view} onChange={setView}>
                <ToggleButton value="activities" >{T.translate(`signage.activities`)}</ToggleButton>
                <ToggleButton value="banners">{T.translate(`signage.banners`)}</ToggleButton>
              </ToggleButtonGroup>
            </ButtonToolbar>
          </div>
          {view === 'activities' &&
            <div className="activities-wrapper"> activity list</div>
          }
          {view === 'banners' &&
            <div className="banners-wrapper"> banners list</div>
          }
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = ({ currentSummitState }) => ({
  summit : currentSummitState.currentSummit,
})

export default connect (
    mapStateToProps,
    {
        getSummitById
    }
)(SignagePage);
