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
import { Box, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import {
  GridFilter,
  useGridFilter
} from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  getPromocodes,
  getPromocodeMeta,
  deletePromocode,
  exportPromocodes,
  importPromoCodesCSV
} from "../../actions/promocode-actions";
import ImportPromocodesBtn from "../../components/import-promocodes";
import GridToolbar from "../../components/mui/grid-toolbar";
import {
  DEFAULT_CURRENT_PAGE,
  TRIM_TEXT_LENGTH_50,
  TRIM_TEXT_LENGTH_40
} from "../../utils/constants";
import { handleDDLSortByLabel, trim } from "../../utils/methods";
import { getCriterias } from "./promocode-list-page.helpers";

const FILTER_ID = "promocode_list";

const fieldNames = [
  { columnKey: "class_name", header: "type" },
  {
    columnKey: "description",
    header: "description",
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
  {
    columnKey: "owner_email",
    header: "owner_email",
    render: (row) => (
      <abbr title={row.owner_email}>
        {trim(row.owner_email, TRIM_TEXT_LENGTH_40)}
      </abbr>
    )
  },
  {
    columnKey: "owner",
    header: "owner",
    render: (row) => (
      <abbr title={row.owner}>{trim(row.owner, TRIM_TEXT_LENGTH_40)}</abbr>
    )
  },
  { columnKey: "email_sent", header: "emailed" },
  { columnKey: "creator", header: "creator" }
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
  extraColumns,
  history,
  ...props
}) => {
  const { parsedFilter } = useGridFilter(FILTER_ID);
  const [selectedColumns, setSelectedColumns] = useState(extraColumns ?? []);

  useEffect(() => {
    props.getPromocodeMeta();
  }, []);

  useEffect(() => {
    if (currentSummit?.id) {
      props.getPromocodes(
        term,
        DEFAULT_CURRENT_PAGE,
        perPage,
        order,
        orderDir,
        parsedFilter,
        selectedColumns
      );
    }
  }, [currentSummit?.id, parsedFilter.join(",")]);

  const handlePageChange = (page) => {
    props.getPromocodes(
      term,
      page,
      perPage,
      order,
      orderDir,
      parsedFilter,
      selectedColumns
    );
  };

  const handlePerPageChange = (newPerPage) => {
    props.getPromocodes(
      term,
      DEFAULT_CURRENT_PAGE,
      newPerPage,
      order,
      orderDir,
      parsedFilter,
      selectedColumns
    );
  };

  const handleSort = (key, dir) => {
    props.getPromocodes(
      term,
      DEFAULT_CURRENT_PAGE,
      perPage,
      key,
      dir,
      parsedFilter,
      selectedColumns
    );
  };

  const handleSearch = (newTerm) => {
    props.getPromocodes(
      newTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir,
      parsedFilter,
      selectedColumns
    );
  };

  const handleEdit = (promocode) => {
    history.push(`/app/summits/${currentSummit.id}/promocodes/${promocode.id}`);
  };

  const handleNewPromocode = () => {
    history.push(`/app/summits/${currentSummit.id}/promocodes/new`);
  };

  const handleExport = () => {
    props.exportPromocodes(term, order, orderDir, parsedFilter);
  };

  const handleColumnsChange = (ev) => {
    setSelectedColumns(ev.target.value);
  };

  const columns = [
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
    },
    ...fieldNames
      .filter((f) => selectedColumns.includes(f.columnKey))
      .map((f) => ({
        columnKey: f.columnKey,
        header: T.translate(`promocode_list.${f.header}`),
        render: f.render
      }))
  ];

  const ddlColumns = [
    { value: "class_name", label: T.translate("promocode_list.type") },
    {
      value: "description",
      label: T.translate("promocode_list.description")
    },
    { value: "owner", label: T.translate("promocode_list.owner") },
    { value: "owner_email", label: T.translate("promocode_list.owner_email") },
    { value: "tags", label: T.translate("promocode_list.tags") },
    { value: "email_sent", label: T.translate("promocode_list.emailed") },
    { value: "creator", label: T.translate("promocode_list.creator") }
  ];

  return (
    <div className="container">
      <h3>
        {T.translate("promocode_list.promocode_list")} ({totalPromocodes})
      </h3>
      <GridToolbar
        searchProps={{
          term,
          placeholder: T.translate(
            "promocode_list.placeholders.search_promocodes"
          ),
          onSearch: handleSearch
        }}
      >
        <GridFilter
          id={FILTER_ID}
          criterias={getCriterias(allTypes, allClasses)}
        />
        <Button
          variant="contained"
          onClick={handleNewPromocode}
          startIcon={<AddIcon />}
        >
          {T.translate("promocode_list.add_promocode")}
        </Button>
        <Button variant="outlined" onClick={handleExport}>
          {T.translate("general.export")}
        </Button>
        <ImportPromocodesBtn onImport={props.importPromoCodesCSV} />
      </GridToolbar>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ my: 2 }}>
        <MuiDropdown
          id="select_fields"
          label={T.translate("event_list.select_fields")}
          placeholder={T.translate("event_list.placeholders.select_fields")}
          value={selectedColumns}
          onChange={handleColumnsChange}
          options={handleDDLSortByLabel(ddlColumns)}
          multiple
        />
      </Box>

      {promocodes.length === 0 ? (
        <div>{T.translate("promocode_list.no_promocodes")}</div>
      ) : (
        <MuiTable
          options={{ sortCol: order, sortDir: orderDir }}
          data={promocodes}
          columns={columns}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalPromocodes}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onEdit={handleEdit}
          onDelete={props.deletePromocode}
          canDelete={(row) => row.redeemed === "No"}
          getName={(row) => row.code}
          deleteDialogBody={(code) =>
            T.translate("promocode_list.remove_promocode_warning", { code })
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
  getPromocodes,
  getPromocodeMeta,
  deletePromocode,
  exportPromocodes,
  importPromoCodesCSV
})(PromocodeListPage);
