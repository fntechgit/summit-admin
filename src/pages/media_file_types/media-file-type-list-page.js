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
import { Box, Button, Grid2 } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getMediaFileTypes,
  getMediaFileType,
  saveMediaFileType,
  deleteMediaFileType,
  resetMediaFileTypeForm
} from "../../actions/media-file-type-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import MediaFileTypeDialog from "./components/media-file-type-dialog";

const MediaFileTypeListPage = ({
  media_file_types,
  currentMediaFileType,
  term,
  currentPage,
  perPage,
  order,
  orderDir,
  totalMediaFileTypes,
  getMediaFileTypes,
  getMediaFileType,
  saveMediaFileType,
  deleteMediaFileType,
  resetMediaFileTypeForm
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getMediaFileTypes();
  }, []);

  const handlePageChange = (page) => {
    getMediaFileTypes(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getMediaFileTypes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getMediaFileTypes(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getMediaFileTypes(
      searchTerm,
      DEFAULT_CURRENT_PAGE,
      perPage,
      order,
      orderDir
    );
  };

  const handleRowEdit = (row) => {
    getMediaFileType(row.id).then(() => setOpen(true));
  };

  const handleNew = () => {
    resetMediaFileTypeForm();
    setOpen(true);
  };

  const handleClose = () => {
    resetMediaFileTypeForm();
    setOpen(false);
  };

  const handleSave = (entity) => {
    saveMediaFileType(entity)
      .then(() =>
        getMediaFileTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
      )
      .then(() => setOpen(false));
  };

  const handleDelete = (mediaFileTypeId) => {
    deleteMediaFileType(mediaFileTypeId).then(() =>
      getMediaFileTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const columns = [
    {
      columnKey: "id",
      header: T.translate("media_file_type.id"),
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("media_file_type.name"),
      sortable: true
    },
    {
      columnKey: "description",
      header: T.translate("media_file_type.description")
    },
    {
      columnKey: "allowed_extensions",
      header: T.translate("media_file_type.allowed_extensions"),
      render: (row) => row.allowed_extensions.join(", ")
    }
  ];

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <div className="container">
      <h3>{T.translate("media_file_type.media_file_type_list")}</h3>
      <Grid2
        container
        spacing={1}
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalMediaFileTypes}{" "}
            {T.translate("media_file_type.media_file_types")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <Grid2 size={4}>
            <SearchInput term={term} onSearch={handleSearch} />
          </Grid2>
          <Button
            variant="contained"
            onClick={handleNew}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("media_file_type.add")}
          </Button>
        </Grid2>
      </Grid2>

      {media_file_types.length > 0 && (
        <MuiTable
          columns={columns}
          data={media_file_types}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalMediaFileTypes}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleRowEdit}
          onDelete={handleDelete}
          deleteDialogBody={(name) =>
            T.translate("media_file_type.remove_warning", { name })
          }
        />
      )}

      {media_file_types.length === 0 && (
        <div>{T.translate("media_file_type.no_results")}</div>
      )}

      {open && (
        <MediaFileTypeDialog
          entity={currentMediaFileType}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({ mediaFileTypeListState, mediaFileTypeState }) => ({
  ...mediaFileTypeListState,
  currentMediaFileType: mediaFileTypeState.entity
});

export default connect(mapStateToProps, {
  getMediaFileTypes,
  getMediaFileType,
  saveMediaFileType,
  deleteMediaFileType,
  resetMediaFileTypeForm
})(MediaFileTypeListPage);
