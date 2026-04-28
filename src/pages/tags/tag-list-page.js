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
import { Box, Button, Grid2, TextField } from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import TagsDialog from "./tags-popup";
import {
  getTags,
  deleteTag,
  saveTag,
  resetTagForm
} from "../../actions/tag-actions";
import { DEFAULT_PER_PAGE } from "../../utils/constants";

const TagListPage = ({
  tags = [],
  currentPage = 1,
  perPage = DEFAULT_PER_PAGE,
  term = "",
  order = "id",
  orderDir = 1,
  totalTags = 0,
  getTags,
  deleteTag,
  saveTag,
  resetTagForm
}) => {
  const [search, setSearch] = useState(term);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    getTags(term, currentPage, perPage, order, orderDir);
  }, [currentPage, perPage, order, orderDir]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      getTags(search, 1, perPage, order, orderDir);
    }
  };

  const handleNewTag = () => {
    setEditData({});
    setDialogOpen(true);
  };

  const handleEditTag = (row) => {
    setEditData(row);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditData(null);
    resetTagForm();
  };

  const handleSaveTag = (entity) => {
    saveTag(entity).then(() => {
      handleCloseDialog();
      getTags(search, currentPage, perPage, order, orderDir);
    });
  };

  const handleDeleteTag = (id) => {
    deleteTag(id).then(() => {
      getTags(search, currentPage, perPage, order, orderDir);
    });
  };

  const columns = [
    {
      columnKey: "id",
      header: "ID",
      sortable: true,
      width: 80
    },
    {
      columnKey: "tag",
      header: T.translate("general.name"),
      sortable: true
    },
    {
      columnKey: "created",
      header: T.translate("tag_list.created")
    },
    {
      columnKey: "updated",
      header: T.translate("tag_list.updated")
    }
  ];

  return (
    <Box className="container">
      <h3>{T.translate("tag_list.tag_list")}</h3>

      <Grid2
        container
        sx={{
          mb: 2,
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}
      >
        <Grid2 md={2} sx={{ display: "flex", alignItems: "center" }}>
          <Box component="span">
            {totalTags}{" "}
            {totalTags === 1
              ? T.translate("tag_list.item")
              : T.translate("tag_list.items")}
          </Box>
        </Grid2>
        <Grid2
          container
          md={10}
          spacing={1}
          gap={1}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <TextField
            variant="outlined"
            value={search}
            placeholder={T.translate("tag_list.placeholders.search_tags")}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            size="small"
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ mr: 1 }} />
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleNewTag()}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("tag_list.add_tag")}
          </Button>
        </Grid2>
      </Grid2>

      <MuiTable
        columns={columns}
        data={tags}
        totalRows={totalTags}
        perPage={perPage}
        currentPage={currentPage}
        onPageChange={(page) => getTags(search, page, perPage, order, orderDir)}
        onPerPageChange={(newPerPage) =>
          getTags(search, 1, newPerPage, order, orderDir)
        }
        onSort={(col, dir) => getTags(search, 1, perPage, col, dir)}
        options={{ sortCol: order, sortDir: orderDir }}
        onEdit={(id) => handleEditTag(id)}
        onDelete={(id) => handleDeleteTag(id)}
        getName={(row) => row.tag}
        deleteConfirmTitle={T.translate("general.are_you_sure")}
        deleteDialogBody={(name) =>
          `${T.translate("tag_list.delete_tag_warning")} "${name}"?`
        }
        confirmButtonColor="error"
      />

      <TagsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveTag}
        initialData={editData}
      />
    </Box>
  );
};

const mapStateToProps = ({ currentTagListState }) => ({
  ...currentTagListState
});

export default connect(mapStateToProps, {
  getTags,
  deleteTag,
  saveTag,
  resetTagForm
})(TagListPage);
