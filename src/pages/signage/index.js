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
import React, {useEffect, useState} from 'react';
import { connect } from 'react-redux';
import T from "i18n-react/dist/i18n-react";
import {ButtonToolbar, ToggleButtonGroup, ToggleButton, Pagination} from "react-bootstrap";
import { Breadcrumb } from 'react-breadcrumbs';
import {
  DateTimePicker,
  Dropdown,
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import styles from '../../styles/signage-page.module.less';
import {getSignBanners, getSignEvents, getLocations, getTemplates, getSign} from "../../actions/signage-actions";
import LocationGroupedDropdown from "../../components/inputs/location-grouped-dropdown";
import {BannersTable} from "../../components/tables/signagebannerstable";

const SignagePage = ({summit, match, locations, templates, events, banners, staticBanner, locationId, term, page, ...props}) => {
  const [template, setTemplate] = useState(null);
  const [jumpDate, setJumpDate] = useState(null);
  const [view, setView] = useState('activities');
  const [staticBannerLoc, setStaticBannerLoc] = useState(staticBanner?.content);
  const templateOptions = templates.map(tmp =>({value: tmp.file, label: tmp.name}));
  const selectedRoom = summit.locations.find(loc => loc.id === locationId);
  
  useEffect(() => {
    props.getLocations();
    props.getTemplates();
  }, [summit.id]);
  
  useEffect(() => {
    setStaticBannerLoc(staticBanner?.content || '')
  }, [locationId])
  
  const getEvents = (newLocation = null, newTerm = null, newPage = null) => {
    const useLocation = newLocation || locationId;
    const useTerm = newTerm || term;
    const usePage = newPage || page;
    
    props.getSignEvents(useLocation, useTerm, usePage);
  }
  
  const getBanners = (newLocation = null, newTerm = null, newPage = null) => {
    const useLocation = newLocation || locationId;
    const useTerm = newTerm || term;
    const usePage = newPage || page;
    
    props.getSignBanners(useLocation, useTerm, usePage);
  }
  
  const onChangeLocation = (newLocation) => {
    getEvents(newLocation, '', 1);
    getBanners(newLocation, '', 1);
    props.getSign(newLocation);
  };
  
  const onSearch = (newTerm) => {
    if (view === 'activities') {
      getEvents(null, newTerm,1);
    } else if (view === 'banners') {
      getBanners(null, newTerm, 1);
    }
  };
  
  const onPageChange = (newPage) => {
    if (view === 'activities') {
      getEvents(null, null, newPage);
    } else if (view === 'banners') {
      getBanners(null, null, newPage);
    }
  };
  
  const jumpToEvent = () => {
  
  };
  
  const viewSign = () => {
  
  };
  
  const pushUpdates = () => {
  
  };
  
  const addNewBanner = () => {
  
  }
  
  const saveNewBanner = () => {
  
  }
  
  if(!summit.id || !locations) return(<div />);
  
  const eventsColumns = [
    { columnKey: 'id', value: 'Id', sortable: true },
    { columnKey: 'title', value: T.translate("signage.title"), sortable: true },
    { columnKey: 'speakers_str', value: T.translate("signage.speakers")},
    { columnKey: 'floor_loc', value: T.translate("signage.floor_loc")},
    { columnKey: 'start_date_str', value: T.translate("signage.start_date")},
    { columnKey: 'end_date_str', value: T.translate("signage.end_date")},
  ];
  
  const eventsTableOptions = {
    sortCol: props.order,
    sortDir: props.orderDir,
    actions: {
      custom: [
        {
          name: 'jump',
          tooltip: 'jump to this event',
          icon: <i className="fa fa-share" />,
          onClick: jumpToEvent,
        }
      ],
    }
  };
  
  return (
    <div className="signage-wrapper">
      <Breadcrumb data={{ title: T.translate("signage.signs"), pathname: match.url }} />
      <div className="container">
        <div className={styles.header}>
          <div className="row form-group">
            <div className="col-md-4">
              <label> {T.translate("signage.location")} </label>
              <LocationGroupedDropdown
                locations={locations}
                value={locationId}
                placeholder={T.translate("signage.placeholders.locations")}
                onChange={op => onChangeLocation(op.value)}
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
            </div>
            <div className="col-md-4">
              <label> {T.translate("signage.static_banner")} </label>
              <input className="form-control" type="text" value={staticBannerLoc} onChange={setStaticBannerLoc} />
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
          <div className="list-wrapper">
            <div className="row">
              <div className="col-md-6">
                <ButtonToolbar>
                  <ToggleButtonGroup type="radio" name="views" value={view} onChange={setView}>
                    <ToggleButton value="activities" >{T.translate(`signage.activities`)}</ToggleButton>
                    <ToggleButton value="banners">{T.translate(`signage.banners`)}</ToggleButton>
                  </ToggleButtonGroup>
                </ButtonToolbar>
              </div>
              <div className="col-md-6 text-right">
                <FreeTextSearch
                  value={term}
                  placeholder={T.translate("signage.placeholders.search")}
                  onSearch={onSearch}
                />
              </div>
            </div>
  
            {view === 'activities' && events.length > 0 &&
              <div>
                <Table
                  options={eventsTableOptions}
                  data={events}
                  columns={eventsColumns}
                  onSort={console.log}
                />
                <Pagination
                  bsSize="medium"
                  prev
                  next
                  first
                  last
                  ellipsis
                  boundaryLinks
                  maxButtons={10}
                  items={props.lastPage}
                  activePage={props.currentPage}
                  onSelect={onPageChange}
                />
              </div>
            }
            {view === 'banners' && banners.length > 0 &&
              <BannersTable
                data={banners}
                locationId={locationId}
                room={selectedRoom}
              />
            }
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = ({ currentSummitState, signageState }) => ({
  summit : currentSummitState.currentSummit,
  ...signageState
})

export default connect (
    mapStateToProps,
    {
      getSignEvents,
      getSignBanners,
      getLocations,
      getTemplates,
      getSign
    }
)(SignagePage);
