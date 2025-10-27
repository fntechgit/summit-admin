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
import {
  Dropdown,
  SortableTable
} from "openstack-uicore-foundation/lib/components";

import {
  getLeadReportSettingsMeta,
  upsertLeadReportSettings
} from "../../actions/summit-actions";
import {
  getSponsors,
  deleteSponsor,
  updateSponsorOrder,
  getSummitLeadReportSettings
} from "../../actions/sponsor-actions";
import Member from "../../models/member";
import {
  denormalizeLeadReportSettings,
  renderOptions
} from "../../models/lead-report-settings";

const SponsorListPage = ({
  currentSummit,
  sponsors,
  getSponsors,
  sponsorLeadReportsSettings,
  getLeadReportSettingsMeta,
  getSummitLeadReportSettings,
  updateSponsorOrder,
  deleteSponsor,
  upsertLeadReportSettings,
  history,
  totalSponsors,
  member,
  availableLeadReportColumns
}) => {
  const [selectedColumns, setSelectedColumns] = useState([]);

  useEffect(() => {
    if (currentSummit) {
      getSponsors();
      getLeadReportSettingsMeta();
      getSummitLeadReportSettings();
    }
  }, []);

  useEffect(() => {
    if (sponsorLeadReportsSettings) {
      const selectedColumns = renderOptions(
        denormalizeLeadReportSettings(sponsorLeadReportsSettings.columns)
      ).map((c) => c.value);
      setSelectedColumns(selectedColumns);
    }
  }, [sponsorLeadReportsSettings]);

  const handleEdit = (sponsor_id) => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/${sponsor_id}`);
  };

  const handleDelete = (sponsorId) => {
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

  const handleNewSponsor = () => {
    history.push(`/app/summits/${currentSummit.id}/sponsors/new`);
  };

  const handleColumnsChange = (ev) => {
    const { value } = ev.target;
    const newColumns = value;
    setSelectedColumns(newColumns);
    upsertLeadReportSettings(newColumns);
  };

  const memberObj = new Member(member);
  const canAddSponsors = memberObj.canAddSponsors();
  const canDeleteSponsors = memberObj.canDeleteSponsors();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();

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
      edit: { onClick: handleEdit }
    }
  };

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

      {sponsors.length > 0 && (
        <div>
          <SortableTable
            options={table_options}
            data={sortedSponsors}
            columns={columns}
            dropCallback={updateSponsorOrder}
            orderField="order"
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorListState
}) => ({
  availableLeadReportColumns: currentSummitState.available_lead_report_columns,
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member,
  ...currentSponsorListState
});

export default connect(mapStateToProps, {
  getLeadReportSettingsMeta,
  getSponsors,
  deleteSponsor,
  updateSponsorOrder,
  upsertLeadReportSettings,
  getSummitLeadReportSettings
})(SponsorListPage);
