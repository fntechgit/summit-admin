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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getEventTypes as getEventTypesAction,
  getEventType as getEventTypeAction,
  deleteEventType as deleteEventTypeAction,
  seedEventTypes as seedEventTypesAction,
  resetEventTypeForm as resetEventTypeFormAction,
  saveEventType as saveEventTypeAction
} from "../../actions/event-type-actions";
import {
  linkToPresentationType as linkToPresentationTypeAction,
  unlinkFromPresentationType as unlinkFromPresentationTypeAction,
  queryMediaUploads
} from "../../actions/media-upload-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import EventTypeDialog from "./components/event-type-dialog";

const EventTypeListPage = ({
  currentSummit,
  eventTypes,
  currentEventType,
  currentEventTypeErrors,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalEventTypes,
  getEventTypes,
  getEventType,
  deleteEventType,
  seedEventTypes,
  resetEventTypeForm,
  saveEventType,
  linkToPresentationType,
  unlinkFromPresentationType
}) => {
  const [openPopup, setOpenPopup] = useState(null);

  const getMediaUploads = (input, callback) => {
    if (!input) return Promise.resolve({ options: [] });
    return queryMediaUploads(currentSummit.id, input, callback);
  };

  useEffect(() => {
    getEventTypes();
  }, []);

  const handleEdit = (row) => {
    getEventType(row.id).then(() => setOpenPopup("eventTypeForm"));
  };

  const handleNew = () => {
    resetEventTypeForm();
    setOpenPopup("eventTypeForm");
  };

  // The dialog closes when this promise resolves, so it must track ONLY the
  // save: a failed list refresh after a successful create would otherwise keep
  // the dialog open and invite a duplicate-create retry.
  const handleSave = (eventTypeEntity) =>
    saveEventType(eventTypeEntity).then(() => {
      getEventTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir).catch(
        () => {}
      );
    });

  const handleDelete = (eventTypeId) => {
    deleteEventType(eventTypeId).then(() =>
      getEventTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handleSearch = (searchTerm) => {
    getEventTypes(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handlePageChange = (page) => {
    getEventTypes(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getEventTypes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getEventTypes(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);
  };

  // The seed endpoint returns only the created types; refetch so the table
  // reflects server-side pagination and ordering.
  const handleSeed = () =>
    seedEventTypes().then(() =>
      getEventTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );

  const columns = [
    {
      columnKey: "name",
      header: T.translate("event_type_list.name"),
      sortable: true
    },
    {
      columnKey: "class_name",
      header: T.translate("event_type_list.class")
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("event_type_list.event_type_list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalEventTypes} {T.translate("event_type_list.event_types")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
          <Button
            variant="outlined"
            onClick={handleSeed}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("event_type_list.seed_event_types")}
          </Button>
          <Button
            variant="contained"
            onClick={handleNew}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("event_type_list.add_event_type")}
          </Button>
        </Grid2>
      </Grid2>

      {eventTypes.length > 0 && (
        <MuiTable
          columns={columns}
          data={eventTypes}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalEventTypes}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canDelete={(row) => !row.is_default}
          deleteDialogBody={(name) =>
            `${T.translate("event_type_list.remove_warning")} ${name}`
          }
          confirmButtonColor="error"
        />
      )}

      {eventTypes.length === 0 && (
        <div>{T.translate("event_type_list.no_items")}</div>
      )}

      {openPopup === "eventTypeForm" && (
        <EventTypeDialog
          currentSummit={currentSummit}
          entity={currentEventType}
          errors={currentEventTypeErrors}
          onClose={() => setOpenPopup(null)}
          onSave={handleSave}
          getMediaUploads={getMediaUploads}
          onMediaUploadLink={linkToPresentationType}
          onMediaUploadUnLink={unlinkFromPresentationType}
        />
      )}
    </div>
  );
};

EventTypeListPage.propTypes = {
  currentSummit: PropTypes.shape({ id: PropTypes.number }).isRequired,
  eventTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      class_name: PropTypes.string,
      is_default: PropTypes.bool
    })
  ).isRequired,
  currentEventType: PropTypes.shape({ id: PropTypes.number }).isRequired,
  currentEventTypeErrors: PropTypes.shape({}),
  term: PropTypes.string,
  currentPage: PropTypes.number,
  perPage: PropTypes.number,
  order: PropTypes.string,
  orderDir: PropTypes.number,
  totalEventTypes: PropTypes.number,
  getEventTypes: PropTypes.func.isRequired,
  getEventType: PropTypes.func.isRequired,
  deleteEventType: PropTypes.func.isRequired,
  seedEventTypes: PropTypes.func.isRequired,
  resetEventTypeForm: PropTypes.func.isRequired,
  saveEventType: PropTypes.func.isRequired,
  linkToPresentationType: PropTypes.func.isRequired,
  unlinkFromPresentationType: PropTypes.func.isRequired
};

EventTypeListPage.defaultProps = {
  currentEventTypeErrors: {},
  term: "",
  currentPage: 1,
  perPage: 10,
  order: "id",
  orderDir: 1,
  totalEventTypes: 0
};

const mapStateToProps = ({
  currentSummitState,
  currentEventTypeListState,
  currentEventTypeState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventTypeListState,
  currentEventType: currentEventTypeState.entity,
  currentEventTypeErrors: currentEventTypeState.errors
});

export default connect(mapStateToProps, {
  getEventTypes: getEventTypesAction,
  getEventType: getEventTypeAction,
  deleteEventType: deleteEventTypeAction,
  seedEventTypes: seedEventTypesAction,
  resetEventTypeForm: resetEventTypeFormAction,
  saveEventType: saveEventTypeAction,
  linkToPresentationType: linkToPresentationTypeAction,
  unlinkFromPresentationType: unlinkFromPresentationTypeAction
})(EventTypeListPage);
