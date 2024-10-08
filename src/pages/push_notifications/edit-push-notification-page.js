/**
 * Copyright 2018 OpenStack Foundation
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
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import PushNotificationForm from "../../components/forms/push-notification-form";
import { getSummitById } from "../../actions/summit-actions";
import {
  getPushNotification,
  resetPushNotificationForm,
  savePushNotification
} from "../../actions/push-notification-actions";
import AddNewButton from "../../components/buttons/add-new-button";

class EditPushNotificationPage extends React.Component {
  constructor(props) {
    const pushNotificationId = props.match.params.push_notification_id;
    super(props);

    if (!pushNotificationId) {
      props.resetPushNotificationForm();
    } else {
      props.getPushNotification(pushNotificationId);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const oldId = prevProps.match.params.push_notification_id;
    const newId = this.props.match.params.push_notification_id;

    if (newId !== oldId) {
      if (!newId) {
        this.props.resetPushNotificationForm();
      } else {
        this.props.getPushNotification(newId);
      }
    }
  }

  render() {
    const { currentSummit, entity, errors, match, channels, platforms } =
      this.props;
    const title = entity.id
      ? T.translate("general.edit")
      : T.translate("general.add");
    const breadcrumb = entity.id ? entity.id : T.translate("general.new");

    return (
      <div className="container">
        <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
        <h3>
          {title} {T.translate("edit_push_notification.push_notification")}
          <AddNewButton entity={entity} />
        </h3>
        <hr />
        {currentSummit && (
          <PushNotificationForm
            history={this.props.history}
            currentSummit={currentSummit}
            entity={entity}
            errors={errors}
            channels={channels}
            platforms={platforms}
            onSubmit={this.props.savePushNotification}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentPushNotificationListState,
  currentPushNotificationState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  channels: currentPushNotificationListState.channels,
  platforms: currentPushNotificationListState.platforms,
  ...currentPushNotificationState
});

export default connect(mapStateToProps, {
  getSummitById,
  getPushNotification,
  resetPushNotificationForm,
  savePushNotification
})(EditPushNotificationPage);
