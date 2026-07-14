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

import React, { useEffect, useState } from "react";
import { Button, Grid2 } from "@mui/material";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import SearchInput from "openstack-uicore-foundation/lib/components/mui/search-input";
import { connect } from "react-redux";
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";
import Restrict from "../../../routes/restrict";
import {
  getAddOnTypes,
  getAddOnType,
  resetAddOnTypeForm,
  saveAddOnType,
  deleteAddOnType
} from "../../../actions/add-on-types-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";
import AddOnTypesDialog from "./add-on-types-dialog";

const AddOnTypesListPage = ({
  match,
  addOnTypes,
  currentAddOnType,
  currentPage,
  perPage,
  term,
  order,
  orderDir,
  totalAddOnTypes,
  getAddOnTypes,
  getAddOnType,
  saveAddOnType,
  deleteAddOnType,
  resetAddOnTypeForm
}) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    resetAddOnTypeForm();
    setOpen(false);
  };

  useEffect(() => {
    getAddOnTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  }, [getAddOnTypes]);

  const handlePageChange = (page) => {
    getAddOnTypes(term, page, perPage, order, orderDir);
  };

  const handlePerPageChange = (newPerPage) => {
    getAddOnTypes(term, DEFAULT_CURRENT_PAGE, newPerPage, order, orderDir);
  };

  const handleSort = (key, dir) => {
    getAddOnTypes(term, currentPage, perPage, key, dir);
  };

  const handleSearch = (searchTerm) => {
    getAddOnTypes(searchTerm, DEFAULT_CURRENT_PAGE, perPage, order, orderDir);
  };

  const handleNewAddOnType = () => {
    resetAddOnTypeForm();
    setOpen(true);
  };

  const handleEdit = (row) => {
    if (row) {
      getAddOnType(row.id).then(() => setOpen(true));
    }
  };

  const handleDelete = (addOnTypeId) =>
    deleteAddOnType(addOnTypeId).then(() => {
      getAddOnTypes(term, DEFAULT_CURRENT_PAGE, perPage, order, orderDir).catch(
        () => {}
      );
    });

  const handleAddOnTypeSave = (item) =>
    saveAddOnType(item).then(() => {
      const page = item.id ? currentPage : DEFAULT_CURRENT_PAGE;
      getAddOnTypes(term, page, perPage, order, orderDir).catch(() => {});
    });

  const columns = [
    {
      columnKey: "id",
      header: T.translate("add_on_types_list.id_column_label"),
      width: 120,
      sortable: true
    },
    {
      columnKey: "name",
      header: T.translate("add_on_types_list.name_column_label"),
      sortable: true
    }
  ];

  const tableOptions = {
    sortCol: order,
    sortDir: orderDir
  };

  return (
    <div className="container">
      <Breadcrumb
        data={{
          title: T.translate("add_on_types_list.add_on_types"),
          pathname: match.url
        }}
      />
      <h3> {T.translate("add_on_types_list.add_on_types")}</h3>
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
            {totalAddOnTypes} {T.translate("add_on_types_list.add_on_types")}
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
            <SearchInput
              term={term}
              onSearch={handleSearch}
              placeholder={T.translate(
                "add_on_types_list.placeholders.search_add_on_types"
              )}
            />
          </Grid2>
          <Button
            variant="contained"
            onClick={() => handleNewAddOnType()}
            startIcon={<AddIcon />}
            sx={{
              height: "36px",
              padding: "6px 16px",
              fontSize: "1.4rem",
              lineHeight: "2.4rem",
              letterSpacing: "0.4px"
            }}
          >
            {T.translate("add_on_types_list.add_add_on_type")}
          </Button>
        </Grid2>
      </Grid2>

      {addOnTypes.length > 0 && (
        <div>
          <MuiTable
            columns={columns}
            data={addOnTypes}
            options={tableOptions}
            perPage={perPage}
            currentPage={currentPage}
            totalRows={totalAddOnTypes}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteDialogBody={(name) =>
              T.translate("add_on_types_list.delete_add_on_type_warning", {
                name
              })
            }
          />
        </div>
      )}

      {addOnTypes.length === 0 && (
        <div>{T.translate("add_on_types_list.no_results")}</div>
      )}

      {open && (
        <AddOnTypesDialog
          entity={currentAddOnType}
          onSave={handleAddOnTypeSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

const mapStateToProps = ({
  currentAddOnTypesListState,
  currentAddOnTypeState
}) => ({
  ...currentAddOnTypesListState,
  currentAddOnType: currentAddOnTypeState.entity
});

export default Restrict(
  connect(mapStateToProps, {
    getAddOnTypes,
    getAddOnType,
    resetAddOnTypeForm,
    saveAddOnType,
    deleteAddOnType
  })(AddOnTypesListPage),
  "inventory"
);
