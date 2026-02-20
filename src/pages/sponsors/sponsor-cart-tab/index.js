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
import SelectFormDialog from "./components/select-form-dialog";
import CartView from "./components/cart-view";
import NewCartForm from "./components/edit-form/new-cart-form";

const SponsorCartTab = ({ sponsor, summitId }) => {
  const [openAddFormDialog, setOpenAddFormDialog] = useState(false);
  const [formEdit, setFormEdit] = useState({formId: 19, addon: null});

  const handleAddForm = (form, addOn) => {
    setFormEdit({ formId: form.id, addon: addOn });
    setOpenAddFormDialog(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {formEdit && (
        <NewCartForm
          formId={formEdit.formId}
          addOn={{addon_name: formEdit.addon?.name, addon_id: formEdit.addon?.id}}
          onCancel={() => setFormEdit(null)}
        />
      )}
      {!formEdit && (
        <CartView
          onEdit={setFormEdit}
          onAddForm={() => setOpenAddFormDialog(true)}
        />
      )}
      <SelectFormDialog
        open={!!openAddFormDialog}
        summitId={summitId}
        sponsor={sponsor}
        onSave={handleAddForm}
        onClose={() => setOpenAddFormDialog(false)}
      />
    </Box>
  );
};

export default SponsorCartTab;
