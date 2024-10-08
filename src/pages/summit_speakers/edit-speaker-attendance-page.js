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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import SpeakerAttendanceForm from "../../components/forms/speaker-attendance-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getAttendance,
  resetAttendanceForm,
  sendAttendanceEmail,
  saveAttendance
} from "../../actions/speaker-actions";
import "../../styles/edit-speaker-attendance-page.less";
import AddNewButton from "../../components/buttons/add-new-button";

class EditSpeakerAttendancePage extends React.Component {
  constructor(props) {
    const attendanceId = props.match.params.attendance_id;
    super(props);

    if (!attendanceId) {
      props.resetAttendanceForm();
    } else {
      props.getAttendance(attendanceId);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.attendance_id;
    const newId = this.props.match.params.attendance_id;

    if (newId !== oldId) {
      if (!newId) {
        this.props.resetAttendanceForm();
      } else {
        this.props.getAttendance(newId);
      }
    }
  }

  render() {
    const { currentSummit, entity, errors, match } = this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    let breadcrumb = T.translate("general.new");

    if (entity.id) {
      breadcrumb = entity.id;

      if (entity.speaker) {
        breadcrumb = `${entity.speaker.first_name} ${entity.speaker.last_name}`;
      }
    }

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_speaker_attendance.speaker_attendance")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <SpeakerAttendanceForm
            history={this.props.history}
            currentSummit={currentSummit}
            entity={entity}
            errors={errors}
            onSendEmail={this.props.sendAttendanceEmail}
            onSubmit={this.props.saveAttendance}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentSpeakerAttendanceState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSpeakerAttendanceState
});

export default connect(mapStateToProps, {
  getSummitById,
  getAttendance,
  resetAttendanceForm,
  sendAttendanceEmail,
  saveAttendance
})(EditSpeakerAttendancePage);
