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
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import { getBadgeTypes, deleteBadgeType } from "../../actions/badge-actions";

const BadgeTypeListPage = ({
  currentSummit,
  history,
  badgeTypes,
  order,
  orderDir,
  totalBadgeTypes,
  getBadgeTypes,
  deleteBadgeType
}) => {
  useEffect(() => {
    if (currentSummit?.id) getBadgeTypes();
  }, [currentSummit?.id]);

  const handleEdit = (badge_type) =>
    history.push(
      `/app/summits/${currentSummit.id}/badge-types/${badge_type.id}`
    );

  const handleDelete = (badgeTypeId) =>
    deleteBadgeType(badgeTypeId)
      .then(() => getBadgeTypes(order, orderDir))
      .catch(() => {});

  const handleSort = (key, dir) => getBadgeTypes(key, dir);

  const handleNewBadgeType = () =>
    history.push(`/app/summits/${currentSummit.id}/badge-types/new`);

  const columns = [
    {
      columnKey: "name",
      header: T.translate("badge_type_list.name"),
      sortable: true
    },
    {
      columnKey: "is_default",
      header: T.translate("badge_type_list.is_default"),
      render: (row) =>
        row.is_default ? T.translate("general.yes") : T.translate("general.no")
    },
    {
      columnKey: "description",
      header: T.translate("badge_type_list.description")
    },
    {
      columnKey: "access_level_names",
      header: T.translate("badge_type_list.access_levels")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <h3> {T.translate("badge_type_list.badge_type_list")}</h3>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleNewBadgeType}
          startIcon={<AddIcon />}
        >
          {T.translate("badge_type_list.add_badge_type")}
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        {totalBadgeTypes} {T.translate("badge_type_list.badge_types")}
      </Box>

      {badgeTypes.length === 0 && (
        <div>{T.translate("badge_type_list.no_badge_types")}</div>
      )}

      {badgeTypes.length > 0 && (
        <div>
          <MuiTable
            options={table_options}
            data={badgeTypes}
            columns={columns}
            totalRows={totalBadgeTypes}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getName={(row) => row.name}
            deleteDialogBody={(name) =>
              `${T.translate("badge_type_list.remove_warning", { name })}`
            }
            confirmButtonColor="error"
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentBadgeTypeListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentBadgeTypeListState
});

export default connect(mapStateToProps, {
  getBadgeTypes,
  deleteBadgeType
})(BadgeTypeListPage);
