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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTableSortable from "openstack-uicore-foundation/lib/components/mui/sortable-table";
import SummitsDropdown from "openstack-uicore-foundation/lib/components/mui/summits-dropdown";
import { getSummitById } from "../../actions/summit-actions";
import {
  getEventCategories,
  deleteEventCategory,
  copyEventCategories,
  updateEventCategoryOrder
} from "../../actions/event-category-actions";

const columns = [
  { columnKey: "id", header: T.translate("general.id") },
  { columnKey: "name", header: T.translate("event_category_list.name") },
  { columnKey: "code", header: T.translate("event_category_list.code") },
  {
    columnKey: "color",
    header: T.translate("event_category_list.color"),
    render: (row) => (
      <Box component="div" dangerouslySetInnerHTML={{ __html: row.color }} />
    )
  }
];

const EventCategoryListPage = ({
  currentSummit,
  eventCategories,
  history,
  getEventCategories,
  deleteEventCategory,
  copyEventCategories,
  updateEventCategoryOrder
}) => {
  const [summitToCopy, setSummitToCopy] = useState(null);

  useEffect(() => {
    if (currentSummit) getEventCategories();
  }, [currentSummit?.id]);

  if (!currentSummit.id) return null;

  const handleEdit = (category) =>
    history.push(
      `/app/summits/${currentSummit.id}/event-categories/${category.id}`
    );

  const handleNew = () =>
    history.push(`/app/summits/${currentSummit.id}/event-categories/new`);

  const handleCopyCategories = () => copyEventCategories(summitToCopy);

  return (
    <div className="container">
      <h3> {T.translate("event_category_list.event_category_list")} </h3>
      <Grid2
        container
        size={{ xs: 12, m3: 6 }}
        spacing={1}
        sx={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          ml: "auto",
          mb: 2
        }}
      >
        <Grid2>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNew}
          >
            {T.translate("event_category_list.add_category")}
          </Button>
        </Grid2>
      </Grid2>

      <Grid2
        container
        size={{ xs: 12, m3: 6 }}
        spacing={1}
        sx={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          ml: "auto",
          mb: 2
        }}
      >
        <Grid2 size={{ xs: 12, sm: 3 }}>
          <SummitsDropdown
            label={T.translate("general.select_summit")}
            onChange={setSummitToCopy}
            summits={[]}
            excludeSummitIds={[currentSummit.id]}
          />
        </Grid2>
        <Grid2>
          <Button
            variant="outlined"
            disabled={!summitToCopy}
            onClick={handleCopyCategories}
          >
            {T.translate("event_category_list.copy_categories")}
          </Button>
        </Grid2>
      </Grid2>

      {eventCategories.length === 0 && (
        <div className="no-items">
          {T.translate("event_category_list.no_items")}
        </div>
      )}

      {eventCategories.length > 0 && (
        <MuiTableSortable
          data={eventCategories}
          columns={columns}
          getName={(category) => category.name}
          onEdit={handleEdit}
          onDelete={deleteEventCategory}
          deleteDialogBody={(name) =>
            `${T.translate("event_category_list.delete_warning")}${name}`
          }
          confirmButtonColor="error"
          onReorder={updateEventCategoryOrder}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentEventCategoryListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentEventCategoryListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getEventCategories,
  deleteEventCategory,
  copyEventCategories,
  updateEventCategoryOrder
})(EventCategoryListPage);
