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
import {Switch, Route, Redirect} from 'react-router-dom';
import T from "i18n-react/dist/i18n-react";
import {connect} from "react-redux";
import { Breadcrumb } from 'react-breadcrumbs';
import Restrict from '../routes/restrict';
import EmailLogsListPage from "../pages/emails/email-log-list-page";

class EmailLogsLayout extends React.Component {

    render(){
        const { match, currentSummit } = this.props;

        return(
            <div>
                <Breadcrumb data={{ title: T.translate("email_logs.email_logs"), pathname: match.url }} />

                <Switch>
                    <Route exact strict path={`${match.url}`} component={EmailLogsListPage}/>                    
                    <Redirect to={`/app/email-logs`} />
                </Switch>
            </div>
        );
    }

}

const mapStateToProps = ({ currentSummitState }) => ({
    ...currentSummitState
});

export default Restrict(connect (mapStateToProps, {})(EmailLogsLayout), 'email-logs');


