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
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import {
  Table,
  FreeTextSearch
} from "openstack-uicore-foundation/lib/components";
import {
  deleteSelectionPlan,
  getSelectionPlans
} from "../../actions/selection-plan-actions";

const SelectionPlanListPage = ({
  currentSummit,
  history,
  selectionPlans,
  totalSelectionPlans,
  term,
  order,
  orderDir,
  lastPage,
  currentPage,
  getSelectionPlans,
  deleteSelectionPlan
}) => {
  useEffect(() => {
    getSelectionPlans();
  }, []);

  const handleEdit = (selectionPlanId) => {
    history.push(
      `/app/summits/${currentSummit.id}/selection-plans/${selectionPlanId}`
    );
  };

  const handleDelete = (selectionPlanId) => {
    const selectionPlan = selectionPlans.find((s) => s.id === selectionPlanId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("selection_plan_list.remove_warning")} ${
        selectionPlan.name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteSelectionPlan(selectionPlanId);
      }
    });
  };

  const handleNew = () => {
    history.push(`/app/summits/${currentSummit.id}/selection-plans/new`);
  };

  const handleSort = (index, key, dir) => {
    getSelectionPlans(term, currentPage, key, dir);
  };

  const handlePageChange = (newPage) => {
    getSelectionPlans(term, newPage, order, orderDir);
  };

  const handleSearch = (newTerm) => {
    getSelectionPlans(newTerm, 1, order, orderDir);
  };

  const columns = [
    { columnKey: "id", value: T.translate("selection_plan_list.id") },
    {
      columnKey: "name",
      value: T.translate("selection_plan_list.name")
    },
    {
      columnKey: "type",
      value: T.translate("selection_plan_list.type")
    },
    {
      columnKey: "is_enabled",
      value: T.translate("selection_plan_list.is_enabled")
    },
    {
      columnKey: "is_hidden",
      value: T.translate("selection_plan_list.is_hidden")
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir,
    actions: {
      edit: { onClick: handleEdit },
      delete: { onClick: handleDelete }
    }
  };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("selection_plan_list.selection_plan_list")} (
        {totalSelectionPlans})
      </h3>

      <div className="row">
        <div className="col-md-6">
          <FreeTextSearch
            value={term}
            placeholder={T.translate("selection_plan_list.placeholders.search")}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <button className="btn btn-primary right-space" onClick={handleNew}>
            {T.translate("selection_plan_list.add_selection_plan")}
          </button>
        </div>
      </div>
      {selectionPlans.length === 0 && (
        <div>{T.translate("selection_plan_list.no_selection_plans")}</div>
      )}

      {selectionPlans.length > 0 && (
        <div>
          <Table
            options={tableOptions}
            data={selectionPlans}
            columns={columns}
            onSort={handleSort}
          />
          <Pagination
            bsSize="medium"
            prev
            next
            first
            last
            ellipsis
            boundaryLinks
            maxButtons={10}
            items={lastPage}
            activePage={currentPage}
            onSelect={handlePageChange}
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
