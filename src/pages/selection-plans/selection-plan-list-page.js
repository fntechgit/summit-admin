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
import {
  deleteSelectionPlan,
  getSelectionPlans
} from "../../actions/selection-plan-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const SelectionPlanListPage = ({
  currentSummit,
  history,
  selectionPlans,
  totalSelectionPlans,
  perPage,
  term,
  order,
  orderDir,
  currentPage,
  getSelectionPlans,
  deleteSelectionPlan
}) => {
  useEffect(() => {
    if (currentSummit?.id) {
      getSelectionPlans(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const refreshSelectionPlans = () =>
    getSelectionPlans(term, currentPage, perPage, order, orderDir);

  const handleEdit = (selectionPlan) => {
    if (!selectionPlan?.id) return;
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${selectionPlan.id}`
    );
  };

  const handleDelete = (id) => {
    if (!id) return;

    deleteSelectionPlan(id)
      .then(() => refreshSelectionPlans())
      .catch(() => {});
  };

  const handleNew = () => {
    history.push(`/app/summits/${currentSummit.id}/selection-plans/new`);
  };

  const handleSort = (key, dir) => {
    getSelectionPlans(term, currentPage, perPage, key, dir);
  };

  const handlePageChange = (page) => {
    getSelectionPlans(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSelectionPlans(
      term,
      DEFAULT_CURRENT_PAGE,
      parseInt(newPerPage, 10),
      order,
      orderDir
    );
  };

  const handleSearch = (newTerm) => {
    getSelectionPlans(newTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("selection_plan_list.id"),
      width: 120,
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("selection_plan_list.name")
    },
    {
      columnKey: "type",
      header: T.translate("selection_plan_list.type")
    },
    {
      columnKey: "is_enabled",
      header: T.translate("selection_plan_list.is_enabled")
    },
    {
      columnKey: "is_hidden",
      header: T.translate("selection_plan_list.is_hidden")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>{T.translate("selection_plan_list.selection_plan_list")}</h3>

      <GridToolbar
        searchProps={{
          onSearch: handleSearch,
          term,
          placeholder: T.translate("selection_plan_list.placeholders.search")
        }}
      >
        <Button variant="contained" onClick={handleNew} startIcon={<AddIcon />}>
          {T.translate("selection_plan_list.add_selection_plan")}
        </Button>
      </GridToolbar>
      <Box sx={{ mb: 2 }}>{totalSelectionPlans} items</Box>

      {selectionPlans.length === 0 && (
        <div>{T.translate("selection_plan_list.no_selection_plans")}</div>
      )}

      {selectionPlans.length > 0 && (
        <div>
          <MuiTable
            data={selectionPlans}
            columns={columns}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalSelectionPlans}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteDialogBody={(name) =>
              `${T.translate("selection_plan_list.remove_warning")}${name}?`
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
  currentSelectionPlanListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSelectionPlanListState
});

export default connect(mapStateToProps, {
  getSelectionPlans,
  deleteSelectionPlan
})(SelectionPlanListPage);
