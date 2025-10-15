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
import {
  Table,
  SponsorInput
} from "openstack-uicore-foundation/lib/components";
import { querySponsorsWithBadgeScans } from "openstack-uicore-foundation/lib/utils/query-actions";
import { Pagination } from "react-bootstrap";
import { getSummitById } from "../../actions/summit-actions";
import { getBadgeScans, exportBadgeScans } from "../../actions/sponsor-actions";
import Member from "../../models/member";

const BadgeScansListPage = ({
  currentSummit,
  history,
  sponsorId,
  allSponsors,
  badgeScans,
  order,
  orderDir,
  currentPage,
  perPage,
  lastPage,
  totalBadgeScans,
  member,
  ...props
}) => {
  useEffect(() => {
    if (sponsorId) {
      props.getBadgeScans(sponsorId);
    }
  }, []);

  const [currentSponsor, setCurrentSponsor] = useState(null);

  const handlePageChange = (page) => {
    props.getBadgeScans(sponsorId, page, perPage, order, orderDir);
  };

  const handleSort = (index, key, dir) => {
    props.getBadgeScans(sponsorId, currentPage, perPage, key, dir);
  };

  const handleSponsorChange = (ev) => {
    const { value } = ev.target;
    setCurrentSponsor(value);
    props.getBadgeScans(value.id, currentPage, perPage, order, orderDir);
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    props.exportBadgeScans(currentSponsor, order, orderDir);
  };

  const handleEditBadgeScan = (id) => {
    history.push(`/app/summits/${currentSummit.id}/badge-scans/${id}`);
  };

  const memberObj = new Member(member);
  const canEditBadgeScans = memberObj.canEditBadgeScans();

  const columns = [
    {
      columnKey: "id",
      value: T.translate("badge_scan_list.id"),
      sortable: true
    },
    {
      columnKey: "scan_date",
      value: T.translate("badge_scan_list.created"),
      sortable: true
    },
    {
      columnKey: "scanned_by",
      value: T.translate("badge_scan_list.scanned_by"),
      sortable: true
    },
    {
      columnKey: "attendee_first_name",
      value: T.translate("badge_scan_list.first_name"),
      sortable: true
    },
    {
      columnKey: "attendee_last_name",
      value: T.translate("badge_scan_list.last_name"),
      sortable: true
    },
    {
      columnKey: "attendee_email",
      value: T.translate("badge_scan_list.email"),
      sortable: true
    },
    {
      columnKey: "attendee_company",
      value: T.translate("badge_scan_list.company_name"),
      sortable: true
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  if (canEditBadgeScans) {
    table_options.actions = {
      edit: { onClick: handleEditBadgeScan }
    };
  }

  if (!currentSummit.id) return <div />;

  // console.log(badgeScans, table_options, columns)

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("badge_scan_list.badge_scan_list")} ({totalBadgeScans})
      </h3>
      <div className="row">
        <div className="col-md-6 col-md-offset-6 text-right">
          <button
            className="btn btn-default right-space pull-right"
            onClick={handleExport}
            disabled={!sponsorId}
          >
            {T.translate("general.export")}
          </button>
          <div className="col-md-6 pull-right">
            <SponsorInput
              id="sponsor"
              value={sponsorId}
              onChange={handleSponsorChange}
              summitId={currentSummit?.id}
              placeholder={T.translate(
                "badge_scan_list.placeholders.select_sponsor"
              )}
              queryFunction={querySponsorsWithBadgeScans}
              defaultOptions
            />
          </div>
        </div>
      </div>

      {!sponsorId ? (
        <div>{T.translate("badge_scan_list.select_sponsor")}</div>
      ) : (
        <>
          {badgeScans.length === 0 && (
            <div>{T.translate("badge_scan_list.no_badge_scans")}</div>
          )}

          {badgeScans.length > 0 && (
            <div>
              <Table
                options={table_options}
                data={badgeScans}
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
        </>
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentSummitState,
  badgeScansListState,
  loggedUserState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member,
  ...badgeScansListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getBadgeScans,
  exportBadgeScans
})(BadgeScansListPage);
