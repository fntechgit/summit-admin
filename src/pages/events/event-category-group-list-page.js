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
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getEventCategoryGroups,
  getEventCategoryGroup,
  getEventCategoryGroupMeta,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  deleteEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup
} from "../../actions/event-category-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import EventCategoryGroupDialog from "./components/event-category-group-dialog";

const EventCategoryGroupListPage = ({
  currentSummit,
  eventCategoryGroups,
  currentEntity,
  allClasses,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalEventCategoryGroups,
  getEventCategoryGroups,
  getEventCategoryGroup,
  getEventCategoryGroupMeta,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  deleteEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup
}) => {
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (currentSummit?.id) {
      getEventCategoryGroups();
    }
  }, [currentSummit?.id]);

  useEffect(() => {
    if (currentSummit && allClasses.length === 0) {
      getEventCategoryGroupMeta();
    }
  }, [currentSummit]);

  const handleNew = () => {
    resetEventCategoryGroupForm();
    setOpenDialog(true);
  };

  const handleEdit = (row) => {
    getEventCategoryGroup(row.id).then(() => setOpenDialog(true));
  };

  const handleClose = () => {
    resetEventCategoryGroupForm();
    setOpenDialog(false);
  };

  const handleSave = (entity) =>
    saveEventCategoryGroup(entity).then(() => {
      getEventCategoryGroups(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      );
    });

  const handleDelete = (groupId) => {
    deleteEventCategoryGroup(groupId).then(() =>
      getEventCategoryGroups(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir
      )
    );
  };

  const handleSearch = (searchTerm) => {
    getEventCategoryGroups(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handlePageChange = (page) => {
    getEventCategoryGroups(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getEventCategoryGroups(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    getEventCategoryGroups(term, currentPage, perPage, key, dir);
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("general.id"),
      width: 60,
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("event_category_group_list.name"),
      width: 160,
      sortable: true
    },
    {
      columnKey: "type",
      header: T.translate("event_category_group_list.type"),
      width: 90
    },
    {
      columnKey: "categories",
      header: T.translate("event_category_group_list.categories")
    },
    {
      columnKey: "color",
      header: T.translate("event_category_group_list.color"),
      width: 70,
      render: (row) => (
        <Box
          sx={{
            width: 24,
            height: 24,
            backgroundColor: `#${row.color}`,
            borderRadius: 1
          }}
        />
      )
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {T.translate("event_category_group_list.event_category_group_list")}
      </h3>
      <Grid2
        container
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalEventCategoryGroups}{" "}
            {T.translate("event_category_group_list.event_category_groups")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <Grid2 size={4}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
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
            {T.translate("event_category_group_list.add_category_group")}
          </Button>
        </Grid2>
      </Grid2>

      {eventCategoryGroups.length > 0 && (
        <MuiTable
          columns={columns}
          data={eventCategoryGroups}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalEventCategoryGroups}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getName={(row) => row.name}
          deleteDialogBody={(name) =>
            `${T.translate("event_category_group_list.delete_warning")} ${name}`
          }
          confirmButtonColor="error"
        />
      )}

      {eventCategoryGroups.length === 0 && (
        <div>{T.translate("event_category_group_list.no_items")}</div>
      )}

      {openDialog && (
        <EventCategoryGroupDialog
          entity={currentEntity}
          allClasses={allClasses}
          currentSummit={currentSummit}
          onSave={handleSave}
          onClose={handleClose}
          onTrackLink={addCategoryToGroup}
          onTrackUnLink={removeCategoryFromGroup}
          onAllowedGroupLink={addAllowedGroupToGroup}
          onAllowedGroupUnLink={removeAllowedGroupFromGroup}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventCategoryGroupListState,
  currentEventCategoryGroupState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventCategoryGroupListState,
  currentEntity: currentEventCategoryGroupState.entity,
  allClasses: currentEventCategoryGroupState.allClasses
});

export default connect(mapStateToProps, {
  getEventCategoryGroups,
  getEventCategoryGroup,
  getEventCategoryGroupMeta,
  resetEventCategoryGroupForm,
  saveEventCategoryGroup,
  deleteEventCategoryGroup,
  addCategoryToGroup,
  removeCategoryFromGroup,
  addAllowedGroupToGroup,
  removeAllowedGroupFromGroup
})(EventCategoryGroupListPage);
