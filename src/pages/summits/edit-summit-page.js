/**
 * Copyright 2026 OpenStack Foundation
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
import Swal from "sweetalert2";
import Restrict from "../../routes/restrict";
import SummitForm from "../../components/forms/summit-form";
import {
  getSummitById,
  resetSummitForm,
  saveSummit,
  attachLogo,
  deleteLogo,
  saveRegistrationLiteMarketingSettings,
  savePrintAppMarketingSettings,
  generateEncryptionKey
} from "../../actions/summit-actions";
import { deleteRoomBookingAttributeType } from "../../actions/room-booking-actions";
import {
  addHelpMember,
  removeHelpMember,
  getUserRolesBySummit
} from "../../actions/user-chat-roles-actions";
import {
  deleteRegFeedMetadata,
  getRegFeedMetadataBySummit
} from "../../actions/reg-feed-metadata-actions";
import {
  getMarketingSettingsForPrintApp,
  getMarketingSettingsForRegLite
} from "../../actions/marketing-actions";
import "../../styles/edit-summit-page.less";
import "../../components/form-validation/validate.less";

class EditSummitPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleAttributeTypeDelete = this.handleAttributeTypeDelete.bind(this);
    this.handleRegFeedMetadataDelete =
      this.handleRegFeedMetadataDelete.bind(this);
  }

  componentDidMount() {
    const { summitId, resetSummitForm } = this.props;

    if (summitId) {
      this.props.getUserRolesBySummit();
      this.props.getMarketingSettingsForRegLite();
      this.props.getMarketingSettingsForPrintApp();
      this.props.getRegFeedMetadataBySummit();
    } else {
      resetSummitForm();
    }
  }

  componentDidUpdate(prevProps) {
    const oldId = prevProps.summitId;
    const newId = this.props.summitId;

    if (newId !== oldId && !newId) {
      this.props.resetSummitForm();
    }
  }

  handleRegFeedMetadataDelete(regFeedMetadataId) {
    const {
      currentRegFeedMetadataListSettings: { regFeedMetadata },
      deleteRegFeedMetadata
    } = this.props;
    const feedMetadata = regFeedMetadata.find(
      (sp) => sp.id === regFeedMetadataId
    );

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("edit_summit.remove_reg_feed_metadata_warning")} ${
        feedMetadata.key
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        console.log("key delete", regFeedMetadataId);
        deleteRegFeedMetadata(regFeedMetadataId);
      }
    });
  }

  handleAttributeTypeDelete(attributeTypeId) {
    const { deleteRoomBookingAttributeType, currentSummit } = this.props;
    const roomBookingType =
      currentSummit.meeting_booking_room_allowed_attributes.find(
        (rb) => rb.id === attributeTypeId
      );

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("room_bookings.delete_booking_attribute_warning")} ${
        roomBookingType.type
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteRoomBookingAttributeType(attributeTypeId);
      }
    });
  }

  render() {
    const {
      currentSummit,
      attachLogo,
      deleteLogo,
      errors,
      history,
      timezones,
      currentSummitRegLiteMarketingSettings,
      currentSummitPrintAppMarketingSettings,
      currentRegFeedMetadataListSettings
    } = this.props;

    return (
      <div className="container">
        <h3>{T.translate("general.summit")}</h3>
        <hr />
        <SummitForm
          history={history}
          entity={currentSummit}
          regLiteMarketingSettings={currentSummitRegLiteMarketingSettings}
          printAppMarketingSettings={currentSummitPrintAppMarketingSettings}
          regFeedMetadataListSettings={currentRegFeedMetadataListSettings}
          timezones={timezones}
          errors={errors}
          onSubmit={this.props.saveSummit}
          onRegFeedMetadataDelete={this.handleRegFeedMetadataDelete}
          onAttributeTypeDelete={this.handleAttributeTypeDelete}
          onLogoAttach={attachLogo}
          onLogoDelete={deleteLogo}
          onAddHelpMember={this.props.addHelpMember}
          onDeleteHelpMember={this.props.removeHelpMember}
          saveRegistrationLiteMarketingSettings={
            this.props.saveRegistrationLiteMarketingSettings
          }
          savePrintAppMarketingSettings={
            this.props.savePrintAppMarketingSettings
          }
          generateEncryptionKey={this.props.generateEncryptionKey}
        />
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  baseState,
  currentRegFeedMetadataListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  currentSummitRegLiteMarketingSettings:
    currentSummitState.reg_lite_marketing_settings,
  currentSummitPrintAppMarketingSettings:
    currentSummitState.print_app_marketing_settings,
  currentRegFeedMetadataListSettings: currentRegFeedMetadataListState,
  errors: currentSummitState.errors,
  timezones: baseState.timezones
});

export default Restrict(
  connect(mapStateToProps, {
    getSummitById,
    saveSummit,
    resetSummitForm,
    deleteRoomBookingAttributeType,
    deleteRegFeedMetadata,
    attachLogo,
    deleteLogo,
    addHelpMember,
    removeHelpMember,
    saveRegistrationLiteMarketingSettings,
    savePrintAppMarketingSettings,
    generateEncryptionKey,
    getMarketingSettingsForRegLite,
    getMarketingSettingsForPrintApp,
    getRegFeedMetadataBySummit,
    getUserRolesBySummit
  })(EditSummitPage),
  "summit-edit"
);
