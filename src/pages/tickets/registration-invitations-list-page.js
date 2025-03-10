/**
 * Copyright 2020 OpenStack Foundation
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
import { Modal, Pagination } from "react-bootstrap";
import Swal from "sweetalert2";
import T from "i18n-react/dist/i18n-react";
import {
  FreeTextSearch,
  SelectableTable,
  UploadInput,
  Dropdown,
  TagInput,
  Input,
  TicketTypesInput
} from "openstack-uicore-foundation/lib/components";
import { SegmentedControl } from "segmented-control";
import { getSummitById } from "../../actions/summit-actions";
import {
  exportInvitationsCSV,
  getInvitations,
  importInvitationsCSV,
  selectInvitation,
  unSelectInvitation,
  clearAllSelectedInvitations,
  deleteAllRegistrationInvitation,
  deleteRegistrationInvitation,
  setCurrentFlowEvent,
  setSelectedAll,
  sendEmails
} from "../../actions/registration-invitation-actions";
import AcceptanceCriteriaDropdown from "../../components/inputs/acceptance-criteria-dropdown";
import {
  MaxTextLengthForTicketTypesOnTable,
  MaxTextLengthForTagsOnTable,
  ALL_FILTER
} from "../../utils/constants";

import "../../styles/registration-invitation-list-page.less";
import OrAndFilter from "../../components/filters/or-and-filter";
import { validateEmail } from "../../utils/methods";
import InvitationStatusDropdown from "../../components/inputs/invitation-status-dropdown";
import SendEmailModal from "../../components/send-email-modal/index";

class RegistrationInvitationsListPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleEdit = this.handleEdit.bind(this);
    this.handleSelected = this.handleSelected.bind(this);
    this.handleSelectedAll = this.handleSelectedAll.bind(this);
    this.handleTicketTypeSelected = this.handleTicketTypeSelected.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleImportInvitations = this.handleImportInvitations.bind(this);
    this.handleExportInvitations = this.handleExportInvitations.bind(this);
    this.handleChangeStatus = this.handleChangeStatus.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleNewInvitation = this.handleNewInvitation.bind(this);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.handleChangeFlowEvent = this.handleChangeFlowEvent.bind(this);
    this.handleDeleteAll = this.handleDeleteAll.bind(this);
    this.handleChangeNoSent = this.handleChangeNoSent.bind(this);
    this.handleTagFilterChange = this.handleTagFilterChange.bind(this);
    this.handleOrAndFilter = this.handleOrAndFilter.bind(this);

    this.state = {
      showImportModal: false,
      importFile: null,
      acceptanceCriteria: null,
      invitationFilter: {
        orAndFilter: ALL_FILTER
      },
      testRecipient: "",
      showEmailModal: false
    };
  }

  componentDidMount() {
    const { currentSummit } = this.props;
    if (currentSummit) {
      const {
        term,
        order,
        orderDir,
        currentPage,
        perPage,
        allowedTicketTypesIds,
        tagFilter,
        status,
        isSent
      } = this.props;
      const {
        invitationFilter: { orAndFilter }
      } = this.state;
      this.props.getInvitations(term, currentPage, perPage, order, orderDir, {
        status,
        isSent,
        allowedTicketTypesIds,
        tagFilter,
        orAndFilter
      });
    }
  }

  handleSearch(term) {
    const {
      order,
      orderDir,
      page,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      status,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handleEdit(invitation_id) {
    const { currentSummit, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/registration-invitations/${invitation_id}`
    );
  }

  handleChangeFlowEvent(ev) {
    const { value } = ev.target;
    this.props.setCurrentFlowEvent(value);
  }

  handleDeleteAll() {
    const { deleteAllRegistrationInvitation } = this.props;

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: T.translate("registration_invitation_list.remove_all_warning"),
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteAllRegistrationInvitation();
      }
    });
  }

  handleDelete(invitation_id) {
    const { deleteRegistrationInvitation, invitations } = this.props;
    const invitation = invitations.find((i) => i.id === invitation_id);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("registration_invitation_list.remove_warning")} (${
        invitation.email
      }) .`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deleteRegistrationInvitation(invitation_id);
      }
    });
  }

  handleNewInvitation() {
    const { currentSummit, history } = this.props;
    history.push(
      `/app/summits/${currentSummit.id}/registration-invitations/new`
    );
  }

  handleSendClick(ev) {
    ev.stopPropagation();
    ev.preventDefault();

    const { selectedCount, currentFlowEvent } = this.props;
    const { testRecipient } = this.state;

    if (!currentFlowEvent) {
      Swal.fire(
        "Validation error",
        T.translate("registration_invitation_list.select_template"),
        "warning"
      );
      return false;
    }

    if (selectedCount === 0) {
      Swal.fire(
        "Validation error",
        T.translate("registration_invitation_list.select_items"),
        "warning"
      );
      return false;
    }

    if (testRecipient !== "" && !validateEmail(testRecipient)) {
      Swal.fire(
        "Validation error",
        T.translate("registration_invitation_list.invalid_recipient_email"),
        "warning"
      );
      return false;
    }

    this.setState({ showEmailModal: true });
  }

  handleSendEmails = (excerpt) => {
    const { status, isSent, sendEmails, allowedTicketTypesIds, tagFilter } =
      this.props;
    const {
      invitationFilter: { orAndFilter },
      testRecipient
    } = this.state;

    this.setState({ showEmailModal: false });

    const filters = {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    };

    sendEmails(filters, testRecipient, excerpt);
  };

  handleSelected(invitation_id, isSelected) {
    if (isSelected) {
      this.props.selectInvitation(invitation_id);
      return;
    }
    this.props.unSelectInvitation(invitation_id);
  }

  handleSelectedAll(ev) {
    const selectedAllCb = ev.target.checked;
    this.props.setSelectedAll(selectedAllCb);
    if (!selectedAllCb) {
      // clear all selected
      this.props.clearAllSelectedInvitations();
    }
  }

  handleTicketTypeSelected(ev) {
    const { term, page, order, orderDir, perPage, status, isSent, tagFilter } =
      this.props;
    const { value } = ev.target;
    const ticketTypeFilter = [...value].map((tt) => ({
      id: tt.id,
      name: tt.name
    }));
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds: ticketTypeFilter,
      tagFilter,
      orAndFilter
    });
  }

  handleSort(index, key, dir) {
    const {
      term,
      page,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      status,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, key, dir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handlePageChange(page) {
    const {
      term,
      order,
      orderDir,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      status,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handleImportInvitations() {
    const { importFile, acceptanceCriteria } = this.state;
    this.setState({ showImportModal: false });
    if (importFile && acceptanceCriteria) {
      this.props.importInvitationsCSV(importFile, acceptanceCriteria);
    }
  }

  handleExportInvitations() {
    const {
      term,
      order,
      orderDir,
      allowedTicketTypesIds,
      tagFilter,
      status,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.exportInvitationsCSV(term, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handleTagFilterChange(ev) {
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      allowedTicketTypesIds,
      status,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter: ev.target.value,
      orAndFilter
    });
  }

  handleChangeStatus(ev) {
    const newValue = ev.target.value;
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      isSent
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;

    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status: newValue,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handleChangeNoSent(newValue) {
    const {
      term,
      order,
      page,
      orderDir,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      status
    } = this.props;
    const {
      invitationFilter: { orAndFilter }
    } = this.state;
    this.props.getInvitations(term, page, perPage, order, orderDir, {
      status,
      isSent: newValue,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter
    });
  }

  handleOrAndFilter(ev) {
    this.setState({
      ...this.state,
      invitationFilter: { ...this.state.invitationFilter, orAndFilter: ev }
    });
    const {
      term,
      order,
      orderDir,
      currentPage,
      perPage,
      allowedTicketTypesIds,
      tagFilter,
      status,
      isSent
    } = this.props;
    this.props.getInvitations(term, currentPage, perPage, order, orderDir, {
      status,
      isSent,
      allowedTicketTypesIds,
      tagFilter,
      orAndFilter: ev
    });
  }

  render() {
    const {
      currentSummit,
      invitations,
      term,
      order,
      orderDir,
      totalInvitations,
      lastPage,
      currentPage,
      selectedCount,
      status,
      isSent,
      currentFlowEvent,
      selectedAll,
      allowedTicketTypesIds,
      tagFilter
    } = this.props;

    const {
      showImportModal,
      importFile,
      acceptanceCriteria,
      invitationFilter,
      testRecipient,
      showEmailModal
    } = this.state;

    const columns = [
      { columnKey: "id", value: T.translate("general.id"), sortable: true },
      {
        columnKey: "email",
        value: T.translate("registration_invitation_list.email")
      },
      {
        columnKey: "first_name",
        value: T.translate("registration_invitation_list.first_name")
      },
      {
        columnKey: "last_name",
        value: T.translate("registration_invitation_list.last_name")
      },
      {
        columnKey: "status",
        value: T.translate("registration_invitation_list.status")
      },
      {
        columnKey: "is_sent",
        value: T.translate("registration_invitation_list.sent")
      },
      {
        columnKey: "allowed_ticket_types",
        value: T.translate("registration_invitation_list.allowed_ticket_types"),
        render: (t) =>
          t.allowed_ticket_types_full.length >
          MaxTextLengthForTicketTypesOnTable ? (
            <>
              {`${t.allowed_ticket_types}...`}&nbsp;
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={t.allowed_ticket_types_full}
              />
            </>
          ) : (
            t.allowed_ticket_types
          )
      },
      {
        columnKey: "tags",
        value: T.translate("registration_invitation_list.tags"),
        render: (t) =>
          t.tags_full.length > MaxTextLengthForTagsOnTable ? (
            <>
              {`${t.tags}...`}&nbsp;
              <i
                className="fa fa-info-circle"
                aria-hidden="true"
                title={t.tags_full}
              />
            </>
          ) : (
            t.tags
          )
      }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      selectedAll,
      actions: {
        edit: {
          onClick: this.handleEdit,
          onSelected: this.handleSelected,
          onSelectedAll: this.handleSelectedAll
        },
        delete: { onClick: this.handleDelete }
      }
    };

    if (!currentSummit.id) return <div />;

    const flowEventsDDL = [
      { label: "-- SELECT EMAIL EVENT --", value: "" },
      {
        label: "SUMMIT_REGISTRATION_INVITE_REGISTRATION",
        value: "SUMMIT_REGISTRATION_INVITE_REGISTRATION"
      },
      {
        label: "SUMMIT_REGISTRATION_REINVITE_REGISTRATION",
        value: "SUMMIT_REGISTRATION_REINVITE_REGISTRATION"
      }
    ];

    return (
      <div>
        <div className="container">
          <h3>
            {" "}
            {T.translate("registration_invitation_list.invitation_list")} (
            {totalInvitations})
          </h3>
          <div className="actions-wrapper">
            <div className="row">
              <div className="col-md-6">
                <FreeTextSearch
                  value={term}
                  placeholder={T.translate(
                    "registration_invitation_list.placeholders.search"
                  )}
                  onSearch={this.handleSearch}
                />
              </div>
              <div className="col-md-6 text-right">
                <button
                  className="btn btn-default right-space"
                  onClick={() => this.setState({ showImportModal: true })}
                >
                  {T.translate("registration_invitation_list.import")}
                </button>
                <button
                  className="btn btn-default right-space"
                  onClick={this.handleExportInvitations}
                >
                  {T.translate("registration_invitation_list.export")}
                </button>
                <button
                  className="btn btn-primary right-space"
                  onClick={this.handleNewInvitation}
                >
                  {T.translate("registration_invitation_list.add_invitation")}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={this.handleDeleteAll}
                >
                  {T.translate(
                    "registration_invitation_list.delete_all_invitations"
                  )}
                </button>
              </div>
            </div>
            <OrAndFilter
              style={{ marginTop: 15 }}
              value={invitationFilter.orAndFilter}
              entity="invitations"
              onChange={(filter) => this.handleOrAndFilter(filter)}
            />
            <div className="row">
              <div className="col-md-6">
                <TagInput
                  id="tags"
                  clearable
                  isMulti
                  value={tagFilter}
                  onChange={this.handleTagFilterChange}
                  placeholder={T.translate(
                    "registration_invitation_list.placeholders.tags"
                  )}
                />
              </div>
              <div className="col-md-6">
                <TicketTypesInput
                  id="allowed_ticket_types_filter"
                  value={allowedTicketTypesIds}
                  placeholder={T.translate(
                    "registration_invitation_list.placeholders.allowed_ticket_types_filter"
                  )}
                  onChange={this.handleTicketTypeSelected}
                  summitId={currentSummit.id}
                  version="v2"
                  optionsLimit={100}
                  defaultOptions
                  isMulti
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <SegmentedControl
                      name="isSent"
                      options={[
                        { label: "All", value: null, default: isSent === null },
                        {
                          label: "Sent",
                          value: "true",
                          default: isSent === "true"
                        },
                        {
                          label: "Non Sent",
                          value: "false",
                          default: isSent === "false"
                        }
                      ]}
                      setValue={(newValue) => this.handleChangeNoSent(newValue)}
                      style={{
                        width: "100%",
                        height: 40,
                        color: "#337ab7",
                        fontSize: "10px"
                      }}
                    />
                  </div>
                  <div className=" col-md-6" style={{ paddingTop: 10 }}>
                    <InvitationStatusDropdown
                      id="status"
                      value={status}
                      onChange={this.handleChangeStatus}
                      isMulti
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 text-right">
                <Dropdown
                  id="flow_event"
                  value={currentFlowEvent}
                  onChange={this.handleChangeFlowEvent}
                  options={flowEventsDDL}
                />
              </div>
              <div className="col-md-4">
                <Input
                  id="testRecipient"
                  value={testRecipient}
                  onChange={(ev) =>
                    this.setState({
                      ...this.state,
                      testRecipient: ev.target.value
                    })
                  }
                  placeholder={T.translate(
                    "registration_invitation_list.placeholders.test_recipient"
                  )}
                  className="form-control"
                />
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-default right-space"
                  onClick={this.handleSendClick}
                >
                  {T.translate("registration_invitation_list.send_emails")}
                </button>
              </div>
              <SendEmailModal
                show={showEmailModal}
                onHide={() => this.setState({ showEmailModal: false })}
                recipients="invitations"
                template={currentFlowEvent}
                qty={selectedCount}
                testRecipient={testRecipient}
                onSend={this.handleSendEmails}
              />
            </div>
          </div>

          {invitations.length === 0 && (
            <div>
              {T.translate("registration_invitation_list.no_invitations")}
            </div>
          )}

          {invitations.length > 0 && (
            <div>
              {selectedCount > 0 && (
                <span>
                  <b>
                    {T.translate("registration_invitation_list.items_qty", {
                      qty: selectedCount
                    })}
                  </b>
                </span>
              )}
              <SelectableTable
                options={table_options}
                data={invitations}
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

        <Modal
          show={showImportModal}
          onHide={() => this.setState({ showImportModal: false })}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {T.translate("registration_invitation_list.import_invitations")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row">
              <div className="col-md-12">
                Format must be the following:
                <br />
                <b>email</b>: invitee email
                <br />
                <b>first_name</b>: invitee First Name
                <br />
                <b>last_name</b>: invitee Last Name
                <br />
                <b>allowed_ticket_types (optional) </b>: Pipe Separated list of
                ticket types IDs
                <br />
                <b>tags (optional) </b>: Pipe Separated list of tags
                <br />
              </div>
              <div className="col-md-12 acceptance-criteria-wrapper">
                <AcceptanceCriteriaDropdown
                  id="acceptance-criteria"
                  value={acceptanceCriteria}
                  onChange={(ev) =>
                    this.setState({ acceptanceCriteria: ev.target.value })
                  }
                />
              </div>
              <div className="col-md-12 invitation-import-upload-wrapper">
                <UploadInput
                  value={importFile && importFile.name}
                  handleUpload={(file) => this.setState({ importFile: file })}
                  handleRemove={() => this.setState({ importFile: null })}
                  className="dropzone col-md-6"
                  multiple={false}
                  accept=".csv"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              disabled={!importFile || !acceptanceCriteria}
              className="btn btn-primary"
              onClick={this.handleImportInvitations}
            >
              {T.translate("registration_invitation_list.ingest")}
            </button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({
  currentSummitState,
  RegistrationInvitationListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...RegistrationInvitationListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getInvitations,
  importInvitationsCSV,
  exportInvitationsCSV,
  selectInvitation,
  unSelectInvitation,
  clearAllSelectedInvitations,
  deleteAllRegistrationInvitation,
  deleteRegistrationInvitation,
  setCurrentFlowEvent,
  setSelectedAll,
  sendEmails
})(RegistrationInvitationsListPage);
