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

import React, { useCallback, useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Grid2 from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import {
  deleteSelectionPlan,
  getSelectionPlan,
  getSelectionPlans,
  resetSelectionPlanForm,
  saveSelectionPlan,
  saveSelectionPlanSettings
} from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";
import { DEFAULT_CURRENT_PAGE, MAX_PER_PAGE } from "../../utils/constants";
import SelectionPlanPopup from "./selection-plan-popup";

const SelectionPlanListPage = ({
  currentSummit,
  history,
  selectionPlans,
  currentSelectionPlan,
  totalSelectionPlans,
  perPage,
  term,
  order,
  orderDir,
  currentPage,
  getSelectionPlan,
  getSelectionPlans,
  resetSelectionPlanForm,
  getMarketingSettingsBySelectionPlan,
  deleteSelectionPlan,
  saveSelectionPlan,
  saveSelectionPlanSettings
}) => {
  const [openSelectionPlanPopup, setOpenSelectionPlanPopup] = useState(false);

  const openEditModal = useCallback(
    (selectionPlanId) => {
      if (!selectionPlanId) return;

      getSelectionPlan(selectionPlanId)
        .then(() =>
          getMarketingSettingsBySelectionPlan(
            selectionPlanId,
            null,
            DEFAULT_CURRENT_PAGE,
            MAX_PER_PAGE
          )
        )
        .then(() => setOpenSelectionPlanPopup(true));
    },
    [getMarketingSettingsBySelectionPlan, getSelectionPlan]
  );

  useEffect(() => {
    if (currentSummit?.id) {
      getSelectionPlans(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const refreshSelectionPlans = () =>
    getSelectionPlans(term, currentPage, perPage, order, orderDir);

  const handleEdit = (selectionPlan) => {
    if (!selectionPlan?.id) return;
    openEditModal(selectionPlan.id);
  };

  const handleDelete = (id) => {
    if (!id) return;

    deleteSelectionPlan(id)
      .then(() => refreshSelectionPlans())
      .catch(() => {});
  };

  const handleNew = () => {
    resetSelectionPlanForm();
    setOpenSelectionPlanPopup(true);
  };

  const handleClosePopup = () => {
    resetSelectionPlanForm();
    setOpenSelectionPlanPopup(false);
  };

  const handleSave = (entity) =>
    saveSelectionPlan(entity)
      .then((savedEntity) => {
        if (!savedEntity?.id) return null;
        return saveSelectionPlanSettings(
          entity.marketing_settings ?? {},
          savedEntity.id
        );
      })
      .then(() => refreshSelectionPlans());

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

      <Grid2
        container
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Grid2 size={{ xs: 12, md: 2 }}>
          <span>{totalSelectionPlans} items</span>
        </Grid2>
        <Grid2
          container
          size={{ xs: 12, md: 10 }}
          spacing={1}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <Grid2 size={{ xs: 12, md: 4 }}>
            <SearchInput
              onSearch={handleSearch}
              term={term}
              placeholder={T.translate(
                "selection_plan_list.placeholders.search"
              )}
            />
          </Grid2>
          <Grid2>
            <Button
              variant="contained"
              onClick={handleNew}
              startIcon={<AddIcon />}
            >
              {T.translate("selection_plan_list.add_selection_plan")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

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

      {openSelectionPlanPopup && (
        <SelectionPlanPopup
          isEditing={!!currentSelectionPlan?.id}
          onClose={handleClosePopup}
          onSave={handleSave}
          history={history}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSelectionPlanListState,
  currentSelectionPlanState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSelectionPlanListState,
  currentSelectionPlan: currentSelectionPlanState.entity
});

export default connect(mapStateToProps, {
  getSelectionPlans,
  getSelectionPlan,
  resetSelectionPlanForm,
  getMarketingSettingsBySelectionPlan,
  deleteSelectionPlan,
  saveSelectionPlan,
  saveSelectionPlanSettings
})(SelectionPlanListPage);
