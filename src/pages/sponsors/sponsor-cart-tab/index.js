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
import EditForm from "./components/edit-form";

const SponsorCartTab = ({
  sponsor,
  summitId,
}) => {
  const [openAddFormDialog, setOpenAddFormDialog] = useState(false);
  const [formEdit, setFormEdit] = useState(null);

  const handleAddForm = (form, addOnId) => {
    setFormEdit({ form, addOnId });
  };

  return (
    <Box sx={{ mt: 2 }}>
      {formEdit && <EditForm form={formEdit} />}
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
