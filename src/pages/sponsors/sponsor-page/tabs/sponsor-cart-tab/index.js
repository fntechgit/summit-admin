/**
 * Copyright 2024 OpenStack Foundation
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

import React, { useState } from "react";
import { Box } from "@mui/material";
import { connect } from "react-redux";
import SelectFormDialog from "./components/select-form-dialog";
import CartView from "./components/cart-view";
import NewCartForm from "./components/edit-form/new-cart-form";
import EditCartForm from "./components/edit-form/edit-cart-form";

const SponsorCartTab = ({ sponsor, currentSummit }) => {
  const [openAddFormDialog, setOpenAddFormDialog] = useState(false);
  const [formEdit, setFormEdit] = useState(null);
  const [newForm, setNewForm] = useState(null);

  const handleFormSelected = (form, addOn) => {
    setNewForm({ formId: form.id, addon: addOn });
    setOpenAddFormDialog(false);
  };

  const handleOnFormAdded = () => {
    setNewForm(null);
  };

  const handleOnFormUpdated = () => {
    setFormEdit(null);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {newForm && (
        <NewCartForm
          formId={newForm.formId}
          addOn={{
            addon_name: newForm.addon?.name,
            addon_id: newForm.addon?.id
          }}
          onCancel={() => setNewForm(null)}
          onSaveCallback={handleOnFormAdded}
        />
      )}
      {formEdit && (
        <EditCartForm
          formId={formEdit.id}
          onCancel={() => setFormEdit(null)}
          onSaveCallback={handleOnFormUpdated}
        />
      )}
      {!formEdit && !newForm && (
        <CartView
          onEdit={setFormEdit}
          onAddForm={() => setOpenAddFormDialog(true)}
        />
      )}
      <SelectFormDialog
        open={!!openAddFormDialog}
        summitId={currentSummit.id}
        sponsor={sponsor}
        onSave={handleFormSelected}
        onClose={() => setOpenAddFormDialog(false)}
      />
    </Box>
  );
};

const mapStateToProps = ({ currentSummitState, currentSponsorState }) => ({
  currentSummit: currentSummitState.currentSummit,
  sponsor: currentSponsorState.entity
});

export default connect(mapStateToProps, {})(SponsorCartTab);
