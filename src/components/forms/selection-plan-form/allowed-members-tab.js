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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { useFormikContext } from "formik";
import Table from "openstack-uicore-foundation/lib/components/mui/table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import ImportModal from "../../inputs/import-modal";

const allowedMembersColumns = [
  { columnKey: "id", header: T.translate("edit_selection_plan.id") },
  { columnKey: "email", header: T.translate("edit_selection_plan.email") }
];

const AllowedMembersTab = ({
  hidden,
  allowedMembers,
  onImportAllowedMembers,
  onAllowedMemberAdd,
  onAllowedMemberDelete,
  onAllowedMembersPageChange
}) => {
  const { values } = useFormikContext();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImport = (importFile) => {
    if (importFile) onImportAllowedMembers(values.id, importFile);
    setShowImportModal(false);
  };

  return (
    <div role="tabpanel" id="tabpanel-allowed_members" hidden={hidden}>
      <Box sx={{ pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2
          }}
        >
          <Button
            type="button"
            variant="contained"
            onClick={() => setShowImportModal(true)}
          >
            {T.translate("edit_selection_plan.import")}
          </Button>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              size="small"
              value={newMemberEmail}
              onChange={(ev) => setNewMemberEmail(ev.target.value)}
            />
            <Button
              type="button"
              variant="outlined"
              onClick={() => onAllowedMemberAdd(values.id, newMemberEmail)}
              disabled={!newMemberEmail}
            >
              {T.translate("general.add")}
            </Button>
          </Box>
        </Box>
        <Table
          data={allowedMembers.data}
          columns={allowedMembersColumns}
          options={{ sortCol: "email", sortDir: 1 }}
          onDelete={(id) => onAllowedMemberDelete(values.id, id)}
          confirmButtonColor="error"
          getName={(item) => item.email}
          deleteDialogBody={(email) =>
            `${T.translate(
              "edit_selection_plan.delete_confirm.allowed_member"
            )} ${email}`
          }
        />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={allowedMembers.lastPage}
            page={allowedMembers.currentPage}
            onChange={(_, page) => onAllowedMembersPageChange(values.id, page)}
            showFirstButton
            showLastButton
          />
        </Box>
      </Box>
      <ImportModal
        title={T.translate("edit_selection_plan.import_allowed_members")}
        show={showImportModal}
        wrapperClass="allowed-members-import-upload-wrapper"
        onHide={() => setShowImportModal(false)}
        onIngest={handleImport}
      >
        * email ( text )
        <br />
      </ImportModal>
    </div>
  );
};

AllowedMembersTab.propTypes = {
  hidden: PropTypes.bool.isRequired,
  allowedMembers: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({ id: PropTypes.number, email: PropTypes.string })
    ).isRequired,
    currentPage: PropTypes.number.isRequired,
    lastPage: PropTypes.number.isRequired
  }).isRequired,
  onImportAllowedMembers: PropTypes.func.isRequired,
  onAllowedMemberAdd: PropTypes.func.isRequired,
  onAllowedMemberDelete: PropTypes.func.isRequired,
  onAllowedMembersPageChange: PropTypes.func.isRequired
};

export default AllowedMembersTab;
