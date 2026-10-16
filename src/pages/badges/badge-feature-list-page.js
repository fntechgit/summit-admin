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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import {
  getBadgeFeatures,
  deleteBadgeFeature
} from "../../actions/badge-actions";

const BadgeFeatureListPage = ({
  currentSummit,
  badgeFeatures,
  order,
  orderDir,
  totalBadgeFeatures,
  history,
  getBadgeFeatures,
  deleteBadgeFeature
}) => {
  useEffect(() => {
    getBadgeFeatures();
  }, []);

  const handleEdit = (row) => {
    history.push(`/app/summits/${currentSummit.id}/badge-features/${row.id}`);
  };

  const handleSort = (key, dir) => {
    getBadgeFeatures(key, dir);
  };

  const handleNewBadgeFeature = () => {
    history.push(`/app/summits/${currentSummit.id}/badge-features/new`);
  };

  const columns = [
    {
      columnKey: "name",
      header: T.translate("badge_feature_list.name"),
      sortable: true
    },
    {
      columnKey: "description",
      header: T.translate("badge_feature_list.description"),
      // description is Jodit HTML; legacy Table injected it, MuiTable renders text
      render: (row) => (
        <Box dangerouslySetInnerHTML={{ __html: row.description }} />
      )
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <Box className="container">
      <Typography variant="h5" component="h3" sx={{ my: 2 }}>
        {T.translate("badge_feature_list.badge_feature_list")} (
        {totalBadgeFeatures})
      </Typography>
      <GridToolbar>
        <Button
          variant="contained"
          onClick={handleNewBadgeFeature}
          startIcon={<AddIcon />}
        >
          {T.translate("badge_feature_list.add_badge_feature")}
        </Button>
      </GridToolbar>

      {/* no pagination props: keeps the single page-1/per_page-100 fetch */}
      <MuiTable
        options={tableOptions}
        data={badgeFeatures}
        columns={columns}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={deleteBadgeFeature}
        deleteDialogBody={(name) =>
          `${T.translate("badge_feature_list.remove_warning")} ${name}`
        }
      />
    </Box>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentBadgeFeatureListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentBadgeFeatureListState
});

export default connect(mapStateToProps, {
  getBadgeFeatures,
  deleteBadgeFeature
})(BadgeFeatureListPage);
