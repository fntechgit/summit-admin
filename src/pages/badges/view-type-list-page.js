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
import GridToolbar from "../../components/mui/grid-toolbar";
import { getSummitById } from "../../actions/summit-actions";
import { getViewTypes, deleteViewType } from "../../actions/badge-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const ViewTypeListPage = ({
  currentSummit,
  history,
  viewTypes,
  totalViewTypes,
  term,
  perPage,
  currentPage,
  order,
  orderDir,
  getViewTypes,
  deleteViewType
}) => {
  useEffect(() => {
    if (currentSummit) {
      getViewTypes();
    }
  }, []);

  const handleEdit = (viewType) =>
    history.push(`/app/summits/${currentSummit.id}/view-types/${viewType.id}`);

  const handleDelete = (viewTypeId) =>
    deleteViewType(viewTypeId)
      .then(() =>
        getViewTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
      )
      .catch(() => {});

  const handleSort = (key, dir) =>
    getViewTypes(term, DEFAULT_CURRENT_PAGE, perPage, key, dir);

  const handlePageChange = (page) =>
    getViewTypes(term, page, perPage, order, orderDir);

  const handlePerPageChange = (newPerPage) =>
    getViewTypes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);

  const handleSearch = (searchTerm) =>
    getViewTypes(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);

  const handleNewViewType = () =>
    history.push(`/app/summits/${currentSummit.id}/view-types/new`);

  const columns = [
    {
      columnKey: "name",
      header: T.translate("view_type_list.name"),
      sortable: true
    },
    {
      columnKey: "is_default",
      header: T.translate("view_type_list.is_default"),
      render: (vt) => (vt.is_default === true ? "Yes" : "No")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3> {T.translate("view_type_list.view_types")}</h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate(
            "view_type_list.placeholders.search_view_type"
          )
        }}
      >
        <Button
          variant="contained"
          onClick={handleNewViewType}
          startIcon={<AddIcon />}
        >
          {T.translate("view_type_list.add_view_type")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>
        {totalViewTypes} {T.translate("view_type_list.view_types")}
      </Box>

      {viewTypes.length === 0 && (
        <div>{T.translate("view_type_list.no_view_type")}</div>
      )}

      {viewTypes.length > 0 && (
        <div>
          <MuiTable
            options={table_options}
            data={viewTypes}
            columns={columns}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalViewTypes}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getName={(row) => row.name}
            deleteDialogBody={(name) =>
              T.translate("view_type_list.remove_warning", { name })
            }
            confirmButtonColor="error"
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, currentViewTypeListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentViewTypeListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getViewTypes,
  deleteViewType
})(ViewTypeListPage);
