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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  getTags,
  deleteTag,
  saveTag,
  resetTagForm
} from "../../actions/tag-actions";
import { DEFAULT_PER_PAGE } from "../../utils/constants";

const TagDialog = ({ open, onClose, onSave, initialData }) => {
  const [tag, setTag] = useState(initialData?.tag || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setTag(initialData?.tag || "");
    setError("");
  }, [initialData, open]);

  const handleSave = () => {
    if (!tag.trim()) {
      setError(T.translate("edit_tag.name_required"));
      return;
    }
    onSave({ ...initialData, tag });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {initialData?.id
          ? `${T.translate("general.edit")  } ${  T.translate("edit_tag.tag")}`
          : `${T.translate("general.add")  } ${  T.translate("edit_tag.tag")}`}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={T.translate("edit_tag.name")}
          type="text"
          fullWidth
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{T.translate("general.cancel")}</Button>
        <Button onClick={handleSave} variant="contained">
          {T.translate("general.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  useEffect(() => {
    getTags(term, currentPage, perPage, order, orderDir);
    // eslint-disable-next-line
  }, [currentPage, perPage, order, orderDir]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      getTags(search, 1, perPage, order, orderDir);
    }
  };

  const handleOpenDialog = (tag = null) => {
    setEditData(tag || {});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditData(null);
    resetTagForm();
  };

  const handleSaveTag = (entity) => {
    saveTag(entity)
      .then(() => {
        setSnackbar({
          open: true,
          message: T.translate("edit_tag.tag_saved"),
          severity: "success"
        });
        handleCloseDialog();
        getTags(search, currentPage, perPage, order, orderDir);
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: T.translate("edit_tag.save_error"),
          severity: "error"
        });
      });
  };

  const handleDeleteTag = (id) => {
    deleteTag(id)
      .then(() => {
        setSnackbar({
          open: true,
          message: T.translate("edit_tag.tag_deleted"),
          severity: "success"
        });
        getTags(search, currentPage, perPage, order, orderDir);
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: T.translate("edit_tag.delete_error"),
          severity: "error"
        });
      });
  };

  return (
    <Box className="container">
      <h3>{T.translate("tag_list.tag_list")}</h3>

      <Grid2
        container
        spacing={2}
        alignItems="center"
        sx={{ mb: 2, width: "100%" }}
      >
        <Grid2 md={2} sx={{ display: "flex", alignItems: "center" }}>
          <Box component="span">{totalTags} items</Box>
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
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ minWidth: 120 }}
          >
            {T.translate("tag_list.add_tag")}
          </Button>
        </Grid2>
      </Grid2>

      <MuiTable
        columns={[
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
        ]}
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
        onEdit={(row) => handleOpenDialog(row)}
        onDelete={(row) => handleDeleteTag(row.id)}
        deleteConfirmTitle={T.translate("general.are_you_sure")}
        deleteDialogBody={(row) =>
          row?.tag
            ? `${T.translate("tag_list.delete_tag_warning")} "${row.tag}"?`
            : T.translate("tag_list.delete_tag_warning")
        }
        confirmButtonColor="error"
      />

      <TagDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveTag}
        initialData={editData}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
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
