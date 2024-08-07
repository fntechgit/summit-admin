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
 **/

import React from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Swal from "sweetalert2";
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Table
} from "openstack-uicore-foundation/lib/components";
import {
  getAttendances,
  deleteAttendance,
  exportAttendances
} from "../../actions/speaker-actions";

class SpeakerAttendanceListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleDeleteAttendance = this.handleDeleteAttendance.bind(this);
    this.isNotConfirmed = this.isNotConfirmed.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleNewAttendance = this.handleNewAttendance.bind(this);

    this.state = {};
  }

  componentDidMount() {
    const { currentSummit } = this.props;
    if (currentSummit) {
      this.props.getAttendances();
    }
  }

  handleEdit(attendanceId) {
    const { currentSummit, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/speaker-attendances/${attendanceId}`
    );
  }

  handlePageChange(page) {
    const { term, order, orderDir, perPage } = this.props;
    this.props.getAttendances(term, page, perPage, order, orderDir);
  }

  handleSort(index, key, dir, func) {
    const { term, page, perPage } = this.props;
    this.props.getAttendances(term, page, perPage, key, dir);
  }

  handleSearch(term) {
    const { order, orderDir, page, perPage } = this.props;
    this.props.getAttendances(term, page, perPage, order, orderDir);
  }

  handleDeleteAttendance(attendanceId) {
    const { deleteAttendance, attendances } = this.props;
    let attendance = attendances.find((a) => a.id === attendanceId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text:
        T.translate("speaker_attendance_list.delete_attendance_warning") +
        " " +
        attendance.speaker_name,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then(function (result) {
      if (result.value) {
        deleteAttendance(attendanceId);
      }
    });
  }

  isNotConfirmed(attendanceId) {
    const { attendances } = this.props;
    let attendance = attendances.find((a) => a.id === attendanceId);

    return attendance.is_confirmed === "No";
  }

  handleExport(ev) {
    const { term, order, orderDir } = this.props;
    ev.preventDefault();

    this.props.exportAttendances(term, order, orderDir);
  }

  handleNewAttendance(ev) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/speaker-attendances/new`);
  }

  render() {
    const {
      currentSummit,
      attendances,
      lastPage,
      currentPage,
      term,
      order,
      orderDir,
      totalAttendances
    } = this.props;

    const columns = [
      { columnKey: "id", value: T.translate("general.id"), sortable: true },
      {
        columnKey: "created",
        value: T.translate("speaker_attendance_list.created"),
        sortable: true
      },
      { columnKey: "speaker_name", value: T.translate("general.name") },
      { columnKey: "speaker_email", value: T.translate("general.email") },
      {
        columnKey: "on_site_phone",
        value: T.translate("speaker_attendance_list.on_site_phone")
      },
      {
        columnKey: "is_confirmed",
        value: T.translate("speaker_attendance_list.is_confirmed")
      },
      {
        columnKey: "confirmation_date",
        value: T.translate("speaker_attendance_list.confirmation_date"),
        sortable: true
      }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      actions: {
        edit: { onClick: this.handleEdit },
        delete: {
          onClick: this.handleDeleteAttendance,
          display: this.isNotConfirmed
        }
      }
    };

    if (!currentSummit.id) return <div />;

    return (
      <div className="container">
        <h3>
          {" "}
          {T.translate("speaker_attendance_list.speaker_attendance_list")} (
          {totalAttendances})
        </h3>
        <div className={"row"}>
          <div className={"col-md-6"}>
            <FreeTextSearch
              value={term}
              placeholder={T.translate(
                "speaker_attendance_list.placeholders.search_attendances"
              )}
              onSearch={this.handleSearch}
            />
          </div>
          <div className="col-md-6 text-right">
            <button
              className="btn btn-default right-space"
              onClick={this.handleExport}
            >
              {T.translate("general.export")}
            </button>
            <button
              className="btn btn-primary"
              onClick={this.handleNewAttendance}
            >
              {T.translate("speaker_attendance_list.add_attendance")}
            </button>
          </div>
        </div>

        {attendances.length === 0 && (
          <div>{T.translate("speaker_attendance_list.no_attendances")}</div>
        )}

        {attendances.length > 0 && (
          <div>
            <Table
              options={table_options}
              data={attendances}
              columns={columns}
              onSort={this.handleSort}
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
              onSelect={this.handlePageChange}
            />
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  currentSpeakerAttendanceListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentSpeakerAttendanceListState
});

export default connect(mapStateToProps, {
  getAttendances,
  deleteAttendance,
  exportAttendances
})(SpeakerAttendanceListPage);
