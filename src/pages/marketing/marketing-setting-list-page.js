/**
 * Copyright 2017 OpenStack Foundation
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
import SummitDropdown from "../../components/summit-dropdown";
import showConfirmDialog from "../../components/mui/showConfirmDialog";
import { getSummitById } from "../../actions/summit-actions";
import {
  getMarketingSettings,
  deleteSetting,
  cloneMarketingSettings
} from "../../actions/marketing-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const wrapLongText = (value) => (
  <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
    {value}
  </div>
);

const MarketingSettingListPage = ({
  currentSummit,
  settings,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalSettings,
  history,
  getMarketingSettings,
  deleteSetting,
  cloneMarketingSettings
}) => {
  useEffect(() => {
    if (currentSummit) {
      getMarketingSettings(term, currentPage, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const handleEdit = (row) => {
    history.push(`/app/summits/${currentSummit.id}/marketing/${row.id}`);
  };

  const handlePageChange = (page) => {
    getMarketingSettings(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getMarketingSettings(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir
    );
  };

  const handleSort = (key, dir) => {
    getMarketingSettings(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (newTerm) => {
    getMarketingSettings(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handleNewSetting = (ev) => {
    ev.preventDefault();
    history.push(`/app/summits/${currentSummit.id}/marketing/new`);
  };

  const handleCloneSettings = async (summitId) => {
    const confirmed = await showConfirmDialog({
      title: T.translate("general.are_you_sure"),
      text: T.translate("marketing.clone_settings_warning"),
      iconType: "warning",
      confirmButtonText: T.translate("marketing.yes_clone"),
      confirmButtonColor: "error"
    });

    if (confirmed) cloneMarketingSettings(summitId);
  };

  const columns = [
    { columnKey: "id", header: T.translate("general.id"), sortable: true },
    {
      columnKey: "key",
      header: T.translate("marketing.key"),
      sortable: true
    },
    { columnKey: "type", header: T.translate("marketing.type") },
    {
      columnKey: "value",
      header: T.translate("marketing.value"),
      width: 450,
      render: (row) => wrapLongText(row.value)
    },
    {
      columnKey: "selection_plan_id",
      header: T.translate("marketing.selection_plan"),
      render: (row) => wrapLongText(row.selection_plan_id)
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("marketing.setting_list")} ({totalSettings})
      </h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate("marketing.placeholders.search_settings")
        }}
      >
        <Button
          variant="contained"
          onClick={handleNewSetting}
          startIcon={<AddIcon />}
        >
          {T.translate("marketing.add_setting")}
        </Button>
        <Box>
          <SummitDropdown
            onClick={handleCloneSettings}
            actionLabel={T.translate("marketing.clone_settings")}
          />
        </Box>
      </GridToolbar>

      {settings.length === 0 && (
        <div>{T.translate("marketing.no_settings")}</div>
      )}

      {settings.length > 0 && (
        <div>
          <MuiTable
            options={tableOptions}
            data={settings}
            columns={columns}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalSettings}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={deleteSetting}
            getName={(row) => row.key}
            deleteDialogBody={(name) =>
              `${T.translate("marketing.delete_setting_warning")} ${name}`
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
  marketingSettingListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...marketingSettingListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getMarketingSettings,
  deleteSetting,
  cloneMarketingSettings
})(MarketingSettingListPage);
