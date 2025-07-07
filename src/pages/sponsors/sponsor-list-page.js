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

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { SortableTable } from "openstack-uicore-foundation/lib/components";
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
import Member from "../../models/member";
import {
  denormalizeLeadReportSettings,
  getSummitLeadReportSettings,
  renderOptions
} from "../../models/lead-report-settings";
import MuiTable from "../../components/mui/table/mui-table";

const SponsorListPage = ({
  currentSummit,
  getSponsors,
  getLeadReportSettingsMeta,
  history,
  deleteSponsor,
  sponsors,
  upsertLeadReportSettings,
  totalSponsors,
  perPage,
  currentPage,
  member,
  availableLeadReportColumns,
  term,
  order,
  orderDir
}) => {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState(term);

  useEffect(() => {
    if (currentSummit) {
      getSponsors();
      getLeadReportSettingsMeta();
      const settings = getSummitLeadReportSettings(currentSummit);
      if (settings) {
        const newSelectedColumns = renderOptions(
          denormalizeLeadReportSettings(settings.columns)
        ).map((c) => c.value);
        this.setState({ ...this.state, selectedColumns });
      }
    }
  }, [currentSummit]);

  // componentDidMount() {
  //   const { currentSummit, getSponsors, getLeadReportSettingsMeta } =
  //     this.props;

  // }

  const handleEdit = (sponsor_id) => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/${sponsor_id}`);
  };

  handleDelete(sponsorId) {
    const { deleteSponsor, sponsors } = this.props;
    const sponsor = sponsors.find((s) => s.id === sponsorId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("sponsor_list.remove_warning")} ${
        sponsor.company_name
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteSponsor(sponsorId);
      }
    });
  };

  handleNewSponsor() {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/sponsors/new`);
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    const newColumns = value;
    this.setState({ ...this.state, selectedColumns: newColumns });
    upsertLeadReportSettings(newColumns);
  };

  render() {
    const { currentSummit, sponsors, totalSponsors, member } = this.props;
    const memberObj = new Member(member);
    const canAddSponsors = memberObj.canAddSponsors();
    const canDeleteSponsors = memberObj.canDeleteSponsors();

    const columns = [
      { columnKey: "id", value: T.translate("sponsor_list.id") },
      {
        columnKey: "sponsorship_name",
        value: T.translate("sponsor_list.sponsorship")
      },
      { columnKey: "company_name", value: T.translate("sponsor_list.company") }
    ];

    const table_options = {
      actions: {
        edit: { onClick: this.handleEdit }
      }
    };

    if (canDeleteSponsors) {
      table_options.actions = {
        ...table_options.actions,
        delete: { onClick: this.handleDelete }
      };
    }
  };

  const memberObj = new Member(member);
  const canAddSponsors = memberObj.canAddSponsors();
  const canDeleteSponsors = memberObj.canDeleteSponsors();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();

    const sortedSponsors = [...sponsors];
    sortedSponsors.sort((a, b) =>
      a.order > b.order ? 1 : a.order < b.order ? -1 : 0
    );

    return (
      <div className="container">
        <h3>
          {" "}
          {T.translate("sponsor_list.sponsor_list")} ({totalSponsors})
        </h3>
        {canAddSponsors && (
          <div className="row">
            <div className="col-md-2 text-right col-md-offset-10">
              <button
                className="btn btn-primary right-space"
                onClick={this.handleNewSponsor}
              >
                {T.translate("sponsor_list.add_sponsor")}
              </button>
            </div>
          </div>
        )}
        {sponsors.length === 0 && (
          <div>{T.translate("sponsor_list.no_sponsors")}</div>
        )}

  if (canDeleteSponsors) {
    table_options.actions = {
      ...table_options.actions,
      delete: { onClick: handleDelete }
    };
  }

  if (!currentSummit.id) return <div />;

  const sortedSponsors = [...sponsors];
  sortedSponsors.sort((a, b) =>
    a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  );

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("sponsor_list.sponsor_list")} ({totalSponsors})
      </h3>
      {canAddSponsors && (
        <div className="row">
          <div className="col-md-10">
            {canEditLeadReportSettings && (
              <Dropdown
                id="sponsor_columns"
                options={availableLeadReportColumns ?? []}
                clearable
                isMulti
                value={selectedColumns}
                onChange={handleColumnsChange}
                placeholder={T.translate(
                  "sponsor_list.placeholders.lead_report_columns"
                )}
              />
            )}
          </div>
          <div className="col-md-2 text-right">
            <button
              className="btn btn-primary right-space"
              onClick={handleNewSponsor}
            >
              {T.translate("sponsor_list.add_sponsor")}
            </button>
          </div>
        </div>
      )}
      {sponsors.length === 0 && (
        <div>{T.translate("sponsor_list.no_sponsors")}</div>
      )}

      {/* {sponsors.length > 0 && (
        <div>
          <SortableTable
            options={table_options}
            data={sortedSponsors}
            columns={columns}
            dropCallback={updateSponsorOrder}
            orderField="order"
          />
        </div>
      )} */}

      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={6}>
          <Box component="span">{totalSponsors} items</Box>
        </Grid2>
        <Grid2
          container
          size={6}
          spacing={1}
          sx={{
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Grid2 size={2} />
          <Grid2 size={6}>
            <TextField
              variant="outlined"
              value={searchTerm}
              placeholder={T.translate(
                "inventory_item_list.placeholders.search_inventory_items"
              )}
              slotProps={{
                input: {
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }
              }}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={handleSearch}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "36px"
                }
              }}
            />
          </Grid2>
          <Grid2 size={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleNewSponsor()}
              startIcon={<AddIcon />}
              sx={{ height: "36px" }}
            >
              {T.translate("sponsor_list.add_sponsor")}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>

      {sponsors.length > 0 && (
        <div>
          <MuiTable
            options={table_options}
            data={sortedSponsors}
            columns={columns}
            totalRows={totalSponsors}
            // dropCallback={this.props.updateSponsorOrder}
            // orderField="order"
            perPage={perPage}
            currentPage={currentPage}
            onRowEdit={handleEdit}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
          />
        </div>
      )}
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
})(SponsorListPage);