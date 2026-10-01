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
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import {
  getAllScheduleSettings,
  deleteScheduleSetting,
  seedDefaultScheduleSettings
} from "../../actions/schedule-settings-actions";

const ScheduleSettingsListPage = ({
  currentSummit,
  scheduleSettings,
  order,
  orderDir,
  totalScheduleSettings,
  history,
  getAllScheduleSettings,
  deleteScheduleSetting,
  seedDefaultScheduleSettings
}) => {
  useEffect(() => {
    if (currentSummit) {
      getAllScheduleSettings(order, orderDir);
    }
  }, [currentSummit]);

  const handleEdit = (row) => {
    history.push(
      `/app/summits/${currentSummit.id}/schedule-settings/${row.id}`
    );
  };

  const handleSort = (key, dir) => {
    getAllScheduleSettings(key, dir);
  };

  const handleNewScheduleSetting = (ev) => {
    ev.preventDefault();
    history.push(`/app/summits/${currentSummit.id}/schedule-settings/new`);
  };

  const handleSeedDefaults = () => {
    seedDefaultScheduleSettings();
  };

  const columns = [
    { columnKey: "key", header: T.translate("edit_schedule_settings.key") },
    {
      columnKey: "is_enabled_str",
      header: T.translate("edit_schedule_settings.enabled")
    },
    {
      columnKey: "is_my_schedule_str",
      header: T.translate("edit_schedule_settings.is_my_schedule")
    },
    {
      columnKey: "is_access_level_str",
      header: T.translate("edit_schedule_settings.access_levels_only")
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return null;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("schedule_settings_list.schedule_settings")} (
        {totalScheduleSettings})
      </h3>
      <GridToolbar>
        <Button
          variant="contained"
          onClick={handleNewScheduleSetting}
          startIcon={<AddIcon />}
        >
          {T.translate("schedule_settings_list.add_schedule_settings")}
        </Button>
        <Button variant="outlined" onClick={handleSeedDefaults}>
          {T.translate("schedule_settings_list.seed_defaults")}
        </Button>
      </GridToolbar>

      {scheduleSettings.length === 0 && (
        <div>{T.translate("schedule_settings_list.no_schedule_settings")}</div>
      )}

      {scheduleSettings.length > 0 && (
        <MuiTable
          options={tableOptions}
          data={scheduleSettings}
          columns={columns}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={deleteScheduleSetting}
          canDelete={(row) => !row.is_default}
          getName={(row) => row.key}
          deleteDialogBody={(name) =>
            `${T.translate("schedule_settings_list.remove_warning")} ${name}`
          }
          confirmButtonColor="error"
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  scheduleSettingsListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...scheduleSettingsListState
});

export default connect(mapStateToProps, {
  getAllScheduleSettings,
  deleteScheduleSetting,
  seedDefaultScheduleSettings
})(ScheduleSettingsListPage);
