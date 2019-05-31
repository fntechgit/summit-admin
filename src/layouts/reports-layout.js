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

import React from 'react'
import { Switch, Route, withRouter } from 'react-router-dom';
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from 'react-breadcrumbs';
import Restrict from '../routes/restrict';
import ReportListPage from '../pages/reports/report-list-page';
import NoMatchPage from "../pages/no-match-page";
import {
    PresentationCompanyReport,
    PresentationReport,
    PresentationTrackReport,
    RsvpReport,
    RsvpEventReport,
    RoomReport,
    SpeakerReport,
    TrackQuestionsReport,
    PresentationVideoReport,
    FeedbackReport,
    FeedbackGroupReport,
    TagReport,
    SmartSpeakerReport
} from "../components/reports"


class ReportsLayout extends React.Component {

    render(){
        let { match } = this.props;
        return(
            <div>
                <Breadcrumb data={{ title: T.translate("reports.reports"), pathname: match.url }} ></Breadcrumb>

                <Switch>
                    <Route strict exact path={match.url} component={ReportListPage}/>
                    <Route strict exact path={`${match.url}/presentation_report`} component={PresentationReport}/>
                    <Route strict exact path={`${match.url}/rsvp_report`} component={RsvpReport}/>
                    <Route strict exact path={`${match.url}/rsvp_report/:event_id(\\d+)`} component={RsvpEventReport}/>
                    <Route strict exact path={`${match.url}/presentation_company_report`} component={PresentationCompanyReport}/>
                    <Route strict exact path={`${match.url}/room_report`} component={RoomReport}/>
                    <Route strict exact path={`${match.url}/presentation_track_report`} component={PresentationTrackReport}/>
                    <Route strict exact path={`${match.url}/speaker_report`} component={SpeakerReport}/>
                    <Route strict exact path={`${match.url}/track_questions_report`} component={TrackQuestionsReport}/>
                    <Route strict exact path={`${match.url}/presentation_video_report`} component={PresentationVideoReport}/>
                    <Route strict exact path={`${match.url}/feedback_report`} component={FeedbackReport}/>
                    <Route strict exact path={`${match.url}/feedback_report/:group(track|speaker|presentation)/:group_id(\\d+)`} component={FeedbackGroupReport}/>
                    <Route strict exact path={`${match.url}/tag_report`} component={TagReport}/>
                    <Route strict exact path={`${match.url}/smart_speaker_report`} component={SmartSpeakerReport}/>
                    <Route component={NoMatchPage}/>
                </Switch>
            </div>
        );
    }

}

export default Restrict(withRouter(ReportsLayout), 'reports');


