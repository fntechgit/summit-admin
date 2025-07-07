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

class SponsorListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleNewSponsor = this.handleNewSponsor.bind(this);
    this.handleColumnsChange = this.handleColumnsChange.bind(this);

    this.state = {
      selectedColumns: []
    };
  }

  componentDidMount() {
    const { currentSummit, getSponsors, getLeadReportSettingsMeta } =
      this.props;

    if (currentSummit) {
      getSponsors();
      getLeadReportSettingsMeta();
      const settings = getSummitLeadReportSettings(currentSummit);
      if (settings) {
        const selectedColumns = renderOptions(
          denormalizeLeadReportSettings(settings.columns)
        ).map((c) => c.value);
        this.setState({ ...this.state, selectedColumns });
      }
    }
  }

  handleEdit(sponsor_id) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/sponsors/${sponsor_id}`);
  }

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
  }

  handleNewSponsor() {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/sponsors/new`);
  }

  handleColumnsChange(ev) {
    const { upsertLeadReportSettings } = this.props;
    const { value } = ev.target;
    const newColumns = value;
    this.setState({ ...this.state, selectedColumns: newColumns });
    upsertLeadReportSettings(newColumns);
  }

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

        {sponsors.length > 0 && (
          <div>
            <SortableTable
              options={table_options}
              data={sortedSponsors}
              columns={columns}
              dropCallback={this.props.updateSponsorOrder}
              orderField="order"
            />
          </div>
        )}
      </div>
    );
  }
}

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
