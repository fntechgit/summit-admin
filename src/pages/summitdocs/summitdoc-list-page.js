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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import GridToolbar from "../../components/mui/grid-toolbar";
import { getSummitById } from "../../actions/summit-actions";
import {
  getSummitDocs,
  deleteSummitDoc
} from "../../actions/summitdoc-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const wrapLongText = (value) => (
  <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
    {value}
  </div>
);

const SummitDocListPage = ({
  currentSummit,
  summitDocs,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalSummitDocs,
  history,
  getSummitDocs,
  deleteSummitDoc
}) => {
  useEffect(() => {
    if (currentSummit) {
      getSummitDocs(term, currentPage, perPage, order, orderDir);
    }
  }, [currentSummit]);

  const handleEdit = (row) => {
    history.push(`/app/summits/${currentSummit.id}/summitdocs/${row.id}`);
  };

  const handlePageChange = (page) => {
    getSummitDocs(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getSummitDocs(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getSummitDocs(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (newTerm) => {
    getSummitDocs(newTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNew = (ev) => {
    ev.preventDefault();
    history.push(`/app/summits/${currentSummit.id}/summitdocs/new`);
  };

  const columns = [
    { columnKey: "id", header: T.translate("general.id"), sortable: true },
    {
      columnKey: "label",
      header: T.translate("summitdoc.label"),
      sortable: true
    },
    {
      columnKey: "description",
      header: T.translate("summitdoc.description"),
      width: 400,
      render: (row) => wrapLongText(row.description)
    },
    {
      columnKey: "event_types_string",
      header: T.translate("summitdoc.event_types"),
      width: 300,
      render: (row) => wrapLongText(row.event_types_string)
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  if (!currentSummit.id) return <div />;

  return (
    <div className="container">
      <h3>
        {" "}
        {T.translate("summitdoc.list")} ({totalSummitDocs})
      </h3>
      <GridToolbar
        searchProps={{
          term,
          onSearch: handleSearch,
          placeholder: T.translate("summitdoc.placeholders.search")
        }}
      >
        <Button variant="contained" onClick={handleNew} startIcon={<AddIcon />}>
          {T.translate("summitdoc.add")}
        </Button>
      </GridToolbar>

      {summitDocs.length === 0 && (
        <div className="no-items">{T.translate("summitdoc.no_items")}</div>
      )}

      {summitDocs.length > 0 && (
        <div>
          <MuiTable
            options={tableOptions}
            data={summitDocs}
            columns={columns}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalSummitDocs}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={deleteSummitDoc}
            getName={(row) => row.label}
            deleteDialogBody={(name) =>
              `${T.translate("summitdoc.delete_warning")} ${name}`
            }
            confirmButtonColor="error"
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = ({ currentSummitState, summitDocListState }) => ({
  currentSummit: currentSummitState.currentSummit,
  ...summitDocListState
});

export default connect(mapStateToProps, {
  getSummitById,
  getSummitDocs,
  deleteSummitDoc
})(SummitDocListPage);
