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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid2 from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import MuiSearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import {
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
} from "../../actions/admin-access-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";
import AdminAccessFormPopup from "./admin-access-form-popup";

const columns = [
  { columnKey: "id", header: T.translate("general.id"), sortable: true },
  {
    columnKey: "title",
    header: T.translate("admin_access.title"),
    sortable: true
  },
  { columnKey: "summits", header: T.translate("admin_access.summits") },
  { columnKey: "members", header: T.translate("admin_access.members") }
];

const AdminAccessListPage = ({
  admin_accesses,
  totalAdminAccesses,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAdminAccesses(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  }, [getAdminAccesses]);

  const handlePageChange = (page) => {
    getAdminAccesses(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getAdminAccesses(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getAdminAccesses(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (value) => {
    getAdminAccesses(value, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNewAdminAccess = () => {
    resetAdminAccessForm();
    setOpen(true);
  };

  const handleEdit = (row) => {
    getAdminAccess(row.id)
      .then(() => setOpen(true))
      .catch(() => {});
  };

  const handleDelete = (accessId) => {
    deleteAdminAccess(accessId).then(() =>
      getAdminAccesses(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir)
    );
  };

  const handleSave = (entity) =>
    saveAdminAccess(entity).then(() =>
      getAdminAccesses(term, currentPage, perPage, order, orderDir)
    );

  const handleClose = () => {
    resetAdminAccessForm();
    setOpen(false);
  };

  const tableOptions = { sortCol: order, sortDir: orderDir };

  return (
    <Box className="container">
      <h3>{T.translate("admin_access.admin_access_list")}</h3>
      <Grid2
        container
        spacing={2}
        sx={{ justifyContent: "center", alignItems: "center", mb: 2 }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalAdminAccesses} {T.translate("general.items")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          spacing={1}
          gap={1}
          sx={{ justifyContent: "flex-end", alignItems: "center" }}
        >
          <Grid2 size={3}>
            <MuiSearchInput
              term={term}
              onSearch={handleSearch}
              placeholder={T.translate("admin_access.placeholders.search")}
            />
          </Grid2>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewAdminAccess}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("admin_access.add")}
          </Button>
        </Grid2>
      </Grid2>

      {admin_accesses.length === 0 && (
        <div>{T.translate("admin_access.no_results")}</div>
      )}

      {admin_accesses.length > 0 && (
        <MuiTable
          columns={columns}
          data={admin_accesses}
          options={tableOptions}
          perPage={perPage}
          currentPage={currentPage}
          totalRows={totalAdminAccesses}
          getName={(adminAccess) => adminAccess?.title ?? adminAccess?.id}
          deleteDialogBody={(groupName) =>
            `${T.translate("admin_access.delete_warning")} "${groupName}"`
          }
          confirmButtonColor="error"
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {open && (
        <AdminAccessFormPopup onSave={handleSave} onClose={handleClose} />
      )}
    </Box>
  );
};

const mapStateToProps = ({ adminAccessListState }) => ({
  ...adminAccessListState
});

export default connect(mapStateToProps, {
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
})(AdminAccessListPage);
