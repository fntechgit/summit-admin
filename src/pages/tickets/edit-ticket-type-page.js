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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import TicketTypeForm from "../../components/forms/ticket-type-form";
import {
  getTicketType,
  resetTicketTypeForm,
  saveTicketType
} from "../../actions/ticket-actions";
import { getBadgeTypes } from "../../actions/badge-actions";
import AddNewButtonMui from "../../components/buttons/add-new-button-mui";

const EditTicketTypePage = ({
  currentSummit,
  entity,
  errors,
  match,
  getTicketType,
  resetTicketTypeForm,
  saveTicketType,
  getBadgeTypes
}) => {
  const ticketTypeId = match.params.ticket_type_id;
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentSummit && !currentSummit.badge_types) {
      getBadgeTypes();
    }
  }, []);

  useEffect(() => {
    if (!ticketTypeId) {
      resetTicketTypeForm();
    } else {
      getTicketType(ticketTypeId);
    }
  }, [ticketTypeId]);

  const onSave = (values) => {
    if (isSaving) return Promise.resolve();
    setIsSaving(true);
    return saveTicketType(values)
      .catch(() => {})
      .finally(() => setIsSaving(false));
  };

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");
  const breadcrumb = entity.id ? entity.name : T.translate("general.new");

  // set entity currency
  entity.currency =
    entity.currency || currentSummit.default_ticket_type_currency;

  return (
    <div className="container">
      <Breadcrumb data={{ title: breadcrumb, pathname: match.url }} />
      <h3>
        {title} {T.translate("edit_ticket_type.ticket_type")}
        <AddNewButtonMui entity={entity} />
      </h3>
      <hr />
      {currentSummit && (
        <TicketTypeForm
          entity={entity}
          errors={errors}
          currentSummit={currentSummit}
          isSaving={isSaving}
          onSubmit={onSave}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, currentTicketTypeState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentTicketTypeState
});

export default connect(mapStateToProps, {
  getTicketType,
  resetTicketTypeForm,
  saveTicketType,
  getBadgeTypes
})(EditTicketTypePage);
