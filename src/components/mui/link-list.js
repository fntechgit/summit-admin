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

import React, { useState } from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import MuiTable from "openstack-uicore-foundation/lib/components/mui/table";

const getItemName = (item) => item.name ?? "";

/**
 * MUI replacement for uicore's legacy SimpleLinkList: an autocomplete + "Add"
 * button to link items from an already-loaded `options` list, and a table to
 * unlink them.
 */
const MuiLinkList = ({
  title,
  placeholder,
  values,
  options,
  columns,
  onLink,
  onUnLink,
  deleteDialogBody
}) => {
  const [selection, setSelection] = useState(null);

  const linkedIds = new Set(values.map((item) => item.id));
  const availableOptions = options.filter((item) => !linkedIds.has(item.id));

  const handleAdd = () => {
    onLink(selection);
    setSelection(null);
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 1
      }}
    >
      {title && (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Autocomplete
          sx={{ flex: { xs: 1, md: "0 0 25%" } }}
          size="small"
          options={availableOptions}
          value={selection}
          getOptionLabel={getItemName}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          onChange={(_, val) => setSelection(val)}
          renderInput={(params) => (
            <TextField
              {...params} // eslint-disable-line react/jsx-props-no-spreading
              placeholder={placeholder}
            />
          )}
        />
        <Button variant="outlined" disabled={!selection} onClick={handleAdd}>
          {T.translate("general.add")}
        </Button>
      </Box>
      {values.length > 0 && (
        <MuiTable
          data={values}
          columns={columns}
          options={{}}
          getName={getItemName}
          onDelete={onUnLink}
          deleteDialogBody={deleteDialogBody}
          confirmButtonColor="error"
        />
      )}
    </Box>
  );
};

MuiLinkList.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number }))
    .isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      columnKey: PropTypes.string.isRequired,
      header: PropTypes.string
    })
  ).isRequired,
  onLink: PropTypes.func.isRequired,
  onUnLink: PropTypes.func.isRequired,
  deleteDialogBody: PropTypes.func
};

MuiLinkList.defaultProps = {
  title: null,
  placeholder: "",
  options: [],
  deleteDialogBody: undefined
};

export default MuiLinkList;
