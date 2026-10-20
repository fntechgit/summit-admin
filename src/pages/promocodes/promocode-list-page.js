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
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select
} from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import Dropdown from "openstack-uicore-foundation/lib/components/inputs/dropdown";
import MemberInput from "openstack-uicore-foundation/lib/components/inputs/member-input";
import TagInput from "openstack-uicore-foundation/lib/components/inputs/tag-input";
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
  DEFAULT_CURRENT_PAGE,
  TRIM_TEXT_LENGTH_50,
  TRIM_TEXT_LENGTH_40
} from "../../utils/constants";
import { trim } from "../../utils/methods";

const fieldNames = [
  { columnKey: "class_name", header: "type" },
  {
    columnKey: "description",
    header: "description",
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
  { columnKey: "tags", header: "tags" },
  { columnKey: "owner_email", header: "owner_email" },
  { columnKey: "owner", header: "owner" },
  { columnKey: "email_sent", header: "emailed" },
  { columnKey: "creator", header: "creator" },
  {
    columnKey: "quantity_available",
    header: "quantity_available",
    sortable: true,
    // 0 means no usage limit
    render: (row) =>
      row.quantity_available || T.translate("promocode_list.unlimited")
  },
  { columnKey: "quantity_used", header: "quantity_used", sortable: true }
];

const PromocodeListPage = ({
  currentSummit,
  promocodes,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalPromocodes,
  allClasses,
  allTypes,
  filters,
  extraColumns,
  history,
  getPromocodes,
  getPromocodeMeta,
  deletePromocode,
  exportPromocodes,
  importPromoCodesCSV
}) => {
  const [selectedColumns, setSelectedColumns] = useState(extraColumns);

  useEffect(() => {
    getPromocodeMeta();
    if (currentSummit) {
      getPromocodes(
        term,
        currentPage,
        perPage,
        order,
        orderDir,
        filters,
        extraColumns
      );
    }
  }, []);

  const handleEdit = (row) => {
    history.push(`/app/summits/${currentSummit.id}/promocodes/${row.id}`);
  };

  const handleExport = (ev) => {
    ev.preventDefault();
    exportPromocodes(term, order, orderDir, filters);
  };

  const handlePageChange = (page) => {
    getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  };

  const handlePerPageChange = (newPerPage) => {
    getPromocodes(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  };

  // filter changes reload from the first page
  const handleFilterChange = (key, value) => {
    filters[key] = value;
    getPromocodes(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  };

  const handleSort = (key, dir) => {
    const sortKey = key === "name" ? "last_name" : key;
    getPromocodes(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      sortKey,
      dir,
      filters,
      selectedColumns
    );
  };

  const handleSearch = (newTerm) => {
    getPromocodes(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      filters,
      selectedColumns
    );
  };

  const handleNewPromocode = () => {
    history.push(`/app/summits/${currentSummit.id}/promocodes/new`);
  };

  const handleColumnsChange = (ev) => {
    setSelectedColumns(ev.target.value);
  };

  const handleDDLSortByLabel = (ddlArray) =>
    ddlArray.sort((a, b) => a.label.localeCompare(b.label));

  let columns = [
    {
      columnKey: "id",
      header: T.translate("promocode_list.id"),
      sortable: true
    },
    {
      columnKey: "code",
      header: T.translate("promocode_list.code"),
      sortable: true
    },
    {
      columnKey: "redeemed",
      header: T.translate("promocode_list.redeemed"),
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
    { value: "creator", label: T.translate("promocode_list.creator") },
    {
      value: "quantity_available",
      label: T.translate("promocode_list.quantity_available")
    },
    {
      value: "quantity_used",
      label: T.translate("promocode_list.quantity_used")
    }
  ];

  const table_options = {
    sortCol: order,
    sortDir: orderDir
  };

  const showColumns = fieldNames
    .filter((f) => selectedColumns.includes(f.columnKey))
    .map((f2) => {
      let c = {
        columnKey: f2.columnKey,
        header: T.translate(`promocode_list.${f2.header}`),
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
        onChange={(filter) => handleFilterChange("orAndFilter", filter)}
      />

      <div className="row">
        <div className="col-md-6">
          <SearchInput
            term={term}
            placeholder={T.translate(
              "promocode_list.placeholders.search_promocodes"
            )}
            onSearch={handleSearch}
          />
        </div>
        <div className="col-md-6 text-right">
          <Dropdown
            id="promo_code_type"
            className="right-space"
            value={filters.typeFilter}
            placeholder={T.translate("promocode_list.placeholders.select_type")}
            options={promocode_types_ddl}
            onChange={(ev) => handleFilterChange("typeFilter", ev.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <TagInput
            id="tags_filter"
            placeholder={T.translate("promocode_list.placeholders.filter_tags")}
            value={filters.tagsFilter}
            onChange={(ev) => handleFilterChange("tagsFilter", ev.target.value)}
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
            onChange={(ev) =>
              handleFilterChange("classNamesFilter", ev.target.value)
            }
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
            onChange={(ev) =>
              handleFilterChange("creatorFilter", ev.target.value)
            }
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
            onChange={(ev) =>
              handleFilterChange("assigneeFilter", ev.target.value)
            }
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
            onClick={handleNewPromocode}
          >
            {T.translate("promocode_list.add_promocode")}
          </button>
          <button
            className="btn btn-default right-space"
            onClick={handleExport}
          >
            {T.translate("general.export")}
          </button>
          <ImportPromocodesBtn onImport={importPromoCodesCSV} />
        </div>
      </div>

      <hr />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="select_fields-label">
          {T.translate("event_list.select_fields")}
        </InputLabel>
        <Select
          labelId="select_fields-label"
          id="select_fields"
          multiple
          value={selectedColumns}
          onChange={handleColumnsChange}
          input={
            <OutlinedInput label={T.translate("event_list.select_fields")} />
          }
          renderValue={(selected) =>
            handleDDLSortByLabel(ddl_columns)
              .filter((option) => selected.includes(option.value))
              .map((option) => option.label)
              .join(", ")
          }
        >
          {handleDDLSortByLabel(ddl_columns).map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {promocodes.length === 0 && (
        <div>{T.translate("promocode_list.no_promocodes")}</div>
      )}

      {promocodes.length > 0 && (
        <MuiTable
          options={table_options}
          data={promocodesFormatted}
          columns={columns}
          onSort={handleSort}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalPromocodes}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onEdit={handleEdit}
          onDelete={deletePromocode}
          canDelete={(row) => row.redeemed === "No"}
          getName={(row) => row.code}
          deleteDialogBody={(code) =>
            `${T.translate("promocode_list.remove_promocode_warning")} ${code}`
          }
        />
      )}
    </div>
  );
};

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
