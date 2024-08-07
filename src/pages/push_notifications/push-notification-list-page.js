/**
 * Copyright 2018 OpenStack Foundation
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
import { Table, Dropdown } from "openstack-uicore-foundation/lib/components";
import { Pagination } from "react-bootstrap";
import { getSummitById } from "../../actions/summit-actions";
import {
  getPushNotifications,
  deletePushNotification,
  approvePushNotification,
  rejectPushNotification
} from "../../actions/push-notification-actions";

import "../../styles/push-notification-list-page.less";

class PushNotificationListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleApprove = this.handleApprove.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleNewPushNotification = this.handleNewPushNotification.bind(this);
    this.isNotSent = this.isNotSent.bind(this);
    this.isApproved = this.isApproved.bind(this);

    this.state = {
      filters: {
        approved_filter: "ALL",
        sent_filter: "ALL",
        channel_filter: "ALL"
      }
    };
  }

  componentDidMount() {
    const { currentSummit } = this.props;
    if (currentSummit) {
      this.props.getPushNotifications();
    }
  }

  handleEdit(push_notification_id) {
    const { currentSummit, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/push-notifications/${push_notification_id}`
    );
  }

  handleDelete(pushNotificationId) {
    const { deletePushNotification, pushNotifications } = this.props;
    let pushNotification = pushNotifications.find(
      (n) => n.id === pushNotificationId
    );

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text:
        T.translate("push_notification_list.remove_warning") +
        " " +
        pushNotification.id,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then(function (result) {
      if (result.value) {
        deletePushNotification(pushNotificationId);
      }
    });
  }

  handleApprove(pushNotificationId) {
    const { approvePushNotification, pushNotifications } = this.props;
    let pushNotification = pushNotifications.find(
      (n) => n.id === pushNotificationId
    );

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text:
        T.translate("push_notification_list.approve_warning") +
        " " +
        pushNotification.id,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#91dd7f",
      confirmButtonText: T.translate("push_notification_list.yes_approve")
    }).then(function (result) {
      if (result.value) {
        approvePushNotification(pushNotificationId);
      }
    });
  }

  handlePageChange(page) {
    const { order, orderDir, perPage } = this.props;
    this.props.getPushNotifications(
      page,
      perPage,
      order,
      orderDir,
      this.state.filters
    );
  }

  handleSort(index, key, dir, func) {
    const { page, perPage } = this.props;
    key = key === "name" ? "last_name" : key;
    this.props.getPushNotifications(
      page,
      perPage,
      key,
      dir,
      this.state.filters
    );
  }

  handleFilter(ev) {
    const { order, orderDir, perPage, page } = this.props;
    let filter = ev.target.id;
    let value = ev.target.value;
    let filters = { ...this.state.filters };

    filters[filter] = value;
    this.setState({ filters: filters });

    this.props.getPushNotifications(page, perPage, order, orderDir, filters);
  }

  handleNewPushNotification(ev) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/push-notifications/new`);
  }

  isNotSent(pushNotificationId) {
    const { pushNotifications } = this.props;
    let pushNotification = pushNotifications.find(
      (n) => n.id === pushNotificationId
    );
    return !pushNotification.is_sent;
  }

  isApproved(pushNotificationId) {
    const { pushNotifications } = this.props;
    let pushNotification = pushNotifications.find(
      (n) => n.id === pushNotificationId
    );
    return pushNotification.approved;
  }

  render() {
    const {
      currentSummit,
      pushNotifications,
      lastPage,
      page,
      order,
      orderDir,
      totalPushNotifications,
      channels
    } = this.props;
    const { approved_filter, sent_filter, channel_filter } = this.state.filters;

    const columns = [
      {
        columnKey: "id",
        value: T.translate("push_notification_list.id"),
        sortable: true
      },
      {
        columnKey: "created",
        value: T.translate("push_notification_list.created"),
        sortable: true
      },
      {
        columnKey: "message",
        value: T.translate("push_notification_list.message")
      },
      {
        columnKey: "approved_tag",
        value: T.translate("push_notification_list.approved")
      },
      {
        columnKey: "is_sent_tag",
        value: T.translate("push_notification_list.is_sent")
      },
      {
        columnKey: "sent_date",
        value: T.translate("push_notification_list.sent_date"),
        sortable: true
      },
      {
        columnKey: "priority",
        value: T.translate("push_notification_list.priority")
      },
      {
        columnKey: "channel",
        value: T.translate("push_notification_list.channel")
      }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      actions: {
        delete: { onClick: this.handleDelete, display: this.isNotSent },
        custom: [
          {
            name: "approve",
            tooltip: "approve",
            icon: <i className="fa fa-check" />,
            onClick: this.handleApprove,
            display: (id) => {
              return this.isNotSent(id) && !this.isApproved(id);
            }
          },
          {
            name: "reject",
            tooltip: "cancel approve",
            icon: <i className="fa fa-times" />,
            onClick: this.props.rejectPushNotification,
            display: (id) => {
              return this.isNotSent(id) && this.isApproved(id);
            }
          }
        ]
      }
    };

    let channels_ddl = channels.map((c) => ({ value: c, label: c }));

    let sent_ddl = [
      { value: "ALL", label: "ALL" },
      { value: 1, label: "SENT" },
      { value: 0, label: "NOT SENT" }
    ];
    let approved_ddl = [
      { value: "ALL", label: "ALL" },
      { value: 1, label: "APPROVED" },
      { value: 0, label: "NOT APPROVED" }
    ];

    if (!currentSummit.id) return <div />;

    return (
      <div className="container">
        <h3>
          {" "}
          {T.translate("push_notification_list.push_notification_list")} (
          {totalPushNotifications})
        </h3>
        <div className="row filters">
          <div className="col-md-2">
            <label>{T.translate("push_notification_list.approved")}</label>
            <Dropdown
              id="approved_filter"
              value={approved_filter}
              options={approved_ddl}
              onChange={this.handleFilter}
            />
          </div>
          <div className="col-md-2">
            <label>{T.translate("push_notification_list.is_sent")}</label>
            <Dropdown
              id="sent_filter"
              value={sent_filter}
              options={sent_ddl}
              onChange={this.handleFilter}
            />
          </div>
          <div className="col-md-2">
            <label>{T.translate("push_notification_list.channel")}</label>
            <Dropdown
              id="channel_filter"
              value={channel_filter}
              options={channels_ddl}
              onChange={this.handleFilter}
            />
          </div>
          <div className="col-md-6 text-right add-notification-box">
            <button
              className="btn btn-primary right-space"
              onClick={this.handleNewPushNotification}
            >
              {T.translate("push_notification_list.add_push_notification")}
            </button>
          </div>
        </div>

        {pushNotifications.length === 0 && (
          <div>
            {T.translate("push_notification_list.no_push_notifications")}
          </div>
        )}

        {pushNotifications.length > 0 && (
          <div>
            <Table
              options={table_options}
              data={pushNotifications}
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
              activePage={page}
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
  currentPushNotificationListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPushNotificationListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getPushNotifications,
  deletePushNotification,
  approvePushNotification,
  rejectPushNotification
})(PushNotificationListPage);
