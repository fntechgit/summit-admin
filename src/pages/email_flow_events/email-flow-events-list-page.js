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
 * */

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import { getSummitById } from "../../actions/summit-actions";
import { getEmailFlowEvents } from "../../actions/email-flows-events-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const EmailFlowEventListPage = ({
  currentSummit,
  emailFlowEvents,
  order,
  orderDir,
  totalEmailFlowEvents,
  currentPage,
  perPage,
  term,
  history,
  getEmailFlowEvents
}) => {
  useEffect(() => {
    if (currentSummit) {
      getEmailFlowEvents(term, currentPage, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const handleEdit = (row) => {
    history.push(
      `/app/summits/${currentSummit.id}/email-flow-events/${row.id}`
    );
  };

  const handleSearch = (newTerm) => {
    getEmailFlowEvents(newTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handlePageChange = (page) => {
    getEmailFlowEvents(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getEmailFlowEvents(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getEmailFlowEvents(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);
  };

  const columns = [
    {
      columnKey: "flow_name",
      header: T.translate("email_flow_event_list.flow_name"),
      sortable: true
    },
    {
      columnKey: "event_type_name",
      header: T.translate("email_flow_event_list.event_type_name"),
      cellSx: { maxWidth: 400 }
    },
    {
      columnKey: "email_template_identifier",
      header: T.translate("email_flow_event_list.email_template_identifier"),
      cellSx: { maxWidth: 400 }
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <div className="container">
      <h3>
        {T.translate("email_flow_event_list.email_flow_event_list")} (
        {totalEmailFlowEvents})
      </h3>

      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate("email_flow_event_list.placeholders.search")
        }}
      />

      {emailFlowEvents.length === 0 && (
        <div>{T.translate("email_flow_event_list.no_email_flow_events")}</div>
      )}

      {emailFlowEvents.length > 0 && (
        <MuiTable
          options={tableOptions}
          data={emailFlowEvents}
          columns={columns}
          currentPage={currentPage}
          perPage={perPage}
          totalRows={totalEmailFlowEvents}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, emailFlowEventsListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...emailFlowEventsListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEmailFlowEvents
})(EmailFlowEventListPage);
