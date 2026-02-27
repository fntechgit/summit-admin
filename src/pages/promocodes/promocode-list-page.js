/**
 * Copyright 2026 OpenStack Foundation
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
import { Pagination } from "react-bootstrap";
import {
  FreeTextSearch,
  Dropdown,
  MemberInput,
  Table,
  TagInput
} from "openstack-uicore-foundation/lib/components";
import { getSummitById } from "../../actions/summit-actions";
import {
  getPromocodes,
  getPromocodeMeta,
  deletePromocode,
  exportPromocodes,
  importPromoCodesCSV
} from "../../actions/promocode-actions";
import OrAndFilter from "../../components/filters/or-and-filter";
import ImportPromocodesBtn from "../../components/import-promocodes";
import {
  TRIM_TEXT_LENGTH_50,
  TRIM_TEXT_LENGTH_40
} from "../../utils/constants";
import { trim } from "../../utils/methods";

const fieldNames = [
  { columnKey: "class_name", value: "type" },
  {
    columnKey: "description",
    value: "description",
    title: true,
    render: (row) =>
      row.description?.length > TRIM_TEXT_LENGTH_50 ? (
        <span title={row.description}>
          {`${row.description.slice(0, TRIM_TEXT_LENGTH_50)}...`}
        </span>
      ) : (
        row.description
      )
  },
  { columnKey: "tags", value: "tags" },
  { columnKey: "owner_email", value: "owner_email" },
  { columnKey: "owner", value: "owner" },
  { columnKey: "email_sent", value: "emailed" },
  { columnKey: "creator", value: "creator" }
];

class PromocodeListPage extends React.Component {
  constructor(props) {
    super(props);

    props.getPromocodeMeta();

    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.isNotRedeemed = this.isNotRedeemed.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleClassNameChange = this.handleClassNameChange.bind(this);
    this.handleTagsChange = this.handleTagsChange.bind(this);
    this.handleSort = this.handleSort.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleNewPromocode = this.handleNewPromocode.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.handleColumnsChange = this.handleColumnsChange.bind(this);
    this.handleDDLSortByLabel = this.handleDDLSortByLabel.bind(this);
    this.handleAssigneeChange = this.handleAssigneeChange.bind(this);
    this.handleCreatorChange = this.handleCreatorChange.bind(this);
    this.handleOrAndFilter = this.handleOrAndFilter.bind(this);

    this.state = {
      selectedColumns: []
    };
  }

  componentDidMount() {
    const {
      currentSummit,
      term,
      currentPage,
      extraColumns,
      perPage,
      order,
      orderDir,
      filters
    } = this.props;
    this.setState({
      ...this.state,
      selectedColumns: extraColumns
    });
    if (currentSummit) {
      this.props.getPromocodes(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        filters,
        extraColumns
      );
    }
  }

  handleEdit(promocode_id) {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/promocodes/${promocode_id}`);
  }

  handleExport(ev) {
    const { term, order, orderDir, filters } = this.props;
    ev.preventDefault();

    this.props.exportPromocodes(term, order, orderDir, filters);
  }

  handleDelete(promocodeId) {
    const { deletePromocode, promocodes } = this.props;
    const promocode = promocodes.find((p) => p.id === promocodeId);

    Swal.fire({
      title: T.translate("general.are_you_sure"),
      text: `${T.translate("promocode_list.remove_promocode_warning")} ${
        promocode.owner
      }`,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      confirmButtonText: T.translate("general.yes_delete")
    }).then((result) => {
      if (result.value) {
        deletePromocode(promocodeId);
      }
    });
  }

  isNotRedeemed(promocodeId) {
    const { promocodes } = this.props;
    const promocode = promocodes.find((a) => a.id === promocodeId);

    return promocode.redeemed === "No";
  }

  handlePageChange(page) {
    const { term, order, orderDir, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleTypeChange(type) {
    const { term, order, orderDir, perPage, page, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.typeFilter = type.target.value;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleClassNameChange(classNames) {
    const { term, order, orderDir, perPage, page, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.classNamesFilter = classNames.target.value;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleTagsChange(ev) {
    const { term, order, orderDir, page, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.tagsFilter = ev.target.value;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleAssigneeChange(ev) {
    const { term, order, orderDir, page, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.assigneeFilter = ev.target.value;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleCreatorChange(ev) {
    const { term, order, orderDir, page, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.creatorFilter = ev.target.value;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleSort(index, key, dir) {
    const { term, page, perPage, filters } = this.props;
    key = key === "name" ? "last_name" : key;
    const { selectedColumns } = this.state;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      key,
      dir,
      filters,
      selectedColumns
    );
  }

  handleSearch(term) {
    const { order, orderDir, page, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  handleNewPromocode() {
    const { currentSummit, history } = this.props;
    history.push(`/app/summits/${currentSummit.id}/promocodes/new`);
  }

  handleColumnsChange(ev) {
    const { value } = ev.target;
    this.setState({ ...this.state, selectedColumns: value });
  }

  handleDDLSortByLabel(ddlArray) {
    return ddlArray.sort((a, b) => a.label.localeCompare(b.label));
  }

  handleOrAndFilter(ev) {
    const { term, order, orderDir, page, perPage, filters } = this.props;
    const { selectedColumns } = this.state;
    filters.orAndFilter = ev;
    this.props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  }

  render() {
    const {
      currentSummit,
      promocodes,
      lastPage,
      currentPage,
      term,
      order,
      orderDir,
      totalPromocodes,
      allClasses,
      allTypes,
      filters
    } = this.props;

    let columns = [
      {
        columnKey: "id",
        value: T.translate("promocode_list.id"),
        sortable: true
      },
      {
        columnKey: "code",
        value: T.translate("promocode_list.code"),
        sortable: true
      },
      {
        columnKey: "redeemed",
        value: T.translate("promocode_list.redeemed"),
        sortable: true
      }
    ];

    const ddl_columns = [
      { value: "class_name", label: T.translate("promocode_list.type") },
      {
        value: "description",
        label: T.translate("promocode_list.description")
      },
      {
        value: "owner",
        label: T.translate("promocode_list.owner")
      },
      {
        value: "owner_email",
        label: T.translate("promocode_list.owner_email")
      },
      { value: "tags", label: T.translate("promocode_list.tags") },
      { value: "email_sent", label: T.translate("promocode_list.emailed") },
      { value: "creator", label: T.translate("promocode_list.creator") }
    ];

    const table_options = {
      sortCol: order,
      sortDir: orderDir,
      actions: {
        edit: { onClick: this.handleEdit },
        delete: { onClick: this.handleDelete, display: this.isNotRedeemed }
      }
    };

    const showColumns = fieldNames
      .filter((f) => this.state.selectedColumns.includes(f.columnKey))
      .map((f2) => {
        let c = {
          columnKey: f2.columnKey,
          value: T.translate(`promocode_list.${f2.value}`),
          sortable: f2.sortable
        };
        // optional fields
        if (f2.hasOwnProperty("title")) c = { ...c, title: f2.title };

        if (f2.hasOwnProperty("render")) c = { ...c, render: f2.render };

        return c;
      });

    columns = [...columns, ...showColumns];

    if (!currentSummit.id) return <div />;

    const promocode_types_ddl = allTypes.map((t) => ({ label: t, value: t }));

    const promocode_classes_ddl = allClasses.map((c) => ({
      label: c.class_name,
      value: c.class_name
    }));

    const promocodesFormatted = promocodes.map((p) => ({
      ...p,
      owner_email: (
        <abbr title={p.owner_email}>
          {trim(p?.owner_email, TRIM_TEXT_LENGTH_40)}
        </abbr>
      ),
      owner: <abbr title={p.owner}>{trim(p?.owner, TRIM_TEXT_LENGTH_40)}</abbr>
    }));

    return (
      <div className="container">
        <h3>
          {" "}
          {T.translate("promocode_list.promocode_list")} ({totalPromocodes})
        </h3>

        <OrAndFilter
          style={{ marginTop: 15 }}
          value={filters.orAndFilter}
          entity="promocodes"
          onChange={(filter) => this.handleOrAndFilter(filter)}
        />

        <div className="row">
          <div className="col-md-6">
            <FreeTextSearch
              value={term ?? ""}
              placeholder={T.translate(
                "promocode_list.placeholders.search_promocodes"
              )}
              onSearch={this.handleSearch}
            />
          </div>
          <div className="col-md-6 text-right">
            <Dropdown
              id="promo_code_type"
              className="right-space"
              value={filters.typeFilter}
              placeholder={T.translate(
                "promocode_list.placeholders.select_type"
              )}
              options={promocode_types_ddl}
              onChange={this.handleTypeChange}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <TagInput
              id="tags_filter"
              placeholder={T.translate(
                "promocode_list.placeholders.filter_tags"
              )}
              value={filters.tagsFilter}
              onChange={this.handleTagsChange}
              isMulti
              isClearable
            />
          </div>
          <div className="col-md-6">
            <Dropdown
              id="promo_class_name"
              className="right-space"
              value={filters.classNamesFilter ?? []}
              placeholder={T.translate(
                "promocode_list.placeholders.filter_class_name"
              )}
              options={promocode_classes_ddl}
              onChange={this.handleClassNameChange}
              isMulti
              isClearable
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <div className="col-md-6">
            <MemberInput
              id="creator"
              value={filters.creatorFilter}
              placeholder={T.translate(
                "promocode_list.placeholders.filter_creator"
              )}
              getOptionLabel={(member) => {
                const fullName = `${member.first_name ?? ""} ${
                  member.last_name ?? ""
                }`;
                return member.hasOwnProperty("email")
                  ? `${fullName} (${member.email})`
                  : `${fullName} (${member.id})`;
              }}
              onChange={this.handleCreatorChange}
              isClearable
            />
          </div>
          <div className="col-md-6">
            <MemberInput
              id="assignee"
              className="right-space"
              value={filters.assigneeFilter}
              placeholder={T.translate(
                "promocode_list.placeholders.filter_assignee"
              )}
              getOptionLabel={(member) => {
                const fullName = `${member.first_name ?? ""} ${
                  member.last_name ?? ""
                }`;
                return member.hasOwnProperty("email")
                  ? `${fullName} (${member.email})`
                  : `${fullName} (${member.id})`;
              }}
              onChange={this.handleAssigneeChange}
              isClearable
            />
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col-md-6" />
          <div className="col-md-6 text-right">
            <button
              className="btn btn-primary right-space"
              onClick={this.handleNewPromocode}
            >
              {T.translate("promocode_list.add_promocode")}
            </button>
            <button
              className="btn btn-default right-space"
              onClick={this.handleExport}
            >
              {T.translate("general.export")}
            </button>
            <ImportPromocodesBtn onImport={this.props.importPromoCodesCSV} />
          </div>
        </div>

        <hr />

        <div className="row" style={{ marginBottom: 15 }}>
          <div className="col-md-12">
            <label>{T.translate("event_list.select_fields")}</label>
            <Dropdown
              id="select_fields"
              placeholder={T.translate("event_list.placeholders.select_fields")}
              value={this.state.selectedColumns}
              onChange={this.handleColumnsChange}
              options={this.handleDDLSortByLabel(ddl_columns)}
              isClearable
              isMulti
            />
          </div>
        </div>

        {promocodes.length === 0 && (
          <div>{T.translate("promocode_list.no_promocodes")}</div>
        )}

        {promocodes.length > 0 && (
          <div>
            <Table
              options={table_options}
              data={promocodesFormatted}
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
  currentPromocodeListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  ...currentPromocodeListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getPromocodes,
  getPromocodeMeta,
  deletePromocode,
  exportPromocodes,
  importPromoCodesCSV
})(PromocodeListPage);
