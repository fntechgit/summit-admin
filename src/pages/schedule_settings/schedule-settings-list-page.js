/**
 * Copyright 2019 OpenStack Foundation
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
import { connect } from 'react-redux';
import T from 'i18n-react/dist/i18n-react';
import Swal from "sweetalert2";
import { Table } from 'openstack-uicore-foundation/lib/components';
import { getScheduleSettings, deleteScheduleSetting } from "../../actions/schedule-settings-actions";

class ScheduleSettingsListPage extends React.Component {
    componentDidMount() {
        const {currentSummit} = this.props;
        if(currentSummit) {
            this.props.getScheduleSettings();
        }
    }

    handleEdit = (schedule_settings_id) => {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/schedule-settings/${schedule_settings_id}`);
    }

    handleDelete = (scheduleSettingId) => {
        const {deleteScheduleSetting, scheduleSettings} = this.props;
        let scheduleSetting = scheduleSettings.find(t => t.id === scheduleSettingId);

        Swal.fire({
            title: T.translate("general.are_you_sure"),
            text: T.translate("schedule_settings_list.remove_warning") + ' ' + scheduleSetting.key,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: T.translate("general.yes_delete")
        }).then(function(result){
            if (result.value) {
                deleteScheduleSetting(scheduleSettingId);
            }
        });
    }

    handleSort = (index, key, dir, func) => {
        this.props.getScheduleSettings(key, dir);
    }

    handleNewScheduleSetting = (ev) => {
        const {currentSummit, history} = this.props;
        history.push(`/app/summits/${currentSummit.id}/schedule-settings/new`);
    }

    render(){
        const {currentSummit, scheduleSettings, order, orderDir, totalScheduleSettings} = this.props;

        const columns = [
            { columnKey: 'key', value: T.translate("schedule_settings_list.key"), sortable: true },
            { columnKey: 'is_enabled_str', value: T.translate("schedule_settings_list.is_enabled") },
            { columnKey: 'is_my_schedule_str', value: T.translate("schedule_settings_list.is_my_schedule") },
            { columnKey: 'is_access_level_str', value: T.translate("schedule_settings_list.access_level_only") },
        ];

        const table_options = {
            sortCol: order,
            sortDir: orderDir,
            actions: {
                edit: { onClick: this.handleEdit },
                delete: { onClick: this.handleDelete }
            }
        }

        if(!currentSummit.id) return null;

        return(
            <div className="container">
                <h3> {T.translate("schedule_settings_list.schedule_settings")} ({totalScheduleSettings})</h3>
                <div className="row">
                    <div className="col-md-6 text-right col-md-offset-6">
                        <button className="btn btn-primary right-space" onClick={this.handleNewScheduleSetting}>
                            {T.translate("schedule_settings_list.add_schedule_settings")}
                        </button>
                    </div>
                </div>

                {scheduleSettings.length === 0 &&
                <div>{T.translate("schedule_settings_list.no_schedule_settings")}</div>
                }

                {scheduleSettings.length > 0 &&
                    <Table
                        options={table_options}
                        data={scheduleSettings}
                        columns={columns}
                        onSort={this.handleSort}
                    />
                }

            </div>
        )
    }
}

const mapStateToProps = ({ currentSummitState, scheduleSettingsListState }) => ({
    currentSummit   : currentSummitState.currentSummit,
    ...scheduleSettingsListState
})

export default connect (
    mapStateToProps,
    {
        getScheduleSettings,
        deleteScheduleSetting
    }
)(ScheduleSettingsListPage);
