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

const AdminAccessListPage = ({
  admin_accesses,
  totalAdminAccesses,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
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
      let ignore = false;
      getAdminAccess(accessId)
        .then(() => {
          if (!ignore) setOpen(true);
        })
        .catch(() => history.push("/app/admin-access"));
      return () => {
        ignore = true;
      };
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

    const nextPage =
      admin_accesses.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;

    deleteAdminAccess(accessId)
      .finally(() => {
        getAdminAccesses(term, nextPage, perPage, order, orderDir);
      })
      .catch(() => {});
  };

  const handleSave = (entity) =>
    saveAdminAccess(entity).then(() =>
      getAdminAccesses(term, currentPage, perPage, order, orderDir)
    );

  const closeDialog = () => {
    setOpen(false);
    history.push("/app/admin-access");
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

  const totalItems = totalAdminAccesses;

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
          <Grid2 size={3}>
            <MuiSearchInput
              term={searchTerm}
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
          totalRows={totalItems}
          getName={(adminAccess) => adminAccess?.title ?? adminAccess?.id}
          deleteDialogBody={(groupName) =>
            `${T.translate("admin_access.delete_warning")} "${groupName}"`
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
        <AdminAccessFormPopup onSave={handleSave} onClose={closeDialog} />
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
