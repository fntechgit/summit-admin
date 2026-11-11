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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import AddNewButton from "openstack-uicore-foundation/lib/components/mui/add-new-button";
import TicketTypeForm from "../../components/forms/ticket-type-form";
import {
  getTicketType,
  resetTicketTypeForm,
  saveTicketType
} from "../../actions/ticket-actions";
import { getBadgeTypes } from "../../actions/badge-actions";

const EditTicketTypePage = ({
  currentSummit,
  entity,
  errors,
  match,
  history,
  getTicketType,
  resetTicketTypeForm,
  saveTicketType,
  getBadgeTypes
}) => {
  const ticketTypeId = match.params.ticket_type_id;

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <h3>
          {title} {T.translate("edit_ticket_type.ticket_type")}
        </h3>
        {entity.id > 0 && (
          <AddNewButton
            onClick={() =>
              history.push(`/app/summits/${currentSummit.id}/ticket-types/new`)
            }
          />
        )}
      </Box>
      <hr />
      {currentSummit && (
        <TicketTypeForm
          entity={entity}
          errors={errors}
          currentSummit={currentSummit}
          onSubmit={saveTicketType}
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
