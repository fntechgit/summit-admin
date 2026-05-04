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

import React, { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid2 from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import SearchInput from "../../components/mui/search-input";
import { getSummitById } from "../../actions/summit-actions";
import AdminAccessForm from "../../components/forms/admin-access-form";
import {
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
} from "../../actions/admin-access-actions";
import { DEFAULT_CURRENT_PAGE } from "../../utils/constants";

const AdminAccessListPage = ({
  admin_accesses,
  totalAdminAccesses,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  entity,
  errors,
  match,
  history,
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
}) => {
  const [searchTerm, setSearchTerm] = useState(term || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getAdminAccesses(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  }, [getAdminAccesses]);

  useEffect(() => {
    const { access_id: accessId } = match.params;
    const isNew = /\/new$/.test(history.location.pathname);

    if (isNew) {
      resetAdminAccessForm();
      setOpen(true);
      return;
    }

    if (accessId) {
      getAdminAccess(accessId).then(() => setOpen(true));
      return;
    }

    setOpen(false);
  }, [match.params.access_id, history.location.pathname]);

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
    setSearchTerm(value);
    getAdminAccesses(value, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNewAdminAccess = () => {
    history.push("/app/admin-access/new");
  };

  const handleEdit = (row) => {
    history.push(`/app/admin-access/${row.id}`);
  };

  const handleDeleteAdminAccess = (rowOrId) => {
    const accessId = typeof rowOrId === "object" ? rowOrId?.id : rowOrId;

    if (!accessId) return;

    deleteAdminAccess(accessId);
  };

  const closeDialog = () => {
    resetAdminAccessForm();
    setOpen(false);
    history.push("/app/admin-access");
  };

  const handleSave = (adminAccessEntity) => {
    saveAdminAccess(adminAccessEntity, false, false).then(() => {
      getAdminAccesses(term, currentPage, perPage, order, orderDir);
      closeDialog();
    });
  };

  const columns = useMemo(
    () => [
      { columnKey: "id", header: T.translate("general.id"), sortable: true },
      {
        columnKey: "title",
        header: T.translate("admin_access.title"),
        sortable: true
      },
      { columnKey: "summits", header: T.translate("admin_access.summits") },
      { columnKey: "members", header: T.translate("admin_access.members") }
    ],
    []
  );

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  const totalItems =
    typeof totalAdminAccesses === "number"
      ? totalAdminAccesses
      : admin_accesses.length;

  return (
    <Box className="container">
      <h3>{T.translate("admin_access.admin_access_list")}</h3>
      <Grid2
        container
        spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          mb: 2
        }}
      >
        <Grid2 size={2}>
          <Box component="span">
            {totalItems} {T.translate("general.items")}
          </Box>
        </Grid2>
        <Grid2
          container
          size={10}
          spacing={1}
          gap={1}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          <SearchInput
            term={searchTerm}
            onSearch={handleSearch}
            placeholder={T.translate("admin_access.placeholders.search")}
          />
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
          totalRows={totalItems}
          getName={(adminAccess) => adminAccess?.title ?? adminAccess?.id}
          deleteDialogBody={(groupName) =>
            `${T.translate("admin_access.delete_warning")} "${groupName}" ?`
          }
          confirmButtonColor="error"
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDeleteAdminAccess}
        />
      )}

      {open && (
        <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {entity.id
              ? T.translate("general.edit")
              : T.translate("general.add")}{" "}
            {T.translate("admin_access.admin_access")}
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ p: 3 }}>
            <AdminAccessForm
              entity={entity}
              errors={errors}
              onSubmit={handleSave}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

const mapStateToProps = ({ adminAccessListState, adminAccessState }) => ({
  ...adminAccessListState,
  entity: adminAccessState.entity,
  errors: adminAccessState.errors
});

export default connect(mapStateToProps, {
  getSummitById,
  getAdminAccesses,
  deleteAdminAccess,
  getAdminAccess,
  resetAdminAccessForm,
  saveAdminAccess
})(AdminAccessListPage);
