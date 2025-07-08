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

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Breadcrumb } from "react-breadcrumbs";
import { Box, Button } from "@mui/material";

import {
  getLeadReportSettingsMeta,
  getSummitById,
  upsertLeadReportSettings
} from "../../actions/summit-actions";
import {
  deleteSponsor,
  getSponsors,
  updateSponsorOrder
} from "../../actions/sponsor-actions";
import MuiTable from "../../components/mui/table/mui-table";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";

const SponsorFormsListPage = ({
  match,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalFormTemplates
}) => {
  const columns = [
    {
      columnKey: "code",
      header: T.translate("form_template_list.code_column_label"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("form_template_list.name_column_label"),
      sortable: true
    },
    {
      columnKey: "items_qty",
      header: T.translate("form_template_list.items_column_label"),
      sortable: false
    },
    {
      columnKey: "manage_items",
      header: "",
      width: 100,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="small"
          onClick={() => handleManageItems(row)}
        >
          Manage Items
        </Button>
      )
    },
    {
      columnKey: "edit",
      header: "",
      width: 40,
      align: "center",
      render: (row, { onRowEdit }) => (
        <IconButton size="small" onClick={() => onRowEdit(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
      className: "dottedBorderLeft"
    },
    {
      columnKey: "archive",
      header: "",
      width: 70,
      align: "center",
      render: (row) => (
        <Button
          variant="text"
          color="inherit"
          size="medium"
          onClick={() => handleArchiveItem(row)}
        >
          {row.is_archived
            ? T.translate("inventory_item_list.unarchive_button")
            : T.translate("inventory_item_list.archive_button")}
        </Button>
      ),
      className: "dottedBorderLeft"
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container" style={{ backgroundColor: "transparent" }}>
      <Breadcrumb
        data={{
          title: T.translate("sponsor_forms.forms"),
          pathname: match.url
        }}
      />
      <h3>{T.translate("sponsor_forms.forms")}</h3>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <MuiTable
          columns={columns}
          data={formTemplates}
          options={table_options}
          perPage={perPage}
          currentPage={currentPage}
          onRowEdit={handleRowEdit}
          onPageChange={handlePageChange}
          onSort={handleSort}
        />
      </Box>
    </div>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorListState,
  currentSummitSponsorshipListState
}) => ({
  summitLeadReportColumns: currentSummitState.lead_report_settings,
  currentSummit: currentSummitState.currentSummit,
  allSponsorships: currentSummitSponsorshipListState.sponsorships,
  member: loggedUserState.member,
  ...currentSponsorListState
});

export default connect(mapStateToProps, {
  getLeadReportSettingsMeta,
  getSummitById,
  getSponsors,
  deleteSponsor,
  updateSponsorOrder,
  upsertLeadReportSettings
})(SponsorFormsListPage);
